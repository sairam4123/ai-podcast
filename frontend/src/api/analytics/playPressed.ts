import { useMutationWithAuth } from "../../lib/useMutation";
import { API_URL } from "../api";

export function usePlayPressed() {
  const { mutate } = useMutationWithAuth<
    {
      success: boolean;
      data: {
        [key: string]: unknown;
      };
    },
    { podcast_id: string }
  >({
    url: `${API_URL}/analytics/podcasts/play/{podcast_id}`,
    method: "POST",
    onSuccess: (data) => {
      console.log("Play pressed analytics recorded successfully", data);
    },
    useQuery: false,
  });

  return { mutate };
}
