import { Podcast } from "./Podcast";

export type PodcastGenTask = {
    id: string;
    podcast_id: string;
    // task_type: 'generation';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
    error_message?: string; // Optional error message if the task failed
    progress?: number; // Optional progress percentage (0-100)
    progress_message?: string; // Optional message to show progress

    podcast: Podcast;
}