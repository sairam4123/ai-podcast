from dotenv import load_dotenv
load_dotenv()

import random
import os
import json

import gtts
import pydub
from pydub import AudioSegment
import google.generativeai as genai
import google.cloud.texttospeech as tts
import io

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

speech_client = tts.TextToSpeechClient.from_service_account_json("gen-lang-client.json")

VOICE_MODEL = "Wavenet" # "Standard" | "Wavenet" | "Chirp3"

TTS_FOLDER = "tts"
FINAL_FOLDER = "finals" # Folder to save the final podcast
if not os.path.exists(FINAL_FOLDER):
    os.makedirs(FINAL_FOLDER)
if not os.path.exists(TTS_FOLDER):
    os.makedirs(TTS_FOLDER)


model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})

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
7. Use SSML tags to add pauses, emphasis, and other speech effects.
8. If the word in the specified language is not available, use the English word.
9. Make the conversation longer and deeper.
10. If the question/statement seems too long, break it down into multiple consecutive questions/statements.

Try different names for the interviewer and speaker.
Use Dr. for the speaker name.

Usually first names are used to address someone in India

The target audience is 20 year old engineering students.

Language: English (American)

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
    "episodeNumber": "Episode Number",
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

def generate_podcast(topic):
    response = model.generate_content(prompt.format(topic=topic) + podcast_schema, generation_config={"max_output_tokens": 4000})
    return response.text

def save_podcast(text, filename, lang="en-IN", voice="en-IN-Standard-A"):
    
    filename = os.path.join(TTS_FOLDER, filename)
    speech = speech_client.synthesize_speech(
        # input=tts.SynthesisInput(text=text),
        input=tts.SynthesisInput(ssml=f"<speak>{text}</speak>"),
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

def remap_os_safe_title(title: str) -> str:
    return title.replace(" ", "_").replace(":", "_").replace("?", "_").replace("!", "_").replace(",", "_")

def main(topic="machine learning"):
    podcast = generate_podcast(topic)
    podcast = json.loads(podcast)
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
    title_audio = save_podcast(podcast_title, f"{os_safe_title}.wav", country_interviewer, gen_voice_ann.name)
    desc_audio = save_podcast(podcast_description, f"{os_safe_title}_description.wav", country_interviewer, gen_voice_ann.name)
    ep_audio = save_podcast(f"{episode_title}", f"{os_safe_title}_episode.wav", language, gen_voice_ann.name)
    
    audios = [title_audio, desc_audio, ep_audio]

    for idx, turn in enumerate(conversation):
        if turn["speaker"] == "interviewer":
            turn_audio = save_podcast(turn["text"], f"{os_safe_title}_{os_safe_interviewer}_{idx}.wav", country_interviewer, gen_voice_inter.name)
        else:
            turn_audio = save_podcast(turn["text"], f"{os_safe_title}_{os_safe_speaker}_{idx}.wav", country_speaker, gen_voice_speak.name)
        audios.append(turn_audio)
        print(f"Generated {turn['speaker']} audio for turn {idx + 1}/{len(conversation)}")

    print(f"Podcast '{podcast_title}' generated and saved in {os.path.abspath('tts')} folder.")

    # merge the files into a single podcast
    
    segments = [pydub.AudioSegment.from_wav(audio) for audio in audios]
    combined = AudioSegment.silent(duration=500)
    for segment in segments:
        combined += segment + AudioSegment.silent(duration=500)  # Add a 1-second silence between segments
    
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
    }

if __name__ == "__main__":
    topic = input("Enter the topic for the podcast (default: machine learning): ")
    main(topic if topic else "machine learning")
