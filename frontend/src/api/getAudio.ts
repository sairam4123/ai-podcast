import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useGetAudio(
  { podcast_id, resp_id }: { podcast_id: string; resp_id?: string },
  { enabled = true }: { enabled?: boolean }
) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // console.log("Audio URL:", audioUrl, "Loading:", loading,);

  // const {data, loading, error, resetData, refetch} = useLoadFile<File>(API_URL + `/audios/${podcast_id}`, {enabled});
  // const audio = data?.audio ? URL.createObjectURL(data.audio) : null;

  // const audioBlob = useMemo(() => {
  //     if (!data) return null;
  //     // check if the data is a valid audio
  //     const isValidAudio = data.type.startsWith("audio/");
  //     if (!isValidAudio) return null;
  //     return new Blob([data], { type: data.type });
  // }, [data]);

  // const audioUrl = useMemo(async () => {
  //     // if (!audioBlob) return null;

  //     if (!await supabase.storage.from("podcasts").exists(`${podcast_id}.wav`)) {
  //         throw new Error("Audio file does not exist");
  //     }
  //     const {data} = await supabase.storage.from("podcasts").getPublicUrl(podcast_id);
  //     return data.publicUrl;

  //     // return URL.createObjectURL(audioBlob);
  // }, [podcast_id]);

  useEffect(() => {
    if (!podcast_id || !enabled) return;
    setLoading(true);
    const fetchAudio = async () => {
      try {
        if (resp_id) {
          const data = supabase.storage
            .from("podcasts")
            .getPublicUrl(`${podcast_id}/${resp_id}.wav`);
          setAudioUrl(data.data.publicUrl);
          return;
        }

        const exists = await supabase.storage
          .from("podcasts")
          .exists(`${podcast_id}.mp3`);
        if (exists.error) {
          console.error("Error checking audio existence:", exists.error);
        }
        let data;
        if (!exists.data) {
          data = supabase.storage
            .from("podcasts")
            .getPublicUrl(`${podcast_id}.wav`);
        } else {
          data = supabase.storage
            .from("podcasts")
            .getPublicUrl(`${podcast_id}.mp3`);
        }

        setAudioUrl(data.data.publicUrl);
      } catch (err) {
        console.error("Error fetching audio:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchAudio();
  }, [podcast_id, enabled]);

  // useEffect(() => {
  //     // return () => {
  //     //   if (audioUrl) URL.revokeObjectURL(audioUrl);
  //     // };
  //   }, [audioUrl]);

  return {
    audioUrl,
    isLoading: loading,
    error,
  };
}
