import { Podcast } from "../@types/Podcast";
import useFetch from "../lib/useFetch";
import { API_URL } from "./api";

export function useGetAllPodcast({
    limit = 10,
    offset = 0,
}: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
}) {

    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });
    const {data, loading, error, resetData, refetch} = useFetch<{results: Podcast[]}>(API_URL + `/podcasts?${params}`, {enabled: !!params.toString()});
    return {
        data: data,
        isLoading: loading,
        error,
        resetData,
        refetch
    }
}