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
You are a expert in this {topic}.
Summarize the content of the {topic} as a simple podcast having two users communicating the ideas.
Basically have a interviewer and a speaker, the interviewer asks questions relevant to the {topic} and speaker talks about
the topic in detail. 
Keep the conversation simple and easy to understand for a 20 year old.
The conversation should be engaging and interesting.
The conversation should be around 8 minutes long.
If the time is given, the conversation should be around that time.
Include ahhs and umms in the conversation to make it sound more natural.
The conversation should be in the format of a podcast.

Around 30 questions and answers should be there in the conversation.

Keep the following in mind:
1. Keep the conversation simple and easy to understand.
2. Use simple words and phrases.
3. Keep things casual and friendly.
4. Use contractions (e.g., "you're" instead of "you are").
5. Remember that the audience is 20 year old engineering students.
6. Use a friendly and casual tone.
7. DO NOT Use SSML tags to add pauses, emphasis, and other speech effects.
8. If the word in the specified language is not available, use the English word.
9. Make the conversation longer and deeper.
10. If the question/statement seems too long, break it down into multiple consecutive questions/statements.

Try different names for the interviewer and speaker.
Use Dr. for the speaker name.

Usually first names are used to address someone in India

The target audience is 20 year old engineering students.

Use the same language for both the interviewer and speaker. (eg: if the interviewer is speaking in Hindi, the speaker should also speak in Hindi.)

Language: {language}

PODCAST SCHEMA:
"""

podcast_schema = """
{
    "podcastTitle": "Podcast Title",
    "podcastDescription": "Podcast Description",
    "episodeTitle": "Episode Title",
    "interviewer": {
        "name": "Interviewer Name",
        "country": "Language Code in the format of 'en-US' or 'en-GB'",
        "gender": "male | female",
    },
    "language": "Language Code in the format of 'en-US' or 'en-GB'",
    "speaker": {
        "name": "Speaker Name",
        "country": "Language Code in the format of 'en-US' or 'en-GB'",
        "gender": "male | female",
    },
    "conversation": [
        {
            "speaker": "interviewer | speaker (enum)",
            "text": "Question or statement",
        },
        {
            "speaker": "interviewer | speaker (enum)",
            "text": "Question or statement"
        }
    ]
}
"""

class Person(pydantic.BaseModel):
    name: str
    country: str
    gender: str

class Conversation(pydantic.BaseModel):
    speaker: str = pydantic.Field(..., description="interviewer or speaker", enum=["interviewer", "speaker"])
    text: str

class Podcast(pydantic.BaseModel):
    podcastTitle: str
    podcastDescription: str
    episodeTitle: str
    interviewer: Person
    speaker: Person
    language: str
    episodeNumber: str = pydantic.Field(..., description="Episode number in the format of '1', '2', '3'")
    conversation: list[Conversation]

class DetectedLanguage(pydantic.BaseModel):
    lang: str = pydantic.Field(..., description="Language code in the format of 'en-US' or 'en-GB'")
    confidence: float = pydantic.Field(..., description="Confidence score of the detected language")

img_prompt = """
You are a expert in this topic: {topic}.
Generate a image for the podcast on {topic}. 
Podcast title is {podcastTitle}.
Podcast description is {podcastDescription}.
Episode title is {episodeTitle}.
Interviewer name is {interviewerName} and gender {interviewerGender}.
Speaker name is {speakerName} and gender {speakerGender}.

Use the language as used in the topic.

The image should be colorful and engaging. 
The image should be in the format of a podcast cover image. 
The image should be in the format of a square. 
The image should be in the format of PNG.
The image should be in the format of a 3000x3000 pixels. 
The image should be in the format of a 72 dpi.
The image should be in the format of a 24 bit color depth.

