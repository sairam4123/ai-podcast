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
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-sm glass-panel p-8 space-y-6">
                <div className="text-center">
                    <h1 className="font-heading text-2xl font-bold text-white">
                        Welcome back
                    </h1>
                    <p className="text-cyan-300/70 text-sm mt-1">
                        Sign in to your account
                    </p>
                </div>

                <form className="space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-cyan-200 mb-1"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            placeholder="Enter your username"
                            className="w-full px-4 py-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-white placeholder-cyan-600/50 focus:border-cyan-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-cyan-200 mb-1"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-white placeholder-cyan-600/50 focus:border-cyan-400 transition-colors"
                        />
                    </div>

                    <div className="text-center space-y-2 pt-2">
                        <p className="text-sm text-cyan-300/60">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-cyan-400 hover:underline">
                                Register
                            </Link>
                        </p>
                        <a
                            href="/forgot-password"
                            className="text-sm text-cyan-400/60 hover:text-cyan-300"
                        >
                            Forgot password?
                        </a>
                    </div>

                    <Button
                        type="submit"
                        isLoading={loginMutation.isLoading}
                        onClick={handleSubmit}
                        className="w-full"
                    >
                        Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
}