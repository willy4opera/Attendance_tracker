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
  AiOutlineEye,
  AiOutlineMenu,
  AiOutlineClose
} from 'react-icons/ai'
import { FaUserShield, FaUserCog, FaUser } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import api from '../../services/api'
import departmentService from "../../services/departmentService"
import type { Department } from "../../types"
import { useAuth } from '../../contexts/useAuth'
import notify from '../../utils/notifications'
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
  const getDepartmentName = (department: string | { id: number; name: string; code: string } | undefined): string | undefined => {
    if (!department) return undefined;
    if (typeof department === "string") return department;
    return department.name;
  };

  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    departmentId: '',
    isActive: '',
    isEmailVerified: ''
  })

  // Check if mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true)
      const response = await departmentService.getAllDepartments({
        isActive: true,
        limit: 1000 // Get all departments
      })
      setDepartments(response.departments)
    } catch (error) {
      notify.toast.error('Failed to fetch departments')
      console.error('Error fetching departments:', error)
    } finally {
      setDepartmentsLoading(false)
    }
  }, [])

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
      notify.toast.error('Failed to fetch users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

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
      const result = await notify.alert.confirm(
        'Change User Role?',
        `Change user role to ${newRole}?`
      )
      
      if (result.isConfirmed) {
        await api.patch(`/users/${userId}/role`, { role: newRole })
        notify.toast.success('User role updated successfully')
        fetchUsers()
      }
    } catch (error) {
      notify.toast.error('Failed to update user role')
    }
  }

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      const result = await notify.alert.confirm(
        `${isActive ? 'Activate' : 'Deactivate'} User?`,
        `Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`
      )
      
      if (result.isConfirmed) {
        await api.patch(`/users/${userId}/status`, { isActive })
        notify.toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
        fetchUsers()
      }
    } catch (error) {
      notify.toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    await notify.actions.deleteWithFeedback(
      'User',
      async () => {
        await api.delete(`/users/${userId}`)
      },
      'User deleted successfully',
      'Failed to delete user'
    )
    fetchUsers()
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      notify.toast.info('Please select users first')
      return
    }

    try {
      switch (action) {
        case 'activate':
          await notify.actions.actionWithFeedback(
            'Activate Users?',
            `Activate ${selectedUsers.length} selected users?`,
            async () => {
              await api.post('/users/bulk-update', {
                userIds: selectedUsers,
                updates: { isActive: true }
              })
            },
            'Users activated successfully'
          )
          break
        case 'deactivate':
          await notify.actions.actionWithFeedback(
            'Deactivate Users?',
            `Deactivate ${selectedUsers.length} selected users?`,
            async () => {
              await api.post('/users/bulk-update', {
                userIds: selectedUsers,
                updates: { isActive: false }
              })
            },
            'Users deactivated successfully'
          )
          break
        case 'delete':
          await notify.actions.batchOperationWithFeedback(
            'Delete Selected Users?',
            selectedUsers,
            async (userId) => {
              await api.delete(`/users/${userId}`)
            },
            'Users deleted successfully'
          )
          break
      }
      setSelectedUsers([])
      fetchUsers()
    } catch (error) {
      notify.toast.error('Bulk action failed')
    }
  }

  const handleExport = async () => {
    try {
      notify.alert.loading('Exporting Users', 'Please wait while we prepare your export...')
      
      const response = await api.get('/users/export?format=csv', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      notify.alert.closeLoading()
      notify.toast.success('Users exported successfully')
    } catch (error) {
      notify.alert.closeLoading()
      notify.toast.error('Failed to export users')
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

  // Mobile Card Component
  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            {getRoleIcon(user.role)}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-xs text-gray-500">ID: {user.id}</p>
          </div>
        </div>
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
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-xs text-gray-600">
          <AiOutlineMail className="mr-1" />
          {user.email}
          {user.isEmailVerified && (
            <MdVerified className="ml-1 text-green-500" title="Email Verified" />
          )}
        </div>
        
        {user.phoneNumber && (
          <div className="flex items-center text-xs text-gray-600">
            <AiOutlinePhone className="mr-1" />
            {user.phoneNumber}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>
        
        <button
          onClick={() => handleToggleStatus(user.id, !user.isActive)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            user.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? (
            <>
              <AiOutlineCheckCircle />
              Active
            </>
          ) : (
            <>
              <AiOutlineCloseCircle />
              Inactive
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {getDepartmentName(user.department) || 'No Department'}
        </span>
        
        <div className="flex items-center space-x-2">
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
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-3 sm:mb-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">User Management</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">Total Users: {totalUsers}</p>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                <AiOutlineDownload className="text-lg" />
                <span className="hidden lg:inline">Export</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
              >
                <AiOutlineUserAdd className="text-lg" />
                <span className="hidden lg:inline">Add User</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-300"
              >
                {showMobileMenu ? <AiOutlineClose /> : <AiOutlineMenu />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="mt-4 pt-4 border-t border-gray-200 sm:hidden">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleExport()
                    setShowMobileMenu(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  <AiOutlineDownload />
                  Export
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(true)
                    setShowMobileMenu(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                >
                  <AiOutlineUserAdd />
                  Add User
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-4 sm:space-y-6">
          {/* Filters and Search */}
          <div className="p-3 sm:p-4 lg:p-6 rounded-lg bg-white shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <form onSubmit={handleSearch} className="flex-1 mb-3 sm:mb-0 sm:max-w-md">
                <div className="relative">
                  <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: theme.colors.primary,
                      color: theme.colors.secondary
                    }}
                  />
                </div>
              </form>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                <AiOutlineFilter />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-4 pt-4 border-t">
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: theme.colors.primary }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>

                <select
                  value={filters.departmentId}
                  onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: theme.colors.primary }}
                  disabled={departmentsLoading}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: theme.colors.primary }}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>

                <select
                  value={filters.isEmailVerified}
                  onChange={(e) => setFilters({ ...filters, isEmailVerified: e.target.value })}
                  className="px-3 py-2 rounded-lg border text-sm"
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
                  className="px-3 sm:px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white shadow rounded-lg">
              <span className="text-sm font-medium">{selectedUsers.length} users selected</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-green-100 text-green-700 hover:bg-green-200"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32 sm:h-64">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2" 
                  style={{ borderColor: theme.colors.primary }}
                />
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                {isMobile ? (
                  <div className="p-4 space-y-4">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <UserCard key={user.id} user={user} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No users found
                      </div>
                    )}
                  </div>
                ) : (
                  /* Desktop Table */
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 lg:px-6 py-3 text-left">
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
                          <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Contact
                          </th>
                          <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Department
                          </th>
                          <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
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
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {getRoleIcon(user.role)}
                                </div>
                                <div className="ml-3 lg:ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500 sm:hidden">
                                    {user.email}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {user.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <AiOutlineMail className="text-gray-400" />
                                  <span className="truncate max-w-32 lg:max-w-none">{user.email}</span>
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
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={user.id === currentUser?.id}
                                className={`text-xs lg:text-sm px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}
                              >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                              <span className="text-sm">
                                {getDepartmentName(user.department) || 'No Department'}
                              </span>
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleStatus(user.id, !user.isActive)}
                                className={`flex items-center gap-1 text-xs lg:text-sm px-2 py-1 rounded-full ${
                                  user.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {user.isActive ? (
                                  <>
                                    <AiOutlineCheckCircle />
                                    <span className="hidden lg:inline">Active</span>
                                  </>
                                ) : (
                                  <>
                                    <AiOutlineCloseCircle />
                                    <span className="hidden lg:inline">Inactive</span>
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-1 lg:gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowDetailsModal(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                >
                                  <AiOutlineEye className="text-base lg:text-lg" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowEditModal(true)
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit User"
                                >
                                  <AiOutlineEdit className="text-base lg:text-lg" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={user.id === currentUser?.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  title="Delete User"
                                >
                                  <AiOutlineDelete className="text-base lg:text-lg" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
              <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1 text-sm rounded-lg border disabled:opacity-50"
                  style={{ borderColor: theme.colors.primary }}
                >
                  Previous
                </button>
                
                {/* Page numbers - simplified for mobile */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                    const page = currentPage - (isMobile ? 1 : 2) + i
                    if (page < 1 || page > totalPages) return null
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-1 text-sm rounded-lg ${
                          page === currentPage
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                        style={{
                          backgroundColor: page === currentPage ? theme.colors.primary : 'transparent',
                          border: `1px solid ${theme.colors.primary}`
                        }}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1 text-sm rounded-lg border disabled:opacity-50"
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
              departments={departments}
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
              departments={departments}
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
      </div>
    </div>
  )
}
