import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import {
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineUser,
  AiOutlineCalendar,
  AiOutlineBarChart,
  AiOutlineTeam,
  AiOutlineQrcode
} from 'react-icons/ai'
import { FaChartLine } from 'react-icons/fa'
import theme from '../../config/theme'
import api from '../../services/api'
import { toastError } from '../../utils/toastHelpers'

interface StatCard {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface DashboardStats {
  presentToday: number
  totalEmployees: number
  onTimeRate: number
  attendanceRate: number
}

interface RecentSession {
  id: string
  employeeName: string
  checkIn: string
  checkOut?: string
  status: 'present' | 'late' | 'absent'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [, setRecentSessions] = useState<RecentSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await api.get('/attendance/stats/today')
      setStats(statsResponse.data.data)

      // Fetch recent sessions
      try {
        const sessionsResponse = await api.get('/attendance/recent')
        setRecentSessions(sessionsResponse.data.data)
      } catch {
        // Silently fail for recent sessions
      }
    } catch {
      toastError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Quick check-in/out',
      icon: <AiOutlineCheckCircle className="w-8 h-8" />,
      link: '/attendance/mark',
      color: theme.colors.success
    },
    {
      title: 'View Reports',
      description: 'Attendance analytics',
      icon: <FaChartLine className="w-8 h-8" />,
      link: '/reports',
      color: theme.colors.info
    },
    {
      title: 'Manage Employees',
      description: 'Employee directory',
      icon: <AiOutlineTeam className="w-8 h-8" />,
      link: '/employees',
      color: theme.colors.warning
    },
    {
      title: 'QR Scanner',
      description: 'Scan QR codes',
      icon: <AiOutlineQrcode className="w-8 h-8" />,
      link: '/attendance/qr-scanner',
      color: theme.colors.error
    }
  ]

  const statCards: StatCard[] = [
    {
      title: 'Present Today',
      value: stats?.presentToday || 0,
      icon: <AiOutlineUser className="w-6 h-6" />,
      color: theme.colors.success,
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <AiOutlineTeam className="w-6 h-6" />,
      color: theme.colors.info
    },
    {
      title: 'On-Time Rate',
      value: `${stats?.onTimeRate || 0}%`,
      icon: <AiOutlineClockCircle className="w-6 h-6" />,
      color: theme.colors.warning,
      trend: { value: 2.3, isPositive: true }
    },
    {
      title: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: <AiOutlineBarChart className="w-6 h-6" />,
      color: theme.colors.primary,
      trend: { value: 1.5, isPositive: false }
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
          style={{ borderColor: theme.colors.primary }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm" style={{ backgroundColor: theme.colors.background.paper }}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.secondary }}>
          Welcome back, {user?.firstName || user?.email}!
        </h2>
        <p className="text-gray-600">
          Here's what's happening with your attendance system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            style={{ backgroundColor: theme.colors.background.paper }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: stat.color + '20', color: stat.color }}
              >
                {stat.icon}
              </div>
              {stat.trend && (
                <div className={`flex items-center text-sm ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <span>{stat.trend.isPositive ? '+' : '-'}{stat.trend.value}%</span>
                </div>
              )}
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold" style={{ color: theme.colors.secondary }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.secondary }}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:scale-105 block"
              style={{ backgroundColor: theme.colors.background.paper }}
            >
              <div 
                className="mb-4"
                style={{ color: action.color }}
              >
                {action.icon}
              </div>
              <h4 className="font-semibold mb-1" style={{ color: theme.colors.secondary }}>
                {action.title}
              </h4>
              <p className="text-sm text-gray-600">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm" style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold" style={{ color: theme.colors.secondary }}>
              Recent Activity
            </h3>
            <Link 
              to="/attendance/history" 
              className="text-sm hover:underline"
              style={{ color: theme.colors.primary }}
            >
              View All
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <AiOutlineCalendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  )
}
