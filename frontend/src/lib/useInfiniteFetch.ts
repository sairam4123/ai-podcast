import { useEffect, useState } from "react";
import { useQueryClient } from "./query-client";

interface InfiniteQueryOptions<TData> {
    enabled?: boolean;
    staleTime?: number;
    getNextPageParam?: (lastPage: TData, allPages: TData[]) => unknown | undefined;
}

export function useInfiniteFetch<TData = any>(
    key: string,
    fetchFn: (context: { pageParam?: unknown }) => Promise<TData>,
    options: InfiniteQueryOptions<TData> = {}
) {
    const client = useQueryClient();
    const [, forceUpdate] = useState({});

    useEffect(() => {
        return client.subscribeToQuery(key, () => {
            forceUpdate({});
        });
    }, [client, key]);

    const query = client.getQuery<{ pages: TData[]; pageParams: unknown[] }>(key);

    const fetchNextPage = async () => {
        const currentPages = query?.data?.pages || [];
        const lastPage = currentPages[currentPages.length - 1];
        const nextPageParam = lastPage
            ? options.getNextPageParam?.(lastPage, currentPages)
            : undefined; // Start with undefined (initial page) if we rely on getNextPageParam for 2nd page onwards? 
        // Actually initial fetch is pageParam undefined usually.

        // If it's the very first fetch
        if (currentPages.length === 0) {
            return fetchPage(undefined);
        }

        if (nextPageParam === undefined || nextPageParam === null) {
            return; // No more pages
        }

        return fetchPage(nextPageParam);
    };

    const fetchPage = async (pageParam: unknown) => {
        // We don't want to use standard client.fetchQuery because that replaces data.
        // We need to manage partial updates. 
        // BUT, for simplicity in this custom impl, we can treat the WHOLE list of pages as the data.

        // We'll manually manage the promise/loading state for now since QueryClient is simple.
        // Ideally we'd extend QueryClient to understand infinite queries, but let's do it successfully here.

        try {
            const newData = await fetchFn({ pageParam });

            const currentData = client.getQueryData<{ pages: TData[]; pageParams: unknown[] }>(key) || { pages: [], pageParams: [] };

            const nextData = {
                pages: [...currentData.pages, newData],
                pageParams: [...currentData.pageParams, pageParam]
            };

            client.setQueryData(key, nextData);
        } catch (e) {
            // Handle error in client?
            console.error(e);
        }
    };

    const staleTime = options.staleTime ?? 0;
    const isStale = !query || !query.lastUpdated || (Date.now() - query.lastUpdated > staleTime);

    useEffect(() => {
        if (options.enabled !== false && isStale && (!query?.data || query?.data?.pages?.length === 0)) {
            fetchPage(undefined);
        }
    }, [key, options.enabled, isStale]);

    return {
        data: query?.data,
        isLoading: !query?.data && !query?.error, // simplistic
        isFetching: false, // TODO: track fetching state better locally or in client
        fetchNextPage,
        hasNextPage: true, // TODO: derive from getNextPageParam
        error: query?.error,
    };
}
