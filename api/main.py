import fastapi
import pydantic
import pydub
from gen import main as generate_podcast
from uuid import uuid4
import json

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



@app.get("/podcasts/search")
async def search_podcasts(query: str):
    results = []
    for podcast_id, podcast in podcasts.items():
        if query.lower() in podcast["podcast_title"].lower() or query.lower() in podcast["podcast_description"].lower() or query.lower() in podcast["episode_title"].lower():
            if "duration" not in podcast: # just in case we don't have it yet
                podcast["duration"] = len(pydub.AudioSegment.from_file(audios[podcast_id])) / 1000
            results.append({"id": podcast_id, **podcast})
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

@app.get("/images/{podcast_id}")
async def get_image(podcast_id: str):
    image = images.get(podcast_id)
    if image:
        return FileResponse(image)
    else:
        return {"error": "Image not found"}, 404
    

@app.post("/podcasts")
async def create_podcast(q_topic: str | None = None, podcast: GeneratePodcast | None = None):
    print(podcast.topic, q_topic)
    podcast = generate_podcast(podcast.topic if podcast else q_topic)
    if not podcast:
        return {"error": "No podcast generated"}, 400
    
    podcast["id"] = str(uuid4())
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