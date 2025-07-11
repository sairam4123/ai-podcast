import toast from "react-hot-toast";
import Button from "../@components/Button";
import useUserLogin from "../api/userLogin";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router";

export default function Login() {

    const navigate = useNavigate();
    const loginMutation = useUserLogin({
        onSuccess: (data) => {
            console.log("Login successful", data);
            if (Array.isArray(data)) {
                if (data.length === 0) {
                    toast.error("Login failed. Please check your credentials and try again.");
                    return;
                }
                if ("emsg" in data[0]) {
                    toast.error(data[0].emsg as string);
                    return;
                }
            }

            toast.success("Login successful!", {
                duration: 5000,
            });

            // Handle successful login, e.g., redirect to dashboard
            supabase.auth.setSession(data.session).then(({ error }) => {
                if (error) {
                    console.error("Error setting session", error);
                } else {
                    console.log("Session set successfully");
                    // Redirect to dashboard or perform other actions
                    navigate('/') // Adjust the redirect path as needed
                }
            }
            );
        },
        onFailure: (error) => {
            toast.error("Login failed. Please check your credentials and try again.");
            console.error("Error logging in", error);
            // Handle login error, e.g., show an error message
        },
    });

    return (
        <div className="h-screen items-center justify-center flex flex-col min-h-screen bg-radial from-sky-950 to-black">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center">Login</h2>
            <form>
            <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input
                type="text"
                name="username"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter your username"
                />
            </div>
            <div className="mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                type="password"
                name="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="*******"
                />
            </div>
            <p className="flex flex-col items-center justify-center text-sm text-gray-600 my-2 mb-4 gap-2">
            <p className="text-sm text-gray-600 text-center">
                Don't have an account? <Link to='/register' className="text-blue-600 hover:underline">Register Now!</Link>
            </p>
            <p className="text-sm text-gray-600 text-center">
                <a href="/forgot-password" className="text-blue-600 hover:underline">Forgot Password? No problem!</a>
            </p>
            </p>
            <Button
                type="submit"
                isLoading={loginMutation.isLoading}
                onClick={(e) => {
                e.preventDefault();            
                const form = e.currentTarget.closest('form') as HTMLFormElement;
                const formData = new FormData(form);
                const data = {
                    user_name: formData.get('username') as string,
                    password: formData.get('password') as string,
                };
                console.log("Creating podcast with data:", data);
                loginMutation.mutate(data);
                // Handle login logic here
                console.log("Login form submitted");
                }}
                className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                   <p className="flex items-center uppercase mx-auto justify-center">
                    Login
                    </p> 
            </Button>
            </form>
            
        </div>
        </div>
    );
}