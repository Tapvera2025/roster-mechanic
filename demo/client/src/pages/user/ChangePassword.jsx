import { useState } from "react";
import { Lock, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { userApi } from "../../lib/api";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Old password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await userApi.changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      toast.success("Password changed successfully");
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const message = err.response?.data?.message || "Failed to change password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[hsl(220,15%,8%)]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(220,15%,20%)] bg-[hsl(220,15%,12%)]">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-gray-400" />
          <h1 className="text-lg font-semibold text-gray-100">Change Password</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-100">Update your password</h2>
              <p className="text-sm text-gray-400 mt-1">
                Enter your current password and choose a new one.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Old Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="oldPassword"
                    name="oldPassword"
                    type="password"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter current password"
                  />
                </div>
                {errors.oldPassword && (
                  <p className="text-red-400 text-xs">{errors.oldPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter new password"
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-red-400 text-xs">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Confirm new password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </form>
          </div>

          {/* Password Requirements */}
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <h3 className="text-sm font-medium text-orange-400 mb-2">Password Requirements</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>- Minimum 6 characters</li>
              <li>- Mix of letters and numbers recommended</li>
              <li>- Avoid using common passwords</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
