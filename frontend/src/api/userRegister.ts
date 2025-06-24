import useMutation from "../lib/useMutation";
import { API_URL } from "./api";

export default function useUserRegister({
    onSuccess,
    onFailure
}: {
    onSuccess?: (data: { success: boolean; message: string }) => void;
    onFailure?: (error: Error) => void;
}) {

    const { mutate, result, isLoading, error } = useMutation<
        { success: boolean; message: string },
        { user_name: string; password: string; email: string, full_name: string }>({
            url: `${API_URL}/register`,
            method: "POST",
            onSuccess: (data) => {
                onSuccess?.(data);
                console.log("Registration successful", data);
            },
            onFailure: (error) => {
                onFailure?.(error as Error);
                console.error("Error registering user", error);
            }
        })

    return {
        mutate,
        result,
        isLoading,
        error,
    }


}