import React, { useState, useEffect, useRef } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import type { User } from '../../types'
import userService from '../../services/user.service'
import theme from '../../config/theme'

interface MultiUserSelectorProps {
  selectedUsers: User[]
  onChange: (users: User[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  maxUsers?: number
}

export const MultiUserSelector: React.FC<MultiUserSelectorProps> = ({
  selectedUsers,
  onChange,
  placeholder = "Select users",
  disabled = false,
  className = "",
  maxUsers
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleUserToggle = (user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id)
    
    if (isSelected) {
      onChange(selectedUsers.filter(u => u.id !== user.id))
    } else {
      if (maxUsers && selectedUsers.length >= maxUsers) {
        return
      }
      onChange([...selectedUsers, user])
    }
  }

  const handleRemoveUser = (userId: number) => {
    onChange(selectedUsers.filter(u => u.id !== userId))
  }

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-4 py-3 text-left bg-gray-50 border-2 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        style={{ 
          borderColor: theme.colors.primary,
          backgroundColor: '#d9d9d9',
          '--tw-ring-color': theme.colors.primary 
        } as any}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <span className={selectedUsers.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
            {selectedUsers.length > 0 
              ? `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`
              : placeholder
            }
          </span>
          <ChevronDownIcon 
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: theme.colors.secondary }}
          />
        </div>
      </button>

      {selectedUsers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedUsers.map(user => (
            <span
              key={user.id || user._id || user.email || `user-${selectedUsers.indexOf(user)}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm"
              style={{
                backgroundColor: theme.colors.primary + '20',
                color: theme.colors.secondary
              }}
            >
              {/* Mini profile picture in selected tags */}
              <div className="relative mr-2">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-5 h-5 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold ${user.profilePicture ? 'hidden' : ''}`}
                  style={{ backgroundColor: getUserColor(user.id) }}
                >
                  {getUserInitials(user)}
                </div>
              </div>
              {user.firstName} {user.lastName}
              <button
                type="button"
                onClick={() => handleRemoveUser(user.id)}
                className="ml-2 hover:opacity-70"
                style={{ color: theme.colors.secondary }}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
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
                  borderColor: theme.colors.primary + '40',
                  focusRingColor: theme.colors.primary 
                } as any}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No users found</div>
            ) : (
              <ul className="py-1">
                {filteredUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id)
                  const isDisabled = maxUsers && selectedUsers.length >= maxUsers && !isSelected
                  
                  return (
                    <li
                      key={user.id || user._id || user.email || `user-${selectedUsers.indexOf(user)}`}
                      onClick={() => !isDisabled && handleUserToggle(user)}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Profile Picture or Initials */}
                        <div className="relative">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
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
                        
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckIcon 
                          className="h-5 w-5" 
                          style={{ color: theme.colors.primary }}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
