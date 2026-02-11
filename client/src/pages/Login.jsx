import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { userApi } from "../lib/api";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the real authentication API
      const response = await userApi.login({
        email: formData.email,
        password: formData.password,
      });

      // Store token and user data
      const { token, user } = response.data.data;

      // Store in auth store (this persists to localStorage automatically via zustand persist)
      setAuth(user, token);

      // Also store in localStorage for backward compatibility
      localStorage.setItem("token", token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", user.role.toLowerCase());
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userEmail", user.email);

      toast.success("Login successful!");

      // Navigate based on role
      if (user.role === "ADMIN" || user.role === "MANAGER") {
        navigate("/dashboard");
      } else {
        navigate("/user/roster");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid email or password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--color-background))] px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[hsl(var(--color-card))] rounded-2xl shadow-xl border border-[hsl(var(--color-border))] p-6 sm:p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))] rounded-2xl mb-4 shadow-lg">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--color-foreground))] mb-2">
              Roster Mechanic
            </h1>
            <p className="text-[hsl(var(--color-foreground-secondary))] text-sm sm:text-base">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[hsl(var(--color-error-soft))] border border-[hsl(var(--color-error))] text-[hsl(var(--color-error))] px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[hsl(var(--color-border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-[hsl(var(--color-foreground-secondary))]"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="font-medium text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-[hsl(var(--color-surface-elevated))] rounded-xl border border-[hsl(var(--color-border))]">
            <p className="text-xs font-semibold text-[hsl(var(--color-foreground))] mb-2">Login with your account:</p>
            <p className="text-xs text-[hsl(var(--color-foreground-secondary))]">Enter your registered email and password to sign in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
