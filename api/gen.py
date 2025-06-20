import asyncio
import time
from typing import Literal
from uuid import UUID, uuid4
from dotenv import load_dotenv
load_dotenv()

from inngest import Inngest
import inngest
import pydantic
from sqlmodel import select

from api.db import get_session, session_maker
from api.models import Conversation, Podcast, PodcastAuthorPersona, PodcastAuthorPodcast, PodcastEpisode, PodcastGenerationTask
from api.utils import PodcastGenTask, create_podcast_generation_task

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

from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from supabase import AClient as Supabase

def get_service_account_info() -> dict:
    res = base64.b64decode(os.environ["GEN_LANG_JSON_KEY"]).decode("utf-8")
    res = json.loads(res)
    return res
    

speech_client: tts.TextToSpeechAsyncClient = tts.TextToSpeechAsyncClient.from_service_account_info(
    get_service_account_info()
)

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
The image should be in the format of a 3000x3000 pixels. 
The image should be in the format of a 72 dpi.
The image should be in the format of a 24 bit color depth.
Choose the correct image for the speaker and interviewer.

Use abstract art and design elements to create a visually appealing image.
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

    speech_client = tts.TextToSpeechAsyncClient.from_service_account_json(os.environ["GEN_LANG_JSON"])

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
    speech_client: tts.TextToSpeechAsyncClient = tts.TextToSpeechAsyncClient.from_service_account_json(os.environ["GEN_LANG_JSON"])
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


async def create_podcast(create_podcast: CreatePodcast, task_id: UUID | None = None, supabase: Supabase | None = None, profile_id: UUID | None = None, step: inngest.Step | None = None) -> Podcast:
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
            profile_id=profile_id)
    

    

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


    episode = PodcastEpisode(
        number=int(podcast_metadata.episodeNumber),
        title=podcast_metadata.episodeTitle,
        podcast_id=podcast.id,
    )

    async with session_maker() as sess:
        task = (await sess.execute(select(PodcastGenerationTask).where(PodcastGenerationTask.id == task_id))).scalar_one_or_none()
        if task is None:
            raise ValueError(f"Podcast generation task with ID {task_id} not found. Something went terribly wrong.")
        task.podcast_id = podcast.id

        sess.add(task)
        await sess.commit() # update the task with the podcast ID at the earliest possible moment

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

    await podcast_gen_task.progress_update(15, "Saving podcast metadata and episode...")

    async with session_maker() as sess:
        podcast = (await sess.execute(select(Podcast).where(Podcast.id == podcast.id))).scalar_one_or_none()
        if podcast is None:
            raise ValueError(f"Podcast not found. Something went terribly wrong.")
        podcast.episodes.append(episode)
    
        sess.add(podcast)
        await sess.flush()
        
        # Generate the audio for the podcast
        await podcast_gen_task.progress_update(20, "Selecting voices for the podcast...")

        # Currently, voices are selected automatically based on the people in the podcast and the language.
        print("Selecting voices for the podcast...")
        voices = await select_voice_people(podcast_metadata.people, podcast_metadata.language)
        print(f"Selected voices: \n{', '.join([f'{person} - {voice.name}' for person, voice in voices.items()])}")

        conv_audios = await save_conversation_audio(podcast_metadata.people, podcast_conversation, voices)

        await podcast_gen_task.progress_update(50, "Generating audio segments for the podcast...")

        # Combine the audio segments into a single podcast audio file
        print("Combining audio segments...")
        markers, combined_audio = combine_audio_segments(conv_audios)

        await podcast_gen_task.progress_update(80, "Combining audio segments...")
        for idx, turn in enumerate(turns):
            turn.start_time = markers[idx][0]
            turn.end_time = markers[idx][1]
            turn.podcast_id = podcast.id
        
        buffer = io.BytesIO()
        combined_audio.export(buffer, format="wav")

        podcast.duration = len(combined_audio) / 1000.0  # duration in seconds

        sess.add(podcast)
        sess.add_all(turns)
        await sess.commit()

    await podcast_gen_task.progress_update(85, "Saving podcast metadata and audio...")

    buffer.seek(0)  # Reset the buffer position to the beginning

    await podcast_gen_task.progress_update(90, "Saving podcast audio...")
    await supabase.storage.from_("podcasts").upload(f"{podcast_id}.wav", buffer.getvalue(), {"content-type": "audio/wav", "upsert": "true"})
    
    await podcast_gen_task.progress_update(100, "Waiting for podcast cover image and author images to complete...")
    await asyncio.gather(*image_gen_tasks)

    await podcast_gen_task.progress_update(100, "Podcast generation completed successfully.")
    await podcast_gen_task.complete()

    return podcast


if __name__ == "__main__":
    import dotenv
    dotenv.load_dotenv()

    import os
    import math

    task_id = uuid4()

    async def main():
        await create_podcast_generation_task(
            podcast_id=str(task_id),
            status="pending",
            progress=0,
            supabase=Supabase(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]),
        )
        await create_podcast(
            CreatePodcast(
                topic="php programming language",
                language="en-IN",
                style="casual, friendly, and engaging",
                description="Explain the PHP programming language and it's use in web development, including its history, features, and how it compares to other languages like Python and JavaScript.",
            ),
            task_id=task_id,
            # inngest=Inngest(app_id=os.environ["INNGEST_APP_ID"],),
            supabase=Supabase(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
        )
    
    start_time = time.time()
    
    asyncio.run(main())

    end_time = time.time()

    print(f"Podcast generation completed in {end_time - start_time} seconds.")
    print(f"Completion time: {(end_time - start_time) // 60:.0f} mins {math.fmod((end_time - start_time), 60):.0f} secs.")

    # topic = input("Enter the topic for the podcast (default: machine learning): ")
    # topic = topic.strip() if topic else "machine learning"
    # main(topic if topic else "machine learning")
    # podcast = generate_podcast(topic, "en-IN")
    # generate_image(topic, podcast)
    # generate_author_images(podcast, topic, remap_os_safe_title(podcast.podcastTitle))


