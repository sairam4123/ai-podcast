import re
import markdown
import asyncio
from typing import Literal
from uuid import UUID, uuid4

import pydantic
from sqlmodel import select
import supabase

from api.db import get_session, session_maker
from api.models import Conversation, Podcast, PodcastAuthorPersona, PodcastAuthorPodcast, PodcastEpisode, PodcastGenerationTask, PodcastQuestion
from api.utils import PodcastGenTask, create_podcast_generation_task

import random
import os
import json
import base64

import ddgs
import gtts
import pydub
from pydub import AudioSegment
import google.genai as genai
import google.cloud.texttospeech as tts
import io
from bs4 import BeautifulSoup



from sqlalchemy.orm import selectinload, joinedload


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


VOICE_MODEL = "Standard" # "Standard" | "Wavenet" | "Chirp3"

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
* Keep the conversation in the requested language, but use English for technical terms if needed.
* Use Markdown to Emphasize important points (bold or italics). 

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

interactive_podcast_prompt = """
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
* Keep the conversation in the requested language, but use English for technical terms if needed.
* Use Markdown to Emphasize important points (bold or italics). 

**Key points:**

* Friendly, simple tone (match the style requested)
* Casual back-and-forth discussion
* Add some arguments or disagreements. (HEATED DISCUSSIONS) (Only if explicity requested by the user)
* Break long explanations into short answers
* Keep technical terms in English if needed
* Same language for everyone in the podcast


PODCAST SCHEMA:
"""

interactive_podcast_schema = """
{
    "podcastTitle": "Podcast Title",
    "podcastDescription": "Podcast Description",
    "episodeTitle": "Episode Title",
    "tags": [
        "tag1",
        "tag2",
        "tag3",
        ... (any number of tags, each tag is a string)
    ],
    "language": "Language Code in the format of 'en-US' or 'en-GB'",
}
"""

class PersonAI(pydantic.BaseModel):
    name: str
    country: str
    gender: str
    interviewer: bool = pydantic.Field(..., description="true if the person is the interviewer, false if the person is the speaker")
    id: str = pydantic.Field(..., description="a unique id for the person to identify the person in the conversation")

class PersonaAI(pydantic.BaseModel):
    name: str = pydantic.Field(..., description="The name of the persona.")
    bio: str = pydantic.Field(..., description="A brief biography of the persona, including their expertise and experience.")
    background: str | None = pydantic.Field(default=None, description="A brief background of the persona, including their country or region if relevant.")

    country: str = pydantic.Field(..., description="The country of the persona.")
    gender: str = pydantic.Field(..., description="The gender of the persona MALE | FEMALE | NEUTRAL")
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

class InteractivePodcastAI(pydantic.BaseModel):
    podcastTitle: str
    podcastDescription: str
    episodeTitle: str
    tags: list[str]
    language: str

class DetectedLanguageAI(pydantic.BaseModel):
    lang: str = pydantic.Field(..., description="Language code in the format of 'en-US' or 'en-GB' (ISO-639-1)")
    confidence: float = pydantic.Field(..., description="Confidence score of the detected language")

def strip_md(txt: str) -> str:
    html = markdown.markdown(txt)

    html = re.sub('<pre>(.*?)</pre>', '', html, flags=re.DOTALL)  # Remove <pre> tags and their content
    html = re.sub('<code>(.*?)</code>', '', html, flags=re.DOTALL)  # Remove <code> tags and their content

    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text()


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


async def generate_podcast_thumbnail_image(podcast: Podcast) -> io.BytesIO:
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

