# Merging api/utils.py
import functools
from fastapi import HTTPException, Request
from supabase import AClient as SupabaseClient

SUPABASE_AUTH_HEADER = "Authorization"

async def update_podcast_generation_task(podcast_id: str, status: str, progress: int = 0, progress_message: str = "", supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").update({
        "status": status,
        "progress": progress,
        "progress_message": progress_message,
    }).eq("id", podcast_id).execute()

async def update_error_generation_task(podcast_id: str, error_message: str, supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").update({
        "status": "failed",
        "error_message": error_message
    }).eq("id", podcast_id).execute()

async def update_completed_generation_task(podcast_id: str, supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").update({
        "status": "completed"
    }).eq("id", podcast_id).execute()

async def create_podcast_generation_task(podcast_id: str, status: str = "pending", progress: int = 0, supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").insert({
        "id": podcast_id,
        "status": status,
        "progress": progress
    }).execute()


class PodcastGenTask():
    def __init__(self, podcast_id: str, status: str = "pending", progress: int = 0, supabase: SupabaseClient | None = None):
        self.podcast_id = podcast_id
        self.status = status
        self.progress = progress
        self.progress_message = ""
        self.supabase = supabase
        self.error_message = None

    async def progress_update(self, progress: int, progress_message: str | None = None):
        self.progress = progress
        self.status = "in_progress"
        self.progress_message = progress_message or ""
        await update_podcast_generation_task(self.podcast_id, self.status, self.progress, self.progress_message, self.supabase)
    
    async def complete(self):
        self.status = "completed"
        await update_completed_generation_task(self.podcast_id, self.supabase)
    
    async def fail(self, error_message: str):
        self.status = "failed"
        self.error_message = error_message
        await update_error_generation_task(self.podcast_id, self.error_message, self.supabase)

def get_supabase_client(with_service=True):
    import os
    if not with_service:
        return SupabaseClient(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])
    return SupabaseClient(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.split("Bearer ")[1]
    supabase = get_supabase_client(with_service=False)
    user_info = await supabase.auth.get_user(token)
    if not user_info or not user_info.user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user_info.user
# Merging api/models.py
import datetime
import functools
from typing import Optional
from sqlmodel import DateTime, SQLModel, Field, Relationship, Column, String, func, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from uuid import uuid4, UUID
from sqlalchemy.sql import and_
from sqlalchemy.orm import foreign

# utcnow = functools.partial(datetime.datetime.now, datetime.timezone.utc)
utcnow = lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

# class GenerationStyle:
#     def __init__(self, topic: str, style: str, language: str, description: str,):
#         self.topic = topic
#         self.style = style
#         self.language = language
#         self.description = description

#     def __composite_values__(self):
#         return self.topic, self.style, self.language, self.description

#     def __repr__(self):
#         return f"{self.topic} - {self.style} - {self.language} - {self.description}"

class UserProfile(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    display_name: str
    username: str = Field(unique=True)

    podcasts: list["Podcast"] = Relationship(back_populates="profile")


class Podcast(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str | None = None
    duration: float | None = None  # Duration in seconds
    cover: str | None = None

    profile_id: UUID | None = Field(foreign_key="userprofile.id")
    profile: UserProfile = Relationship(back_populates="podcasts")

    language: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))

    like_count: int = Field(default=0)
    dislike_count: int = Field(default=0)
    view_count: int = Field(default=0)
    trending_score: float = Field(default=0.0)
    is_featured: bool = Field(default=False)
    is_generating: bool = Field(default=False)
    is_public: bool = Field(default=True)

    authors: list["PodcastAuthorPodcast"] = Relationship(back_populates="podcast")
    episodes: list["PodcastEpisode"] = Relationship(back_populates="podcast")

    task: Optional["PodcastGenerationTask"] = Relationship(
        back_populates="podcast",
    )
    created_at: datetime.datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )
    updated_at: datetime.datetime = Field(
        default_factory=utcnow,
        sa_column=Column(
            DateTime,
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
    )

    conversations: list["Conversation"] = Relationship(
        back_populates="podcast",
    )

class PodcastAuthorPersona(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    bio: str | None = None
    background: str | None = None
    profile_image: str | None = None

    gender: str | None = None
    country: str | None = None

    friendlyness: float = Field(default=0.0)
    trustworthiness: float = Field(default=0.0)
    expertise: str | None = None

    authored_podcasts: list["PodcastAuthorPodcast"] = Relationship(back_populates="author")

    outgoing_relationships: list["PodcastAuthorDynamics"] = Relationship(
        back_populates="author",
        sa_relationship_kwargs={"foreign_keys": "[PodcastAuthorDynamics.other_author_id]"}
    )
    incoming_relationships: list["PodcastAuthorDynamics"] = Relationship(
        back_populates="other_author",
        sa_relationship_kwargs={"foreign_keys": "[PodcastAuthorDynamics.author_id]"}
    )

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))
    


class PodcastAuthorPodcast(SQLModel, table=True):
    podcast_id: UUID = Field(foreign_key="podcast.id", primary_key=True)
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)

    podcast: Podcast = Relationship(back_populates="authors")
    author: PodcastAuthorPersona = Relationship(back_populates="authored_podcasts")

    is_host: bool = Field(default=False)

    conversations: list["Conversation"] = Relationship(
        back_populates="podcast_author",
        sa_relationship_kwargs={
            "primaryjoin": lambda: and_(
            Conversation.podcast_id == foreign(PodcastAuthorPodcast.podcast_id), # type: ignore # type: ignore
            Conversation.speaker_id == foreign(PodcastAuthorPodcast.author_id), # type: ignore
            ),
            "uselist": True,
        }
    )


class PodcastAuthorDynamics(SQLModel, table=True):
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)
    other_author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)

    author: PodcastAuthorPersona = Relationship(back_populates="outgoing_relationships", sa_relationship_kwargs={
        "foreign_keys": "[PodcastAuthorDynamics.author_id]"
    })
    other_author: PodcastAuthorPersona = Relationship(back_populates="incoming_relationships", sa_relationship_kwargs={
        "foreign_keys": "[PodcastAuthorDynamics.other_author_id]"
    })

    trust: float = Field(default=0.0)
    likes: int = Field(default=0)
    hates: int = Field(default=0)
    relationship: str | None = None
    background: str | None = None


class PodcastEpisode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    number: int
    title: str
    description: str | None = None
    cover: str | None = None
    audio_file: str | None = None  # Path to the audio file

    podcast_id: UUID = Field(foreign_key="podcast.id")
    podcast: Podcast = Relationship(back_populates="episodes")

    conversations: list["Conversation"] = Relationship(back_populates="episode")

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))


class Conversation(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    text: str
    start_time: float | None = None
    end_time: float | None = None

    speaker_id: UUID = Field(foreign_key="podcastauthorpersona.id")
    speaker: PodcastAuthorPersona = Relationship()

    podcast_id: UUID | None = Field(foreign_key="podcast.id")
    podcast: Podcast | None = Relationship(back_populates="conversations")

    episode_id: UUID = Field(foreign_key="podcastepisode.id")
    episode: PodcastEpisode = Relationship(back_populates="conversations")

    podcast_author: "PodcastAuthorPodcast" = Relationship(
        back_populates="conversations",
        sa_relationship_kwargs={
            "primaryjoin":lambda: and_(
                Conversation.podcast_id == foreign(PodcastAuthorPodcast.podcast_id), # type: ignore
                Conversation.speaker_id == foreign(PodcastAuthorPodcast.author_id), # type: ignore
            ),
            "uselist": False,
        },
    )

class PodcastGenerationTask(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: str = Field(default="pending")  # pending, in_progress, completed, failed
    progress: int = Field(default=0)  # Progress percentage (0-100)

    progress_message: str | None = None
    error_message: str | None = None

    podcast_id: UUID | None = Field(foreign_key="podcast.id")
    podcast: Optional[Podcast] = Relationship(back_populates="task")

    generation_data: dict | None = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )  # JSON or other data related to the generation task

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))
# Merging api/db.py
import contextlib
from sqlalchemy import NullPool
from sqlmodel import create_engine, Session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Make it async

