import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getToken } from "./supabase";

type QueryKey = string;

interface Query<T = any> {
    key: QueryKey;
    data: T | null;
    error: Error | null;
    status: "idle" | "loading" | "success" | "error";
    lastUpdated: number;
    promise: Promise<T> | null;
    listeners: Set<() => void>;
}

interface QueryObserverOptions<T = any> {
    enabled?: boolean;
    staleTime?: number; // ms before data is considered stale
    cacheTime?: number; // ms to keep unused data in cache (not fully implemented cleanup yet)
    onSuccess?: (data: T) => void;
    onError?: (err: Error) => void;
    fetcher?: () => Promise<T>; // Custom fetcher
}

export class QueryClient {
    private queries = new Map<QueryKey, Query>();
    private listeners = new Set<() => void>();

    constructor() { }

    subscribe(callback: () => void) {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    notify() {
        this.listeners.forEach((l) => l());
    }

    getQuery<T>(key: QueryKey): Query<T> | undefined {
        return this.queries.get(key);
    }

    setQueryData<T>(key: QueryKey, data: T | null) {
        const query = this.queries.get(key) || this.createEmptyQuery(key);
        query.data = data;
        query.status = "success";
        query.lastUpdated = Date.now();
        query.error = null;
        this.queries.set(key, query);
        this.notifyQueryListeners(key);
    }

    getQueryData<T>(key: QueryKey): T | null | undefined {
        return this.queries.get(key)?.data;
    }

    invalidateQueries(keyOrPredicate: QueryKey | ((key: QueryKey) => boolean)) {
        if (typeof keyOrPredicate === "string") {
            const query = this.queries.get(keyOrPredicate);
            if (query) {
                query.lastUpdated = 0; // Mark as stale immediately
                if (query.listeners.size > 0) {
                    this.fetchQuery(keyOrPredicate);
                }
            }
        } else {
            // iterate and invalidate
            for (const [key, query] of this.queries.entries()) {
                if (keyOrPredicate(key)) {
                    query.lastUpdated = 0;
                    if (query.listeners.size > 0) {
                        this.fetchQuery(key);
                    }
                }
            }
        }
    }

    async fetchQuery<T>(key: QueryKey, fetchFn?: () => Promise<T>): Promise<T> {
        let query = this.queries.get(key) as Query<T>;

        if (!query) {
            query = this.createEmptyQuery(key);
            this.queries.set(key, query);
        }

        // If already loading, return existing promise
        if (query.promise) {
            return query.promise;
        }

        query.status = "loading";
        query.error = null; // Clear previous error on new fetch
        this.notifyQueryListeners(key);

        const promise = (async () => {
            try {
                let data: T;
                if (fetchFn) {
                    data = await fetchFn();
                } else {
                    // Default fetcher logic (handles same logic as useFetchWithAuth)
                    data = await this.defaultFetcher<T>(key);
                }

                query.data = data;
                query.status = "success";
                query.lastUpdated = Date.now();
                query.promise = null;
                this.notifyQueryListeners(key);
                return data;
            } catch (err) {
                query.error = err as Error;
                query.status = "error";
                query.promise = null;
                this.notifyQueryListeners(key);
                throw err;
            }
        })();

        query.promise = promise;
        return promise;
    }

    private createEmptyQuery(key: string): Query {
        return {
            key,
            data: null,
            error: null,
            status: "idle",
            lastUpdated: 0,
            promise: null,
            listeners: new Set(),
        };
    }

    private notifyQueryListeners(key: string) {
        const query = this.queries.get(key);
        if (query) {
            query.listeners.forEach((l) => l());
        }
    }

    subscribeToQuery(key: string, listener: () => void) {
        let query = this.queries.get(key);
        if (!query) {
            query = this.createEmptyQuery(key);
            this.queries.set(key, query);
        }
        query.listeners.add(listener);
        return () => {
            query?.listeners.delete(listener);
        };
    }

    private async defaultFetcher<T>(url: string): Promise<T> {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        const json = await res.json();

        if (res.ok) {
            if ("success" in json && !json.success) {
                throw new Error(json.message || "Request failed");
            }
            return json as T;
        } else {
            throw new Error(json.message || JSON.stringify(json));
        }
    }
}

// Context and Hook
const QueryClientContext = createContext<QueryClient | null>(null);

export const QueryClientProvider = ({ client, children }: { client: QueryClient; children: ReactNode }) => {
    return (
        // @ts-ignore
        <QueryClientContext.Provider value={client} >
            {children}
        </QueryClientContext.Provider>
    );
};

export const useQueryClient = () => {
    const client = useContext(QueryClientContext);
    if (!client) {
        throw new Error("useQueryClient must be used within a QueryClientProvider");
    }
    return client;
};

// Internal hook for useFetch to reuse
export function useQuery<T>(
    key: string,
    options: QueryObserverOptions = {}
) {
    const client = useQueryClient();
    // Force update to re-render
    const [, forceUpdate] = useState({});

    useEffect(() => {
        return client.subscribeToQuery(key, () => {
            forceUpdate({});
        });
    }, [client, key]);

    const query = client.getQuery<T>(key);

    const staleTime = options.staleTime ?? 0;
    const isStale = !query || !query.lastUpdated || (Date.now() - query.lastUpdated > staleTime);

    useEffect(() => {
        // Only fetch if enabled, is stale, and NOT already loading
        if (options.enabled !== false && isStale && (!query || query.status !== 'loading')) {
            client.fetchQuery(key, options.fetcher).then(options.onSuccess).catch(options.onError || (() => { }));
        }
    }, [key, options.enabled, isStale, client, options.fetcher]); // Dependencies control when to fetch

    const refetch = () => {
        return client.fetchQuery(key, options.fetcher).then(options.onSuccess).catch(options.onError || (() => { }));
    };

    return {
        data: query?.data ?? null,
        isLoading: !query || (query.status === "loading" && !query.data),
        isFetching: query?.status === "loading",
        error: query?.error ?? null,
        refetch,
        // Helper to manually set data
        setData: (data: T | null) => client.setQueryData(key, data),
        status: query?.status ?? "idle",
    };
}
