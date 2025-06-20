import io
import fastapi
from inngest import Context, Inngest, Step, fast_api, TriggerEvent, Event
import pydantic
import pydub
from sqlmodel import and_, asc, desc, select, any_
from sqlalchemy.orm import selectinload, joinedload
# from sqlalchemy import select
from api.utils import get_current_user, get_supabase_client
from api.db import session_maker
from api.models import Conversation, Podcast, PodcastEpisode, PodcastGenerationTask, UserProfile
from api.gen import CreatePodcast, create_podcast as gen_create_podcast
from uuid import UUID, uuid4
import json
from fuzzywuzzy import fuzz, process
from google import genai

import os
from supabase import AClient as Supabase

from fastapi.responses import FileResponse, StreamingResponse

import pathlib

app = fastapi.FastAPI(root_path="/api")

# Add CORS middleware to allow requests from any origin
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class GeneratePodcast(pydantic.BaseModel):
    topic: str | None = None
    style: str | None = None
    language: str | None = None
    description: str | None = None



inngest = Inngest(app_id="ai-podcast")

podcasts = {}
pathlib.Path("podcasts.json").touch(exist_ok=True)
with open("podcasts.json", "r") as f:
    podcasts = json.loads(f.read() or "{}")

audios = {}
pathlib.Path("audios.json").touch(exist_ok=True)
with open("audios.json", "r") as f:
    audios = json.loads(f.read() or "{}")

images = {}
pathlib.Path("images.json").touch(exist_ok=True)
with open("images.json", "r") as f:
    images = json.loads(f.read() or "{}")

def remap_os_safe_title(title: str) -> str:
    # Replace spaces with underscores and remove special characters
    return "".join(c if c.isalnum() or c in [' ', '_'] else '_' for c in title).strip().replace(" ", "_").lower()


class PodcastTopicsSearch(pydantic.BaseModel):
    topic: str | None = None
    search_keys: list[str] | None = pydantic.Field(..., description="Search keys for easy podcast searching (include atleast 3-5 keys to ensure correct suggestion)")

prompt = """
TLDR: Give a set of search_keys for the given topic. 

The user is searching podcasts for the specific topic and your role is to suggest specific search keys that help in the suggestion of correct podcasts.
The search keys should be relevant to the topic and should be used to find podcasts related to the topic.

For example, if the topic is "Artificial Intelligence", the search keys could be ["AI", "Machine Learning", "Deep Learning", "Neural Networks", "NLP"].

QUERY: {query}
"""


client = genai.Client()

@app.get("/podcasts")
async def get_podcasts(offset: int = 0, limit: int = 10, v2: bool = False):
    if v2:
        with session_maker() as sess:
            podcasts_db = sess.exec(select(Podcast).order_by(desc(Podcast.created_at))).all()
            new_podcasts = [{
                "id": str(p.id),
                "podcast_title": p.title,
                "podcast_description": p.description,
                "language": p.language,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "view_count": p.view_count,
                "like_count": p.like_count,
                "duration": p.duration,
            } for p in podcasts_db]

            return {"results": new_podcasts[offset:offset + limit]}

    else:
        results = []
        for podcast_id, podcast in list(podcasts.items())[offset:offset + limit]:
            if "duration" not in podcast: # just in case we don't have it yet
                podcast["duration"] = len(pydub.AudioSegment.from_file(audios[podcast_id])) / 1000
            results.append({"id": podcast_id, **podcast})
        return {"results": results}

