import { PodcastGenTask } from "../@types/PodcastGenTask";
import { useFetchWithAuth } from "../lib/useFetch";
import { API_URL } from "./api";

export function useGetQueue() {
    const { data, loading: isLoading, error, refetch } = useFetchWithAuth<{ tasks: PodcastGenTask[] }>(
        API_URL + "/queue",
        {
            enabled: true,
        }
    );

    // console.log("useGetQueue", { data, isLoading, error });
    return {
        data,
        isLoading,
        error,
        refetch,
    };
}