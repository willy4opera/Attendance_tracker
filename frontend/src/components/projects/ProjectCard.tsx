import React from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import { 
  FolderIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import theme from '../../config/theme'

interface ProjectCardProps {
  project: Project
  viewMode?: 'grid' | 'list'
}

export function ProjectCard({ project, viewMode = 'grid' }: ProjectCardProps) {
  const getStatusColor = () => {
    switch (project.status) {
      case 'active':
        return { bg: theme.colors.success + '20', text: theme.colors.success }
      case 'completed':
        return { bg: theme.colors.info + '20', text: theme.colors.info }
      case 'on_hold':
        return { bg: theme.colors.warning + '20', text: theme.colors.warning }
      case 'cancelled':
        return { bg: theme.colors.error + '20', text: theme.colors.error }
      default:
        return { bg: theme.colors.primary + '20', text: theme.colors.primary }
    }
  }

  const statusColors = getStatusColor()
  const stats = project.stats || {
    boardCount: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    reviewTasks: 0,
    archivedTasks: 0,
    progress: 0,
    activeMemberCount: 0
  }

  if (viewMode === 'list') {
    return (
      <Link to={`/projects/${project.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6" 
             style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.primary + '20' }}>
                <FolderIcon className="h-8 w-8" style={{ color: theme.colors.primary }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                  {project.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="flex items-center text-xs" style={{ color: theme.colors.text.secondary }}>
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    {stats.boardCount} Boards
                  </span>
                  <span className="flex items-center text-xs" style={{ color: theme.colors.text.secondary }}>
                    <UsersIcon className="h-4 w-4 mr-1" />
                    {stats.activeMemberCount} Members
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-8">
              {/* Enhanced Statistics */}
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
                    {stats.totalTasks}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                    Total
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                    {stats.completedTasks}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                    Done
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
                    {stats.inProgressTasks}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                    In Progress
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: theme.colors.info }}>
                    {stats.todoTasks}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                    To Do
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    {stats.progress.toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                    Progress
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
              >
                {project.status.replace('_', ' ')}
              </span>

              <ArrowRightIcon className="h-5 w-5" style={{ color: theme.colors.text.secondary }} />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid View
  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 h-full" 
           style={{ backgroundColor: theme.colors.background.paper }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.primary + '20' }}>
            <FolderIcon className="h-8 w-8" style={{ color: theme.colors.primary }} />
          </div>
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
          >
            {project.status.replace('_', ' ')}
          </span>
        </div>

        {/* Project Info */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
          {project.name}
        </h3>
        <p className="text-sm mb-4 line-clamp-2" style={{ color: theme.colors.text.secondary }}>
          {project.description || 'No description'}
        </p>

        {/* Task Status Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-600">To Do</p>
            <p className="text-lg font-semibold">{stats.todoTasks}</p>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <p className="text-xs text-yellow-600">In Progress</p>
            <p className="text-lg font-semibold">{stats.inProgressTasks}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <p className="text-xs text-blue-600">Review</p>
            <p className="text-lg font-semibold">{stats.reviewTasks}</p>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <p className="text-xs text-green-600">Completed</p>
            <p className="text-lg font-semibold">{stats.completedTasks}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: theme.colors.text.secondary }}>Progress</span>
            <span className="text-xs font-medium" style={{ color: theme.colors.text.primary }}>
              {stats.progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${stats.progress}%`,
                backgroundColor: stats.progress >= 75 ? theme.colors.success :
                               stats.progress >= 50 ? theme.colors.warning :
                               stats.progress >= 25 ? theme.colors.info :
                               theme.colors.error
              }}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm" style={{ color: theme.colors.text.secondary }}>
              <ChartBarIcon className="h-4 w-4 mr-1" />
              {stats.boardCount} Boards
            </div>
            <div className="flex items-center text-sm" style={{ color: theme.colors.text.secondary }}>
              <UsersIcon className="h-4 w-4 mr-1" />
              {stats.activeMemberCount} Members
            </div>
          </div>
          <div className="flex items-center text-sm" style={{ color: theme.colors.text.secondary }}>
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            {stats.totalTasks} Tasks
          </div>
        </div>

        {/* Dates */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs" 
               style={{ color: theme.colors.text.secondary }}>
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {project.startDate && new Date(project.startDate).toLocaleDateString()}
            </div>
            {project.endDate && (
              <div>
                → {new Date(project.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