@app.get("/podcasts/search")
async def search_podcasts(query: str, v2: bool = False):

    if v2:
        with session_maker() as sess:
            podcasts_db = sess.exec(select(Podcast)).all()
            new_podcasts = {p.id: {
                "id": str(p.id),
                "podcast_title": p.title,
                "podcast_description": p.description,
                "language": p.language,
            } for p in podcasts_db}

    else:
        new_podcasts = {podcast_id: {"id": podcast_id, **podcast} for podcast_id, podcast in podcasts.items()}
    
    response = client.models.generate_content(contents=prompt.format(query=query), config={"response_mime_type": "application/json", "response_schema": PodcastTopicsSearch}, model="gemini-1.5-flash")
    podcast_search_keys = PodcastTopicsSearch.model_validate(response.parsed) # Type: PodcastTopicsSearch
    print(podcast_search_keys)
    results = []
    for podcast_id, podcast in new_podcasts.items():
        # search_match = 0
        # for sk in (podcast_search_keys.search_keys or []):
        #     fuzz_ratio = (fuzz.partial_ratio(sk.lower(), podcast["podcast_title"].lower()) * 0.4 + fuzz.partial_ratio(sk.lower(), podcast["podcast_description"].lower()) * 0.2 + fuzz.partial_ratio(sk.lower(), podcast["episode_title"].lower())) * 0.2
        #     print("Fuzz ratio for", sk, "in", podcast["podcast_title"], ":", fuzz_ratio, 
        #           "podcast description:", podcast["podcast_description"], "episode title:", podcast["episode_title"])
        #     if fuzz_ratio < 30:
        #         continue
        #     search_match += fuzz_ratio
        # if search_match < 80: # if the search match is less than 80, skip this podcast
        #     print("Skipping podcast", podcast["podcast_title"], "due to low search match:", search_match)
        #     continue

        search_match = 0

        for sk in (podcast_search_keys.search_keys or []):
            process_results = process.extract(sk, [podcast["podcast_title"], podcast["podcast_description"]], limit=1, scorer=fuzz.partial_ratio)
            search_match += process_results[0][1] if process_results else 0
            print("Search match for", podcast["podcast_title"], ":", search_match)
        search_match /= len(podcast_search_keys.search_keys) if podcast_search_keys.search_keys else 1 # is this a good idea?
        process_results = process.extract(query, [podcast["podcast_title"], podcast["podcast_description"]], limit=1, scorer=fuzz.partial_ratio)
        search_match += process_results[0][1] * 3 if process_results else 0 # Higher weight for the query match
        search_match /= 4 # Normalize the search match
        if search_match < 60:
            print("Skipping podcast", podcast["podcast_title"], "due to low search match:", search_match)
            continue

        # if "duration" not in podcast: # just in case we don't have it yet
        #     podcast["duration"] = len(pydub.AudioSegment.from_file(audios[podcast_id])) / 1000
        results.append({"id": podcast_id, **podcast, "search_match": search_match})
    results = sorted(results, key=lambda x: x["search_match"], reverse=True)
    if results:
        return {"results": results}
    return {"results": []}

@app.get("/podcasts/{podcast_id}")
async def get_podcast(podcast_id: str, v2: bool = False):

    if v2:
        with session_maker() as sess:
            podcast_db = sess.exec(select(Podcast).where(Podcast.id == podcast_id)).first()
            if not podcast_db:
                return {"error": "Podcast not found"}, 404
            podcast = {
                "id": str(podcast_db.id),
                "podcast_title": podcast_db.title,
                "podcast_description": podcast_db.description,
                "language": podcast_db.language,
                "created_at": podcast_db.created_at.isoformat() if podcast_db.created_at else None,
                "updated_at": podcast_db.updated_at.isoformat() if podcast_db.updated_at else None,
                "view_count": podcast_db.view_count,
                "like_count": podcast_db.like_count,
                "duration": podcast_db.duration,
                "tags": podcast_db.tags,
            }
            return {"podcast": podcast, "success": True, "message": "Podcast found"}

    podcast = podcasts.get(podcast_id)
    if not podcast:
        return {"error": "Podcast not found"}, 404
    if "duration" not in podcast: # just in case we don't have it yet
        podcast["duration"] = len(pydub.AudioSegment.from_file(audios[podcast_id])) / 1000
    if podcast:
        return {"podcast": podcast, "success": True, "message": "Podcast found"}
    else:
        return {"error": "Podcast not found"}, 404


@app.get("/user/{user_id}/podcasts", dependencies=[fastapi.Depends(get_current_user)])
async def get_podcasts_created_by(user_id: str):
    with session_maker() as sess:
        podcasts_db = sess.exec(select(Podcast).where(Podcast.profile_id == user_id)).all()
        if not podcasts_db:
            return {"error": "No podcasts found for this user"}, 404
        return {"results": podcasts_db}

