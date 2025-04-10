from dotenv import load_dotenv
load_dotenv()

import os
import json

import gtts
import pydub
from pydub import AudioSegment
import google.generativeai as genai

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

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
The conversation should be around 2-5 minutes long.
If the time is given, the conversation should be around that time.
If time given is more than 5 minutes, then the conversation should be around 5 minutes.
If time given is less than 2 minutes, then the conversation should be around 2 minutes.
The conversation should be in English.
PODCAST SCHEMA:
"""

podcast_schema = """
{
    "podcastTitle": "Podcast Title",
    "podcastDescription": "Podcast Description",
    "episodeTitle": "Episode Title",
    "interviewer": "Interviewer Name",
    "speaker": "Speaker Name",
    "conversation": [
        {
            "speaker": "interviewer | speaker",
            "text": "Question or statement"
        },
        {
            "speaker": "interviewer | speaker",
            "text": "Question or statement"
        }
    ]
}
"""

def generate_podcast(topic):
    response = model.generate_content(prompt.format(topic=topic) + podcast_schema, generation_config={"max_output_tokens": 4000})
    return response.text

def save_podcast(text, filename, tld="com"):

    filename = os.path.join(TTS_FOLDER, filename)
    tts = gtts.gTTS(text, tld=tld, slow=False)
    tts.save(filename)

def main(topic="machine learning"):
    podcast = generate_podcast(topic)
    podcast = json.loads(podcast)
    podcast_title = podcast["podcastTitle"]
    podcast_description = podcast["podcastDescription"]
    episode_title = podcast["episodeTitle"]
    interviewer = podcast["interviewer"]
    speaker = podcast["speaker"]
    conversation = podcast["conversation"]
    os_safe_title = podcast_title.replace(" ", "_").replace(":", "_").replace("?", "_").replace("!", "_").replace(",", "_")
    os_safe_interviewer = interviewer.replace(" ", "_").replace(":", "_").replace("?", "_").replace("!", "_").replace(",", "_")
    os_safe_speaker = speaker.replace(" ", "_").replace(":", "_").replace("?", "_").replace("!", "_").replace(",", "_")
    print("Generating podcast...")
    print(f"Podcast Title: {podcast_title}")
    save_podcast(podcast_title, f"{os_safe_title}.mp3", tld="us")
    save_podcast(podcast_description, f"{os_safe_title}_description.mp3", tld="us")
    save_podcast(episode_title, f"{os_safe_title}_episode.mp3", tld="us")
    for idx, turn in enumerate(conversation):
        if turn["speaker"] == "interviewer":
            save_podcast(turn["text"], f"{os_safe_title}_{os_safe_interviewer}_{idx}.mp3", tld="co.uk")
        else:
            save_podcast(turn["text"], f"{os_safe_title}_{os_safe_speaker}_{idx}.mp3", tld="us")

    print(f"Podcast '{podcast_title}' generated and saved in {os.path.abspath('tts')} folder.")

    # merge the files into a single podcast
    podcast_files = [f"{os_safe_title}.mp3", f"{os_safe_title}_description.mp3", f"{os_safe_title}_episode.mp3"]
    for idx, turn in enumerate(conversation):
        if turn["speaker"] == "interviewer":
            podcast_files.append(f"{os_safe_title}_{os_safe_interviewer}_{idx}.mp3")
        else:
            podcast_files.append(f"{os_safe_title}_{os_safe_speaker}_{idx}.mp3")
    
    segments = [pydub.AudioSegment.from_mp3(os.path.join(TTS_FOLDER, file)) for file in podcast_files]
    combined = AudioSegment.silent(duration=500)
    for segment in segments:
        combined += segment + AudioSegment.silent(duration=500)  # Add a 1-second silence between segments
    
    final_file = os.path.join(FINAL_FOLDER, f"{os_safe_title}_final.mp3")
    combined.export(final_file, format="mp3")
    print(f"Final podcast '{podcast_title}_final.mp3' generated.")
    return {
        "podcast_title": podcast_title,
        "podcast_description": podcast_description,
        "episode_title": episode_title,
        "interviewer": interviewer,
        "speaker": speaker,
        "audio_file": final_file
    }

if __name__ == "__main__":
    topic = input("Enter the topic for the podcast (default: machine learning): ")
    main(topic if topic else "machine learning")
