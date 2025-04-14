import useMutation from "../lib/useMutation";
import { API_URL } from "./api";

export function useGeneratePodcast({onSuccess, onFailure}: {onSuccess?: (data: {success: boolean, message: string}) => void, onFailure?: (error: Error) => void}) {
    const {mutate, result, isLoading, error} = useMutation<{success: boolean, message: string}, {topic: string}>({
        url: API_URL + "/podcasts",
        method: "POST",
        onSuccess: (data) => {
            onSuccess?.(data);
            console.log("Podcast generated successfully", data);
        },
        onFailure: (error) => {
            onFailure?.(error as Error);
            console.error("Error generating podcast", error);
        }
    });

    return {
        mutate,
        result,
        isLoading,
        error,
    }
}