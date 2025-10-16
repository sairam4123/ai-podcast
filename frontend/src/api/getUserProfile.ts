import { useFetchWithAuth } from "../lib/useFetch";
import { API_URL } from "./api";

export default function useGetUserProfile({ userId }: { userId: string }) {
  const {
    data,
    loading: isLoading,
    error,
    refetch,
  } = useFetchWithAuth<{
    user: {
      display_name: string;
      id: string;
      username: string;
    };
    total_views: number;
    total_dislikes: number;
    total_likes: number;
    net_likes: number;
    total_podcasts: number;
  }>(API_URL + `/user/${userId}`, {
    enabled: !!userId,
  });

  //  console.log("useGetUserProfile", {data, isLoading, error});
  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
