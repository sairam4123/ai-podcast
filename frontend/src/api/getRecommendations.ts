import { Podcast } from "../@types/Podcast";
import useFetch, { useFetchWithAuth } from "../lib/useFetch";
import { API_URL } from "./api";

export function useGetRecommendations() {
  // {
  //   limit = 10,
  //   offset = 0,
  // }: {
  //   limit?: number;
  //   offset?: number;
  //   sortBy?: string;
  //   sortOrder?: string;
  // }
  const { data, loading, error, resetData, refetch } = useFetchWithAuth<
    Podcast[]
  >(API_URL + "/recommendations/@me", {
    enabled: true,
  });
  return {
    data: data,
    isLoading: loading,
    error,
    resetData,
    refetch,
  };
}
