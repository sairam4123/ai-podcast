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
}

// export type PodcastNew = {

// }