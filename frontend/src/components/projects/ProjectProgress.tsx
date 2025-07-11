import React from 'react'
import type { ProjectStats as ProjectStatsType } from '../../types'
import { 
  CheckCircleIcon, 
  ClipboardDocumentIcon, 
  DocumentTextIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'
import theme from '../../config/theme'

interface ProjectProgressProps {
  stats: ProjectStatsType
}

export const ProjectProgress: React.FC<ProjectProgressProps> = ({ stats }) => {
  const progressPercentage = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Project Progress</h3>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="style={{ backgroundColor: theme.colors.primary }} h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Progress Details */}
      <div className="space-y-4">
        {/* Completed Tasks */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Completed Tasks</p>
              <p className="text-xs text-gray-500">Successfully finished</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">{stats.completedTasks}</p>
            <p className="text-xs text-gray-500">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">In Progress</p>
              <p className="text-xs text-gray-500">Currently being worked on</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-yellow-600">{stats.inProgressTasks}</p>
            <p className="text-xs text-gray-500">
              {stats.totalTasks > 0 ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Todo Tasks */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <ClipboardDocumentIcon className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">To Do</p>
              <p className="text-xs text-gray-500">Pending tasks</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">{stats.todoTasks}</p>
            <p className="text-xs text-gray-500">
              {stats.totalTasks > 0 ? Math.round((stats.todoTasks / stats.totalTasks) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Overdue Tasks */}
        {stats.overdueTasks > 0 && (
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Overdue</p>
                <p className="text-xs text-gray-500">Need immediate attention</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">{stats.overdueTasks}</p>
              <p className="text-xs text-gray-500">
                {stats.totalTasks > 0 ? Math.round((stats.overdueTasks / stats.totalTasks) * 100) : 0}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Tasks</span>
          <span className="text-sm font-medium text-gray-900">{stats.totalTasks}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">Completion Rate</span>
          <span className="text-sm font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
        </div>
      </div>
    </div>
  )
}

export default ProjectProgress
