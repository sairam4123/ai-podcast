import { Podcast } from "../@types/Podcast";
import useFetch from "../lib/useFetch";
import { API_URL } from "./api";

export function useSearchPodcast({
    searchTerm,
    limit = 10,
    offset = 0,
    sortBy = "relevance",
    sortOrder = "desc",
}: {
    searchTerm: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
}) {
    const {data, loading, error, resetData, refetch} = useFetch<{results: Podcast[]}>(API_URL + "/podcasts/search?query=" + searchTerm, {enabled: !!searchTerm});
    return {
        data: data,
        isLoading: loading,
        error,
        resetData,
        refetch
    }
}