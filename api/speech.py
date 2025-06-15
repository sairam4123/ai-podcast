
import io
import random
from typing import Sequence
from pydub import AudioSegment

import google.cloud.texttospeech as tts


from gen import detect_topic_language

def unique_languages_from_voices(voices: Sequence[tts.Voice]):
    language_set = set()
    for voice in voices:
        for language_code in voice.language_codes:
            language_set.add(language_code)
    return language_set


def list_languages():
    client = tts.TextToSpeechClient.from_service_account_json("gen-lang-client.json")
    response = client.list_voices()
    languages = unique_languages_from_voices(response.voices)

    print(f" Languages: {len(languages)} ".center(60, "-"))
    for i, language in enumerate(sorted(languages)):
        print(f"{language:>10}", end="\n" if i % 5 == 4 else "")

import google.cloud.texttospeech as tts

count = 1


def shift_down(audio: AudioSegment, semitones: float) -> AudioSegment:
    # Adjust sample rate to shift pitch
    new_sample_rate = int(audio.frame_rate * (2.0 ** (semitones / 12.0)))
    return audio._spawn(audio.raw_data, overrides={'frame_rate': new_sample_rate}).set_frame_rate(audio.frame_rate)

def list_voices(language_code=None):
    client = tts.TextToSpeechClient.from_service_account_json("gen-lang-client.json")
    response = client.list_voices(language_code=language_code)
    voices = sorted(response.voices, key=lambda voice: voice.name)

    print(f" Voices: {len(voices)} ".center(60, "-"))
    for voice in voices:
        languages = ", ".join(voice.language_codes)
        name = voice.name
        gender = tts.SsmlVoiceGender(voice.ssml_gender).name
        rate = voice.natural_sample_rate_hertz
        print(f"{languages:<8} | {name:<24} | {gender:<8} | {rate:,} Hz")
        


def text_to_wav(voice_name: str, text: str):
    global count
    language_code = "-".join(voice_name.split("-")[:2])
    text_input = tts.SynthesisInput(text=text)
    voice_params = tts.VoiceSelectionParams(
        language_code=language_code, name=voice_name
    )
    audio_config = tts.AudioConfig(
        audio_encoding=tts.AudioEncoding.LINEAR16,
        speaking_rate=1.0
    )

    client = tts.TextToSpeechClient.from_service_account_json("gen-lang-client.json")
    response = client.synthesize_speech(
        input=text_input,
        voice=voice_params,
        audio_config=audio_config,
    )

    pitch_shift = random.uniform(-1, 1) * random.randint(1, 4)  # Random pitch shift between -5 and 5 semitones
    print(f"Generating {count:03d} - {voice_name} with pitch shift of {pitch_shift} semitones")

    file: AudioSegment = AudioSegment.from_wav(io.BytesIO(response.audio_content))
    file = shift_down(file, pitch_shift)  # Shift down by 2 semitones

    
    file.export(f"{count:03d}-{voice_name}.wav", format="wav")
    count += 1
        

# list_voices()

print(detect_topic_language("explain the process behind time-sharing in operating systems"))

text_to_wav("en-GB-Chirp3-HD-Charon", "Ah, like time-sharing! So the OS juggles running programs using these scheduling rules to decide who gets the CPU next. Cool!")
text_to_wav("en-GB-Chirp3-HD-Charon", "Ah, like time-sharing! So the OS juggles running programs using these scheduling rules to decide who gets the CPU next. Cool!")
text_to_wav("en-GB-Chirp3-HD-Charon", "Ah, like time-sharing! So the OS juggles running programs using these scheduling rules to decide who gets the CPU next. Cool!")
text_to_wav("en-GB-Chirp3-HD-Charon", "Ah, like time-sharing! So the OS juggles running programs using these scheduling rules to decide who gets the CPU next. Cool!")
text_to_wav("en-GB-Chirp3-HD-Charon", "Ah, like time-sharing! So the OS juggles running programs using these scheduling rules to decide who gets the CPU next. Cool!")
text_to_wav("en-GB-Chirp3-HD-Charon", "Ah, like time-sharing! So the OS juggles running programs using these scheduling rules to decide who gets the CPU next. Cool!")
