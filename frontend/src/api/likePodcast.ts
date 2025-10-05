import { useMutationWithAuth } from "../lib/useMutation";
import { API_URL } from "./api";

export function useLikePodcast({
  onSuccess,
  onFailure,
}: {
  onSuccess?: (data: { success: boolean }) => void;
  onFailure?: (error: unknown) => void;
}) {
  return useMutationWithAuth<
    { success: boolean },
    { podcast_id: string; liked: boolean }
  >({
    url: `${API_URL}/podcasts/{podcast_id}/like`,
    method: "POST",
    onSuccess(data) {
      console.log("Podcast liked/unliked successfully", data);
      onSuccess?.(data);
    },
    onFailure,
    useQuery: true,
  });
}
