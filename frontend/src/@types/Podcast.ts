export type Podcast = {
    id: string;
    podcast_title: string;
    podcast_description: string;
    episode_title: string;
    image?: string;
    duration: number;

    interviewer: {
        name: string;
        country: string;
        gender: string;
    } | string;

    speaker: {
        name: string;
        country: string;
        gender: string;
    } | string;

    conversation?: {
        speaker: "interviewer" | "speaker";
        text: string;
    }[]

}