import useMutation from "../lib/useMutation";
import { API_URL } from "./api";
import { Session } from "@supabase/supabase-js"

export default function useUserLogin({
    onSuccess,
    onFailure,
}: {
    onSuccess?: (data: { success: boolean; message: string, session: Session }) => void;
    onFailure?: (error: Error) => void;
}) {
    const { mutate, result, isLoading, error } = useMutation<
        { success: boolean; message: string; session: Session },
        { user_name: string; password: string }
    >({
        url: API_URL + "/login",
        method: "POST",
        onSuccess: (data) => {
            onSuccess?.(data);
            console.log("Login successful", data);
        },
        onFailure: (error) => {
            onFailure?.(error as Error);
            console.error("Error logging in", error);
        },
    });

    return {
        mutate,
        result,
        isLoading,
        error,
    };
}