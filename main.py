import fastapi
from gen import main as generate_podcast
from uuid import uuid4
import json

from fastapi.responses import FileResponse

import pathlib

app = fastapi.FastAPI()

podcasts = {}
pathlib.Path("podcasts.json").touch(exist_ok=True)
with open("podcasts.json", "r") as f:
    podcasts = json.loads(f.read() or "{}")

audios = {}
pathlib.Path("audios.json").touch(exist_ok=True)
with open("audios.json", "r") as f:
    audios = json.loads(f.read() or "{}")


@app.get("/podcasts/search")
async def search_podcasts(query: str):
    results = []
    for podcast_id, podcast in podcasts.items():
        if query.lower() in podcast["podcast_title"].lower() or query.lower() in podcast["podcast_description"].lower():
            results.append({"id": podcast_id, **podcast})
    if results:
        return {"results": results}
    return {"results": []}

@app.get("/podcasts/{podcast_id}")
async def get_podcast(podcast_id: str):
    podcast = podcasts.get(podcast_id)
    if podcast:
        return {**podcast}
    else:
        return {"error": "Podcast not found"}, 404

@app.get("/audios/{podcast_id}")
async def get_audio(podcast_id: str):
    audio = audios.get(podcast_id)
    if audio:
        return FileResponse(audio, media_type="audio/mpeg")
    else:
        return {"error": "Audio not found"}, 404

@app.post("/podcasts")
async def create_podcast(topic: str):
    podcast = generate_podcast(topic)
    podcast["id"] = str(uuid4())
    podcasts[podcast["id"]] = podcast
    
    audios[podcast["id"]] = podcast["audio_file"]

    del podcast["audio_file"]

    with open("podcasts.json", "w") as f:
        f.write(json.dumps(podcasts, indent=4))
    
    with open("audios.json", "w") as f:
        f.write(json.dumps(audios, indent=4))

    return {**podcast}

if __name__ == '__main__':
    pass