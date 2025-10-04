import { useState } from "react";
import { getToken } from "./supabase";

type Status = "IDLE" | "LOADING" | "SUCCESS" | "FAILURE";

export default function useMutation<TResult, TBody, TError = unknown>({
  url,
  method,
  onSuccess,
  onFailure,
  useQuery = false,
}: {
  url: string;
  method: "POST" | "PUT" | "DELETE";
  onSuccess?: (data: TResult) => void;
  onFailure?: (error: TError) => void;
  useQuery?: boolean;
}) {
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [status, setStatus] = useState<Status>("IDLE");
  const isLoading = status === "LOADING";
  const mutate = async (body: TBody) => {
    setStatus("LOADING");
    console.log(JSON.stringify(body));
    let newUrl = url;
    if (url && url.includes("{podcast_id}") && "podcast_id" in body) {
      newUrl = url.replace("{podcast_id}", body.podcast_id as string);
    } else {
      console.warn(
        "URL does not contain {podcast_id} or body does not have podcast_id"
      );
    }
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
      console.log("Data received: ", data);
      console.log("Data set: ", data, "response OK?", response.ok);
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
  useQuery = false,
}: {
  url: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  useQuery?: boolean;
  onSuccess?: (data: TResult) => void;
  onFailure?: (error: TError) => void;
}) {
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [status, setStatus] = useState<Status>("IDLE");
  const isLoading = status === "LOADING";
  const mutate = async (body: TBody) => {
    setStatus("LOADING");
    console.log(JSON.stringify(body));
    let newUrl = url;
    if (url && url.includes("{podcast_id}") && "podcast_id" in body) {
      newUrl = url.replace("{podcast_id}", body.podcast_id as string);
    } else {
      console.warn(
        "URL does not contain {podcast_id} or body does not have podcast_id"
      );
    }
    if (useQuery) {
      newUrl += `?${new URLSearchParams(
        body as Record<string, string>
      ).toString()}`;
    }
    try {
      const token = await getToken();
      const response = await fetch(newUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Assuming token is stored in localStorage
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log("Data received: ", data);
      console.log("Data set: ", data, "response OK?", response.ok);
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
    }
  };
  return { result, error, isLoading, status, mutate };
}
