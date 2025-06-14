import fastapi
import pydantic
import pydub
from gen import main as generate_podcast
from uuid import uuid4
import json
from fuzzywuzzy import fuzz, process
from google import genai

from fastapi.responses import FileResponse

import pathlib

app = fastapi.FastAPI()

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
async def get_podcasts(offset: int = 0, limit: int = 10):
    results = []
    for podcast_id, podcast in list(podcasts.items())[offset:offset + limit]:
        if "duration" not in podcast: # just in case we don't have it yet
            podcast["duration"] = len(pydub.AudioSegment.from_file(audios[podcast_id])) / 1000
        results.append({"id": podcast_id, **podcast})
    return {"results": results}

@app.get("/podcasts/search")
async def search_podcasts(query: str):

    response = client.models.generate_content(contents=prompt.format(query=query), config={"response_mime_type": "application/json", "response_schema": PodcastTopicsSearch}, model="gemini-1.5-flash")
    podcast_search_keys = response.parsed # Type: PodcastTopicsSearch
    print(podcast_search_keys)
    results = []
    for podcast_id, podcast in podcasts.items():
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
            process_results = process.extract(query, [podcast["podcast_title"], podcast["podcast_description"], podcast["episode_title"]], limit=1, scorer=fuzz.partial_ratio)
            search_match += process_results[0][1] if process_results else 0
            print("Search match for", podcast["podcast_title"], ":", search_match)
        search_match /= len(podcast_search_keys.search_keys) if podcast_search_keys.search_keys else 1 # is this a good idea?
        if search_match < 60:
            print("Skipping podcast", podcast["podcast_title"], "due to low search match:", search_match)
            continue


        if "duration" not in podcast: # just in case we don't have it yet
            podcast["duration"] = len(pydub.AudioSegment.from_file(audios[podcast_id])) / 1000
        results.append({"id": podcast_id, **podcast, "search_match": search_match})
    results = sorted(results, key=lambda x: x["search_match"], reverse=True)
    if results:
        return {"results": results}
    return {"results": []}

@app.get("/podcasts/{podcast_id}")
async def get_podcast(podcast_id: str):
    podcast = podcasts.get(podcast_id)
    if not podcast:
        return {"error": "Podcast not found"}, 404
    if "duration" not in podcast: # just in case we don't have it yet
        podcast["duration"] = len(pydub.AudioSegment.from_file(audios[podcast_id])) / 1000
    if podcast:
        return {"podcast": podcast, "success": True, "message": "Podcast found"}
    else:
        return {"error": "Podcast not found"}, 404


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
async def get_image(podcast_id: str):
    image = images.get(podcast_id)
    if image:
        return FileResponse(image)
    else:
        return {"error": "Image not found"}, 404

@app.post("/podcasts")
async def create_podcast(q_topic: str | None = None, podcast: GeneratePodcast | None = None):
    print(podcast, q_topic)
    podcast_id = str(uuid4())

    podcast = generate_podcast(podcast.topic if podcast else q_topic, podcast_id)
    print(podcast)
    if not podcast:
        return {"error": "No podcast generated"}, 400
    
    podcast["id"] = podcast_id
    podcasts[podcast["id"]] = podcast
    
    audios[podcast["id"]] = podcast["audio_file"]
    images[podcast["id"]] = podcast["image_file"]

    del podcast["audio_file"]
    del podcast["image_file"]

    with open("podcasts.json", "w") as f:
        f.write(json.dumps(podcasts, indent=4))
    
    with open("audios.json", "w") as f:
        f.write(json.dumps(audios, indent=4))

    with open("images.json", "w") as f:
        f.write(json.dumps(images, indent=4))

    return {**podcast}

if __name__ == '__main__':
    pass