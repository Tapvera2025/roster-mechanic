import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, LogOut, Edit2, X, Check, Calendar, KeyRound } from "lucide-react";
import { userApi } from "../../lib/api";
import toast from "react-hot-toast";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile();
      setProfile(response.data.data);
      setFormData({ name: response.data.data.name, email: response.data.data.email });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await userApi.updateProfile(formData);
      setProfile(response.data.data);
      setIsEditing(false);
      toast.success("Profile updated successfully");
      if (formData.name) localStorage.setItem("userName", formData.name);
      if (formData.email) localStorage.setItem("userEmail", formData.email);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: profile.name, email: profile.email });
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
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--color-foreground))]">My Profile</h1>
          <p className="mt-1 text-sm text-[hsl(var(--color-foreground-secondary))]">
            Manage your account information and settings
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-xl overflow-hidden shadow-sm">

          {/* Profile Header Banner */}
          <div className="bg-gradient-to-r from-[hsl(var(--color-primary))] to-orange-600 px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-white">
                  <h2 className="text-xl sm:text-2xl font-bold">{profile?.name}</h2>
                  <p className="text-white/80 text-sm sm:text-base mt-0.5">{roleInfo.title}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30 font-medium text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-6">
            <div className="space-y-6">

              {/* Name */}
              <div>
                <label className="flex items-center text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-2">
                  <User className="w-4 h-4 mr-2 text-[hsl(var(--color-primary))]" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-[hsl(var(--color-foreground))] text-base sm:text-lg font-medium bg-[hsl(var(--color-surface-elevated))] px-4 py-2.5 rounded-lg border border-[hsl(var(--color-border))]">
                    {profile?.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-2">
                  <Mail className="w-4 h-4 mr-2 text-[hsl(var(--color-primary))]" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-[hsl(var(--color-foreground))] text-base sm:text-lg font-medium bg-[hsl(var(--color-surface-elevated))] px-4 py-2.5 rounded-lg border border-[hsl(var(--color-border))]">
                    {profile?.email}
                  </p>
                )}
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="flex items-center text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-2">
                  <Shield className="w-4 h-4 mr-2 text-[hsl(var(--color-primary))]" />
                  Role
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
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[hsl(var(--color-border))]">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[hsl(var(--color-primary))] text-white rounded-lg hover:bg-[hsl(var(--color-primary-hover))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] border border-[hsl(var(--color-border))] rounded-lg hover:bg-[hsl(var(--color-card))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="px-6 py-4 bg-[hsl(var(--color-surface-elevated))] border-t border-[hsl(var(--color-border))]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-xl px-6 py-5 shadow-sm">
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

        {/* Quick Actions */}
        <div className="mt-6 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-xl px-6 py-5 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--color-foreground))] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/user/change-password")}
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
