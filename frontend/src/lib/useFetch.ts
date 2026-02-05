import { useQuery } from "./query-client";
import { useCallback } from "react";

type FetchOpts = {
  enabled?: boolean;
  staleTime?: number; // New option
  cacheTime?: number; // New option
  onSuccess?: (data: any) => void; // New option
  onError?: (err: Error) => void;  // New option
};

export default function useFetch<T>(
  url: string,
  opts: FetchOpts = { enabled: true }
): {
  loading: boolean;
  data: T | null;
  error: Error | null;
  resetData: () => void;
  refetch: () => Promise<void>;
} {
  const fetcher = useCallback(async () => {
    const res = await fetch(url);
    const json = await res.json();
    if (res.ok) {
      if ("success" in json && !json.success) {
        throw new Error(json.message);
      }
      return json;
    } else {
      throw new Error(json.message || JSON.stringify(json));
    }
  }, [url]);

  const { data, isFetching, error, refetch, setData } = useQuery<T>(url, {
    enabled: opts.enabled,
    staleTime: opts.staleTime,
    cacheTime: opts.cacheTime,
    onSuccess: opts.onSuccess,
    onError: opts.onError,
    fetcher,
  });

  const resetData = () => {
    setData(null);
  };

  const refetchWrapper = async () => {
    await refetch();
  };

  return { loading: isFetching, data, error, resetData, refetch: refetchWrapper };
}

export function useFetchWithAuth<T>(
  url: string,
  opts: FetchOpts = { enabled: true }
): {
  loading: boolean;
  data: T | null;
  error: Error | null;
  resetData: () => void;
  refetch: () => Promise<void>;
} {
  // QueryClient's defaultFetcher already creates authenticated requests using existing logic
  // So we can reuse useQuery directly.
  const { data, isFetching, error, refetch, setData } = useQuery<T>(url, {
    enabled: opts.enabled,
    staleTime: opts.staleTime,
    cacheTime: opts.cacheTime,
    onSuccess: opts.onSuccess,
    onError: opts.onError,
  });

  const resetData = () => {
    setData(null);
  };

  const refetchWrapper = async () => {
    await refetch();
  };

  return { loading: isFetching, data, error, resetData, refetch: refetchWrapper };
}
