import useFetch from "../lib/useFetch";
import { API_URL } from "./api";

export function useGetConversation({podcastId}: {podcastId?: string}) {
    const params = new URLSearchParams({
        v2: "true",
    });

    const {data, loading, error} = useFetch<{success: boolean, message: string, conversation: any}>(
        API_URL + "/podcasts/" + podcastId + "/conversations" + "?" + params.toString(),
        {enabled: !!podcastId}
    );

    console.log("useGetConversation", {data});

    return {data, isLoading: loading, error};
}