@app.get("/user/{user_id}/", dependencies=[fastapi.Depends(get_current_user)])
async def get_user_profile(user_id: str):
    with session_maker() as sess:
        user = sess.exec(select(UserProfile).where(UserProfile.id == user_id)).first()
        if not user:
            return {"error": "User not found"}, 404
        return {"user": user}


@app.get("/audios/{podcast_id}")
async def get_audio(podcast_id: str):
    audio = audios.get(podcast_id)
    if audio:
        return FileResponse(audio)
    else:
        return {"error": "Audio not found"}, 404


@app.get("/images/{podcast_id}/avatar/{person_id}")
async def get_image_avatar(podcast_id: str, person_id: str):
    podcast = podcasts.get(podcast_id)
    if not podcast:
        return {"error": "Podcast not found"}, 404
    print("Fetching avatar for podcast_id:", podcast_id, "and person_id:", person_id)
    title = podcast['podcast_title']

    avatar = f"images/{remap_os_safe_title(title)}_{podcast_id}_{person_id}.png"
    if not pathlib.Path(avatar).exists():
        print("Avatar not found for", title, "with person_id", person_id)
        # Fallback to a generic avatar if specific one is not found
        avatar = f"images/{remap_os_safe_title(title)}_{person_id}.png"
        if not pathlib.Path(avatar).exists():
            return {"error": "Avatar image not found"}, 404
    if avatar:
        return FileResponse(avatar)
    else:
        return {"error": "Image not found"}, 404


@app.get("/images/{podcast_id}")
async def get_image(podcast_id: str, v2: bool = True):

    if v2:
        supabase = get_supabase_client(with_service=True)
        image = await supabase.storage.from_("podcast-cover-images").download(f"{podcast_id}.png")
        if image:
            return StreamingResponse(io.BytesIO(image), media_type="image/png")
        # supabase_image = await supabase.storage.from_("podcast_images").download(f"{podcast_id}.png")
    image = images.get(podcast_id)
    if image:
        return FileResponse(image)
    else:
        return {"error": "Image not found"}, 404

@app.get("/queue")
async def get_queue(offset: int = 0, limit: int = 10):
    with session_maker() as sess:
        tasks = sess.exec(select(PodcastGenerationTask).options(joinedload(PodcastGenerationTask.podcast))
                  .order_by(desc(PodcastGenerationTask.created_at))
                  .offset(offset).limit(limit)
                  ).all()
        
        # brittle code - DO NOT TOUCH
        return {
    "tasks": [
        {
            **task.model_dump(),
            "podcast": task.podcast.model_dump() if task.podcast else None,
        }
        for task in tasks
    ]
}



@app.post("/podcasts")
async def create_podcast(podcast: GeneratePodcast | None = None):

    if not podcast:
        return {"error": "No podcast generation data provided"}, 400
    
    task = PodcastGenerationTask(status="pending", progress=0, progress_message="Starting podcast generation...", podcast_id=None)
    with session_maker() as sess:
        sess.add(task)
        sess.commit()

    # supabase = Supabase(os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    
    # generated_podcast = await gen_create_podcast(CreatePodcast.model_validate(podcast.model_dump()), task_id=podcast_id, supabase=supabase)
    # print(podcast)
    # if not generated_podcast:
    #     return {"error": "No podcast generated"}, 400

    
    await inngest.send(
        Event(
            data={
                "task_id": str(task.id),
                "topic": podcast.topic,
                "style": podcast.style,
                "language": podcast.language,
                "description": podcast.description,
            },
            name="ai-podcast.create_podcast",
            id=str(uuid4()),

        )
    )
    
    return {
        "podcast_id": str(task.id),
    }


@inngest.create_function(
        name="Create Podcast",
        fn_id="create_podcast",
        trigger=TriggerEvent(
            event="ai-podcast.create_podcast",
        ),
    )
async def create_podcast_inngest(ctx: Context, step: Step):
    podcast_data: dict[str, str | UUID] = ctx.event.data # type: ignore
    print("Creating podcast with data:", podcast_data)

    supabase = get_supabase_client()
    async def handler():
        podcast = await gen_create_podcast(
            CreatePodcast.model_validate(podcast_data),
            task_id=podcast_data.get("task_id", uuid4()), # type: ignore
            supabase=supabase,
            step=step
        )
        return podcast.model_dump(mode="json")
    
    podcast = await step.run("generate_podcast", handler)

    return podcast

