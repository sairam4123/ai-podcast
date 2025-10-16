import dotenv
dotenv.load_dotenv()
import os

from api.gen import CreatePodcast, create_podcast_gen
import time


async def main():
    secs = []
    for i in range(10):
        start_time = time.time()
        podcast = await create_podcast_gen(
            create_podcast=CreatePodcast(
                topic=f"Test Podcast {i+1}",
                description="A Test podcast about various topics.",
                style="Casual conversation",
                language="en",
            ),
            should_upload=False,
            should_generate_images=False,
            raise_errors=False,
        )
        end_time = time.time()
        print(f"Time taken for podcast {i+1}: {end_time - start_time} seconds")
        print(f"Created podcast: {podcast.id}")
        secs.append(end_time - start_time)
    avg_time = sum(secs) / len(secs)
    print(f"Average time taken: {avg_time} seconds")
    print(f"Fastest time: {min(secs)} seconds")
    print(f"Slowest time: {max(secs)} seconds")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
