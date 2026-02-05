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
    url: (body) => `${API_URL}/podcasts/${body.podcast_id}/like`,
    method: "POST",
    onSuccess(data) {
      console.log("Podcast liked/unliked successfully", data);
      onSuccess?.(data);
    },
    onFailure,
    useQuery: true, // This appends body params as query string? If liked status needs to be query param.
    // Checking original: yes useQuery: true. 
    // And body is {podcast_id, liked}. 
    // If useQuery is true, params are appended. 
    // The previous implementation replaced {podcast_id} but also appended params?
    // "if (useQuery) newUrl += ...params"
    // So yes.
  });
}
