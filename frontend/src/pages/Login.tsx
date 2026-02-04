import toast from "react-hot-toast";
import Button from "../@components/Button";
import useUserLogin from "../api/userLogin";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router";

export default function Login() {
    const navigate = useNavigate();
    const loginMutation = useUserLogin({
        onSuccess: (data) => {
            if (Array.isArray(data)) {
                if (data.length === 0) {
                    toast.error("Login failed. Please check your credentials.");
                    return;
                }
                if ("emsg" in data[0]) {
                    toast.error(data[0].emsg as string);
                    return;
                }
            }

            toast.success("Login successful!", { duration: 5000 });

            supabase.auth.setSession(data.session).then(({ error }) => {
                if (error) {
                    console.error("Error setting session", error);
                } else {
                    navigate("/");
                }
            });
        },
        onFailure: (error) => {
            toast.error("Login failed. Please check your credentials.");
            console.error("Error logging in", error);
        },
    });

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest("form") as HTMLFormElement;
        const formData = new FormData(form);
        const data = {
            user_name: formData.get("username") as string,
            password: formData.get("password") as string,
        };
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="w-full max-w-sm glass-panel p-10 space-y-8 bg-surface/30 border-tertiary/20">
                <div className="text-center space-y-2">
                    <h1 className="font-heading text-3xl font-bold text-tertiary-foreground">
                        Welcome back
                    </h1>
                    <p className="text-tertiary text-sm">
                        Sign in to your account
                    </p>
                </div>

                <form className="space-y-5">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-tertiary"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            placeholder="Enter your username"
                            className="w-full px-4 py-3 rounded-lg bg-surface border border-tertiary/20 text-tertiary-foreground placeholder-tertiary/60 focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-tertiary"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-lg bg-surface border border-tertiary/20 text-tertiary-foreground placeholder-tertiary/60 focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div className="text-center space-y-3 pt-3">
                        <Button
                            type="submit"
                            isLoading={loginMutation.isLoading}
                            onClick={handleSubmit}
                            className="w-full"
                        >
                            Sign In
                        </Button>

                        <div className="flex flex-col gap-2 pt-2">
                            <p className="text-sm text-tertiary">
                                Don't have an account?{" "}
                                <Link to="/register" className="text-primary hover:text-primary-foreground font-medium hover:underline">
                                    Register
                                </Link>
                            </p>
                            <a
                                href="/forgot-password"
                                className="text-xs text-tertiary/70 hover:text-tertiary"
                            >
                                Forgot password?
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}