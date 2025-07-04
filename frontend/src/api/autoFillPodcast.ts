import { useMutationWithAuth } from "../lib/useMutation";
import { API_URL } from "./api";

export function useAutoFillPodcastForm({onSuccess, onFailure}: {onSuccess?: (data: {language: string; style: string; description: string; topic: string;}) => void, onFailure?: (error: Error) => void}) {
    const {mutate, result, isLoading, error} = useMutationWithAuth<{language: string; style: string; description: string; topic: string;}, {topic: string}>({
        url: API_URL + "/topic/generate",
        method: "POST",
        onSuccess: (data) => {
            onSuccess?.(data);
            console.log("Auto filled successfully", data);
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