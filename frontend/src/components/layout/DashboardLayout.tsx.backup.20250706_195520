import { useEffect, useState, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import authService from '../../services/auth.service'
import { toastSuccess, toastError } from '../../utils/toast'
import theme from '../../config/theme'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department?: string
}

interface DashboardLayoutProps {
  title?: string
}

export default function DashboardLayout({ title = 'Dashboard' }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData.user)
    } catch {
      toastError('Failed to load user data')
      navigate('/login')
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleLogout = async () => {
    try {
      await authService.logout()
      toastSuccess('Logged out successfully')
      navigate('/login')
    } catch {
      toastError('Logout failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
          style={{ borderColor: theme.colors.primary }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: theme.colors.background.default }}>
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <Header title={title} user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ user, refreshUser: fetchUserData }} />
        </main>
      </div>
    </div>
  )
}