def detect_topic_language(topic: str) -> str:
    response = client.models.generate_content(contents=f"Detect the language given in the topic: {topic}. The language must be in the form of en-US, en-IN, etc. Also, if the user requests for a specific language, eg: (in tamil, in hindi), return that language instead in the format as specified earlier. (ISO-639-1)", config={"response_mime_type": "application/json", "response_schema": DetectedLanguageAI}, model="gemini-2.0-flash")
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
    
    random.seed(42)  # For reproducibility
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

    image = await generate_podcast_thumbnail_image(podcast)
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

    search_results = ddgs.DDGS().text(f"{create_podcast.topic} wikipedia", max_results=5)
    contents = ["Here are some relevant search results to help you create the podcast:\n"]
    for result in search_results:
        contents.append(f"# {result['title']}\n{result['body']}\n{result['href']}\n")
    contents.append("\nPODCAST PROMPT:\n")
    content = "\n".join(contents)
    print("Search results fetched. Generating podcast content..., content: ", content)

    response = await client.aio.models.generate_content(contents=content+podcast_prompt.format(topic=create_podcast.topic, language=create_podcast.language, style=create_podcast.style, description=create_podcast.description) + podcast_schema, config={"response_mime_type": "application/json", "response_schema": PodcastAI}, model="gemini-2.0-flash",)
    return PodcastAI.model_validate(response.parsed) 

async def generate_podcast_metadata(create_podcast: CreatePodcast) -> InteractivePodcastAI:

    search_results = ddgs.DDGS().text(f"{create_podcast.topic} wikipedia", max_results=5)
    contents = ["Here are some relevant search results to help you create the podcast:\n"]
    for result in search_results:
        contents.append(f"# {result['title']}\n{result['body']}\n{result['href']}\n")
    contents.append("\nPODCAST PROMPT:\n")
    content = "\n".join(contents)
    print("Search results fetched. Generating podcast metadata..., content: ", content)

    response = await client.aio.models.generate_content(contents=content+interactive_podcast_prompt.format(topic=create_podcast.topic, language=create_podcast.language, style=create_podcast.style, description=create_podcast.description) + interactive_podcast_schema, config={"response_mime_type": "application/json", "response_schema": PodcastAI}, model="gemini-2.0-flash",)
    return InteractivePodcastAI.model_validate(response.parsed) 