Use abstract art and design elements to create a visually appealing image.
"""

def generate_podcast(topic, lang) -> Podcast:
    response = client.models.generate_content(contents=prompt.format(topic=topic, language=lang) + podcast_schema, config={"response_mime_type": "application/json", "response_schema": Podcast}, model="gemini-2.0-flash",)
    return response.parsed

def generate_image(topic, podcast: Podcast) -> io.BytesIO:
    response = client.models.generate_content(contents=img_prompt.format(topic=topic, **podcast), config={"response_modalities": ["IMAGE", "TEXT"]}, model="gemini-2.0-flash-exp-image-generation")
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

def save_podcast(text, filename, lang="en-IN", voice="en-IN-Standard-A"):
    
    filename = os.path.join(TTS_FOLDER, filename)
    speech = speech_client.synthesize_speech(
        input=tts.SynthesisInput(text=text),
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

def main(topic="machine learning"):
    lang = detect_topic_language(topic)
    print(f"Detected language: {lang}")
    podcast = generate_podcast(topic, lang)
    # print(podcast.model_dump_json(indent=4))
    podcast = podcast.model_dump()
    podcast_title = podcast["podcastTitle"]
    podcast_description = podcast["podcastDescription"]
    episode_title = podcast["episodeTitle"]
    interviewer = podcast["interviewer"]
    speaker = podcast["speaker"]
    conversation = podcast["conversation"]
    os_safe_title = remap_os_safe_title(podcast_title)
    os_safe_interviewer = remap_os_safe_title(interviewer["name"])
    os_safe_speaker = remap_os_safe_title(speaker["name"])
    
    country_interviewer = interviewer["country"]
    country_speaker = speaker["country"]
    gender_interviewer = interviewer["gender"]
    gender_speaker = speaker["gender"]
    language = podcast["language"]
    episode_number = podcast["episodeNumber"]

    image = generate_image(topic, {**podcast, "interviewerName": interviewer["name"], "speakerName": speaker["name"], "interviewerGender": gender_interviewer, "speakerGender": gender_speaker})
    image_file = os.path.join(IMAGES_FOLDER, f"{os_safe_title}.png")
    with open(image_file, "wb") as f:
        f.write(image.getbuffer())
    print(f"Image saved as {os_safe_title}.png")

    # Filter voices by gender
    resp_voices_inter = speech_client.list_voices(language_code=country_interviewer).voices
    gen_voices_inter = [voice for voice in resp_voices_inter if tts.SsmlVoiceGender(voice.ssml_gender).name == gender_interviewer.upper() and VOICE_MODEL in voice.name]
    gen_voice_inter = random.choice(gen_voices_inter)

    resp_voices_speak = speech_client.list_voices(language_code=country_speaker).voices
    gen_voices_speak = [voice for voice in resp_voices_speak if tts.SsmlVoiceGender(voice.ssml_gender).name == gender_speaker.upper() and VOICE_MODEL in voice.name and voice.name != gen_voice_inter.name]
    gen_voice_speak = random.choice(gen_voices_speak)


    resp_voices_ann = speech_client.list_voices(language_code=language).voices
    gen_voices_ann = [voice for voice in resp_voices_ann if tts.SsmlVoiceGender(voice.ssml_gender).name == gender_speaker.upper() and VOICE_MODEL in voice.name and voice.name != gen_voice_inter.name and voice.name != gen_voice_speak.name]
    gen_voice_ann = random.choice(gen_voices_ann)


    print(f"Announcer voice: {gen_voice_ann.name} ({gen_voice_ann.language_codes})")
    print(f"Interviewer voice: {gen_voice_inter.name} ({gen_voice_inter.language_codes})")
    print(f"Speaker voice: {gen_voice_speak.name} ({gen_voice_speak.language_codes})")

    print("Generating podcast...")
    print(f"Podcast Title: {podcast_title}")
    title_audio = save_podcast(podcast_title, f"{os_safe_title}.wav", language, gen_voice_ann.name)
    desc_audio = save_podcast(podcast_description, f"{os_safe_title}_description.wav", language, gen_voice_ann.name)
    ep_audio = save_podcast(f"{episode_title}", f"{os_safe_title}_episode.wav", language, gen_voice_ann.name)
    
    audios = [title_audio, desc_audio, ep_audio]
    conv_audios = []

    for idx, turn in enumerate(conversation):
        if turn["speaker"] == "interviewer":
            turn_audio = save_podcast(turn["text"], f"{os_safe_title}_{os_safe_interviewer}_{idx}.wav", country_interviewer, gen_voice_inter.name)
        else:
            turn_audio = save_podcast(turn["text"], f"{os_safe_title}_{os_safe_speaker}_{idx}.wav", country_speaker, gen_voice_speak.name)
        conv_audios.append(turn_audio)
        print(f"Generated {turn['speaker']} audio for turn {idx + 1}/{len(conversation)}")

    print(f"Podcast '{podcast_title}' generated and saved in {os.path.abspath('tts')} folder.")

    # merge the files into a single podcast
    
    title_audio_seg = sum([pydub.AudioSegment.from_wav(audio) + pydub.AudioSegment.silent(duration=500) for audio in audios])
    conv_segments = [pydub.AudioSegment.from_wav(audio) for audio in conv_audios]
    combined = AudioSegment.silent(duration=500) + title_audio_seg  # Add silence at the beginning
    for idx, segment in enumerate(conv_segments):
        conversation[idx]["start_time"] = len(combined) / 1000  # start time in seconds
        combined += segment + AudioSegment.silent(duration=500)  # Add a 500ms silence between segments

        conversation[idx]["end_time"] = len(combined) / 1000
    
    final_file = os.path.join(FINAL_FOLDER, f"{os_safe_title}_final.wav")
    combined.export(final_file, format="wav")

    print(f"Final podcast '{podcast_title}_final.wav' generated.")
    return {
        "podcast_title": podcast_title,
        "podcast_description": podcast_description,
        "episode_title": episode_title,
        "interviewer": interviewer,
        "speaker": speaker,
        "conversation": conversation,
        "audio_file": final_file,
        "duration": len(combined) / 1000,  # duration in seconds
        "image_file": image_file,
        "episode_number": episode_number,
    }

if __name__ == "__main__":
    topic = input("Enter the topic for the podcast (default: machine learning): ")
    main(topic if topic else "machine learning")