class UserLogin(pydantic.BaseModel):
    user_name: str
    password: str

class UserRegister(UserLogin):
    email: str | None = None
    full_name: str | None = None
    profile_image: str | None = None

@app.post("/login")
async def login(user_login: UserLogin):
    supabase = get_supabase_client(with_service=True)

    if not user_login.user_name or not user_login.password:
        return {"error": "Username and password are required"}, 400
    
    with session_maker() as sess:
        user = sess.exec(
            select(UserProfile).where(UserProfile.username == user_login.user_name)
        ).first()
    
    if not user:
        return {"error": "User not found"}, 404
    
    user = await supabase.auth.admin.get_user_by_id(str(user.id))
    user = user.user
    if not user:
        return {"error": "User not found"}, 404
    
    auth = await supabase.auth.sign_in_with_password({
        "email": user.email or "",
        "password": user_login.password
    })

    return auth


@app.post("/register")
async def register(user_register: UserRegister):
    supabase = get_supabase_client(with_service=True)
    if not user_register.user_name or not user_register.password:
        return {"error": "Username and password are required"}, 400
    
    if not user_register.email:
        return {"error": "Email is required"}, 400
    
    if not user_register.full_name:
        return {"error": "Full name is required"}, 400
    
    supabase_user = await supabase.auth.sign_up({
        "email": user_register.email,
        "password": user_register.password,
    })

    if not supabase_user.user:
        return {"error": "User registration failed"}, 400
    
    user = UserProfile(
        username=user_register.user_name,
        display_name=user_register.full_name,
        id=UUID(supabase_user.user.id),
    )

    with session_maker() as sess:
        sess.add(user)
        sess.commit()

    print("User registered:", user.model_dump())
    
    return user

@app.post("/signout")
async def signout():
    supabase = get_supabase_client(with_service=True)
    try:
        await supabase.auth.sign_out()
        return {"message": "User signed out successfully"}
    except Exception as e:
        return {"error": str(e)}, 500

@app.get("/episodes/{episode_id}/conversation")
async def get_podcast_conversation(episode_id: str):

    with session_maker() as sess:
        conversation = sess.exec(select(Conversation).where(Conversation.episode_id == episode_id))

    return {"conversation": conversation.all()}

@app.get("/podcasts/{podcast_id}/conversations")
async def get_podcast_conversations(podcast_id: str):
    with session_maker() as sess:
        # Now query conversations where episode_id is in episode_ids
        conversations = sess.exec(
            select(Conversation)
            .where(Conversation.podcast_id == podcast_id)
            .options(selectinload(Conversation.speaker), selectinload(Conversation.podcast_author))  # Load speaker relationship
            .order_by(asc(Conversation.start_time))  # Order by start_time
        ).unique().all()

        if not conversations:
            return {"error": "No conversations found"}, 404

        return {"conversations": [{
            **conversation.model_dump(),
            "speaker": conversation.speaker.model_dump() if conversation.speaker else None,
            "podcast_author": (conversation.podcast_author.model_dump() if conversation.podcast_author else {}),
        } for conversation in conversations]}

@app.get("/podcasts/{podcast_id}/episodes")
async def get_podcast_episodes(podcast_id: str):
    with session_maker() as sess:
        episodes = sess.exec(select(PodcastEpisode).where(PodcastEpisode.podcast_id == podcast_id)).all()
        if not episodes:
            return {"error": "Podcast not found"}, 404
        return {"episodes": episodes}

    # podcast["id"] = podcast_id
    # podcasts[podcast["id"]] = podcast
    
    # audios[podcast["id"]] = podcast["audio_file"]
    # images[podcast["id"]] = podcast["image_file"]

    # del podcast["audio_file"]
    # del podcast["image_file"]

    # with open("podcasts.json", "w") as f:
    #     f.write(json.dumps(podcasts, indent=4))
    
    # with open("audios.json", "w") as f:
    #     f.write(json.dumps(audios, indent=4))

    # with open("images.json", "w") as f:
    #     f.write(json.dumps(images, indent=4))
fast_api.serve(app, inngest,functions=[create_podcast_inngest], serve_path="/inngest")

if __name__ == '__main__':
    pass