import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from '../../hooks/useDebounce';
import { requestDeduplicator } from '../../utils/requestDeduplicator';
import { cachedRequest } from '../../utils/apiCache';
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
import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'
import UserDetailsModal from './UserDetailsModal'
import { formatDate } from '../../utils/dateUtils'
import notify from '../../utils/notify'

interface User {
  id: number
  email: string
  profile: {
    firstName: string
    lastName: string
    phoneNumber: string
    position: string
    profilePicture: string | null
  }
  role: string
  department: {
    id: number
    name: string
  }
  departmentId: number
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  lastLogin: string | null
}

const UserManagement: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [departmentsLoading, setDepartmentsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [itemsPerPage] = useState(10)
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    role: '',
    departmentId: '',
    isActive: '',
    isEmailVerified: ''
  })

  // Optimization: Debounced search and fetch tracking
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const fetchUsersInProgress = useRef(false);
  const initialLoadComplete = useRef(false);

  // Check if mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Optimized fetch departments with caching
  const fetchDepartments = useCallback(async () => {
    try {
      setDepartmentsLoading(true)
      const departments = await cachedRequest(
        'user-management-departments',
        async () => {
          const response = await departmentService.getAllDepartments({
            isActive: true,
            limit: 1000
          })
          return response.departments
        },
        5 * 60 * 1000 // Cache for 5 minutes
      )
      setDepartments(departments)
    } catch (error) {
      notify.toast.error('Failed to fetch departments')
    } finally {
      setDepartmentsLoading(false)
    }
  }, [])

  // Optimized fetch users with deduplication
  const fetchUsers = useCallback(async () => {
    if (fetchUsersInProgress.current) {
      console.log('Fetch already in progress, skipping...')
      return
    }
    
    fetchUsersInProgress.current = true
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        includeStats: 'true',
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      })

      if (searchQuery) params.append('search', searchQuery)
      if (filters.role) params.append('role', filters.role)
      if (filters.departmentId) params.append('departmentId', filters.departmentId)
      if (filters.isActive) params.append('isActive', filters.isActive)
      if (filters.isEmailVerified) params.append('isEmailVerified', filters.isEmailVerified)

      const response = await requestDeduplicator.deduplicate(
        `users-${params.toString()}`,
        () => api.get(`/users?${params}`)
      )
      
      setUsers(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setTotalUsers(response.data.pagination?.total || 0)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      notify.toast.error(error.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
      fetchUsersInProgress.current = false
    }
  }, [currentPage, searchQuery, filters, itemsPerPage])

  // Initial load - only once
  useEffect(() => {
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true
      Promise.all([
        fetchDepartments(),
        fetchUsers()
      ])
    }
  }, [])

  // Handle debounced search
  useEffect(() => {
    if (initialLoadComplete.current && debouncedSearchQuery !== searchQuery) {
      setCurrentPage(1)
    }
  }, [debouncedSearchQuery])

  // Fetch users when search or filters change
  useEffect(() => {
    if (initialLoadComplete.current) {
      fetchUsers()
    }
  }, [debouncedSearchQuery, filters, currentPage])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by the debounced effect
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
    } catch (error: any) {
      notify.toast.error(error.response?.data?.message || 'Failed to update role')
    }
  }

  const handleStatusChange = async (userId: number, isActive: boolean) => {
    try {
      const result = await notify.alert.confirm(
        isActive ? 'Activate User?' : 'Deactivate User?',
        `${isActive ? 'Activate' : 'Deactivate'} this user account?`
      )
      
      if (result.isConfirmed) {
        await api.patch(`/users/${userId}/status`, { isActive })
        notify.toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
        fetchUsers()
      }
    } catch (error: any) {
      notify.toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDelete = async (userId: number) => {
    try {
      const result = await notify.alert.confirm(
        'Delete User?',
        'This action cannot be undone. Are you sure?'
      )
      
      if (result.isConfirmed) {
        await api.delete(`/users/${userId}`)
        notify.toast.success('User deleted successfully')
        
        // If deleting last item on page, go back
        if (users.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
        
        fetchUsers()
      }
    } catch (error: any) {
      notify.toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      notify.toast.error('No users selected')
      return
    }

    try {
      let result
      switch (action) {
        case 'activate':
          result = await notify.alert.confirm(
            'Activate Users?',
            `Activate ${selectedUsers.length} selected users?`
          )
          if (result.isConfirmed) {
            await api.post('/users/bulk-update', {
              userIds: selectedUsers,
              updates: { isActive: true }
            })
            notify.toast.success('Users activated successfully')
          }
          break
          
        case 'deactivate':
          result = await notify.alert.confirm(
            'Deactivate Users?',
            `Deactivate ${selectedUsers.length} selected users?`
          )
          if (result.isConfirmed) {
            await api.post('/users/bulk-update', {
              userIds: selectedUsers,
              updates: { isActive: false }
            })
            notify.toast.success('Users deactivated successfully')
          }
          break
          
        case 'delete':
          result = await notify.alert.confirm(
            'Delete Users?',
            `Delete ${selectedUsers.length} selected users? This cannot be undone.`
          )
          if (result.isConfirmed) {
            for (const userId of selectedUsers) {
              await api.delete(`/users/${userId}`)
            }
            notify.toast.success('Users deleted successfully')
          }
          break
      }
      
      setSelectedUsers([])
      setShowBulkActions(false)
      fetchUsers()
    } catch (error: any) {
      notify.toast.error(error.response?.data?.message || 'Bulk action failed')
    }
  }

  const exportUsers = async () => {
    try {
      const response = await api.get('/users/export?format=csv', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users-${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      notify.toast.success('Users exported successfully')
    } catch (error: any) {
      notify.toast.error(error.response?.data?.message || 'Export failed')
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { icon: FaUserShield, className: 'bg-red-100 text-red-800' },
      moderator: { icon: FaUserCog, className: 'bg-blue-100 text-blue-800' },
      user: { icon: FaUser, className: 'bg-gray-100 text-gray-800' }
    }
    
    const badge = badges[role as keyof typeof badges] || badges.user
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="mr-1" />
        {role}
      </span>
    )
  }

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <AiOutlineCheckCircle className="mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AiOutlineCloseCircle className="mr-1" />
        Inactive
      </span>
    )
  )

  const handleResetFilters = () => {
    setFilters({
      role: '',
      departmentId: '',
      isActive: '',
      isEmailVerified: ''
    })
    setSearchQuery('')
  }

  // Copy the rest of the component JSX from the original file...
  // This is where the render logic would go

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <AiOutlineFilter className="mr-2" />
              Filters
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <AiOutlineUserAdd className="mr-2" />
              Add User
            </button>

            <button
              type="button"
              onClick={exportUsers}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <AiOutlineDownload className="mr-2" />
              Export
            </button>
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>

                <select
                  value={filters.departmentId}
                  onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={departmentsLoading}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>

                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>

                <select
                  value={filters.isEmailVerified}
                  onChange={(e) => setFilters({ ...filters, isEmailVerified: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Verification</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>
              
              <button
                onClick={handleResetFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading users...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(users.map(u => u.id))
                              setShowBulkActions(true)
                            } else {
                              setSelectedUsers([])
                              setShowBulkActions(false)
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
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
                        Last Login
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
                                setShowBulkActions(true)
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                                if (selectedUsers.length === 1) {
                                  setShowBulkActions(false)
                                }
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profile.profilePicture ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={user.profile.profilePicture}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <AiOutlineUser className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.profile.firstName} {user.profile.lastName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <AiOutlineMail className="mr-1" />
                                {user.email}
                                {user.isEmailVerified && (
                                  <MdVerified className="ml-1 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge isActive={user.isActive} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDetailsModalOpen(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <AiOutlineEye />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setIsEditModalOpen(true)
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit User"
                            >
                              <AiOutlineEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <AiOutlineDelete />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalUsers)}
                      </span>{' '}
                      of <span className="font-medium">{totalUsers}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              {selectedUsers.length} users selected
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setSelectedUsers([])
                  setShowBulkActions(false)
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {isCreateModalOpen && (
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              setIsCreateModalOpen(false)
              fetchUsers()
            }}
            departments={departments}
          />
        )}

        {isEditModalOpen && selectedUser && (
          <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedUser(null)
            }}
            onSuccess={() => {
              setIsEditModalOpen(false)
              setSelectedUser(null)
              fetchUsers()
            }}
            user={selectedUser}
            departments={departments}
          />
        )}

        {isDetailsModalOpen && selectedUser && (
          <UserDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false)
              setSelectedUser(null)
            }}
            userId={selectedUser.id}
          />
        )}
      </div>
    </div>
  )
}

export default UserManagement