# db_url = "postgresql+asyncpg://postgres:aipodcast-123@db.kzgbfmhlcmfjknkbvggg.supabase.co:5432/postgres"
db_url = "postgresql+asyncpg://postgres.kzgbfmhlcmfjknkbvggg:aipodcast-123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_async_engine(
    db_url,
    echo=True, poolclass=NullPool,)

@contextlib.asynccontextmanager
async def session_maker():
    sess = AsyncSession(engine, expire_on_commit=False)
    try:
        yield sess
    except Exception as e:
        await sess.rollback()
        raise e
    finally:
        await sess.close()

async def get_session():
    async with session_maker() as session:
        yield session
# Merging api/gen.py
import asyncio
import time
from typing import Literal
from uuid import UUID, uuid4
from dotenv import load_dotenv
load_dotenv()

import pydantic
from sqlmodel import select





import random
import os
import json
import base64

import gtts
import pydub
from pydub import AudioSegment
import google.genai as genai
import google.cloud.texttospeech as tts
import io

import platform
if platform.system() == "Linux":
    import pydub
    # connect the ffmpeg library to pydub
    pydub.AudioSegment.converter = "ffmpeg-linux-x64.gz"


from sqlalchemy.orm import selectinload, joinedload


from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from supabase import AClient as Supabase

def get_service_account_info() -> dict:
    res = base64.b64decode(os.environ["GEN_LANG_JSON_KEY"]).decode("utf-8")
    res = json.loads(res)
    return res
    

def get_speech_client():
    tts_client: tts.TextToSpeechAsyncClient = tts.TextToSpeechAsyncClient.from_service_account_info(
    get_service_account_info())
    return tts_client

speech_client = get_speech_client()


VOICE_MODEL = "Chirp3" # "Standard" | "Wavenet" | "Chirp3"

# TTS_FOLDER = "tts"
# FINAL_FOLDER = "finals" # Folder to save the final podcast
# IMAGES_FOLDER = "images" # Folder to save the images

# if not os.path.exists(FINAL_FOLDER):
#     os.makedirs(FINAL_FOLDER)
# if not os.path.exists(TTS_FOLDER):
#     os.makedirs(TTS_FOLDER)
# if not os.path.exists(IMAGES_FOLDER):
#     os.makedirs(IMAGES_FOLDER)


# model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

client = genai.Client()

# image_model = client.models.generate_content(
#     model="gemini-2.0-flash-exp-image-generation",
#     contents=[text_input, image],
#     config=types.GenerateContentConfig(
#       response_modalities=['Text', 'Image']
#     )
# )

podcast_prompt = """
You are an expert in the field of **{topic}**.
You are creating a podcast episode for **{topic}**.
The podcast follows the {style} style. Match the style of the conversation to the style requested.
Any background information or description of the topic is given:
{description}
The podcast is in **{language}**.

**Prompt:**

Create a podcast-style conversation on the topic **{topic}**, in **{language}**, targeting 20-year-old engineering students.
The conversation should be engaging, informative, and easy to understand.
Podcast should match the style requested.
Explain the topic intuitively, breaking down complex concepts into simple terms unless explicitly requested otherwise.

* The format should be a friendly and engaging chat between an interviewer and one or more speakers.
* Do not use "*" or "**" for bold / emphasis text, just use normal text. (Don't use markdown formatting in the text, just plain text.)
* If more than one speaker is requested, adjust the number of interviewers and speakers accordingly (e.g., 5 speakers = 2 interviewers + 3 speakers).
* Use simple, casual language with natural-sounding phrases (add a few "uh", "umm", etc. for realism).
* Spice in a few arguments or disagreements to make it lively, but keep it friendly and respectful. (Between guests and interviewer too.) (HEATED DISCUSSIONS) (Only if requested by the user)
* The conversation should be about 12 minutes long and include **around 50 questions and answers**.

* You may include "[pause long]" in the conversation to indicate a longer pause, but keep it natural.
* Keep it light, easy to understand, and relatable.
* Speakers should be named (e.g., Dr. Ravi, Ms. Anu). Use first names in the conversation.
* No need for complex words or SSML tags. Avoid using backquotes for code—just write it out.
* Use a friendly, simple tone. Avoid being too formal or technical.
* Use English for technical terms and local language for casual phrases.
* Use the appropriate script for the language (e.g. Devanagari for Hindi, Tamil script for Tamil).
* Guests can also talk with each other not just with interviewer.
* More debates and arguments in between guests to spice it up (HEATED DISCUSSIONS).
* Makes sure that the topic is included in the description or episode title of the podcast.
* If list or steps are generated, make sure to keep the same person speaking throughout the list or steps. (Don't change the speaker in between the list or steps).
* == DO NOT USE MARKDOWN FORMATTING IN THE TEXT, JUST PLAIN TEXT. ==
* Keep the conversation in the requested language, but use English for technical terms if needed.

**Key points:**

* Friendly, simple tone (match the style requested)
* Casual back-and-forth discussion
* Add some arguments or disagreements. (HEATED DISCUSSIONS) (Only if explicity requested by the user)
* Break long explanations into short answers
* Keep technical terms in English if needed
* Same language for everyone in the podcast


PODCAST SCHEMA:
"""

podcast_schema = """
{
    "podcastTitle": "Podcast Title",
    "podcastDescription": "Podcast Description",
    "episodeTitle": "Episode Title",
    "people": [
        {
            "id": "a unique id for the person to identify the person in the conversation",
            "name": "Interviewer Name",
            "country": "Language Code in the format of 'en-US' or 'en-GB'",
            "gender": "male | female",
            "interviewer": true
        },
        {
            "id": "a unique id for the person to identify the person in the conversation",
            "name": "Speaker Name",
            "country": "Language Code in the format of 'en-US' or 'en-GB'",
            "gender": "male | female",
            "interviewer": false
        }
    ],
    "tags": [
        "tag1",
        "tag2",
        "tag3",
        ... (any number of tags, each tag is a string)
    ]
    "language": "Language Code in the format of 'en-US' or 'en-GB'",
    "conversation": [
        {
            "speaker": "person id",
            "text": "Question or statement",
            "pronounciations": [
                {
                    "word": "word to be pronounced",
                    "ipa": "IPA representation of the word",
                    "phonetic": "Phonetic representation of the word"
                }
            ]
        },
        {
            "speaker": "person id",
            "text": "Question or statement",
            "pronounciations": [
                {
                    "word": "word to be pronounced",
                    "ipa": "IPA representation of the word",
                    "phonetic": "Phonetic representation of the word"
                }
            ]
        }
    ]
}
"""

class PersonAI(pydantic.BaseModel):
    name: str
    country: str
    gender: str
    interviewer: bool = pydantic.Field(..., description="true if the person is the interviewer, false if the person is the speaker")
    id: str = pydantic.Field(..., description="a unique id for the person to identify the person in the conversation")

