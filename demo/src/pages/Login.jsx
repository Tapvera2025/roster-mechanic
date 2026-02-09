import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Lock, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate login delay
    setTimeout(() => {
      // Check credentials - Admin login
      if (formData.username === "admin" && formData.password === "adminpass123") {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", "admin");
        navigate("/dashboard");
      }
      // Employee/User login
      else if (formData.username === "user" && formData.password === "userpass123") {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", "user");
        navigate("/user/roster");
      } else {
        // Failed login
        setError("Invalid username or password");
        setIsLoading(false);
      }
    }, 500);
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
    <div className="min-h-screen flex items-center justify-center bg-[hsl(220,15%,8%)] px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[hsl(220,15%,14%)] rounded-3xl shadow-xl border border-[hsl(220,15%,20%)] p-6 sm:p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl mb-4 shadow-lg">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2">
              Roster Mechanic
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
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
                  className="h-4 w-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,16%)] text-orange-500 focus:ring-orange-500"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-gray-300"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="font-medium text-orange-500 hover:text-orange-400 transition-colors"
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
          <div className="mt-6 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <p className="text-xs font-semibold text-orange-400 mb-2">Demo Credentials:</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-orange-300">Admin Portal:</p>
                <p className="text-xs text-gray-400">Username: admin | Password: adminpass123</p>
              </div>
              <div>
                <p className="text-xs font-medium text-orange-300">Employee Portal:</p>
                <p className="text-xs text-gray-400">Username: user | Password: userpass123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
