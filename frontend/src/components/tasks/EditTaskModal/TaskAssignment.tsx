import React from 'react'
import { UserGroupIcon, BuildingOfficeIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { MultiUserSelector } from '../../common/MultiUserSelector'
import { DepartmentSelector } from '../../common/DepartmentSelector'
import theme from '../../../config/theme'
import type { User, Department } from '../../../types'

interface TaskAssignmentProps {
  selectedUsers: User[]
  selectedDepartments: Department[]
  onUsersChange: (users: User[]) => void
  onDepartmentsChange: (departments: Department[]) => void
}

const TaskAssignment: React.FC<TaskAssignmentProps> = ({
  selectedUsers,
  selectedDepartments,
  onUsersChange,
  onDepartmentsChange
}) => {
  // Debug log to see user structure
  console.log('Selected users in TaskAssignment:', selectedUsers)

  // Function to get user initials
  const getUserInitials = (user: User) => {
    const firstInitial = user.firstName?.charAt(0).toUpperCase() || ''
    const lastInitial = user.lastName?.charAt(0).toUpperCase() || ''
    return firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || '?'
  }

  // Function to get user display name
  const getUserDisplayName = (user: User) => {
    // Try different combinations to get a display name
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user.name) {
      return user.name
    }
    if (user.username) {
      return user.username
    }
    if (user.email) {
      return user.email
    }
    return 'Unknown User'
  }

  // Function to generate color based on user ID
  const getUserColor = (userId: any) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#48DBFB', '#A29BFE', '#FD79A8'
    ]
    const id = typeof userId === 'string' ? parseInt(userId) || 0 : userId || 0
    return colors[id % colors.length]
  }

  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <UserGroupIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Assignment
      </h4>
      
      <div className="space-y-4">
        {/* User Assignment */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <UserGroupIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Assign to Users
          </label>
          <div 
            className="rounded-xl border-2 p-1" 
            style={{ 
              borderColor: theme.colors.primary, 
              backgroundColor: '#d9d9d9' 
            }}
          >
            <MultiUserSelector
              selectedUsers={selectedUsers}
              onChange={onUsersChange}
              placeholder="Select users..."
              maxHeight="200px"
            />
          </div>

          {/* Display selected users with profile pictures */}
          {selectedUsers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {selectedUsers.map((user, index) => {
                const userId = user.id || user._id || `user-${index}`
                return (
                  <div 
                    key={userId}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: theme.colors.primary + '10',
                      border: `1px solid ${theme.colors.primary}30`
                    }}
                  >
                    {/* Profile Picture or Initials */}
                    <div className="relative">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={getUserDisplayName(user)} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: getUserColor(user.id) }}
                        >
                          {getUserInitials(user)}
                        </div>
                      )}
                      {/* Status indicator */}
                      <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                        {getUserDisplayName(user)}
                      </p>
                      {user.role && (
                        <p className="text-xs" style={{ color: theme.colors.secondary + '80' }}>
                          {user.role}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Department Assignment */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <BuildingOfficeIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Assign to Departments
          </label>
          <div 
            className="rounded-xl border-2 p-1" 
            style={{ 
              borderColor: theme.colors.primary, 
              backgroundColor: '#d9d9d9' 
            }}
          >
            <DepartmentSelector
              selectedDepartments={selectedDepartments}
              onChange={onDepartmentsChange}
              placeholder="Select departments..."
              maxHeight="200px"
            />
          </div>

          {/* Display selected departments */}
          {selectedDepartments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedDepartments.map((dept, index) => {
                const deptId = dept.id || `dept-${index}`
                return (
                  <span 
                    key={deptId}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: `${theme.colors.primary}10`,
                      color: theme.colors.secondary
                    }}
                  >
                    {dept.name}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskAssignment
