import { useFetchWithAuth } from "../lib/useFetch";
import { API_URL } from "./api";

export default function useGetPodcastQuestions(
  { podcast_id }: { podcast_id: string },
  options?: { enabled?: boolean }
) {
  const {
    data,
    loading: isLoading,
    error,
    refetch,
  } = useFetchWithAuth<{
    questions: { id: string; question: string; response?: string }[];
  }>(API_URL + `/live/questions/${podcast_id}/`, {
    enabled: !!podcast_id && (options?.enabled ?? true),
  });
  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
