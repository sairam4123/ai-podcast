import { useEffect, useMemo } from "react";
import useLoadFile from "../lib/useLoadFile";
import { API_URL } from "./api";

export function useGetAudio({podcast_id}: {podcast_id: string}, {enabled = true}: {enabled?: boolean}) {
    const {data, loading, error, resetData, refetch} = useLoadFile<File>(API_URL + `/audios/${podcast_id}`, {enabled});
    // const audio = data?.audio ? URL.createObjectURL(data.audio) : null;

    const audioBlob = useMemo(() => {
        if (!data) return null;
        // check if the data is a valid audio
        const isValidAudio = data.type.startsWith("audio/");
        if (!isValidAudio) return null;
        return new Blob([data], { type: data.type });
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

    return {
        audioUrl,
        isLoading: loading,
        error,
        resetData,
        refetch,
    }
}