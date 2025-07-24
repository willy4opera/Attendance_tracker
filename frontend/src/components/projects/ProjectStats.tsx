import React from 'react'
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  UsersIcon,
  FolderIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import theme from '../../config/theme'

interface ProjectStatsProps {
  stats: {
    boardCount: number
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    progress: number
    activeMemberCount: number
  }
}

export default function ProjectStats({ stats }: ProjectStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Total Tasks */}
      <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex flex-col items-center">
          <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: theme.colors.primary + '20' }}>
            <ChartBarIcon className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            {stats.totalTasks}
          </p>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Total Tasks
          </p>
        </div>
      </div>

      {/* Completed Tasks */}
      <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex flex-col items-center">
          <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: theme.colors.success + '20' }}>
            <CheckCircleIcon className="h-6 w-6" style={{ color: theme.colors.success }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
            {stats.completedTasks}
          </p>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Completed
          </p>
        </div>
      </div>

      {/* In Progress Tasks */}
      <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex flex-col items-center">
          <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: theme.colors.warning + '20' }}>
            <ClockIcon className="h-6 w-6" style={{ color: theme.colors.warning }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
            {stats.inProgressTasks}
          </p>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            In Progress
          </p>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke={theme.colors.primary + '30'}
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke={theme.colors.primary}
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(stats.progress / 100) * 126} 126`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: theme.colors.text.primary }}>
                {stats.progress}%
              </span>
            </div>
          </div>
          <p className="text-sm mt-2" style={{ color: theme.colors.text.secondary }}>
            Progress
          </p>
        </div>
      </div>

      {/* Boards */}
      <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex flex-col items-center">
          <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: theme.colors.info + '20' }}>
            <FolderIcon className="h-6 w-6" style={{ color: theme.colors.info }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            {stats.boardCount}
          </p>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Boards
          </p>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
           style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex flex-col items-center">
          <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: theme.colors.secondary + '20' }}>
            <UsersIcon className="h-6 w-6" style={{ color: theme.colors.secondary }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            {stats.activeMemberCount}
          </p>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Members
          </p>
        </div>
      </div>
    </div>
  )
}
