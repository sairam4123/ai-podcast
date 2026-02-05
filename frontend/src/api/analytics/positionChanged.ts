import { useMutationWithAuth } from "../../lib/useMutation";
import { API_URL } from "../api";

export function useCurrentPositionChanged() {
  const { mutate } = useMutationWithAuth<
    {
      success: boolean;
      data: {
        [key: string]: unknown;
      };
    },
    { podcast_id: string; position: number }
  >({
    url: (body) => `${API_URL}/analytics/podcasts/position/${body.podcast_id}`,
    method: "POST",
    onSuccess: (data) => {
      console.log("Play pressed analytics recorded successfully", data);
    },
    useQuery: true,
  });

  return { mutate };
}
