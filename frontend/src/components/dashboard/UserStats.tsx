import React, { useState, useEffect } from 'react'
import { FaUsers, FaUserCheck, FaUserClock, FaUserShield } from 'react-icons/fa'
import api from '../../services/api'
import theme from '../../config/theme'

interface UserStatistics {
  overview: {
    total: number
    active: number
    inactive: number
    verified: number
    unverified: number
  }
  byRole: {
    admin?: number
    moderator?: number
    user?: number
  }
}

export default function UserStats() {
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/stats')
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch user statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Total Users',
      value: stats.overview.total,
      icon: <FaUsers className="text-3xl text-blue-500" />,
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Users',
      value: stats.overview.active,
      icon: <FaUserCheck className="text-3xl text-green-500" />,
      bgColor: 'bg-green-50'
    },
    {
      title: 'Verified Users',
      value: stats.overview.verified,
      icon: <FaUserClock className="text-3xl text-purple-500" />,
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Administrators',
      value: (stats.byRole.admin || 0) + (stats.byRole.moderator || 0),
      icon: <FaUserShield className="text-3xl text-red-500" />,
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.secondary }}>
        User Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${card.bgColor}`}
            style={{ backgroundColor: theme.colors.background.paper }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.secondary }}>
                  {card.value}
                </p>
              </div>
              <div>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
