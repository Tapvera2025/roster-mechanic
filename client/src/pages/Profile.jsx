import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, LogOut, Edit2, X, Check, Calendar } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
          {/* Profile Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <span className="text-blue-600 text-3xl font-bold">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-white">
                  <h2 className="text-3xl font-bold">{profile?.name}</h2>
                  <p className="text-blue-100 text-lg mt-1">
                    {profile?.role === "ADMIN" ? "Administrator" :
                     profile?.role === "MANAGER" ? "Manager" : "Employee"}
                  </p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-md font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-8 py-8">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-xl">
                    {profile?.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <Mail className="w-5 h-5 mr-2 text-blue-500" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-xl">
                    {profile?.email}
                  </p>
                )}
              </div>

              {/* Role Field (Read-only) */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <Shield className="w-5 h-5 mr-2 text-blue-500" />
                  Role & Permissions
                </label>
                <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl">
                  <p className="text-blue-900 text-lg font-medium">
                    {profile?.role === "ADMIN" ? "Administrator" :
                     profile?.role === "MANAGER" ? "Manager" : "Employee"}
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    {profile?.role === "ADMIN" ? "Full system access and control" :
                     profile?.role === "MANAGER" ? "Manage employees and schedules" :
                     "View schedules and clock in/out"}
                  </p>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
                  >
                    <Check className="w-5 h-5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="mt-6 bg-white shadow-lg rounded-2xl px-8 py-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 px-4 py-3 rounded-xl">
              <span className="text-sm font-medium text-gray-500">Account Created</span>
              <p className="text-gray-900 font-semibold mt-1">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-xl">
              <span className="text-sm font-medium text-gray-500">Last Login</span>
              <p className="text-gray-900 font-semibold mt-1">
                {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Settings Card */}
        <div className="mt-6 bg-white shadow-lg rounded-2xl px-8 py-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/user/change-password")}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-700 font-medium"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
