import { Link, useNavigate } from "react-router";
import { api } from "../api/api";
import Button from "../@components/Button";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const registerMutation = api.useUserRegister({
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        if (data.length === 0) {
          toast.error("Registration failed. Please try again.");
          return;
        }
        if ("emsg" in data[0]) {
          toast.error(data[0].emsg as string);
          return;
        }
      }

      toast.success("Registration successful!", { duration: 8000 });
      toast.success("Check your email for verification!", { duration: 8000 });
      navigate("/login");
    },
    onFailure: (error) => {
      toast.error("Registration failed: " + error.message);
      console.error("Error registering user", error);
    },
  });

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      toast.error("Passwords do not match.");
      return;
    }

    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm glass-panel p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-white">
            Create account
          </h1>
          <p className="text-cyan-300/70 text-sm mt-1">
            Join Podolli.AI today
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-cyan-200 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-white placeholder-cyan-600/50 focus:border-cyan-400 transition-colors"
            />
          </div>

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
              placeholder="Choose a username"
              className="w-full px-4 py-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-white placeholder-cyan-600/50 focus:border-cyan-400 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-cyan-200 mb-1"
            >
              Display Name
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              required
              placeholder="Your display name"
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-cyan-200 mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-white placeholder-cyan-600/50 focus:border-cyan-400 transition-colors"
            />
          </div>

          <p className="text-sm text-cyan-300/60 text-center pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:underline">
              Sign in
            </Link>
          </p>

          <Button
            type="submit"
            isLoading={registerMutation.isLoading}
            onClick={handleSubmit}
            className="w-full"
          >
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}