class PronounciationAI(pydantic.BaseModel):
    word: str = pydantic.Field(..., description="The word to be pronounced")
    ipa: str = pydantic.Field(..., description="The IPA representation of the word")
    phonetic: str = pydantic.Field(..., description="The phonetic representation of the word")

class ConversationAI(pydantic.BaseModel):
    speaker: str = pydantic.Field(..., description="interviewer or speaker")
    text: str
    pronunciations: list[PronounciationAI] = pydantic.Field(
        default_factory=list, 
        description="List of pronounciations for the words in the text. If the word is not in the list, it will be pronounced as it is."
    )

    start_time: float | None
    end_time: float | None

class PodcastAI(pydantic.BaseModel):
    podcastTitle: str
    podcastDescription: str
    episodeTitle: str
    people: list[PersonAI]
    language: str
    tags: list[str]
    episodeNumber: str = pydantic.Field(..., description="Episode number in the format of '1', '2', '3'")
    conversation: list[ConversationAI]

class DetectedLanguageAI(pydantic.BaseModel):
    lang: str = pydantic.Field(..., description="Language code in the format of 'en-US' or 'en-GB' (ISO-639-1)")
    confidence: float = pydantic.Field(..., description="Confidence score of the detected language")

img_prompt = """
Generate a podcast cover image for the podcast titled "{podcastTitle}".
Description of the podcast is:
{podcastDescription}


People involved in the podcast are:
{people}
Additionally, include images of the people in the podcast.


Use the language as used in the topic.

The image should be colorful and engaging. 
The image should be in the format of a podcast cover image. 
The image should be in the format of a square. 
The image should be in the format of PNG. 
The image should be in the format of a 72 dpi.
The image should be in the format of a 24 bit color depth.
Choose the correct image for the speaker and interviewer.

Use abstract art and design elements to create a visually appealing image.
"""

featured_prompt = """Generate a podcast cover image for the podcast titled "{podcastTitle}".
Description of the podcast is:
{podcastDescription}


People involved in the podcast are:
{people}
Additionally, include images of the people in the podcast.

The image should be colorful and engaging. 
The image should be in the format of a podcast cover image. 
The image should be in the format of a rectangle (16:9). 
The image should be in the format of PNG. 
Aspect ratio of the image should be 16:9 (wide).

Use abstract art and design elements to create a visually appealing image.
Keep image simple and clean, with a focus on the podcast title and description.
"""

author_prompt = """
Generate an image of {persona.name} from {persona.country} who is a {persona.gender}.

Bio:
{persona.bio}

Background:
{persona.background}

The image should be in the format of a square.
Make sure that the image resembles a real-looking person, NOT a cartoon or an avatar. (An image that will be used in the actual podcast cover image)
Keep the image clean and professional and high quality.
Ground it to be more realistic and human-like and NOT like a AI generated avatar.
"""

people_prompt = """
{index}. {persona.name} is from {persona.country}, is a {persona.gender} and is a {interviewer} in the podcast.
"""


async def generate_featured_podcast_thumbnail_image(podcast: Podcast) -> io.BytesIO:
    response = await client.aio.models.generate_content(contents=img_prompt.format(
        podcastTitle=podcast.title,
        people="".join([people_prompt.format(index=index, persona=persona.author, interviewer=("host" if persona.is_host else "guest")) for index, persona in enumerate(podcast.authors, start=1)]),
        podcastDescription=podcast.description,
    ), config={"response_modalities": ["IMAGE", "TEXT"]}, model="gemini-2.0-flash-exp-image-generation")
    if not response.candidates or not response.candidates[0].content or not response.candidates[0].content.parts:
        raise ValueError("No image found in response")
    for content in response.candidates[0].content.parts:
        # print(content)
        if content.text is not None:
            continue
        if content.inline_data is not None:
            image = content.inline_data.data
            if image is None:
                raise ValueError("No image data found in response")
            image = io.BytesIO(image)
            break
    else:
        raise ValueError("No image found in response")
    return image

async def generate_featured_podcast_thumbnail_image(podcast: Podcast) -> io.BytesIO:
    response = await client.aio.models.generate_content(contents=featured_prompt.format(
        podcastTitle=podcast.title,
        people="".join([people_prompt.format(index=index, persona=persona.author, interviewer=("host" if persona.is_host else "guest")) for index, persona in enumerate(podcast.authors, start=1)]),
        podcastDescription=podcast.description,
    ), config={"response_modalities": ["IMAGE", "TEXT"]}, model="gemini-2.0-flash-exp-image-generation")
    if not response.candidates or not response.candidates[0].content or not response.candidates[0].content.parts:
        raise ValueError("No image found in response")
    for content in response.candidates[0].content.parts:
        # print(content)
        if content.text is not None:
            continue
        if content.inline_data is not None:
            image = content.inline_data.data
            if image is None:
                raise ValueError("No image data found in response")
            image = io.BytesIO(image)
            break
    else:
        raise ValueError("No image found in response")
    return image

# def synth_turn(text, lang="en-IN", voice="en-IN-Standard-A", pronounciations: list[PronounciationAI] | None = None):
#     pronounciations = pronounciations or []
#     print([pron for pron in pronounciations])
#     # filename = os.path.join(TTS_FOLDER, filename)
#     speech = speech_client.synthesize_speech(
#         input=tts.SynthesisInput(text=text,
#                 custom_pronunciations=tts.CustomPronunciations(
#                     pronunciations=[
#                     tts.CustomPronunciationParams(
#                         phrase=pronounciation.word,
#                         pronounciation=pronounciation.ipa,
#                         phonetic_encoding="PHONETIC_ENCODING_IPA"
#                     ) for pronounciation in (pronounciations or [])
#                 ]
#                 )
#             ),        
#         # input=tts.SynthesisInput(ssml=f"<speak>{text}</speak>"),
#         voice=tts.VoiceSelectionParams(
#             language_code=lang,
#             name=voice,
#         ),
#         audio_config=tts.AudioConfig(
#             audio_encoding=tts.AudioEncoding.LINEAR16,
#             # speaking_rate=1.05,
#             pitch=0.0,
            
#         ),
#     )

#     if speech.audio_content is None:
#         # TODO: retry after exponential backoff
#         pass

#     return io.BytesIO(speech.audio_content)
#     # # Save the audio to a file
#     # with open(filename, "wb") as out:
#     #     out.write(speech.audio_content)
    

# def save_podcast(text, filename, tld="com"):
#     filename = os.path.join(TTS_FOLDER, filename)
#     tts = speech_model.generate_content(text, generation_config={"max_output_tokens": 4000})
#     print(tts.text)
#     # tts.save(filename)

def detect_topic_language(topic: str) -> str:
    response = client.models.generate_content(contents=f"Detect the language given in the topic: {topic}. The language must be in the form of en-US, en-IN, etc. Also, if the user requests for a specific language, eg: (in tamil, in hindi), return that language instead in the format as specified earlier. (ISO-639-1)", config={"response_mime_type": "application/json", "response_schema": DetectedLanguageAI}, model="gemini-1.5-flash")
    data = DetectedLanguageAI.model_validate(response.parsed)
    return data.lang

def remap_os_safe_title(title: str) -> str:
    return title.replace(" ", "_").replace(":", "_").replace("?", "_").replace("!", "_").replace(",", "_")

