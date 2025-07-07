import React, { useState, useEffect } from 'react'
import { AiOutlineClose, AiOutlineMail, AiOutlinePhone, AiOutlineCalendar, AiOutlineClockCircle } from 'react-icons/ai'
import { FaUserShield, FaUserCog, FaUser } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import api from '../../services/api'
import theme from '../../config/theme'

interface UserDetailsModalProps {
  userId: number
  onClose: () => void
}

interface UserDetails {
  id: number
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: string
  department?: {
    id: number
    name: string
    code: string
  }
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  projects: Array<{
    id: number
    name: string
    status: string
    UserProject: {
      role: string
      joinedAt: string
    }
  }>
  stats?: {
    attendance: {
      total: number
      present: number
      late: number
      absent: number
      rate: string
    }
    projects: {
      total: number
      active: number
      asLead: number
    }
    tasks: {
      assigned: number
      completed: number
      completionRate: string
    }
    activity: {
      lastLogin: string
      accountAge: number
    }
  }
}

export default function UserDetailsModal({ userId, onClose }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/users/${userId}?includeFullStats=true`)
      setUser(response.data.data)
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-red-500 text-3xl" />
      case 'moderator':
        return <FaUserCog className="text-yellow-500 text-3xl" />
      default:
        return <FaUser className="text-gray-500 text-3xl" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
            style={{ borderColor: theme.colors.primary }}
          />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: theme.colors.secondary }}>
            User Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <AiOutlineClose className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          {/* User Header */}
          <div className="flex items-start gap-6 mb-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                {getRoleIcon(user.role)}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold" style={{ color: theme.colors.secondary }}>
                {user.firstName} {user.lastName}
              </h3>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <AiOutlineMail className="text-gray-400" />
                  <span>{user.email}</span>
                  {user.isEmailVerified && (
                    <MdVerified className="text-green-500" title="Email Verified" />
                  )}
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <AiOutlinePhone className="text-gray-400" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                {user.department && (
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {user.department.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          {user.stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2" style={{ color: theme.colors.secondary }}>
                  Attendance
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Sessions:</span>
                    <span className="font-medium">{user.stats.attendance.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Present:</span>
                    <span className="font-medium text-green-600">{user.stats.attendance.present}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late:</span>
                    <span className="font-medium text-yellow-600">{user.stats.attendance.late}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Absent:</span>
                    <span className="font-medium text-red-600">{user.stats.attendance.absent}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex justify-between">
                      <span>Attendance Rate:</span>
                      <span className="font-bold">{user.stats.attendance.rate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2" style={{ color: theme.colors.secondary }}>
                  Projects
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Projects:</span>
                    <span className="font-medium">{user.stats.projects.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <span className="font-medium text-green-600">{user.stats.projects.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>As Lead:</span>
                    <span className="font-medium text-blue-600">{user.stats.projects.asLead}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2" style={{ color: theme.colors.secondary }}>
                  Tasks
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Assigned:</span>
                    <span className="font-medium">{user.stats.tasks.assigned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-medium text-green-600">{user.stats.tasks.completed}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-bold">{user.stats.tasks.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projects List */}
          {user.projects && user.projects.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>
                Projects ({user.projects.length})
              </h4>
              <div className="space-y-2">
                {user.projects.map((project) => (
                  <div key={project.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-medium">{project.name}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Role: <span className="font-medium">{project.UserProject.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Information */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>
              Activity Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <AiOutlineCalendar className="text-gray-400" />
                <span>Created: {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <AiOutlineClockCircle className="text-gray-400" />
                <span>Updated: {formatDate(user.updatedAt)}</span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center gap-2">
                  <AiOutlineClockCircle className="text-gray-400" />
                  <span>Last Login: {formatDate(user.lastLogin)}</span>
                </div>
              )}
              {user.stats?.activity.accountAge !== undefined && (
                <div className="flex items-center gap-2">
                  <AiOutlineCalendar className="text-gray-400" />
                  <span>Account Age: {user.stats.activity.accountAge} days</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-3 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: theme.colors.primary,
              color: theme.colors.secondary
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
