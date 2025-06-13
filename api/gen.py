import time
from typing import Literal
from uuid import uuid4
from dotenv import load_dotenv
import pydantic
load_dotenv()

import random
import os
import json

import gtts
import pydub
from pydub import AudioSegment
import google.genai as genai
import google.cloud.texttospeech as tts
import io

from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

speech_client = tts.TextToSpeechClient.from_service_account_json(os.environ["GEN_LANG_JSON"])

VOICE_MODEL = "Chirp3" # "Standard" | "Wavenet" | "Chirp3"

TTS_FOLDER = "tts"
FINAL_FOLDER = "finals" # Folder to save the final podcast
IMAGES_FOLDER = "images" # Folder to save the images

if not os.path.exists(FINAL_FOLDER):
    os.makedirs(FINAL_FOLDER)
if not os.path.exists(TTS_FOLDER):
    os.makedirs(TTS_FOLDER)
if not os.path.exists(IMAGES_FOLDER):
    os.makedirs(IMAGES_FOLDER)


# model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

client = genai.Client()

# image_model = client.models.generate_content(
#     model="gemini-2.0-flash-exp-image-generation",
#     contents=[text_input, image],
#     config=types.GenerateContentConfig(
#       response_modalities=['Text', 'Image']
#     )
# )

prompt = """
You are an expert in the field of **{topic}**.
You are creating a podcast episode for **{topic}**.
**Prompt:**

Create a podcast-style conversation on the topic **{topic}**, in **{language}**, targeting 20-year-old engineering students.

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

**Key points:**

* Friendly, simple tone
* Casual back-and-forth discussion
* Add some arguments or disagreements. (HEATED DISCUSSIONS)
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

class Person(pydantic.BaseModel):
    name: str
    country: str
    gender: str
    interviewer: bool = pydantic.Field(..., description="true if the person is the interviewer, false if the person is the speaker")
    id: str = pydantic.Field(..., description="a unique id for the person to identify the person in the conversation")

class Pronounciation(pydantic.BaseModel):
    word: str = pydantic.Field(..., description="The word to be pronounced")
    ipa: str = pydantic.Field(..., description="The IPA representation of the word")
    phonetic: str = pydantic.Field(..., description="The phonetic representation of the word")

class Conversation(pydantic.BaseModel):
    speaker: str = pydantic.Field(..., description="interviewer or speaker")
    text: str
    pronounciations: list[Pronounciation] = pydantic.Field(
        default_factory=list, 
        description="List of pronounciations for the words in the text. If the word is not in the list, it will be pronounced as it is."
    )

class Podcast(pydantic.BaseModel):
    podcastTitle: str
    podcastDescription: str
    episodeTitle: str
    people: list[Person]
    language: str
    episodeNumber: str = pydantic.Field(..., description="Episode number in the format of '1', '2', '3'")
    conversation: list[Conversation]

class DetectedLanguage(pydantic.BaseModel):
    lang: str = pydantic.Field(..., description="Language code in the format of 'en-US' or 'en-GB' (ISO-639-1)")
    confidence: float = pydantic.Field(..., description="Confidence score of the detected language")

img_prompt = """
You are a expert in this topic: {topic}.
Generate a cover image for the podcast on {topic}. 
Podcast title is {podcastTitle}.
Podcast description is {podcastDescription}.
Episode title is {episodeTitle}.

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
Generate an image of {people.name} from {people.country} who is a {people.gender}.
The image should be in the format of a square.
Make sure that the image resembles a real person, not a cartoon or an avatar. (An image that will be used in the actual podcast cover image)
Keep the image clean and professional and high quality.
Ground it to be more realistic and human-like and not like a AI generated avatar.
"""

people_prompt = """
{people.name} - {people.country} - {people.gender} is a {people.interviewer} (true if the person is the interviewer, false if the person is the speaker)
"""

def generate_podcast(topic, lang) -> Podcast:
    response = client.models.generate_content(contents=prompt.format(topic=topic, language=lang) + podcast_schema, config={"response_mime_type": "application/json", "response_schema": Podcast}, model="gemini-2.0-flash",)
    return response.parsed

def generate_image(topic, podcast: Podcast) -> io.BytesIO:
    response = client.models.generate_content(contents=img_prompt.format(
        topic=topic, 
        podcastTitle=podcast.podcastTitle,
        people="".join([people_prompt.format(people=people) for people in podcast.people]),
        podcastDescription=podcast.podcastDescription,
        episodeTitle=podcast.episodeTitle,
    ), config={"response_modalities": ["IMAGE", "TEXT"]}, model="gemini-2.0-flash-exp-image-generation")
    for content in response.candidates[0].content.parts:
        # print(content)
        if content.text is not None:
            continue
        if content.inline_data is not None:
            
            image = content.inline_data.data
            image = io.BytesIO(image)
            break
    else:
        raise ValueError("No image found in response")
    return image

def save_podcast(text, lang="en-IN", voice="en-IN-Standard-A", pronounciations: list[Pronounciation] | None = None):
    pronounciations = pronounciations or []
    print([pron for pron in pronounciations])
    # filename = os.path.join(TTS_FOLDER, filename)
    speech = speech_client.synthesize_speech(
        input=tts.SynthesisInput(text=text,
                custom_pronunciations=tts.CustomPronunciations(
                    pronunciations=[
                    tts.CustomPronunciationParams(
                        phrase=pronounciation.word,
                        pronounciation=pronounciation.ipa,
                        phonetic_encoding="PHONETIC_ENCODING_IPA"
                    ) for pronounciation in (pronounciations or [])
                ]
                )
            ),        
        # input=tts.SynthesisInput(ssml=f"<speak>{text}</speak>"),
        voice=tts.VoiceSelectionParams(
            language_code=lang,
            name=voice,
        ),
        audio_config=tts.AudioConfig(
            audio_encoding=tts.AudioEncoding.LINEAR16,
            # speaking_rate=1.05,
            pitch=0.0,
            
        ),
    )

    return io.BytesIO(speech.audio_content)
    # # Save the audio to a file
    # with open(filename, "wb") as out:
    #     out.write(speech.audio_content)
    



# def save_podcast(text, filename, tld="com"):
#     filename = os.path.join(TTS_FOLDER, filename)
#     tts = speech_model.generate_content(text, generation_config={"max_output_tokens": 4000})
#     print(tts.text)
#     # tts.save(filename)

def detect_topic_language(topic: str) -> str:
    response = client.models.generate_content(contents=f"Detect the language given in the topic: {topic}. The language must be in the form of en-US, en-IN, etc. Also, if the user requests for a specific language, eg: (in tamil, in hindi), return that language instead in the format as specified earlier. (ISO-639-1)", config={"response_mime_type": "application/json", "response_schema": DetectedLanguage}, model="gemini-1.5-flash")
    data: DetectedLanguage = response.parsed
    return data.lang

def remap_os_safe_title(title: str) -> str:
    return title.replace(" ", "_").replace(":", "_").replace("?", "_").replace("!", "_").replace(",", "_")

def select_voice_people(people: list[Person], lang: str) -> dict[str, tts.Voice]:
    voices = {}
    used_voices = set()
    all_voices = speech_client.list_voices(language_code=lang)
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
            
            available = [v for v in gender_voices.get(person_gender, []) if v.name not in used_voices]
            
            if not available:
                raise ValueError(f"No available voices left for gender: {person.gender}")

            voice = random.choice(available)
            voices[person.id] = voice
            used_voices.add(voice.name)
    return voices

def save_image(image: io.BytesIO, podcast_id: str) -> None:
    image_file = os.path.join(IMAGES_FOLDER, f"{podcast_id}.png")
    with open(image_file, "wb") as f:
        f.write(image.getbuffer())
    print(f"Image saved as {podcast_id}.png")

def save_podcast_cover(podcast: Podcast, topic: str, title: str) -> None:

    image = generate_image(topic, podcast)
    save_image(image, title)

def generate_author_image(person: Person) -> io.BytesIO:
    response = client.models.generate_content(contents=author_prompt.format(people=person), config={"response_modalities": ["IMAGE", "TEXT"]}, model="gemini-2.0-flash-exp-image-generation")
    for content in response.candidates[0].content.parts:
        if content.text is not None:
            continue
        if content.inline_data is not None:
            image = content.inline_data.data
            image = io.BytesIO(image)
            return image
    else:
        raise ValueError("No image found in response")

def generate_author_images(podcast: Podcast, topic: str, title: str) -> None:
    authors = podcast.people
    print(f"Generating images for {len(authors)} authors...")
    executor = ThreadPoolExecutor()
    futures = []
    for author in authors:
        future = executor.submit(generate_author_image, author)
        futures.append((author.id, future))
    executor.shutdown(wait=True)
    print("All author images generated. Saving images...")
    for (pid, future) in futures:
        response = future.result()
        save_image(response, f"{title}_{pid}")        
        


def main(topic="machine learning", podcast_id=None):
    podcast_id = podcast_id or str(uuid4())
    print(f"Generating podcast for topic: {topic} with ID: {podcast_id}")
    lang = detect_topic_language(topic)
    print(f"Detected language: {lang}")
    podcast = generate_podcast(topic, lang)
    # print(podcast.model_dump_json(indent=4))
    podcast_title = podcast.podcastTitle
    podcast_description = podcast.podcastDescription
    episode_title = podcast.episodeTitle
    conversation = [conversation.model_dump() for conversation in podcast.conversation]
    os_safe_title = remap_os_safe_title(podcast_title) + "_" + podcast_id
    
    # country_interviewer = interviewer["country"]
    # country_speaker = speaker["country"]
    # gender_interviewer = interviewer["gender"]
    # gender_speaker = speaker["gender"]
    language = podcast.language
    episode_number = podcast.episodeNumber

    start_time = time.time()
    voices = select_voice_people(podcast.people, podcast.language)
    end_time = time.time()
    print(f"Time taken to select voices: {end_time - start_time} seconds")

    executor = ProcessPoolExecutor()
    
        # return image
    
    image_file = os.path.join(IMAGES_FOLDER, f"{os_safe_title}.png")
    res = executor.submit(save_podcast_cover, podcast, topic, os_safe_title)

    print(f"Selected voices: {"".join([f"{name} - {voice.name}\n" for name, voice in voices.items()])}")
    print("Generating podcast...")
    print(f"Podcast Title: {podcast_title}")
    # title_audio = save_podcast(podcast_title, language, gen_voice_ann.name)
    # desc_audio = save_podcast(podcast_description, language, gen_voice_ann.name)
    # ep_audio = save_podcast(f"{episode_title}", language, gen_voice_ann.name)
    
    # audios = [title_audio, desc_audio, ep_audio]
    audios = []
    conv_audios = []

    people = {person.id: person for person in podcast.people}
    
    executor.submit(generate_author_images, podcast, topic, os_safe_title)


    with ThreadPoolExecutor() as executor:
        for idx, turn in enumerate(podcast.conversation):
            voice = voices[turn.speaker]
            country = people[turn.speaker].country
            print("Generating audio for turn: ", turn.text)
            turn_audio = executor.submit(save_podcast, turn.text, country, voice.name, turn.pronounciations)
            conv_audios.append(turn_audio)
            print(f"Generated {turn.speaker} audio for turn {idx + 1}/{len(conversation)}")

            if idx % 8 == 0:
                time.sleep(1)  # Sleep for 1 second every 10 turns to avoid rate limiting
    
    conv_audios = [audio.result() for audio in conv_audios]

    print(f"Podcast '{podcast_title}' generated and saved in {os.path.abspath('tts')} folder.")

    # merge the files into a single podcast
    
    title_audio_seg = sum([pydub.AudioSegment.from_wav(audio) + pydub.AudioSegment.silent(duration=500) for audio in audios])
    conv_segments = [pydub.AudioSegment.from_wav(audio) for audio in conv_audios]
    combined = AudioSegment.silent(duration=500) + title_audio_seg  # Add silence at the beginning
    for idx, segment in enumerate(conv_segments):
        conversation[idx]["start_time"] = len(combined) / 1000  # start time in seconds
        # 500ms silence between segments - (based on the average pause between sentences)
        silence_duration = min(500, len(segment) / 10)  # maximum 500ms silence or 1/10th of the segment length
        combined += segment + AudioSegment.silent(duration=min(int(silence_duration), 1))  # Add a 500ms silence between segments

        conversation[idx]["end_time"] = len(combined) / 1000
    
    final_file = os.path.join(FINAL_FOLDER, f"{os_safe_title}_final.wav")
    combined.export(final_file, format="wav")

    print(f"Final podcast '{os_safe_title}_final.wav' generated.")
    res = res.result()
    executor.shutdown(wait=True)
    return {
        "podcast_title": podcast_title,
        "podcast_description": podcast_description,
        "episode_title": episode_title,
        "people": [people.model_dump() for people in podcast.people],
        "language": language,
        "conversation": conversation,
        "audio_file": final_file,
        "duration": len(combined) / 1000,  # duration in seconds
        "image_file": image_file,
        "episode_number": episode_number,
    }

def generate_podcast_from_topic(podcast_id: str, topic: str):
    yield "Detecting language..."
    lang = detect_topic_language(topic)
    yield "Generating podcast..."
    podcast = generate_podcast(topic, lang)
    yield "Generating image..."
    image = generate_image(topic, podcast)
    save_image(image, podcast_id)
    yield "Generating audio..."
    audio = save_audio(podcast, podcast_id)
    yield "Generating final podcast..."

    return podcast


if __name__ == "__main__":
    topic = input("Enter the topic for the podcast (default: machine learning): ")
    topic = topic.strip() if topic else "machine learning"
    main(topic if topic else "machine learning")
    # podcast = generate_podcast(topic, "en-IN")
    # generate_image(topic, podcast)
    # generate_author_images(podcast, topic, remap_os_safe_title(podcast.podcastTitle))


