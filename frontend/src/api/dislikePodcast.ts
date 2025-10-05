import { useMutationWithAuth } from "../lib/useMutation";
import { API_URL } from "./api";

export function useDislikePodcast({
  onSuccess,
  onFailure,
}: {
  onSuccess?: (data: { success: boolean }) => void;
  onFailure?: (error: unknown) => void;
}) {
  return useMutationWithAuth<
    { success: boolean },
    { podcast_id: string; disliked: boolean }
  >({
    url: `${API_URL}/podcasts/{podcast_id}/dislike`,
    method: "POST",
    onSuccess(data) {
      console.log("Podcast disliked/undisliked successfully", data);
      onSuccess?.(data);
    },
    onFailure,
    useQuery: true,
  });
}
