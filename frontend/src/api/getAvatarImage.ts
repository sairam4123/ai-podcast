import { useEffect, useMemo } from "react";
import useLoadFile from "../lib/useLoadFile";
import { API_URL } from "./api";

export function useGetAvatarImage({podcastId, personId}: {podcastId: string; personId: string}) {
    const { data, loading, error } = useLoadFile<File>(API_URL + `/images/${podcastId}/avatar/${personId}`, { enabled: !!podcastId && !!personId });
        const imageBlob = useMemo(() => {
            if (!data) return null;
            // check if the data is a valid image
            const isValidImage = data.type.startsWith("image/");
            if (!isValidImage) return null;

            return new Blob([data]);
        }, [data]);
    
        const imageUrl = useMemo(() => {
            if (!imageBlob) return null;
            return URL.createObjectURL(imageBlob);
        }, [imageBlob]);
    
        useEffect(() => {
            return () => {
              if (imageUrl) URL.revokeObjectURL(imageUrl);
            };
          }, [imageUrl]);
    
    return {
        imageUrl,
        isLoading: loading,
        error,
    };
}