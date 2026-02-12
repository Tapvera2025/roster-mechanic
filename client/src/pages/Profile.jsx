import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, LogOut, Edit2, X, Check, Calendar, KeyRound } from "lucide-react";
import { userApi } from "../lib/api";
import toast from "react-hot-toast";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile();
      setProfile(response.data.data);
      setFormData({
        name: response.data.data.name,
        email: response.data.data.email
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await userApi.updateProfile(formData);
      setProfile(response.data.data);
      setIsEditing(false);
      toast.success("Profile updated successfully");

      // Update localStorage with new user info
      if (formData.name) {
        localStorage.setItem("userName", formData.name);
      }
      if (formData.email) {
        localStorage.setItem("userEmail", formData.email);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--color-background))]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--color-primary))]"></div>
      </div>
    );
  }

  const getRoleDisplay = (role) => {
    switch(role) {
      case "ADMIN": return { title: "Administrator", desc: "Full system access and control" };
      case "MANAGER": return { title: "Manager", desc: "Manage employees and schedules" };
      default: return { title: "Employee", desc: "View schedules and clock in/out" };
    }
  };

  const roleInfo = getRoleDisplay(profile?.role);

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--color-foreground))]">Profile Settings</h1>
          <p className="mt-1 text-sm text-[hsl(var(--color-foreground-secondary))]">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-xl overflow-hidden shadow-sm">
          {/* Profile Header with Gradient */}
          <div className="bg-gradient-to-r from-[hsl(var(--color-primary))] to-orange-600 px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4 sm:space-x-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <span className="text-white text-2xl sm:text-3xl font-bold">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl sm:text-3xl font-bold">{profile?.name}</h2>
                  <p className="text-white/80 text-base sm:text-lg mt-1">
                    {roleInfo.title}
                  </p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30 font-medium text-sm sm:text-base"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="flex items-center text-sm font-semibold text-[hsl(var(--color-foreground-secondary))] mb-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[hsl(var(--color-primary))]" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-[hsl(var(--color-foreground))] text-base sm:text-lg font-medium bg-[hsl(var(--color-surface-elevated))] px-4 py-2.5 sm:py-3 rounded-lg border border-[hsl(var(--color-border))]">
                    {profile?.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="flex items-center text-sm font-semibold text-[hsl(var(--color-foreground-secondary))] mb-2">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[hsl(var(--color-primary))]" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 sm:py-3 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent outline-none transition-all text-sm sm:text-base"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-[hsl(var(--color-foreground))] text-base sm:text-lg font-medium bg-[hsl(var(--color-surface-elevated))] px-4 py-2.5 sm:py-3 rounded-lg border border-[hsl(var(--color-border))]">
                    {profile?.email}
                  </p>
                )}
              </div>

              {/* Role Field (Read-only) */}
              <div>
                <label className="flex items-center text-sm font-semibold text-[hsl(var(--color-foreground-secondary))] mb-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[hsl(var(--color-primary))]" />
                  Role & Permissions
                </label>
                <div className="bg-[hsl(var(--color-primary))]/10 border border-[hsl(var(--color-primary))]/20 px-4 py-3 rounded-lg">
                  <p className="text-[hsl(var(--color-foreground))] text-base sm:text-lg font-medium">
                    {roleInfo.title}
                  </p>
                  <p className="text-[hsl(var(--color-foreground-secondary))] text-xs sm:text-sm mt-1">
                    {roleInfo.desc}
                  </p>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[hsl(var(--color-border))]">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-[hsl(var(--color-primary))] text-white rounded-lg hover:bg-[hsl(var(--color-primary-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-sm sm:text-base"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] border border-[hsl(var(--color-border))] rounded-lg hover:bg-[hsl(var(--color-card))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <div className="px-6 sm:px-8 py-4 sm:py-5 bg-[hsl(var(--color-surface-elevated))] border-t border-[hsl(var(--color-border))]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 font-semibold transition-colors text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="mt-6 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-xl px-6 sm:px-8 py-5 sm:py-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--color-foreground))] mb-4 flex items-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[hsl(var(--color-primary))]" />
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] px-4 py-3 rounded-lg">
              <span className="text-xs sm:text-sm font-medium text-[hsl(var(--color-foreground-secondary))]">Account Created</span>
              <p className="text-[hsl(var(--color-foreground))] font-semibold mt-1 text-sm sm:text-base">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </p>
            </div>
            <div className="bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] px-4 py-3 rounded-lg">
              <span className="text-xs sm:text-sm font-medium text-[hsl(var(--color-foreground-secondary))]">Last Login</span>
              <p className="text-[hsl(var(--color-foreground))] font-semibold mt-1 text-sm sm:text-base">
                {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="mt-6 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-xl px-6 sm:px-8 py-5 sm:py-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--color-foreground))] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/change-password")}
              className="w-full text-left px-4 py-3 bg-[hsl(var(--color-surface-elevated))] hover:bg-[hsl(var(--color-surface-elevated))]/80 border border-[hsl(var(--color-border))] rounded-lg transition-colors text-[hsl(var(--color-foreground))] font-medium flex items-center gap-3 text-sm sm:text-base"
            >
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-primary))]" />
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
