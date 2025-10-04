import { useMutationWithAuth } from "../lib/useMutation";
import { API_URL } from "./api";

export function useUpdatePodcastVisibility({
  onSuccess,
  onFailure,
}: {
  onSuccess?: (data: {
    success: boolean;
    data: {
      [key: string]: unknown;
    };
  }) => void;
  onFailure?: (error: Error) => void;
}) {
  const { mutate, result, isLoading, error } = useMutationWithAuth<
    {
      success: boolean;
      data: {
        [key: string]: unknown;
      };
    },
    { podcast_id: string; is_public: boolean }
  >({
    url: API_URL + `/podcasts/{podcast_id}/visibility`,
    method: "PATCH",
    onSuccess: (data) => {
      onSuccess?.(data);
      console.log("Podcast visibility updated successfully", data);
    },
    onFailure: (error) => {
      onFailure?.(error as Error);
      console.error("Error generating podcast", error);
    },
    useQuery: true,
  });

  return {
    mutate,
    result,
    isLoading,
    error,
  };
}
