import React from 'react'
import type { ProjectStats as ProjectStatsType } from '../../types'
import { 
  CheckCircleIcon, 
  DocumentTextIcon, 
  ClipboardDocumentIcon, 
  ClockIcon,
  UserGroupIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline'

interface ProjectStatsProps {
  stats: ProjectStatsType
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ stats }) => {
  const progressPercentage = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Project Statistics</h3>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="style={{ backgroundColor: theme.colors.primary }} h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Tasks */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <ClipboardDocumentIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressTasks}</p>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-500">Team Members</p>
            <p className="text-lg font-semibold text-gray-900">{stats.memberCount}</p>
          </div>
        </div>
        <div className="flex items-center">
          <ChartPieIcon className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-500">Boards</p>
            <p className="text-lg font-semibold text-gray-900">{stats.boardCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectStats
