import React, { useState, useEffect, useCallback } from 'react'
import { 
  AiOutlineUserAdd, 
  AiOutlineSearch, 
  AiOutlineEdit, 
  AiOutlineDelete,
  AiOutlineDownload,
  AiOutlineFilter,
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineEye
} from 'react-icons/ai'
import { FaUserShield, FaUserCog, FaUser } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import api from '../../services/api'
import { useAuth } from '../../contexts/useAuth'
import { toastSuccess, toastError, toastInfo } from '../../utils/toastHelpers'
import theme from '../../config/theme'
import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'
import UserDetailsModal from './UserDetailsModal'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: 'admin' | 'moderator' | 'user'
  department?: {
    id: number
    name: string
    code: string
  }
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: string
  createdAt: string
  stats?: {
    projectCount: number
    attendanceRate: number
  }
}

interface UserFilters {
  search: string
  role: string
  departmentId: string
  isActive: string
  isEmailVerified: string
}

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    departmentId: '',
    isActive: '',
    isEmailVerified: ''
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        includeStats: 'true',
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      })

      // Add filters
      if (filters.search) params.append('search', filters.search)
      if (filters.role && filters.role !== 'all') params.append('role', filters.role)
      if (filters.departmentId) params.append('departmentId', filters.departmentId)
      if (filters.isActive) params.append('isActive', filters.isActive)
      if (filters.isEmailVerified) params.append('isEmailVerified', filters.isEmailVerified)

      const response = await api.get(`/users?${params}`)
      setUsers(response.data.data.users)
      setTotalUsers(response.data.data.total)
      setTotalPages(response.data.data.totalPages)
    } catch (error) {
      toastError('Failed to fetch users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole })
      toastSuccess('User role updated successfully')
      fetchUsers()
    } catch (error) {
      toastError('Failed to update user role')
    }
  }

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      await api.patch(`/users/${userId}/status`, { isActive })
      toastSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      toastError('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await api.delete(`/users/${userId}`)
      toastSuccess('User deleted successfully')
      fetchUsers()
    } catch (error) {
      toastError('Failed to delete user')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toastInfo('Please select users first')
      return
    }

    try {
      switch (action) {
        case 'activate':
          await api.post('/users/bulk-update', {
            userIds: selectedUsers,
            updates: { isActive: true }
          })
          toastSuccess('Users activated successfully')
          break
        case 'deactivate':
          await api.post('/users/bulk-update', {
            userIds: selectedUsers,
            updates: { isActive: false }
          })
          toastSuccess('Users deactivated successfully')
          break
        case 'delete':
          if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return
          for (const userId of selectedUsers) {
            await api.delete(`/users/${userId}`)
          }
          toastSuccess('Users deleted successfully')
          break
      }
      setSelectedUsers([])
      fetchUsers()
    } catch (error) {
      toastError('Bulk action failed')
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/users/export?format=csv', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users_${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toastSuccess('Users exported successfully')
    } catch (error) {
      toastError('Failed to export users')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-red-500" />
      case 'moderator':
        return <FaUserCog className="text-yellow-500" />
      default:
        return <FaUser className="text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.secondary }}>
            User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.secondary }}>
            Total Users: {totalUsers}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.background.paper,
              color: theme.colors.secondary,
              border: `1px solid ${theme.colors.primary}`
            }}
          >
            <AiOutlineDownload className="text-lg" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.secondary
            }}
          >
            <AiOutlineUserAdd className="text-lg" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex items-center justify-between mb-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{
                  borderColor: theme.colors.primary,
                  color: theme.colors.secondary
                }}
              />
            </div>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.secondary
            }}
          >
            <AiOutlineFilter />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-3 py-2 rounded-lg border"
              style={{ borderColor: theme.colors.primary }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>

            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="px-3 py-2 rounded-lg border"
              style={{ borderColor: theme.colors.primary }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              value={filters.isEmailVerified}
              onChange={(e) => setFilters({ ...filters, isEmailVerified: e.target.value })}
              className="px-3 py-2 rounded-lg border"
              style={{ borderColor: theme.colors.primary }}
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <button
              onClick={() => {
                setFilters({
                  search: '',
                  role: 'all',
                  departmentId: '',
                  isActive: '',
                  isEmailVerified: ''
                })
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: theme.colors.primary }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.background.paper }}>
          <span className="text-sm font-medium">{selectedUsers.length} users selected</span>
          <button
            onClick={() => handleBulkAction('activate')}
            className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200"
          >
            Activate
          </button>
          <button
            onClick={() => handleBulkAction('deactivate')}
            className="px-3 py-1 text-sm rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          >
            Deactivate
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedUsers([])}
            className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: theme.colors.background.paper }}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
              style={{ borderColor: theme.colors.primary }}
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(u => u.id))
                      } else {
                        setSelectedUsers([])
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <AiOutlineMail className="text-gray-400" />
                        {user.email}
                        {user.isEmailVerified && (
                          <MdVerified className="text-green-500" title="Email Verified" />
                        )}
                      </div>
                      {user.phoneNumber && (
                        <div className="flex items-center gap-1 mt-1">
                          <AiOutlinePhone className="text-gray-400" />
                          {user.phoneNumber}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === currentUser?.id}
                      className={`text-sm px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">
                      {user.department?.name || 'No Department'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleToggleStatus(user.id, !user.isActive)}
                        className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <AiOutlineCheckCircle /> Active
                          </>
                        ) : (
                          <>
                            <AiOutlineCloseCircle /> Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.stats && (
                      <div>
                        <div>Projects: {user.stats.projectCount}</div>
                        <div>Attendance: {user.stats.attendanceRate}%</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <AiOutlineEye className="text-lg" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit User"
                      >
                        <AiOutlineEdit className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete User"
                      >
                        <AiOutlineDelete className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: theme.colors.secondary }}>
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border disabled:opacity-50"
              style={{ borderColor: theme.colors.primary }}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage - 2 + i
              if (page < 1 || page > totalPages) return null
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg ${
                    page === currentPage
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor: page === currentPage ? theme.colors.primary : 'transparent',
                    color: page === currentPage ? theme.colors.secondary : theme.colors.secondary,
                    border: `1px solid ${theme.colors.primary}`
                  }}
                >
                  {page}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border disabled:opacity-50"
              style={{ borderColor: theme.colors.primary }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchUsers()
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedUser(null)
            fetchUsers()
          }}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          userId={selectedUser.id}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}
