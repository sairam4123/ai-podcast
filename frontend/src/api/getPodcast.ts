import { Podcast } from "../@types/Podcast";
import useFetch from "../lib/useFetch";
import { API_URL } from "./api";

export function useGetPodcast({podcastId}: {podcastId?: string}) {
    const {data, loading, error} = useFetch<{success: boolean, message: string, podcast: Podcast}>(
        API_URL + "/podcasts/" + podcastId,
        {enabled: !!podcastId}
    );

    return {data, isLoading: loading, error};
}