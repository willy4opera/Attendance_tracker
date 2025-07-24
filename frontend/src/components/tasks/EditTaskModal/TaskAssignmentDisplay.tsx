import React, { useState } from 'react';
import { UserGroupIcon, BuildingOfficeIcon, PencilIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { User, Department } from '../../../types';
import theme from '../../../config/theme';
import userService from '../../../services/userService';
import { toast } from 'react-toastify';

interface TaskAssignmentDisplayProps {
  assignedUsers: User[];
  assignedDepartments: Department[];
  onEditUsers: () => void;
  onEditDepartments: () => void;
  onUpdateAssignedUsers?: (users: User[]) => void;
  boardId?: string;
}

const TaskAssignmentDisplay: React.FC<TaskAssignmentDisplayProps> = ({
  assignedUsers,
  assignedDepartments,
  onEditUsers,
  onEditDepartments,
  onUpdateAssignedUsers,
  boardId
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUserClick = async () => {
    setIsAddingUser(true);
    setLoading(true);
    try {
      // Fetch all users to show in dropdown
      const response = await userService.getAllUsers({ limit: 100 });
      // Filter out already assigned users
      const assignedUserIds = assignedUsers.map(u => u.id);
      const available = response.users.filter(user => !assignedUserIds.includes(user.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    if (!selectedUserId || !onUpdateAssignedUsers) return;

    const userToAdd = availableUsers.find(u => u.id === selectedUserId);
    if (userToAdd) {
      const updatedUsers = [...assignedUsers, userToAdd];
      onUpdateAssignedUsers(updatedUsers);
      toast.success(`${userToAdd.firstName} ${userToAdd.lastName} assigned to task`);
      setIsAddingUser(false);
      setSelectedUserId('');
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (!onUpdateAssignedUsers) return;
    
    const userToRemove = assignedUsers.find(u => u.id === userId);
    const updatedUsers = assignedUsers.filter(u => u.id !== userId);
    onUpdateAssignedUsers(updatedUsers);
    
    if (userToRemove) {
      toast.success(`${userToRemove.firstName} ${userToRemove.lastName} removed from task`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Assigned Users Section */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
            <h4 className="font-medium" style={{ color: theme.colors.secondary }}>
              Assigned Users ({assignedUsers.length})
            </h4>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddUserClick}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Add user"
            >
              <PlusIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
            </button>
            <button
              type="button"
              onClick={onEditUsers}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Edit assigned users"
            >
              <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
            </button>
          </div>
        </div>
        
        {assignedUsers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {assignedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border group"
                style={{ borderColor: theme.colors.border }}
              >
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.firstName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                )}
                <span className="text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-gray-500">({user.role})</span>
                {onUpdateAssignedUsers && (
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.id)}
                    className="ml-1 p-0.5 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove user"
                  >
                    <XMarkIcon className="h-3 w-3 text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No users assigned</p>
        )}

        {/* Add User Dropdown */}
        {isAddingUser && (
          <div className="mt-3 flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
              style={{ borderColor: theme.colors.border }}
              disabled={loading}
            >
              <option value="">Select a user...</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddUser}
              disabled={!selectedUserId}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingUser(false);
                setSelectedUserId('');
              }}
              className="px-3 py-1.5 border rounded-lg text-sm"
              style={{ borderColor: theme.colors.border }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Assigned Departments Section */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
            <h4 className="font-medium" style={{ color: theme.colors.secondary }}>
              Assigned Departments ({assignedDepartments.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={onEditDepartments}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            title="Edit assigned departments"
          >
            <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
          </button>
        </div>
        
        {assignedDepartments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {assignedDepartments.map((dept) => (
              <div
                key={dept.id}
                className="px-3 py-1.5 bg-white rounded-lg border"
                style={{ borderColor: theme.colors.border }}
              >
                <span className="text-sm font-medium">{dept.name}</span>
                <span className="text-xs text-gray-500 ml-1">({dept.code})</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No departments assigned</p>
        )}
      </div>
    </div>
  );
};

export default TaskAssignmentDisplay;
