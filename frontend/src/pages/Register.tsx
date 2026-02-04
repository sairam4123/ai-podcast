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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-sm glass-panel p-9 space-y-6 bg-surface/30 border-tertiary/20">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl font-bold text-tertiary-foreground">
            Create account
          </h1>
          <p className="text-tertiary text-sm">
            Join Podolli.AI today
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-tertiary"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-surface border border-tertiary/20 text-tertiary-foreground placeholder-tertiary/60 focus:border-primary/50 transition-colors"
            />
          </div>

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
              placeholder="Choose a username"
              className="w-full px-4 py-3 rounded-lg bg-surface border border-tertiary/20 text-tertiary-foreground placeholder-tertiary/60 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-tertiary"
            >
              Display Name
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              required
              placeholder="Your display name"
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

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-tertiary"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-surface border border-tertiary/20 text-tertiary-foreground placeholder-tertiary/60 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="text-center space-y-3 pt-3">
            <Button
              type="submit"
              isLoading={registerMutation.isLoading}
              onClick={handleSubmit}
              className="w-full"
            >
              Create Account
            </Button>

            <p className="text-sm text-tertiary">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:text-primary-foreground font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
