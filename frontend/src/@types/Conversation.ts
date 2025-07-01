export type Conversation = {
    id: string;
    episode_id: string;
    speaker_id: string;
    text: string;

    start_time: number;
    end_time: number;

    podcast_author: {
        author_id: string;
        is_host: boolean;
        podcast_id: string;
    }

    speaker: {
        id: string;
        name: string;
        bio?: string;
        background?: string;
    }
}