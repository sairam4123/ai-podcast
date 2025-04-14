import { useEffect, useMemo } from "react";
import useFetch from "../lib/useFetch";
import useLoadFile from "../lib/useLoadFile";
import { API_URL } from "./api";

export function useGetAudio({podcast_id}: {podcast_id: string}, {enabled = true}: {enabled?: boolean}) {
    const {data, loading, error, resetData, refetch} = useLoadFile<File>(API_URL + `/audios/${podcast_id}`, {enabled});
    // const audio = data?.audio ? URL.createObjectURL(data.audio) : null;

    const audioBlob = useMemo(() => {
        if (!data) return null;
        return new Blob([data], { type: "audio/mpeg" });
    }, [data]);

    const audioUrl = useMemo(() => {
        if (!audioBlob) return null;
        return URL.createObjectURL(audioBlob);
    }, [audioBlob]);

    useEffect(() => {
        return () => {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
      }, [audioUrl]);

    console.log(data)
    return {
        audioUrl,
        isLoading: loading,
        error,
        resetData,
        refetch,
    }
}