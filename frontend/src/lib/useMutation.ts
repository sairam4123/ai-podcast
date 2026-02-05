import { useState } from "react";
import { getToken } from "./supabase";
// import { useQueryClient } from "./query-client";

type Status = "IDLE" | "LOADING" | "SUCCESS" | "FAILURE";

export default function useMutation<
  TResult,
  TBody extends object,
  TError = unknown
>({
  url,
  method,
  onSuccess,
  onFailure,
  onSettled,
  useQuery = false,
}: {
  url: string | ((body: TBody) => string);
  method: "POST" | "PUT" | "DELETE";
  onSuccess?: (data: TResult) => void;
  onFailure?: (error: TError) => void;
  onSettled?: () => void;
  useQuery?: boolean;
}) {
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [status, setStatus] = useState<Status>("IDLE");
  const isLoading = status === "LOADING";
  // const client = useQueryClient();

  const mutate = async (body: TBody) => {
    setStatus("LOADING");
    let newUrl = typeof url === "function" ? url(body) : url;

    // DEPRECATED: {podcast_id} replacement logic removed.
    // Callers must provide full URL.

    if (useQuery) {
      newUrl += `?${new URLSearchParams(
        body as Record<string, string>
      ).toString()}`;
    }
    try {
      const response = await fetch(newUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        if ("success" in data && !data.success) {
          throw new Error(data.message);
        }
        setStatus("SUCCESS");
        onSuccess?.(data);
        setResult(data);
      } else {
        setStatus("FAILURE");
        setError(data);
        onFailure?.(data);
      }
    } catch (error) {
      setStatus("FAILURE");
      setError(error as TError);
      onFailure?.(error as TError);
    } finally {
      onSettled?.();
    }
  };
  return { result, error, isLoading, status, mutate };
}

export function useMutationWithAuth<
  TResult extends object | unknown[],
  TBody extends object | unknown[],
  TError = unknown
>({
  url,
  method,
  onSuccess,
  onFailure,
  onSettled,
  useQuery = false,
}: {
  url: string | ((body: TBody) => string);
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  useQuery?: boolean;
  onSuccess?: (data: TResult) => void;
  onFailure?: (error: TError) => void;
  onSettled?: () => void;
}) {
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [status, setStatus] = useState<Status>("IDLE");
  const isLoading = status === "LOADING";
  // const client = useQueryClient();

  const mutate = async (body: TBody) => {
    setStatus("LOADING");
    let newUrl = typeof url === "function" ? url(body) : url;

    // DEPRECATED: {podcast_id} replacement logic removed.

    if (useQuery) {
      newUrl += `?${new URLSearchParams(
        body as Record<string, string>
      ).toString()}`;
    }
    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(newUrl, {
        method,
        headers,
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        if ("success" in data && !data.success) {
          throw new Error(data.message);
        }
        setStatus("SUCCESS");
        onSuccess?.(data);
        setResult(data);
      } else {
        setStatus("FAILURE");
        setError(data);
        onFailure?.(data);
      }
    } catch (error) {
      setStatus("FAILURE");
      setError(error as TError);
      onFailure?.(error as TError);
    } finally {
      onSettled?.();
    }
  };
  return { result, error, isLoading, status, mutate };
}
