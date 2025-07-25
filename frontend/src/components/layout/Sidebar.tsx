import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  AiOutlineLogout,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineMail,
  AiOutlineDown,
  AiOutlineRight,
  AiOutlinePlus,
  AiOutlineNotification
} from 'react-icons/ai'
import theme from '../../config/theme'
import { menuItems, filterMenuItems } from './sidebar'
import type { MenuItem } from './sidebar/types'

interface Department {
  id: number
  name: string
  code: string
}

interface SidebarProps {
  user: { 
    id: string | number
    email: string
    firstName: string
    lastName: string
    role: string
    isEmailVerified?: boolean
    emailVerified?: boolean // backward compatibility
    department?: Department | null
    profilePicture?: string
  } | null
  onLogout: () => void
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['project-management'])
  
  // Check both possible field names for email verification status
  const isEmailVerified = user?.isEmailVerified ?? user?.emailVerified ?? false

  // Use modular menu items with filtering
  const filteredMenuItems = filterMenuItems(menuItems, user?.role || 'user')

  // Function to get the image URL
  const getImageUrl = (url: string | undefined) => {
    if (!url) return null;
    
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // For relative URLs, let Vite's proxy handle it
    return url;
  };

  const profilePictureUrl = getImageUrl(user?.profilePicture);

  const isActive = (path: string) => location.pathname === path

  const isParentActive = (item: MenuItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.path))
    }
    return isActive(item.path)
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name.toLowerCase().replace(/\s+/g, '-'))
    const isItemActive = isParentActive(item)

    if (hasChildren) {
      return (
        <li key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name.toLowerCase().replace(/\s+/g, '-'))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              isItemActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'hover:bg-gray-100'
            }`}
            style={{
              color: isItemActive ? theme.colors.primary : theme.colors.text.primary
            }}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              {!isCollapsed && <span>{item.name}</span>}
            </div>
            {!isCollapsed && (
              <span className="transform transition-transform duration-200">
                {isExpanded ? <AiOutlineDown className="w-4 h-4" /> : <AiOutlineRight className="w-4 h-4" />}
              </span>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <ul className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
              {item.children?.map((child) => (
                <li key={child.path}>
                  <Link
                    to={child.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(child.path) 
                        ? 'text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isActive(child.path) ? theme.colors.primary : 'transparent',
                      color: isActive(child.path) ? theme.colors.secondary : theme.colors.text.secondary
                    }}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {child.icon}
                    <span className="text-sm">{child.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      )
    }

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive(item.path) 
              ? 'text-white' 
              : 'hover:bg-gray-100'
          }`}
          style={{
            backgroundColor: isActive(item.path) ? theme.colors.primary : 'transparent',
            color: isActive(item.path) ? theme.colors.secondary : theme.colors.text.primary
          }}
          onClick={() => setIsMobileOpen(false)}
        >
          {item.icon}
          {!isCollapsed && <span>{item.name}</span>}
        </Link>
      </li>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ 
          backgroundColor: theme.colors.primary,
          color: theme.colors.secondary 
        }}
      >
        {isMobileOpen ? <AiOutlineClose className="w-6 h-6" /> : <AiOutlineMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-2xl transition-all duration-300 z-40 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: theme.colors.background.paper }}
      >
        {/* Logo Section - Fixed at top */}
        <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/images/logo.png" alt="Logo" className="h-10 w-10" />
            {!isCollapsed && (
              <h2 className="font-bold text-lg" style={{ color: theme.colors.secondary }}>
                Attendance
              </h2>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1 rounded hover:bg-gray-100"
          >
            <AiOutlineMenu className="w-5 h-5" style={{ color: theme.colors.secondary }} />
          </button>
        </div>

        {/* User Info - Fixed at top */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center space-x-3">
            {profilePictureUrl && !imageError ? (
              <img
                src={profilePictureUrl}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
              >
                {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div>
                <p className="font-medium text-sm" style={{ color: theme.colors.secondary }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                  {user?.role}
                  {user?.department && ` • ${user.department.name}`}
                </p>
                {!isEmailVerified && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AiOutlineMail className="w-3 h-3" />
                    Verify email
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="p-4 border-b">
              <div className="flex space-x-2">
                <Link
                  to="/projects/create"
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ 
                    backgroundColor: theme.colors.primary + '15',
                    color: theme.colors.primary 
                  }}
                >
                  <AiOutlinePlus className="w-4 h-4" />
                  <span>Project</span>
                </Link>
                <Link
                  to="/boards/create"
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ 
                    backgroundColor: theme.colors.primary + '15',
                    color: theme.colors.primary 
                  }}
                >
                  <AiOutlinePlus className="w-4 h-4" />
                  <span>Board</span>
                </Link>
              </div>
            </div>
          )}

          {/* Notifications Badge */}
          {!isCollapsed && (
            <div className="px-4 py-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <AiOutlineNotification className="w-4 h-4" />
                <span>3 new notifications</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map(renderMenuItem)}
            </ul>
          </nav>
        </div>

        {/* Logout Button - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-red-50"
            style={{ color: theme.colors.error }}
          >
            <AiOutlineLogout className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
