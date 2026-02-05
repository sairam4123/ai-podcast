import { Podcast } from "../@types/Podcast";
import { useFetchWithAuth } from "../lib/useFetch";
import { API_URL } from "./api";

export interface LikedPodcast extends Podcast {
    liked_at: string;
}

export function useGetLikedPodcasts({
    limit = 10,
    offset = 0,
}: {
    limit?: number;
    offset?: number;
} = {}) {
    const { data, loading, error, refetch } = useFetchWithAuth<{ results: LikedPodcast[] }>(
        API_URL + "/podcasts/liked/@me?limit=" + limit + "&offset=" + offset,
        {
            enabled: true,
        }
    );

    return {
        data,
        isLoading: loading,
        error,
        refetch,
    };
}
