export type Podcast = {
    id: string;
    podcast_title: string;
    podcast_description: string;
    episode_title: string;
    image?: string;
    duration: number;

    people?: {
        id: string;
        name: string;
        gender: 'male' | 'female';
        interviewer: boolean;
    }[]

    conversation?: {
        speaker: string;
        text: string;
        start_time?: number;
        end_time?: number;
    }[]

    created_at: string;
    updated_at: string;

    language: string;
    tags: string[];

    view_count: number;
    like_count: number;
    dislike_count: number;
}

// export type PodcastNew = {

// }