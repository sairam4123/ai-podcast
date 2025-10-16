import { useMutationWithAuth } from "../lib/useMutation";
import { API_URL } from "./api";

export default function useSendLiveQuestion({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: { message: string; response?: string }) => void;
  onError?: (error: unknown) => void;
}) {
  const { mutate, isLoading } = useMutationWithAuth<
    { message: string; response?: string },
    { question: string; podcast_id: string }
  >({
    url: `${API_URL}/live/questions/{podcast_id}`,
    method: "POST",
    onSuccess,
    onFailure: onError,
  });

  return { mutate, isLoading };
}
