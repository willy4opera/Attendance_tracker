import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  UserIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { User } from '../services/userService';
import userService from '../services/userService';
import theme from '../config/theme';

interface UserSelectionProps {
  selectedUsers: User[];
  onUsersChange: (users: User[]) => void;
  maxUsers?: number;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  selectedUsers,
  onUsersChange,
  maxUsers
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const getDepartmentName = (department: string | { id: string; name: string; code: string } | undefined): string | undefined => {
    if (!department) return undefined;
    if (typeof department === "string") return department;
    return department.name;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        setUsers(response.users);
        setFilteredUsers(response.users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDepartmentName(user.department)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const isUserSelected = (user: User) => {
    return selectedUsers.some(selected => selected.id === user.id);
  };

  const handleUserToggle = (user: User) => {
    if (isUserSelected(user)) {
      // Remove user
      onUsersChange(selectedUsers.filter(selected => selected.id !== user.id));
    } else {
      // Add user (if not at max limit)
      if (!maxUsers || selectedUsers.length < maxUsers) {
        onUsersChange([...selectedUsers, user]);
      }
    }
  };

  const removeSelectedUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(user => user.id !== userId));
  };

  const getProfilePicture = (user: User) => {
    // Use a more reliable placeholder service or implement actual profile pictures
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=random&color=fff&size=128`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#ef4444';
      case 'moderator':
        return '#f59e0b';
      default:
        return '#6b7280';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all"
          style={{ focusRingColor: theme.colors.primary }}
        />
      </div>

      {/* Selected Users Summary */}
      {selectedUsers.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              Selected Members ({selectedUsers.length}{maxUsers ? `/${maxUsers}` : ''})
            </h4>
            <button
              onClick={() => onUsersChange([])}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border"
              >
                <img
                  src={getProfilePicture(user)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={() => removeSelectedUser(user.id)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User List */}
      <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No users found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const selected = isUserSelected(user);
              const canSelect = !maxUsers || selectedUsers.length < maxUsers || selected;
              
              return (
                <div
                  key={user.id}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                    selected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => canSelect && handleUserToggle(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Profile Picture */}
                      <div className="relative">
                        <img
                          src={getProfilePicture(user)}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                        {user.status === 'inactive' && (
                          <div className="absolute inset-0 bg-gray-500 bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        {user.department && (
                          <p className="text-xs text-gray-500 truncate">{getDepartmentName(user.department)}</p>
                        )}
                        {user.lastLogin && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last active: {new Date(user.lastLogin).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="flex items-center">
                      {user.status === 'inactive' && (
                        <span className="text-xs text-red-500 mr-2">Inactive</span>
                      )}
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {selected && <CheckIcon className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Max Users Warning */}
      {maxUsers && selectedUsers.length >= maxUsers && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Maximum number of users ({maxUsers}) selected. Remove some users to add others.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserSelection;
