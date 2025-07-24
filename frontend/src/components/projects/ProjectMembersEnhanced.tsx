import React, { useState, useEffect } from 'react'
import { UserPlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import type { ProjectMember } from '../../types'
import { ProjectRole } from '../../types'
import { useProjectMembers } from '../../hooks/useProjectMembers'
import userService from '../../services/userService'
import { useProjectStatistics } from '../../hooks/useProjectStatistics'
import theme from '../../config/theme'
import api from '../../services/api'

interface ProjectMembersEnhancedProps {
  projectId: number
  members: ProjectMember[]
  projectManagerId?: number
  onMembersUpdate?: () => void
}

interface TaskMember {
  user_id: number
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  profile_picture?: string | null
  role: ProjectRole
  department_name?: string
  assigned_tasks?: string
  completed_tasks?: string
  in_progress_tasks?: string
  todo_tasks?: string
  boards_involved?: string
  completion_rate?: string
}

export function ProjectMembersEnhanced({ 
  projectId, 
  members: initialMembers, 
  projectManagerId,
  onMembersUpdate 
}: ProjectMembersEnhancedProps) {
  const [members, setMembers] = useState<any[]>(initialMembers)
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<ProjectRole>(ProjectRole.MEMBER)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  
  const { addMember, removeMember, updateMemberRole, loading } = useProjectMembers(projectId)
  const { statistics } = useProjectStatistics()

  useEffect(() => {
    const fetchTaskMembers = async () => {
      try {
        const response = await api.get(`/projects/${projectId}/task-members`)
        if (response.data && response.data.data) {
          setTaskMembers(response.data.data.members || [])
        }
      } catch (error) {
        console.error('Failed to fetch task members:', error)
      }
    }

    fetchTaskMembers()
  }, [projectId])

  useEffect(() => {
    // Merge task members with initial members
    const taskMemberMap = new Map()
    const initialMemberMap = new Map()
    
    // Add task members to map
    taskMembers.forEach(member => {
      taskMemberMap.set(member.user_id, {
        ...member,
        userId: member.user_id,
        user: {
          firstName: member.first_name,
          lastName: member.last_name,
          email: member.email,
          profilePicture: member.profile_picture
        }
      })
    })
    
    // Add initial members to map
    initialMembers.forEach(member => {
      initialMemberMap.set(member.userId, member)
    })
    
    // Merge both maps, preferring task member data for profile pictures
    const mergedMembers = [...initialMemberMap.values()].map(member => {
      const taskMember = taskMemberMap.get(member.userId)
      if (taskMember) {
        return {
          ...member,
          ...taskMember,
          user: {
            ...member.user,
            profilePicture: taskMember.user.profilePicture || member.user?.profilePicture
          }
        }
      }
      return member
    })
    
    // Add any task members not in initial members
    taskMemberMap.forEach((member, userId) => {
      if (!initialMemberMap.has(userId)) {
        mergedMembers.push(member)
      }
    })
    
    setMembers(mergedMembers)
  }, [initialMembers, taskMembers])

  useEffect(() => {
    fetchAvailableUsers()
  }, [members])

  const fetchAvailableUsers = async () => {
    try {
      const response = await userService.getAllUsers({ 
        page: 1, 
        limit: 100 
      })
      // Filter out users who are already members
      const memberUserIds = members.map(m => m.userId || m.user_id)
      const available = response.users.filter((user: any) => !memberUserIds.includes(user.id))
      setAvailableUsers(available)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    try {
      const newMember = await addMember(Number(selectedUserId), selectedRole)
      setMembers([...members, newMember])
      setShowAddMember(false)
      setSelectedUserId('')
      setSelectedRole(ProjectRole.MEMBER)
      onMembersUpdate?.()
    } catch (error) {
      console.error('Failed to add member:', error)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (userId === projectManagerId) {
      alert('Cannot remove the project manager')
      return
    }

    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(userId)
        setMembers(members.filter(m => (m.userId || m.user_id) !== userId))
        onMembersUpdate?.()
      } catch (error) {
        console.error('Failed to remove member:', error)
      }
    }
  }

  const handleUpdateRole = async (userId: number, newRole: ProjectRole) => {
    if (userId === projectManagerId && newRole !== ProjectRole.LEAD) {
      alert('Project manager must remain as lead')
      return
    }

    try {
      await updateMemberRole(userId, newRole)
      setMembers(members.map(m => 
        (m.userId || m.user_id) === userId ? { ...m, role: newRole } : m
      ))
      setEditingMember(null)
      onMembersUpdate?.()
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const getRoleBadgeColor = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.LEAD:
        return {
          bg: theme.colors.primary + '20',
          text: theme.colors.primary,
          border: theme.colors.primary
        }
      case ProjectRole.MEMBER:
        return {
          bg: theme.colors.success + '20',
          text: theme.colors.success,
          border: theme.colors.success
        }
      case ProjectRole.VIEWER:
        return {
          bg: theme.colors.secondary + '20',
          text: theme.colors.secondary,
          border: theme.colors.secondary
        }
      default:
        return {
          bg: '#f3f4f6',
          text: '#6b7280',
          border: '#e5e7eb'
        }
    }
  }

  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
    const email = user.email.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })

  const getInitials = (member: any) => {
    const firstName = member.first_name || member.user?.firstName || member.user?.first_name || ''
    const lastName = member.last_name || member.user?.lastName || member.user?.last_name || ''
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '??'
  }

  const getProfilePicture = (member: any) => {
    return member.profile_picture || member.user?.profilePicture || null
  }

  // Get actual member count from statistics
  const projectStats = statistics?.projectLevelStats?.find(stat => stat.project_id === projectId)
  const actualMemberCount = projectStats ? parseInt(projectStats.member_count) : members.length

  return (
    <div 
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300" 
      style={{ 
        background: `linear-gradient(135deg, ${theme.colors.background.paper} 0%, ${theme.colors.background.default} 100%)`,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
          Team Members ({actualMemberCount})
        </h3>
        <button
          onClick={() => setShowAddMember(true)}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-button-primary shadow-md hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.primary,
            color: 'white',
            transform: 'translateY(0)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primaryDark
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <UserPlusIcon className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member, index) => {
          const userId = member.userId || member.user_id
          const fullName = member.first_name 
            ? `${member.first_name} ${member.last_name || ''}` 
            : member.user 
              ? `${member.user.firstName || member.user.first_name || ''} ${member.user.lastName || member.user.last_name || ''}`
              : 'Unknown User'
          const email = member.email || member.user?.email || ''
          const roleColors = getRoleBadgeColor(member.role)
          const isProjectManager = userId === projectManagerId
          const profilePicture = getProfilePicture(member)

          return (
            <div
              key={`member-${userId}-${index}`}
              className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background.default + '50'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt={fullName}
                      className="w-12 h-12 rounded-full object-cover shadow-inner"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const initials = document.createElement('div')
                          initials.className = 'w-12 h-12 rounded-full flex items-center justify-center font-medium shadow-inner'
                          initials.style.backgroundColor = theme.colors.primary + '30'
                          initials.style.color = theme.colors.primary
                          initials.style.fontSize = '14px'
                          initials.textContent = getInitials(member)
                          parent.appendChild(initials)
                        }
                      }}
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-medium shadow-inner"
                      style={{ 
                        backgroundColor: theme.colors.primary + '30',
                        color: theme.colors.primary,
                        fontSize: '14px'
                      }}
                    >
                      {getInitials(member)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: theme.colors.text.primary }}>
                        {fullName}
                      </p>
                      {isProjectManager && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: theme.colors.warning + '20',
                            color: theme.colors.warning
                          }}
                        >
                          Project Manager
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                      {email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {editingMember === `${userId}` ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(userId, e.target.value as ProjectRole)}
                      onBlur={() => setEditingMember(null)}
                      className="px-3 py-1.5 rounded-lg border text-sm focus:ring-2"
                      style={{ 
                        borderColor: theme.colors.border,
                        focusRingColor: theme.colors.primary
                      }}
                      autoFocus
                    >
                      <option value={ProjectRole.LEAD}>Lead</option>
                      <option value={ProjectRole.MEMBER}>Member</option>
                      <option value={ProjectRole.VIEWER}>Viewer</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium capitalize transition-all duration-200"
                        style={{ 
                          backgroundColor: roleColors.bg,
                          color: roleColors.text,
                          border: `1px solid ${roleColors.border}`
                        }}
                      >
                        {member.role}
                      </span>
                      {!isProjectManager && (
                        <button
                          onClick={() => setEditingMember(`${userId}`)}
                          className="p-1.5 rounded-lg transition-all duration-200 hover:shadow-md"
                          style={{ 
                            color: theme.colors.text.secondary,
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.background.paper
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {!isProjectManager && (
                    <button
                      onClick={() => handleRemoveMember(userId)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:shadow-md"
                      style={{ 
                        color: theme.colors.error,
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.error + '10'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      disabled={loading}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            style={{ backgroundColor: theme.colors.background.paper }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
              Add Team Member
            </h3>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-200"
                  style={{ 
                    borderColor: theme.colors.border,
                    focusRingColor: theme.colors.primary
                  }}
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2" 
                   style={{ borderColor: theme.colors.border }}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedUserId === String(user.id) ? 'ring-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: selectedUserId === String(user.id) 
                          ? theme.colors.primary + '10' 
                          : 'transparent',
                        ringColor: theme.colors.primary
                      }}
                    >
                      <input
                        type="radio"
                        name="user"
                        value={user.id}
                        checked={selectedUserId === String(user.id)}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="text-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: theme.colors.text.primary }}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                          {user.email}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-center py-4" style={{ color: theme.colors.text.secondary }}>
                    No available users found
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-200"
                  style={{ 
                    borderColor: theme.colors.border,
                    focusRingColor: theme.colors.primary
                  }}
                >
                  <option value={ProjectRole.MEMBER}>Member</option>
                  <option value={ProjectRole.LEAD}>Lead</option>
                  <option value={ProjectRole.VIEWER}>Viewer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMember(false)
                  setSelectedUserId('')
                  setSearchQuery('')
                }}
                className="flex-1 px-4 py-2 border rounded-lg transition-all duration-200"
                style={{ 
                  borderColor: theme.colors.border,
                  color: theme.colors.text.secondary
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || loading}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  opacity: !selectedUserId || loading ? 0.5 : 1
                }}
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
