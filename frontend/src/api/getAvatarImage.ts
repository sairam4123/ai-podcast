import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useGetAvatarImage({ personId }: { personId: string }) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // console.log("Image URL:", imageUrl);

  useEffect(() => {
    if (!personId) return;
    setLoading(true);
    const fetchImage = async () => {
      const { data: exists } = await supabase.storage
        .from("podcast-authors")
        .exists(`${personId}.png`);
      if (!exists) {
        console.error("Image file does not exist");
        setError(new Error("Image file does not exist"));
        setImageUrl(undefined);
        setLoading(false);
        return;
      }
      try {
        const { data } = supabase.storage
          .from("podcast-authors")
          .getPublicUrl(`${personId}.png`);
        console.log("Fetched image data:", data);
        if (!data.publicUrl) throw new Error("Image file does not exist");
        setImageUrl(data.publicUrl);
      } catch (err) {
        console.error("Error fetching image:", err);
        setError(err as Error);
        setImageUrl(undefined);
      } finally {
        setLoading(false);
      }
    };
    fetchImage();
  }, [personId]);

  // const { data, loading, error } = useLoadFile<File>(API_URL + `/images/${podcastId}`, { enabled: !!podcastId });
  //     const imageBlob = useMemo(() => {
  //         if (!data) return null;
  //         // check if the data is a valid image
  //         const isValidImage = data.type.startsWith("image/");
  //         if (!isValidImage) return null;
  //         return new Blob([data]);
  //     }, [data]);

  //     const imageUrl = useMemo(() => {
  //         if (!imageBlob) return null;
  //         return URL.createObjectURL(imageBlob);
  //     }, [imageBlob]);

  //     useEffect(() => {
  //         return () => {
  //           if (imageUrl) URL.revokeObjectURL(imageUrl);
  //         };
  //       }, [imageUrl]);

  return {
    imageUrl,
    isLoading: loading,
    error,
  };
}
