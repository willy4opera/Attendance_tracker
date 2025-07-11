import { useAuth } from '../../contexts/useAuth';
import React, { useEffect, useState, useRef } from 'react';
import { 
  AiOutlineUser, 
  AiOutlineMail, 
  AiOutlinePhone, 
  AiOutlineIdcard,
  AiOutlineCalendar,
  AiOutlineEdit,
  AiOutlineSave,
  AiOutlineClose,
  AiOutlineLock,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineCamera,
  AiOutlineUpload
} from 'react-icons/ai';
import { FaUserShield, FaUserCog, FaUser } from 'react-icons/fa';
import { MdVerified, MdDepartureBoard } from 'react-icons/md';
import api from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toastHelpers';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  role: 'admin' | 'moderator' | 'user';
  department?: {
    id: number;
    name: string;
    code: string;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  stats?: {
    totalAttendance: number;
    attendanceRate: number;
    totalSessions: number;
    recentActivity: Array<{
      date: string;
      action: string;
    }>;
  };
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log("Fetching profile...");
      const response = await api.get('/users/profile');
      console.log("Profile response:", response.data);
      const profileData = response.data.data;
      console.log("Profile data:", profileData);
      console.log("Profile picture URL:", profileData.profilePicture);
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber || ''  
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toastError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const response = await api.put('/users/profile', formData);
      setProfile(response.data.data);
      setIsEditing(false);
      toastSuccess('Profile updated successfully');
    } catch (error) {
      toastError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toastError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toastError('Password must be at least 6 characters');
      return;
    }

    try {
      setUpdating(true);
      await api.patch('/users/updatePassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toastSuccess('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toastError('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toastError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('avatar', file);

      // Upload the avatar - this endpoint also updates the user profile
      const response = await api.post('/files/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update local profile state with the new profile picture
      if (response.data.data.profilePicture) {
        setProfile(prev => prev ? {...prev, profilePicture: response.data.data.profilePicture} : prev);
      }
      
      toastSuccess('Profile picture updated successfully');
    } catch (error) {
      toastError('Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-red-500 text-xl" />;
      case 'moderator':
        return <FaUserCog className="text-yellow-500 text-xl" />;
      default:
        return <FaUser className="text-gray-500 text-xl" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-yellow-100 text-yellow-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  // Helper function to get full image URL
  // Helper function to get full image URL
  // Helper function to get full image URL
  // Helper function to get full image URL
  // Helper function to get full image URL with logging
  const getImageUrl = (url: string | undefined) => {
    console.log("getImageUrl called with:", url);
    
    if (!url) {
      console.log("No URL provided, returning empty string");
      return "";
    }
    
    // If it's already a full URL, return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      console.log("URL is already full, returning as-is:", url);
      return url;
    }
    
    // Return the URL as-is (relative) so it goes through the Vite proxy
    // This avoids mixed content issues when serving over HTTPS
    console.log("Returning relative URL for proxy:", url);
    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 lg:px-8 py-4 lg:py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account information and settings</p>
            </div>
            {getRoleIcon(profile.role)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {profile.profilePicture ? (
                    <img 
                      src={getImageUrl(profile.profilePicture)} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                      onLoad={(e) => {
                        console.log("Image loaded successfully!");
                        console.log("Image natural dimensions:", e.currentTarget.naturalWidth, "x", e.currentTarget.naturalHeight);
                      }}
                      onError={(e) => {
                        console.error("Image failed to load!");
                        console.error("Image src attempted:", e.currentTarget.src);
                        console.error("Error event:", e);
                        // Fallback to default icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gray-200 rounded-full flex items-center justify-center ${profile.profilePicture ? 'hidden' : ''}`}>
                    <AiOutlineUser className="text-4xl text-gray-600" />
                  </div>
                  
                  {/* Upload button overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
                    disabled={uploadingPhoto}
                    title="Change profile picture"
                  >
                    {uploadingPhoto ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <AiOutlineCamera className="text-sm" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                
                <h3 className="text-xl font-semibold">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-gray-600">{profile.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(profile.role)}`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`flex items-center gap-1 ${profile.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.isActive ? <AiOutlineCheckCircle /> : <AiOutlineCloseCircle />}
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Email Verified</span>
                  <span className={`flex items-center gap-1 ${profile.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {profile.isEmailVerified && <MdVerified />}
                    {profile.isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {profile.department && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium">{profile.department.name}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              {profile.stats && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Sessions</span>
                      <span className="font-medium">{profile.stats.totalSessions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Attendance Rate</span>
                      <span className="font-medium">{profile.stats.attendanceRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <AiOutlineEdit />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          firstName: profile.firstName,
                          lastName: profile.lastName,
                          phoneNumber: profile.phoneNumber || ''
                        });
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <AiOutlineClose />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                        {profile.email}
                        {profile.isEmailVerified && <MdVerified className="text-green-500" />}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {profile.phoneNumber || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <AiOutlineSave />
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">User ID</span>
                  <span className="font-medium">{profile.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Created</span>
                  <span className="font-medium">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {profile.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Login</span>
                    <span className="font-medium">
                      {new Date(profile.lastLogin).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Security</h3>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <AiOutlineLock />
                    Change Password
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-600">
                  We recommend changing your password regularly to keep your account secure.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
