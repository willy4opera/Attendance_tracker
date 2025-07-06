import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  AiOutlineDashboard, 
  AiOutlineCalendar, 
  AiOutlineCheckCircle,
  AiOutlineUser,
  AiOutlineTeam,
  AiOutlineFile,
  AiOutlineQrcode,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineMail,
} from 'react-icons/ai'
import { FaChartBar } from 'react-icons/fa'
import theme from '../../config/theme'

interface MenuItem {
  name: string
  path: string
  icon: React.ReactNode
  roles?: string[]
}

interface SidebarProps {
  user: { id: string; email: string; firstName: string; lastName: string; role: string; emailVerified?: boolean; department?: string } | null
  onLogout: () => void
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <AiOutlineDashboard className="w-5 h-5" />
    },
    {
      name: 'Sessions',
      path: '/sessions',
      icon: <AiOutlineCalendar className="w-5 h-5" />
    },
    {
      name: 'My Attendance',
      path: '/attendance',
      icon: <AiOutlineCheckCircle className="w-5 h-5" />
    },
    {
      name: 'QR Scanner',
      path: '/qr-scanner',
      icon: <AiOutlineQrcode className="w-5 h-5" />
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <FaChartBar className="w-5 h-5" />
    },
    {
      name: 'Files',
      path: '/files',
      icon: <AiOutlineFile className="w-5 h-5" />
    },
    {
      name: 'Users',
      path: '/users',
      icon: <AiOutlineTeam className="w-5 h-5" />,
      roles: ['admin', 'moderator']
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <AiOutlineUser className="w-5 h-5" />
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <AiOutlineSetting className="w-5 h-5" />,
      roles: ['admin']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role || 'user')
  })

  const isActive = (path: string) => location.pathname === path

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
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: theme.colors.background.paper }}
      >
        {/* Logo Section */}
        <div className="p-4 border-b flex items-center justify-between">
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

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            {!isCollapsed && (
              <div>
                <p className="font-medium text-sm" style={{ color: theme.colors.secondary }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                  {user?.role}
                </p>
                {!user?.emailVerified && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AiOutlineMail className="w-3 h-3" />
                    Verify email
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
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
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
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
