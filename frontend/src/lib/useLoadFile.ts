import { useCallback, useEffect, useState } from "react";

type FetchOpts = {
    enabled: boolean;
}

export default function useLoadFile<T>(url: string, opts: FetchOpts = {enabled: true}): {loading: boolean, data: T | null, error: Error | null, resetData: () => void; refetch: () => void} {
   const [loading, setLoading] = useState(false);
   const [data, setData] = useState<T | null>(null);
   const [error, setError] = useState<Error | null>(null);

   const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      if (res.ok) {
        setData(blob as unknown as T)
      } else {
        setError(new Error(blob.toString()))
      }
    } catch (e) {
      setError(e as Error)
    }
    finally {
      setLoading(false)
    }
   }, [url]);

   useEffect(() => {
    if (opts.enabled) {
        fetchData();
    }
   }, [url, fetchData, opts.enabled])

   const resetData = () => {
    setData(null)
   }

   const refetch = () => {
    fetchData()
   }

    return {loading, data, error, resetData, refetch}
} 