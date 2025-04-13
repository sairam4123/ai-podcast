import useFetch from "../lib/useFetch";
import useLoadFile from "../lib/useLoadFile";
import { API_URL } from "./api";

export function useGetAudio({podcast_id}: {podcast_id: string}, {enabled = true}: {enabled?: boolean}) {
    const {data, loading, error, resetData, refetch} = useLoadFile<File>(API_URL + `/audios/${podcast_id}`, {enabled});
    // const audio = data?.audio ? URL.createObjectURL(data.audio) : null;
    const audioBlob = data ? new Blob([data], { type: "audio/mpeg" }) : null;
    console.log(data)
    return {
        data: data,
        audioBlob,
        isLoading: loading,
        error,
        resetData,
        refetch,
    }
}