import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../contexts/useAuth'
import { toastError } from '../../utils/toastHelpers'
import theme from '../../config/theme'

interface DashboardLayoutProps {
  title?: string
}

export default function DashboardLayout({ title = 'Dashboard' }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      toastError('Please login to continue')
      navigate('/login')
    }
  }, [loading, user, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
          style={{ borderColor: theme.colors.primary }}
        />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: theme.colors.background.default }}>
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
        {/* Header - Full width */}
        <div className="bg-white shadow-sm" style={{ backgroundColor: theme.colors.background.paper }}>
          <Header title={title} user={user} />
        </div>

        {/* Page Content - Full width to match header */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.colors.background.default }}>
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  )
}
