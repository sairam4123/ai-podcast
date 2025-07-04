import { Link, useNavigate } from "react-router";
import { api } from "../api/api";
import Button from "../@components/Button";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const registerMutation = api.useUserRegister({
    onSuccess: (data) => {
      console.log("Registration successful", data);

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

      toast.success("Registration successful!", {
        duration: 8000,
      });
      toast.success("Check your email for verification link!", {
        duration: 8000,
      });
      navigate("/login"); // Redirect to login page after successful registration
    },
    onFailure: (error) => {
      toast.error(
        "Registration failed. Please try again. Error: " + error.message
      );
      console.error("Error registering user", error);
      // Handle registration error, e.g., show an error message
    },
  });

  return (
    <div className="h-screen items-center justify-center flex flex-col min-h-screen bg-radial from-sky-700 to-blue-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Register</h2>
        <form className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              name="username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700"
            >
              Display Name
            </label>
            <input
              type="text"
              name="full_name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="*******"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Confirm your password"
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Got an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login!
            </Link>
          </p>
          <Button
            type="submit"
            isLoading={registerMutation.isLoading}
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest("form") as HTMLFormElement;
              const formData = new FormData(form);
              const data = {
                email: formData.get("email") as string,
                user_name: formData.get("username") as string,
                full_name: formData.get("full_name") as string,
                password: formData.get("password") as string,
                confirm_password: formData.get("confirmPassword") as string,
              };

              if (
                !data.email ||
                !data.user_name ||
                !data.full_name ||
                !data.password ||
                !data.confirm_password
              ) {
                toast.error("Please fill in all fields.");
                return;
              }

              if (data.password !== data.confirm_password) {
                toast.error("Passwords do not match. Please try again.");
                return;
              }

              console.log("Creating podcast with data:", data);
              registerMutation.mutate(data);
              // Handle login logic here
              console.log("Login form submitted");
            }}
            className="w-full py-2 px-4 mt-8 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <p className="flex items-center mx-auto uppercase justify-center">
              Register
            </p>
          </Button>
        </form>
      </div>
    </div>
  );
}
