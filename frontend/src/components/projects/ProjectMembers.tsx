import React, { useState } from 'react'
import type { ProjectMember } from '../../types'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ProjectMembersProps {
  projectId: string
}

export const ProjectMembers: React.FC<ProjectMembersProps> = ({ projectId }) => {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for now - would be replaced with actual API call
  const mockMembers: ProjectMember[] = [
    {
      id: '1',
      projectId,
      userId: '1',
      role: 'owner',
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        profilePicture: undefined
      },
      joinedAt: new Date().toISOString()
    },
    {
      id: '2',
      projectId,
      userId: '2',
      role: 'admin',
      user: {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        profilePicture: undefined
      },
      joinedAt: new Date().toISOString()
    }
  ]

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Member
        </button>
      </div>

      <div className="space-y-4">
        {mockMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.user.profilePicture ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={member.user.profilePicture}
                    alt={`${member.user.firstName} ${member.user.lastName}`}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {getInitials(member.user.firstName, member.user.lastName)}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.user.firstName} {member.user.lastName}
                </p>
                <p className="text-sm text-gray-500">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Role Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>

              {/* Remove Button (only show for non-owners) */}
              {member.role !== 'owner' && (
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => {
                    // Handle remove member
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {mockMembers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No team members yet.</p>
          <button className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add First Member
          </button>
        </div>
      )}
    </div>
  )
}

export default ProjectMembers