async def select_voice_people(people: list[PersonAI], lang: str) -> dict[str, tts.Voice]:

    # speech_client = tts.TextToSpeechAsyncClient.from_service_account_json(os.environ["GEN_LANG_JSON"])
    speech_client = get_speech_client()

    voices = {}
    used_voices = set()

    all_voices = await speech_client.list_voices(tts.ListVoicesRequest(language_code=lang))
    listed_voices = [voice for voice in all_voices.voices if VOICE_MODEL in voice.name]

    gender_voices: dict[Literal["male"] | Literal["female"] | Literal["neutral"], list[tts.Voice]] = {
        "male": [],
        "female": [],
        "neutral": [],
    }

    for voice in listed_voices:
        gender = tts.SsmlVoiceGender(voice.ssml_gender).name.lower()
        if gender in gender_voices:
            gender_voices[gender] += [voice]
    

    for person in people:
        if person.id not in voices:
            person_gender = person.gender.lower()
            if (person_gender not in ["male", "female", "neutral"]):
                raise ValueError(f"Invalid {person_gender} is generated.")
            
            available = [v for v in gender_voices.get(person_gender if person_gender in gender_voices else "neutral", []) if v.name not in used_voices]
            
            if not available:
                raise ValueError(f"No available voices left for gender: {person.gender}")

            voice = random.choice(available)
            voices[person.id] = voice
            used_voices.add(voice.name)
    return voices

async def save_image(image: io.BytesIO, name: str, bucket: str = "podcast-cover-images") -> str:
    supabase = Supabase(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    image.seek(0)  # Reset the stream position to the beginning
    res = await supabase.storage.from_(bucket).upload(name, image.getvalue(), {"content-type": "image/png", "upsert": "true"})
    return res.full_path


async def save_podcast_cover(podcast: Podcast) -> None:

    image = await generate_featured_podcast_thumbnail_image(podcast)
    await save_image(image, f"{podcast.id}.png", "podcast-cover-images")

async def generate_author_image(persona: PodcastAuthorPersona) -> tuple[UUID, io.BytesIO]:
    response = await client.aio.models.generate_content(contents=author_prompt.format(persona=persona), config={"response_modalities": ["IMAGE", "TEXT"]}, model="gemini-2.0-flash-exp-image-generation")

    if not response.candidates or not response.candidates[0].content or not response.candidates[0].content.parts:
        raise ValueError("No image found in response")

    for content in response.candidates[0].content.parts:
        if content.text is not None:
            continue
        if content.inline_data is not None:
            image = content.inline_data.data
            if image is None:
                raise ValueError("No image data found in response")
            image = io.BytesIO(image)
            return persona.id, image
    else:
        raise ValueError("No image found in response")

async def generate_author_images(authors: list[PodcastAuthorPersona]) -> None:
    print(f"Generating images for {len(authors)} authors...")

    tasks = []
    for author in authors:
        task = asyncio.create_task(generate_author_image(author))
        tasks.append(task)

    res = await asyncio.gather(*tasks)
    responses = {pid: response for pid, response in res if response is not None}
    print("All author images generated. Saving images...")

    tasks = []
    for pid, response in responses.items():
        tasks.append(asyncio.create_task(save_image(response, f"{pid}.png", "podcast-authors")))
    
    await asyncio.gather(*tasks)

    # executor = ThreadPoolExecutor()
    # futures = []
    # for author in authors:
    #     future = executor.submit(generate_author_image, author)
    #     futures.append((author.id, future))
    # executor.shutdown(wait=True)
    # print("All author images generated. Saving images...")
    # for (pid, future) in futures:
    #     response = future.result()
    #     await save_image(response, f"{title}_{pid}")


def main_test(topic: str, podcast_id: str | None = None):
    pass
    # podcast_id = podcast_id or str(uuid4())
    # print(f"Generating podcast for topic: {topic} with ID: {podcast_id}")
    # lang = detect_topic_language(topic)
    # print(f"Detected language: {lang}")
    # podcast = generate_podcast(topic, lang)
    # # print(podcast.model_dump_json(indent=4))
    # podcast_title = podcast.podcastTitle
    # podcast_description = podcast.podcastDescription
    # episode_title = podcast.episodeTitle
    # conversation = [conversation.model_dump() for conversation in podcast.conversation]
    # os_safe_title = remap_os_safe_title(podcast_title) + "_" + podcast_id
    
    # # country_interviewer = interviewer["country"]
    # # country_speaker = speaker["country"]
    # # gender_interviewer = interviewer["gender"]
    # # gender_speaker = speaker["gender"]
    # language = podcast.language
    # episode_number = podcast.episodeNumber

    # start_time = time.time()
    # voices = select_voice_people(podcast.people, podcast.language)
    # end_time = time.time()
    # print(f"Time taken to select voices: {end_time - start_time} seconds")

    # executor = ProcessPoolExecutor()
    
    #     # return image
    
    # image_file = os.path.join(IMAGES_FOLDER, f"{os_safe_title}.png")
    # res = executor.submit(save_podcast_cover, podcast, topic, os_safe_title)

    # print(f"Selected voices: {"".join([f"{name} - {voice.name}\n" for name, voice in voices.items()])}")
    # print("Generating podcast...")
    # print(f"Podcast Title: {podcast_title}")
    # # title_audio = save_podcast(podcast_title, language, gen_voice_ann.name)
    # # desc_audio = save_podcast(podcast_description, language, gen_voice_ann.name)
    # # ep_audio = save_podcast(f"{episode_title}", language, gen_voice_ann.name)
    
    # # audios = [title_audio, desc_audio, ep_audio]
    # audios = []
    # conv_audios = []

    # people = {person.id: person for person in podcast.people}
    
    # executor.submit(generate_author_images, podcast, topic, os_safe_title)


    # with ThreadPoolExecutor() as executor:
    #     for idx, turn in enumerate(podcast.conversation):
    #         voice = voices[turn.speaker]
    #         country = people[turn.speaker].country
    #         print("Generating audio for turn: ", turn.text)
    #         turn_audio = executor.submit(save_podcast, turn.text, country, voice.name, turn.pronunciations)
    #         conv_audios.append(turn_audio)
    #         print(f"Generated {turn.speaker} audio for turn {idx + 1}/{len(conversation)}")

    #         if idx % 8 == 0:
    #             time.sleep(1)  # Sleep for 1 second every 10 turns to avoid rate limiting
    
    # conv_audios = [audio.result() for audio in conv_audios]

    # print(f"Podcast '{podcast_title}' generated and saved in {os.path.abspath('tts')} folder.")

    # # merge the files into a single podcast
    
    # title_audio_seg = sum([pydub.AudioSegment.from_wav(audio) + pydub.AudioSegment.silent(duration=500) for audio in audios])
    # conv_segments = [pydub.AudioSegment.from_wav(audio) for audio in conv_audios]
    # combined = AudioSegment.silent(duration=500) + title_audio_seg  # Add silence at the beginning
    # for idx, segment in enumerate(conv_segments):
    #     conversation[idx]["start_time"] = len(combined) / 1000  # start time in seconds
    #     # 500ms silence between segments - (based on the average pause between sentences)
    #     silence_duration = min(500, len(segment) / 10)  # maximum 500ms silence or 1/10th of the segment length
    #     combined += segment + AudioSegment.silent(duration=min(int(silence_duration), 1))  # Add a 500ms silence between segments

    #     conversation[idx]["end_time"] = len(combined) / 1000
    
    # final_file = os.path.join(FINAL_FOLDER, f"{os_safe_title}_final.wav")
    # combined.export(final_file, format="wav")

    # print(f"Final podcast '{os_safe_title}_final.wav' generated.")
    # res = res.result()
    # executor.shutdown(wait=True)
    # return {
    #     "podcast_title": podcast_title,
    #     "podcast_description": podcast_description,
    #     "episode_title": episode_title,
    #     "people": [people.model_dump() for people in podcast.people],
    #     "language": language,
    #     "conversation": conversation,
    #     "audio_file": final_file,
    #     "duration": len(combined) / 1000,  # duration in seconds
    #     "image_file": image_file,
    #     "episode_number": episode_number,
    # }


class CreatePodcast(pydantic.BaseModel):
    topic: str = pydantic.Field(..., description="The topic of the podcast")
    language: str = pydantic.Field(..., description="The language of the podcast in the format of 'en-US' or 'en-GB'")
    style: str = pydantic.Field(
        default="casual",
        description="The style of the podcast. Can be 'casual', 'formal', 'debate', 'interview', etc."
    )
    description: str | None = pydantic.Field(
        default=None,
        description="The description of the podcast. If not provided, it will be generated based on the topic."
    )


async def generate_podcast_content(create_podcast: CreatePodcast):
    response = await client.aio.models.generate_content(contents=podcast_prompt.format(topic=create_podcast.topic, language=create_podcast.language, style=create_podcast.style, description=create_podcast.description) + podcast_schema, config={"response_mime_type": "application/json", "response_schema": PodcastAI}, model="gemini-2.0-flash",)
    return PodcastAI.model_validate(response.parsed) 


async def generate_audio(turn: ConversationAI, voice: tts.Voice, country: str) -> io.BytesIO:
    # speech_client: tts.TextToSpeechAsyncClient = tts.TextToSpeechAsyncClient.from_service_account_json(os.environ["GEN_LANG_JSON"])
    speech_client = get_speech_client()
    pronunciations = turn.pronunciations or []
    print([pron for pron in pronunciations])
    # filename = os.path.join(TTS_FOLDER, filename)
    request = tts.SynthesizeSpeechRequest(
        
        input=tts.SynthesisInput(text=turn.text,
                # custom_pronunciations=tts.CustomPronunciations(
                #     pronunciations=[
                #     tts.CustomPronunciationParams(
                #         phrase=pronounciation.word,
                #         pronunciation=pronounciation.ipa,
                #         phonetic_encoding="PHONETIC_ENCODING_IPA"
                #     ) for pronounciation in (pronunciations or [])
                # ]
                # )
            ),        
        # input=tts.SynthesisInput(ssml=f"<speak>{text}</speak>"),
        voice=tts.VoiceSelectionParams(
            language_code=voice.language_codes[0] if voice.language_codes else country,
            name=voice.name,
            ssml_gender=voice.ssml_gender,
        ),
        audio_config=tts.AudioConfig(
            audio_encoding=tts.AudioEncoding.LINEAR16,
        ),
    )

    speech = await speech_client.synthesize_speech(
        request=request,
    )

    if speech.audio_content is None:
        # TODO: retry after exponential backoff
        pass

    return io.BytesIO(speech.audio_content)

async def save_conversation_audio(people: list[PersonAI], conversation: list[ConversationAI], voices: dict[str, tts.Voice]):
    audio_tasks = []
    people_map = {person.id: person for person in people}
    for idx, turn in enumerate(conversation):
        voice = voices[turn.speaker]
        country = people_map[turn.speaker].country
        print(f"Generating audio for turn {idx + 1}/{len(conversation)}:\n{turn.text}")
        turn_audio = asyncio.create_task(generate_audio( turn, voice, country))
        audio_tasks.append(turn_audio)
        if idx % 8 == 0:
            await asyncio.sleep(1)  # Sleep for 1 second every 10 turns to avoid rate limiting

    conv_audios = await asyncio.gather(*audio_tasks)
    conv_audios = [pydub.AudioSegment.from_wav(audio) for audio in conv_audios if audio is not None]  # Filter out any None results
    return conv_audios

def combine_audio_segments(audio_segments: list[pydub.AudioSegment]) -> tuple[list[tuple[float, float]], AudioSegment]:
    combined: AudioSegment = AudioSegment.silent(duration=500)  # Start with 500ms silence
    conversation_markers: list[tuple[float, float]] = []

    total_duration = 0.5
    for segment in audio_segments:
        
        silence_duration = min(500, len(segment) // 10) # maximum 500ms silence or 1/10th of the segment length
        combined += segment + AudioSegment.silent(duration=max(silence_duration, 1)) 

        start = total_duration
        total_duration = len(combined) / 1000.0  # Update total duration in seconds
        end = total_duration

        conversation_markers.append((start, end))  # Store start and end times in seconds
    return conversation_markers, combined


async def create_podcast_gen(create_podcast: CreatePodcast, task_id: UUID | None = None, supabase: Supabase | None = None, profile_id: UUID | None = None) -> Podcast:
    task_id = task_id or uuid4()

    if not create_podcast.topic:
        raise ValueError("Topic is required to create a podcast.")

    if not supabase:
        raise ValueError("Supabase client is required to create a podcast.")


    # if not inngest:
    #     raise ValueError("Inngest client is required to create a podcast.")
    
    podcast_gen_task = PodcastGenTask(podcast_id=str(task_id), supabase=supabase)

    await podcast_gen_task.progress_update(0, "Starting podcast generation...")
    if not create_podcast.language:
        await podcast_gen_task.progress_update(5, "Detecting language...")
        language = detect_topic_language(create_podcast.topic)
        create_podcast.language = language
    
    await podcast_gen_task.progress_update(9, "Generating podcast metadata...")
    

    print(f"Creating podcast for topic: {create_podcast.topic} with ID: {task_id}")
    # Generate the podcast content (metadata and conversation)
    podcast_metadata: PodcastAI = await generate_podcast_content(create_podcast)
    await podcast_gen_task.progress_update(10, "Generating podcast content...")
    podcast_conversation = podcast_metadata.conversation

    podcast = Podcast(
        title=podcast_metadata.podcastTitle,
        description=podcast_metadata.podcastDescription,
        language=podcast_metadata.language,
        tags=podcast_metadata.tags,
        profile_id=profile_id,
        is_generating=True,
        is_public=False, 
    )
    

    podcast_id = podcast.id

    personas = [PodcastAuthorPersona(name=person.name, bio=f"{person.country}") for person in podcast_metadata.people]

    podcast.authors = [PodcastAuthorPodcast(
        author=persona,
        podcast=podcast,
        is_host=author.interviewer,
        author_id=persona.id,
        podcast_id=podcast.id,
    ) for persona, author in zip(personas, podcast_metadata.people)]
    
    image_gen_tasks = [
        asyncio.create_task(save_podcast_cover(podcast,)),
        asyncio.create_task(generate_author_images([author.author for author in podcast.authors]))
    ]

    async with session_maker() as sess:
        sess.add(podcast)
        await sess.commit()
        await sess.refresh(podcast)

    async with session_maker() as sess:
        task = (await sess.execute(select(PodcastGenerationTask).where(PodcastGenerationTask.id == task_id))).scalar_one_or_none()
        if task is None:
            raise ValueError(f"Podcast generation task with ID {task_id} not found. Something went terribly wrong.")
        task.podcast_id = podcast.id

        sess.add(task)
        await sess.commit() # update the task with the podcast ID at the earliest possible moment


    await podcast_gen_task.progress_update(15, "Saving podcast metadata and episode...")

    async with session_maker() as sess:

        episode = PodcastEpisode(
            number=int(podcast_metadata.episodeNumber),
            title=podcast_metadata.episodeTitle,
            podcast_id=podcast.id,
        )

        persona_map = {author.id: persona for persona, author in zip(personas, podcast_metadata.people)}
        # Add the conversation turns to the podcast
        turns = [Conversation(
            text=turn.text,
            speaker_id=persona_map[turn.speaker].id,
            start_time=None,  # Will be set later after audio generation
            end_time=None,  # Will be set later after audio generation
            episode_id=episode.id,
            episode=episode,
            podcast_id=podcast.id,
        ) for turn in podcast_conversation]
        episode.conversations = turns

        print("Getting new podcast from the database...")
        podcast = (await sess.execute(select(Podcast).where(Podcast.id == podcast.id).options(
            selectinload(Podcast.authors), selectinload(Podcast.episodes).selectinload(PodcastEpisode.conversations) # type: ignore
        ))).scalar_one_or_none()
        if podcast is None:
            print("Podcast not found in the database. Something went terribly wrong.")
            raise ValueError(f"Podcast not found. Something went terribly wrong.")
        podcast.episodes.append(episode)
        print("Saving podcast metadata and episode...")
        sess.add(podcast)
        await sess.flush()
        
        # Generate the audio for the podcast
        await podcast_gen_task.progress_update(20, "Selecting voices for the podcast...")

        # Currently, voices are selected automatically based on the people in the podcast and the language.
        print("Selecting voices for the podcast...")
        voices = await select_voice_people(podcast_metadata.people, podcast_metadata.language)
        print(f"Selected voices: \n{', '.join([f'{person} - {voice.name}' for person, voice in voices.items()])}")
        await podcast_gen_task.progress_update(50, "Generating audio segments for the podcast...")

        conv_audios = await save_conversation_audio(podcast_metadata.people, podcast_conversation, voices)

        await podcast_gen_task.progress_update(80, "Combining audio segments...")

        markers, combined_audio = combine_audio_segments(conv_audios)
        # Combine the audio segments into a single podcast audio file
        print("Combining audio segments...")

        for idx, turn in enumerate(turns):
            turn.start_time = markers[idx][0]
            turn.end_time = markers[idx][1]
            turn.podcast_id = podcast.id
        

        podcast.duration = len(combined_audio) / 1000.0  # duration in seconds
        podcast.is_generating = False
        sess.add(podcast)
        sess.add_all(turns)
        await sess.commit()

    buffer = io.BytesIO()
    combined_audio.export(buffer, format="mp3")
    await podcast_gen_task.progress_update(85, "Saving podcast metadata and audio...")

    buffer.seek(0)  # Reset the buffer position to the beginning

    await podcast_gen_task.progress_update(90, "Saving podcast audio...")
    await supabase.storage.from_("podcasts").upload(f"{podcast_id}.mp3", buffer.getvalue(), {"content-type": "audio/mpeg", "upsert": "true"})
    
    await podcast_gen_task.progress_update(100, "Waiting for podcast cover image and author images to complete...")
    await asyncio.gather(*image_gen_tasks)

    await podcast_gen_task.progress_update(100, "Podcast generation completed successfully.")
    await podcast_gen_task.complete()

    return podcast


# if __name__ == "__main__":
#     import dotenv
#     dotenv.load_dotenv()

#     import os
#     import math

#     task_id = uuid4()

#     async def main():
#         await create_podcast_generation_task(
#             podcast_id=str(task_id),
#             status="pending",
#             progress=0,
#             supabase=Supabase(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]),
#         )
#         await create_podcast_gen(
#             CreatePodcast(
#                 topic="php programming language",
#                 language="en-IN",
#                 style="casual, friendly, and engaging",
#                 description="Explain the PHP programming language and it's use in web development, including its history, features, and how it compares to other languages like Python and JavaScript.",
#             ),
#             task_id=task_id,
#             # inngest=Inngest(app_id=os.environ["INNGEST_APP_ID"],),
#             supabase=Supabase(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
#         )
    
#     start_time = time.time()
    
#     asyncio.run(main())

#     end_time = time.time()

#     print(f"Podcast generation completed in {end_time - start_time} seconds.")
#     print(f"Completion time: {(end_time - start_time) // 60:.0f} mins {math.fmod((end_time - start_time), 60):.0f} secs.")

    # topic = input("Enter the topic for the podcast (default: machine learning): ")
    # topic = topic.strip() if topic else "machine learning"
    # main(topic if topic else "machine learning")
    # podcast = generate_podcast(topic, "en-IN")
    # generate_image(topic, podcast)
    # generate_author_images(podcast, topic, remap_os_safe_title(podcast.podcastTitle))



# Merging api/main.py
import io
import fastapi
from inngest import Context, Inngest, Step, fast_api, TriggerEvent, Event, TriggerCron
import pydantic
import pydub
from sqlmodel import and_, asc, desc, or_, select, any_
from sqlalchemy.orm import selectinload, joinedload
# from sqlalchemy import select




from uuid import UUID, uuid4
import json
from fuzzywuzzy import fuzz, process
from google import genai

import os
from supabase import AClient as Supabase
from supabase import AuthApiError

from fastapi.responses import FileResponse, StreamingResponse

import pathlib


ERROR_CODES = {
    'auth_email_not_confirmed': 40001,
    'auth_invalid_credentials': 40002,
    'auth_user_not_found': 40003,
    'auth_user_already_exists': 40004,
    'auth_invalid_token': 40005, 
    'auth_incomplete_registration': 40006,
    'auth_user_not_authenticated': 40007,
    'auth_email_invalid': 40008,
    'auth_email_already_exists': 40009,


    'unknown_error': 50000,
    'podcast_not_found': 40401,
    'podcast_creation_failed': 40402,
}


app = fastapi.FastAPI(root_path="/api")

# Add CORS middleware to allow requests from any origin

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=("*"),  # Allows all origins
    # allow_credentials=True,
    allow_methods=("*"),  # Allows all methods
    allow_headers=("*"),  # Allows all headers

)

class GeneratePodcast(pydantic.BaseModel):
    topic: str | None = None
    style: str | None = None
    language: str | None = None
    description: str | None = None

podolli_epoch = 1743465600 # April Fools 00:00:00 2025 UTC

inngest = Inngest(app_id="ai-podcast")

podcasts = {}
# pathlib.Path("podcasts.json").touch(exist_ok=True)
# with open("podcasts.json", "r") as f:
#     podcasts = json.loads(f.read() or "{}")

audios = {}
# pathlib.Path("audios.json").touch(exist_ok=True)
# with open("audios.json", "r") as f:
#     audios = json.loads(f.read() or "{}")

images = {}
# pathlib.Path("images.json").touch(exist_ok=True)
# with open("images.json", "r") as f:
#     images = json.loads(f.read() or "{}")

# def remap_os_safe_title(title: str) -> str:
#     # Replace spaces with underscores and remove special characters
#     return "".join(c if c.isalnum() or c in [' ', '_'] else '_' for c in title).strip().replace(" ", "_").lower()


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
        async with session_maker() as sess:
            podcasts_db = (await sess.execute(select(Podcast).where(
                and_(Podcast.is_public == True,
                     Podcast.is_generating == False
                     )
            ).order_by(desc(Podcast.created_at)))).scalars().all()
            new_podcasts = [{
                "id": str(p.id),
                "podcast_title": p.title,
                "podcast_description": p.description,
                "language": p.language,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "view_count": p.view_count,
                "like_count": p.like_count,
                "dislike_count": p.dislike_count,
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

@app.get("/podcasts/@me")
async def get_my_podcasts(offset: int = 0, limit: int = 10, user: UserProfile = fastapi.Depends(get_current_user)):
    async with session_maker() as sess:
        podcasts_db = (await sess.execute(select(Podcast).where(
            and_(Podcast.profile_id == user.id,
                    Podcast.is_generating == False
                    )
        ).order_by(desc(Podcast.created_at)))).scalars().all()
        new_podcasts = [{
            "id": str(p.id),
            "podcast_title": p.title,
            "podcast_description": p.description,
            "language": p.language,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "view_count": p.view_count,
            "like_count": p.like_count,
            "dislike_count": p.dislike_count,
            "duration": p.duration,
        } for p in podcasts_db]

        return {"results": new_podcasts[offset:offset + limit]}

@app.get("/podcasts/trending")
async def get_trending_podcasts(offset: int = 0, limit: int = 10):
    async with session_maker() as sess:
        podcasts_db = (await sess.execute(
            select(Podcast).where(and_(
                Podcast.trending_score > 0,
            )).order_by(desc(Podcast.trending_score)).offset(offset).limit(limit)
        )).scalars().all()

        if not podcasts_db:
            return {"error": "No trending podcasts found"}, 404
        
        new_podcasts = [
            {
                "id": str(p.id),
                "podcast_title": p.title,
                "podcast_description": p.description,
                "language": p.language,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "view_count": p.view_count,
                "like_count": p.like_count,
                "dislike_count": p.dislike_count,
                "duration": p.duration,
            } for p in podcasts_db
        ]

        return {"results": new_podcasts}

@app.get("/podcasts/search")
async def search_podcasts(query: str, v2: bool = False):

    if v2:
        async with session_maker() as sess:
            podcasts_db = (await sess.execute(select(Podcast))).scalars().all()
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

@app.post("/analytics/podcasts/play")
async def play_button_pressed(podcast_id: str):
    async with session_maker() as sess:
        podcast_db = (await sess.execute(select(Podcast).where(Podcast.id == podcast_id))).scalar_one_or_none()
        if not podcast_db:
            return {"error": "Podcast not found"}, 404
        
        podcast_db.view_count += 1
        await sess.commit()
        
        return {"message": "Podcast play count updated", "view_count": podcast_db.view_count}


@app.post("/podcasts/{podcast_id}/like")
async def like_button_pressed(podcast_id: str):
    async with session_maker() as sess:
        podcast_db = (await sess.execute(select(Podcast).where(Podcast.id == podcast_id))).scalar_one_or_none()
        if not podcast_db:
            return {"error": "Podcast not found"}, 404
        
        podcast_db.like_count += 1
        await sess.commit()
        
        return {"message": "Podcast like count updated", "like_count": podcast_db.like_count}

@app.post("/podcasts/{podcast_id}/dislike")
async def dislike_button_pressed(podcast_id: str):
    async with session_maker() as sess:
        podcast_db = (await sess.execute(select(Podcast).where(Podcast.id == podcast_id))).scalar_one_or_none()
        if not podcast_db:
            return {"error": "Podcast not found"}, 404
        
        podcast_db.dislike_count += 1
        await sess.commit()
        
        return {"message": "Podcast dislike count updated", "dislike_count": podcast_db.dislike_count}    

@inngest.create_function(
        fn_id="update_trend_analytics",
        name="Update Trend Analytics",
        trigger=TriggerCron(
            cron="*/5 * * * *",  # Every five minutes
        )
)
async def update_trend_analytics(ctx: Context, step: Step):
    async def handler():
        # Fetch the latest podcasts
        async with session_maker() as sess:
            podcasts_db = (await sess.execute(select(Podcast).order_by(desc(Podcast.created_at)))).scalars().all()
            if not podcasts_db:
                return {"message": "No podcasts found"}
            
            print("Calculating trending scores for podcasts...")
            for podcast in podcasts_db:
                podcast.trending_score = podcast.view_count + (podcast.like_count * 1.5) - (podcast.dislike_count) + ((podcast.created_at.timestamp() - podolli_epoch) / 45000)
                print("Calculating trending score for podcast:", podcast.title, "Score:", podcast.trending_score)

            sess.add_all(podcasts_db)
            await sess.commit()
        print("Trend analytics updated successfully")
        return {"message": "Trend analytics updated successfully"}
        
    await step.run("commit_trending_scores", handler=handler)
    return {"message": "Trend analytics updated successfully"}

@inngest.create_function(
    fn_id="create_featured_podcast_covers",
    name="Create Featured Podcast Covers",
    trigger=TriggerCron(
        cron="* */1 * * *",  # Every hour
    )
)
async def create_featured_podcast_covers(ctx: Context, step: Step):
    async def handler():
        pass

    await step.run("create_featured_podcast_covers", handler=handler)
    return {"message": "Featured podcast covers creation task finished"}


@inngest.create_function(
        fn_id="generate_pending_podcasts",
        name="Generate Pending Podcasts",
        trigger=TriggerCron(
            cron="*/30 * * * *",  # Every 30 minutes
        )
)
async def generate_pending_podcasts(ctx: Context, step: Step):
    async def handler():
        async with session_maker() as sess:
            tasks = (await sess.execute(
                select(PodcastGenerationTask).where(or_(PodcastGenerationTask.status == "pending"))
                .order_by(PodcastGenerationTask.created_at) # type: ignore
            )).scalars().all()

            if not tasks:
                return {"message": "No pending podcast generation tasks found"}

            print("Generating podcasts for pending tasks...")
            for task in tasks:
                print("Processing task:", task.id)

                if not task.generation_data:
                    print("No generation data found for task:", task.id)
                    continue
                generation_data = task.generation_data

                if not generation_data.get("topic") or not generation_data.get("language"):
                    print("Incomplete generation data for task:", task.id)
                    print("Deleting task:", task.id)
                    await sess.delete(task)
                    continue

                await inngest.send(
                    Event(
                        data={
                            "task_id": str(task.id),
                            "topic": task.generation_data["topic"],
                            "style": task.generation_data["style"],
                            "language": task.generation_data["language"],
                            "description": task.generation_data["description"],
                        },
                        name="ai-podcast.create_podcast",
                        id=str(uuid4()),
                    )
                )
            await sess.commit()

        return {"message": "Pending podcasts generated successfully"}
    
    await step.run("generate_pending_podcasts", handler=handler)
    return {"message": "Pending podcasts generation completed"}

@app.get("/podcasts/featured")
async def get_featured_podcasts(offset: int = 0, limit: int = 10):
    async with session_maker() as sess:
        podcasts_db = (await sess.execute(
            select(Podcast).where(and_(
                Podcast.is_featured == True,
            )).order_by(desc(Podcast.trending_score)).offset(offset).limit(limit)
        )).scalars().all()

        if not podcasts_db:
            return {"error": "No featured podcasts found"}, 404
        
        new_podcasts = [
            {
                "id": str(p.id),
                "podcast_title": p.title,
                "podcast_description": p.description,
                "language": p.language,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "view_count": p.view_count,
                "like_count": p.like_count,
                "dislike_count": p.dislike_count,
                "duration": p.duration,
            } for p in podcasts_db
        ]

        return {"results": new_podcasts}
    


@app.get("/podcasts/{podcast_id}")
async def get_podcast(podcast_id: str, v2: bool = False):

    if v2:
        async with session_maker() as sess:
            podcast_db = (await sess.execute(select(Podcast).where(Podcast.id == podcast_id))).scalar_one_or_none()
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
    async with session_maker() as sess:
        podcasts_db = (await sess.execute(select(Podcast).where(Podcast.profile_id == user_id))).scalars().all()
        if not podcasts_db:
            return {"error": "No podcasts found for this user"}, 404
        return {"results": podcasts_db}

@app.get("/user/{user_id}", dependencies=[fastapi.Depends(get_current_user)])
async def get_user_profile(user_id: str):
    async with session_maker() as sess:
        user = (await sess.execute(select(UserProfile).where(UserProfile.id == user_id))).scalar_one_or_none()
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
async def get_image_avatar(podcast_id: str, person_id: str, v2: bool = True):
    podcast = podcasts.get(podcast_id)
    if not podcast:
        return {"error": "Podcast not found"}, 404
    
    # Check if v2 is enabled
    # if v2:
    #     supabase = get_supabase_client(with_service=True)
    #     avatar = await supabase.storage.from_("podcast-avatar-images").download(f"{podcast

    if not v2:
        return {"error": "This endpoint is only available in v2"}, 404

    # print("Fetching avatar for podcast_id:", podcast_id, "and person_id:", person_id)
    # title = podcast['podcast_title']

    # avatar = f"images/{remap_os_safe_title(title)}_{podcast_id}_{person_id}.png"
    # if not pathlib.Path(avatar).exists():
    #     print("Avatar not found for", title, "with person_id", person_id)
    #     # Fallback to a generic avatar if specific one is not found
    #     avatar = f"images/{remap_os_safe_title(title)}_{person_id}.png"
    #     if not pathlib.Path(avatar).exists():
    #         return {"error": "Avatar image not found"}, 404
    # if avatar:
    #     return FileResponse(avatar)
    # else:
    #     return {"error": "Image not found"}, 404


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
    async with session_maker() as sess:
        tasks = (await sess.execute(select(PodcastGenerationTask).options(joinedload(PodcastGenerationTask.podcast)) # type: ignore
                  .order_by(desc(PodcastGenerationTask.created_at))
                  .offset(offset).limit(limit)
                  )).scalars().all()
        
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
    
    task = PodcastGenerationTask(status="pending", progress=0, progress_message="Starting podcast generation...", podcast_id=None,
        generation_data={
            "topic": podcast.topic,
            "style": podcast.style,
            "language": podcast.language,
            "description": podcast.description,
        } if podcast else None
    )
    async with session_maker() as sess:
        sess.add(task)
        await sess.commit()
        await sess.refresh(task)  # Refresh to get the generated ID

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
        podcast = await create_podcast_gen(
            CreatePodcast.model_validate(podcast_data),
            task_id=podcast_data.get("task_id", uuid4()), # type: ignore
            supabase=supabase,
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
    
    async with session_maker() as sess:
        user = (await sess.execute(
            select(UserProfile).where(UserProfile.username == user_login.user_name)
        )).scalar_one_or_none()
    
    if not user:
        return {"emsg": "User not found", "ecode": ERROR_CODES["auth_user_not_found"]}, 404
    
    user = await supabase.auth.admin.get_user_by_id(str(user.id))
    user = user.user
    if not user:
        return {"emsg": "User not found", "ecode": ERROR_CODES["auth_user_not_found"]}, 404
    
    try:
        auth = await supabase.auth.sign_in_with_password({
            "email": user.email or "",
            "password": user_login.password
        })
    except AuthApiError as e:
        if e.code == 'email_not_confirmed':
            return {"emsg": e.message, "ecode": ERROR_CODES["auth_email_not_confirmed"]}, 401
        elif e.code == 'invalid_credentials':
            return {"emsg": e.message, "ecode": ERROR_CODES["auth_invalid_credentials"]}, 401
        else:
            return {"emsg": e.message, "ecode": ERROR_CODES["unknown_error"]}, 400

    return auth

@app.middleware("http")
async def log_errors(request: fastapi.Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

@app.post("/register")
async def register(user_register: UserRegister):
    supabase = get_supabase_client(with_service=True)
    if not user_register.user_name or not user_register.password:
        return {"emsg": "Username and password are required", "ecode": ERROR_CODES["auth_incomplete_registration"]}, 400
    
    if not user_register.email:
        return {"emsg": "Email is required", "ecode": ERROR_CODES["auth_incomplete_registration"]}, 400
    
    if not user_register.full_name:
        return {"emsg": "Full name is required", "ecode": ERROR_CODES["auth_incomplete_registration"]}, 400
    
    try:
        supabase_user = await supabase.auth.sign_up({
            "email": user_register.email,
            "password": user_register.password,
        })
    except AuthApiError as e:
        if e.code == 'user_already_exists':
            return {"emsg": "User already exists", "ecode": ERROR_CODES["auth_user_already_exists"]}, 400
        elif e.code == 'email_address_invalid':
            return {"emsg": "Invalid email address", "ecode": ERROR_CODES["auth_email_invalid"]}, 400
        elif e.code == 'email_exists':
            return {"emsg": "Email already exists", "ecode": ERROR_CODES["auth_email_already_exists"]}, 400
        else:
            return {"emsg": str(e), "ecode": ERROR_CODES["unknown_error"]}, 500

    if not supabase_user.user:
        return {"error": "User registration failed"}, 400
    
    user = UserProfile(
        username=user_register.user_name,
        display_name=user_register.full_name,
        id=UUID(supabase_user.user.id),
    )

    async with session_maker() as sess:
        sess.add(user)
        await sess.commit()

    print("User registered:", user.model_dump())
    
    return {"user": user, "success": True, "message": "User registered successfully"}

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

    async with session_maker() as sess:
        conversation = await sess.execute(select(Conversation).where(Conversation.episode_id == episode_id))

    return {"conversation": conversation.scalars().all()}

@app.get("/podcasts/{podcast_id}/conversations")
async def get_podcast_conversations(podcast_id: str):
    async with session_maker() as sess:
        # Now query conversations where episode_id is in episode_ids
        conversations = (await sess.execute(
            select(Conversation)
            .where(Conversation.podcast_id == podcast_id)
            .options(selectinload(Conversation.speaker), selectinload(Conversation.podcast_author))  # Load speaker relationship # type: ignore
            .order_by(asc(Conversation.start_time))  # Order by start_time
        )).scalars().unique().all()

        if not conversations:
            return {"error": "No conversations found"}, 404

        return {"conversations": [{
            **conversation.model_dump(),
            "speaker": conversation.speaker.model_dump() if conversation.speaker else None,
            "podcast_author": (conversation.podcast_author.model_dump() if conversation.podcast_author else {}),
        } for conversation in conversations]}

@app.get("/podcasts/{podcast_id}/episodes")
async def get_podcast_episodes(podcast_id: str):
    async with session_maker() as sess:
        episodes = (await sess.execute(select(PodcastEpisode).where(PodcastEpisode.podcast_id == podcast_id))).scalars().all()
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
fast_api.serve(app, inngest, functions=[
    create_podcast_inngest, 
    update_trend_analytics, 
    generate_pending_podcasts
], serve_path="/inngest")

if __name__ == '__main__':
    pass