async def generate_podcast_authors(create_podcast: CreatePodcast) -> list[PersonaAI]:
    topic = create_podcast.topic


    class PersonaResponse(pydantic.BaseModel):
        personas: list[PersonaAI]


    client = genai.Client()

    personas = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""
    You are an expert at creating personas.
    Create a list of 3-5 distinct personas that are experts in the topic of {topic}.
    You may also generate personas that are novices or beginners in the topic to provide a diverse range of perspectives.
    For each persona, provide a name, a short description of their expertise, and a brief bio.
    Respond in JSON format as a list of objects with the following fields: name, description, bio.
    Keep the descriptions and bios concise, each under 50-100 words.
    Give a short but realistic background for each persona.

    Make sure that the names are unique and realistic (not "cartoonish" or comedic) and the personas cover a diverse range of perspectives and backgrounds.
    
    Give 3 personas that are as different from each other as possible.
    """,
        config={
            "response_schema": PersonaResponse,
            "response_mime_type": "application/json",
        }
    )

    persona_list = PersonaResponse.model_validate(personas.parsed) 
    print(f"Generated personas: {persona_list}")

    if not persona_list.personas or len(persona_list.personas) < 1:
        raise ValueError("No personas generated. Cannot proceed.")
    
    return persona_list.personas
    

async def generate_audio(turn: ConversationAI, voice: tts.Voice, country: str) -> io.BytesIO:
    # speech_client: tts.TextToSpeechAsyncClient = tts.TextToSpeechAsyncClient.from_service_account_json(os.environ["GEN_LANG_JSON"])
    speech_client = get_speech_client()
    pronunciations = turn.pronunciations or []
    print([pron for pron in pronunciations])
    # filename = os.path.join(TTS_FOLDER, filename)
    request = tts.SynthesizeSpeechRequest(
        
        input=tts.SynthesisInput(text=strip_md(turn.text)),
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


async def create_podcast_gen(create_podcast: CreatePodcast, task_id: UUID | None = None, supabase: Supabase | None = None, profile_id: UUID | None = None, should_upload: bool = True, should_generate_images: bool = True, raise_errors: bool = True) -> Podcast:
    task_id = task_id or uuid4()

    if not create_podcast.topic:
        raise ValueError("Topic is required to create a podcast.")

    if (not supabase) and should_upload:
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
    await podcast_gen_task.progress_update(10, "Searching for relevant information...")
    # Generate the podcast content (metadata and conversation)
    podcast_metadata: PodcastAI = await generate_podcast_content(create_podcast)
    await podcast_gen_task.progress_update(15, "Generating podcast content...")
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
    ] if should_generate_images else []

    async with session_maker() as sess:
        sess.add(podcast)
        await sess.commit()
        await sess.refresh(podcast)

    async with session_maker() as sess:
        task = (await sess.execute(select(PodcastGenerationTask).where(PodcastGenerationTask.id == task_id))).scalar_one_or_none()
        if task is None:
            if raise_errors:
                raise ValueError(f"Podcast generation task with ID {task_id} not found. Something went terribly wrong.")
        else:
            task.podcast_id = podcast.id

            sess.add(task)
            await sess.commit() # update the task with the podcast ID at the earliest possible moment


    await podcast_gen_task.progress_update(20, "Saving podcast metadata and episode...")

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
        await podcast_gen_task.progress_update(25, "Selecting voices for the podcast...")

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
    combined_audio.export(buffer, format="wav")
    await podcast_gen_task.progress_update(85, "Saving podcast metadata and audio...")

    buffer.seek(0)  # Reset the buffer position to the beginning

    await podcast_gen_task.progress_update(90, "Saving podcast audio...")
    if should_upload and supabase:
        await supabase.storage.from_("podcasts").upload(f"{podcast_id}.wav", buffer.getvalue(), {"content-type": "audio/wav", "upsert": "true"})
    
    await podcast_gen_task.progress_update(100, "Waiting for podcast cover image and author images to complete...")
    await asyncio.gather(*image_gen_tasks)

    await podcast_gen_task.progress_update(100, "Completed")
    await podcast_gen_task.complete()

    return podcast


async def create_interactive_podcast(create_podcast: CreatePodcast, task_id: UUID | None = None, supabase: Supabase | None = None, profile_id: UUID | None = None) -> Podcast:
    
    
    podcast_gen_task = PodcastGenTask(podcast_id=str(task_id), supabase=supabase)

    await podcast_gen_task.progress_update(0, "Starting podcast generation...")
    if not create_podcast.language:
        await podcast_gen_task.progress_update(5, "Detecting language...")
        language = detect_topic_language(create_podcast.topic)
        create_podcast.language = language
    
    await podcast_gen_task.progress_update(9, "Generating podcast metadata...")

    print(f"Creating podcast for topic: {create_podcast.topic} with ID: {task_id}")
    await podcast_gen_task.progress_update(10, "Searching for relevant information...")
    # Generate the podcast content (metadata and conversation)
    podcast_metadata: InteractivePodcastAI = await generate_podcast_metadata(create_podcast)

    await podcast_gen_task.progress_update(15, "Saving podcast metadata...")
    podcast = Podcast(
        title=podcast_metadata.podcastTitle,
        description=podcast_metadata.podcastDescription,
        language=podcast_metadata.language,
        tags=podcast_metadata.tags,
        profile_id=profile_id,
        is_generating=True,
        is_public=False, 
    )

    await podcast_gen_task.progress_update(20, "Generating podcast authors...")
    personas_data = await generate_podcast_authors(create_podcast)
    personas = [PodcastAuthorPersona(name=person.name, bio=f"{person.bio}", background=person.background, gender=person.gender, country=person.country) for person in personas_data]

    podcast.authors = [PodcastAuthorPodcast(
        author=persona,
        podcast=podcast,
        is_host=(idx == 0),  # First persona is the host
        author_id=persona.id,
        podcast_id=podcast.id,
    ) for idx, persona in enumerate(personas)]

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

    if not supabase:
        raise ValueError("Supabase client is required to create a podcast.")
    
    await podcast_gen_task.progress_update(20, "Saving podcast metadata and episode...")
    await podcast_gen_task.complete()


    # await podcast_gen_task.progress_update(15, "")

async def generate_interactive_podcast_content(podcast: Podcast, question: str, user_id: UUID, supabase: Supabase | None = None):

    if not supabase:
        raise ValueError("Supabase client is required to create a podcast.")

    async with session_maker() as sess:
        people = (await sess.execute(select(PodcastAuthorPersona).join(PodcastAuthorPodcast).where(PodcastAuthorPodcast.podcast_id == podcast.id))).scalars().all()

    text_interactive_prompt = f"The podcast is about {podcast.title}. Description: {podcast.description}\n The people in the podcast are:\n{''.join([f'{idx+1}. {person.name} from {person.country}, is a {person.gender}\n' for idx, person in enumerate(people)])}\n\n"
    text_interactive_prompt += f"The user asked the question: {question}\n"
    text_interactive_prompt += "Based on the podcast topic and the people in the podcast, select the most suitable persona to answer the question. If none of the personas are suitable, select the one that is closest to the topic.\n"
    text_interactive_prompt += "Provide a detailed reason for selecting the persona.\n"

    class DetectedPersona(pydantic.BaseModel):
        persona: str
        reason: str
        confidence: float

    class DetectedPersonaResponse(pydantic.BaseModel):
        personas: list[DetectedPersona]
    
    response = await client.aio.models.generate_content(contents=text_interactive_prompt + """
    Respond in JSON format""", config={"response_mime_type": "application/json", "response_schema": DetectedPersonaResponse}, model="gemini-2.0-flash")
    detected_personas = DetectedPersonaResponse.model_validate(response.parsed)
    if not detected_personas.personas or len(detected_personas.personas) < 1:
        raise ValueError("No personas detected. Cannot proceed.")
    selected_persona = max(detected_personas.personas, key=lambda p: p.confidence)
    print(f"Selected persona: {selected_persona.persona} with confidence {selected_persona.confidence}")

    
    class ResponseSchema(pydantic.BaseModel):
        persona: str
        answer: str = pydantic.Field(description="The answer to the user's question, provided by the selected persona.")
    
    response = await client.aio.models.generate_content(contents=text_interactive_prompt + f"""
    The selected persona is {selected_persona.persona}. Answer the user's question in detail, in the style of the selected persona.
    Respond in JSON format""", config={"response_mime_type": "application/json", "response_schema": ResponseSchema}, model="gemini-2.0-flash")
    answer = ResponseSchema.model_validate(response.parsed)

    people_map = {person.name: person for person in people}
    if answer.persona not in people_map:
        raise ValueError(f"Selected persona {answer.persona} not found in the podcast authors.")

    selected_persona = people_map[answer.persona]
    async with session_maker() as sess:
        pd_qn = PodcastQuestion(podcast_id=podcast.id, question=question, answer=answer.answer, persona_id=selected_persona.id, user_id=user_id)
        sess.add(pd_qn)
        await sess.commit()
        await sess.refresh(pd_qn)


    audio = await generate_audio(ConversationAI(speaker=selected_persona.name, text=answer.answer, pronunciations=[], start_time=0, end_time=5), voice=tts.Voice(name="en-US-Wavenet-D"), country="US")

    buffer = io.BytesIO()
    audio.seek(0)
    buffer.write(audio.read())
    buffer.seek(0)
    await supabase.storage.from_("podcasts").upload(f"{podcast.id}/{pd_qn.id}.wav", buffer.getvalue(), {"content-type": "audio/wav", "upsert": "true"})

    return answer

async def recognize_speech(file: io.BytesIO, user_id: UUID, podcast_id: str, supabase: Supabase | None = None):
    from google.cloud import speech as stt
    

    speech_client = stt.SpeechClient.from_service_account_info(get_service_account_info())

    audio = stt.RecognitionAudio(content=file.getvalue())
    config = stt.RecognitionConfig(
        language_code="en-US",
    )

    resp = speech_client.recognize(audio=audio, config=config)
    question = ""

    # pick the maximum confidence question
    alts = [alt for result in resp.results for alt in result.alternatives]
    question = max(alts, key=lambda alt: alt.confidence).transcript

    async with session_maker() as sess:
        podcast = await sess.get(Podcast, podcast_id)
        if not podcast:
            return

        return await generate_interactive_podcast_content(podcast, question, user_id, supabase)
    
    




