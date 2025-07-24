import React from 'react'
import { ClockIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

interface QuickStatsCardsProps {
  stats: {
    progress: number
    totalTasks: number
    completedTasks: number
    activeMemberCount: number
  }
  memberCount?: number // Add explicit member count
}

export function QuickStatsCards({ stats, memberCount }: QuickStatsCardsProps) {
  // Use provided member count or fall back to stats
  const actualMemberCount = memberCount ?? stats.activeMemberCount

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-6 shadow-sm" 
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Completion Rate
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: theme.colors.secondary }}>
              {stats.progress}%
            </p>
          </div>
          <div className="relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke={theme.colors.secondary + '20'}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke={theme.colors.secondary}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(stats.progress / 100) * 176} 176`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm" 
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Active Tasks
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: theme.colors.warning }}>
              {stats.totalTasks - stats.completedTasks}
            </p>
          </div>
          <ClockIcon className="h-12 w-12" style={{ color: theme.colors.warning + '40' }} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm" 
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Team Size
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: theme.colors.secondary }}>
              {actualMemberCount}
            </p>
          </div>
          <UsersIcon className="h-12 w-12" style={{ color: theme.colors.secondary + '40' }} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm" 
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              Productivity
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: theme.colors.success }}>
              {actualMemberCount > 0 ? Math.round(stats.completedTasks / actualMemberCount) : 0}
            </p>
            <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
              tasks/member
            </p>
          </div>
          <ChartBarIcon className="h-12 w-12" style={{ color: theme.colors.success + '40' }} />
        </div>
      </div>
    </div>
  )
}
