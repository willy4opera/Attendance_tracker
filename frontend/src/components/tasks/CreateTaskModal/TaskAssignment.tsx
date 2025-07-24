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
  // Function to get user initials
  const getUserInitials = (user: User) => {
    const firstInitial = user.firstName?.charAt(0).toUpperCase() || ''
    const lastInitial = user.lastName?.charAt(0).toUpperCase() || ''
    return firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || '?'
  }

  // Function to generate color based on user ID
  const getUserColor = (userId: number) => {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899']
    return colors[userId % colors.length]
  }

  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <UserGroupIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Assignment
      </h4>

      <div className="space-y-4">
        {/* Assign to Users */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
            Assign to Users
          </label>
          <div 
            className="rounded-xl border-2 transition-all duration-200"
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
              {selectedUsers.map(user => (
                <div 
                  key={user.id}
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
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${user.profilePicture ? 'hidden' : ''}`}
                      style={{ backgroundColor: getUserColor(user.id) }}
                    >
                      {getUserInitials(user)}
                    </div>
                  </div>
                  
                  {/* User Name */}
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: theme.colors.secondary }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs opacity-70" style={{ color: theme.colors.secondary }}>
                      {user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign to Departments */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
            Assign to Departments
          </label>
          <div 
            className="rounded-xl border-2 transition-all duration-200"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9'
            }}
          >
            <DepartmentSelector
              selectedDepartments={selectedDepartments}
              onChange={onDepartmentsChange}
              placeholder="Select departments..."
            />
          </div>
        </div>

        {/* Assignment Summary */}
        {(selectedUsers.length > 0 || selectedDepartments.length > 0) && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.primary + '10' }}>
            <p className="text-xs font-medium mb-2" style={{ color: theme.colors.secondary }}>
              Assignment Summary
            </p>
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 mb-1">
                <UserCircleIcon className="h-4 w-4" style={{ color: theme.colors.secondary + 'cc' }} />
                <p className="text-xs" style={{ color: theme.colors.secondary + 'cc' }}>
                  <span className="font-medium">{selectedUsers.length}</span> user{selectedUsers.length !== 1 ? 's' : ''} assigned
                </p>
              </div>
            )}
            {selectedDepartments.length > 0 && (
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" style={{ color: theme.colors.secondary + 'cc' }} />
                <p className="text-xs" style={{ color: theme.colors.secondary + 'cc' }}>
                  <span className="font-medium">{selectedDepartments.length}</span> department{selectedDepartments.length !== 1 ? 's' : ''} assigned
                </p>
              </div>
            )}
            
            {/* Show profile pictures in summary */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {selectedUsers.slice(0, 5).map((user, index) => (
                  <div 
                    key={user.id}
                    className="relative"
                    style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-6 h-6 rounded-full object-cover border-2 border-white"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white ${user.profilePicture ? 'hidden' : ''}`}
                      style={{ backgroundColor: getUserColor(user.id) }}
                    >
                      {getUserInitials(user)}
                    </div>
                  </div>
                ))}
                {selectedUsers.length > 5 && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white"
                    style={{ 
                      backgroundColor: theme.colors.secondary,
                      marginLeft: '-8px'
                    }}
                  >
                    +{selectedUsers.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskAssignment
