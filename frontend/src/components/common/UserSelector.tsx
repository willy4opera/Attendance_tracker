import React, { useState, useEffect, useRef } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { User } from '../../types'
import userService from '../../services/user.service'
import theme from '../../config/theme'

interface UserSelectorProps {
  value: string
  onChange: (userId: string, user?: User) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select a user",
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return
      
      setLoading(true)
      try {
        const response = await userService.getAllUsers({
          search: searchTerm,
          status: 'active',
          limit: 50
        })
        setUsers(response.users)
      } catch (error) {
        console.error('Failed to fetch users:', error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isOpen, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    onChange(user.id.toString(), user)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    setSelectedUser(null)
    onChange('', undefined)
    setSearchTerm('')
  }

  const displayValue = selectedUser 
    ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
    : placeholder

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
        }`}
        style={{ 
          '--tw-ring-color': theme.colors.primary,
          focusRingColor: theme.colors.primary 
        } as any}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${!selectedUser ? 'text-gray-500' : 'text-gray-900'}`}>
            {displayValue}
          </span>
          <div className="flex items-center space-x-1">
            {selectedUser && (
              <XMarkIcon 
                className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
            <ChevronDownIcon 
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{ 
                  '--tw-ring-color': theme.colors.primary,
                  focusRingColor: theme.colors.primary 
                } as any}
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <ul className="py-1">
                {users.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email} • {user.role}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserSelector
