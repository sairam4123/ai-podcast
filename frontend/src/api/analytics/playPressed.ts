import useMutation from "../../lib/useMutation";
import { API_URL } from "../api";

export function usePlayPressed({podcastId}:{podcastId: string}) {
    const {mutate} = useMutation({
        url: `${API_URL}/analytics/podcasts/play?podcast_id=${podcastId}`,
        method: "POST",
        onSuccess: (data) => {
            console.log("Play pressed analytics recorded successfully", data);
        },
    })

    return {mutate}
}