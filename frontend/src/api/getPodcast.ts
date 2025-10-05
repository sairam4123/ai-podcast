import { Podcast } from "../@types/Podcast";
import { useFetchWithAuth } from "../lib/useFetch";
import { API_URL } from "./api";

export function useGetPodcast({ podcastId }: { podcastId?: string }) {
  const params = new URLSearchParams({
    v2: "true",
  });

  const { data, loading, error, refetch } = useFetchWithAuth<{
    success: boolean;
    message: string;
    podcast: Podcast;
  }>(API_URL + "/podcasts/" + podcastId + "?" + params.toString(), {
    enabled: !!podcastId,
  });

  return { data, isLoading: loading, error, refetch };
}
