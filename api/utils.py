from supabase import AClient as SupabaseClient

async def update_podcast_generation_task(podcast_id: str, status: str, progress: int = 0, progress_message: str = "", supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").update({
        "status": status,
        "progress": progress,
        "progress_message": progress_message,
    }).eq("id", podcast_id).execute()

async def update_error_generation_task(podcast_id: str, error_message: str, supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").update({
        "status": "failed",
        "error_message": error_message
    }).eq("id", podcast_id).execute()

async def update_completed_generation_task(podcast_id: str, supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").update({
        "status": "completed"
    }).eq("id", podcast_id).execute()

async def create_podcast_generation_task(podcast_id: str, status: str = "pending", progress: int = 0, supabase: SupabaseClient | None = None):
    if not supabase:
        return 

    await supabase.table("podcastgenerationtask").insert({
        "id": podcast_id,
        "status": status,
        "progress": progress
    }).execute()


class PodcastGenTask():
    def __init__(self, podcast_id: str, status: str = "pending", progress: int = 0, supabase: SupabaseClient | None = None):
        self.podcast_id = podcast_id
        self.status = status
        self.progress = progress
        self.progress_message = ""
        self.supabase = supabase
        self.error_message = None

    async def progress_update(self, progress: int, progress_message: str | None = None):
        self.progress = progress
        self.status = "in_progress"
        self.progress_message = progress_message or ""
        await update_podcast_generation_task(self.podcast_id, self.status, self.progress, self.progress_message, self.supabase)
    
    async def complete(self):
        self.status = "completed"
        await update_completed_generation_task(self.podcast_id, self.supabase)
    
    async def fail(self, error_message: str):
        self.status = "failed"
        self.error_message = error_message
        await update_error_generation_task(self.podcast_id, self.error_message, self.supabase)