import React from 'react'
import type { Project } from '../../types'
import { ProjectStatus, ProjectPriority } from '../../types'
import { useNavigate } from 'react-router-dom'
import { 
  EllipsisVerticalIcon, 
  CalendarIcon, 
  UserGroupIcon,
  ChartBarIcon,
  ViewColumnsIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import theme from '../../config/theme'

interface ProjectCardProps {
  project: Project
  viewMode: 'grid' | 'list'
  onUpdate: () => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, viewMode, onUpdate }) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/projects/${project.id}`)
  }

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return theme.colors.success
      case 'completed':
        return theme.colors.info
      case 'on_hold':
        return theme.colors.warning
      case 'cancelled':
        return theme.colors.error
      default:
        return theme.colors.text.secondary
    }
  }

  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.error
      case 'high':
        return theme.colors.warning
      case 'medium':
        return theme.colors.primary
      case 'low':
        return theme.colors.success
      default:
        return theme.colors.text.secondary
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Get priority from metadata.customFields
  const getPriority = (): ProjectPriority => {
    const priority = project.metadata?.customFields?.priority as ProjectPriority
    return priority || ProjectPriority.MEDIUM
  }

  const formatStatus = (status: ProjectStatus) => {
    return status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN'
  }

  const formatPriority = (priority: ProjectPriority) => {
    return priority ? priority.toUpperCase() : 'MEDIUM'
  }

  // Get project statistics
  const stats = project.stats || {}
  const boardCount = stats.boardCount || 0
  const activeMemberCount = stats.activeMemberCount || 0
  const progress = stats.progress || 0

  if (viewMode === 'grid') {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer hover:border-opacity-50"
        style={{ 
          borderColor: theme.colors.primary + '30',
          backgroundColor: theme.colors.background.paper 
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.colors.primary
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.colors.primary + '30'
        }}
      >
        <div className="p-6" onClick={handleCardClick}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium truncate" style={{ color: theme.colors.text.primary }}>
                {project.name}
              </h3>
              <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
                Code: {project.code}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle menu click
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <EllipsisVerticalIcon className="w-5 h-5" style={{ color: theme.colors.text.secondary }} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <p className="text-sm line-clamp-2" style={{ color: theme.colors.text.secondary }}>
              {project.description || 'No description provided'}
            </p>
          </div>

          {/* Status and Priority */}
          <div className="mt-4 flex items-center space-x-2">
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getStatusColor(project.status) }}
            >
              {formatStatus(project.status)}
            </span>
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getPriorityColor(getPriority()) }}
            >
              {formatPriority(getPriority())}
            </span>
          </div>

          {/* Project Manager */}
          {project.projectManager && (
            <div className="mt-3 text-sm" style={{ color: theme.colors.text.secondary }}>
              <span className="font-medium">Manager: </span>
              {project.projectManager.firstName} {project.projectManager.lastName}
            </div>
          )}

          {/* Department */}
          {project.department && (
            <div className="mt-1 text-sm" style={{ color: theme.colors.text.secondary }}>
              <span className="font-medium">Department: </span>
              {project.department.name}
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm" style={{ color: theme.colors.text.secondary }}>
            <div className="flex items-center">
              <ViewColumnsIcon className="w-4 h-4 mr-1" />
              <span>{boardCount} boards</span>
            </div>
            <div className="flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-1" />
              <span>{activeMemberCount} members</span>
            </div>
          </div>

          {/* Progress */}
          {progress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span style={{ color: theme.colors.text.secondary }}>Progress</span>
                <span style={{ color: theme.colors.text.primary }}>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: theme.colors.primary
                  }}
                />
              </div>
            </div>
          )}

          {/* Dates */}
          {(project.startDate || project.endDate) && (
            <div className="mt-4 flex items-center text-sm" style={{ color: theme.colors.text.secondary }}>
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>
                {project.startDate && formatDate(project.startDate)}
                {project.startDate && project.endDate && ' - '}
                {project.endDate && formatDate(project.endDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer hover:border-opacity-50"
      style={{ 
        borderColor: theme.colors.primary + '30',
        backgroundColor: theme.colors.background.paper 
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary + '30'
      }}
    >
      <div className="p-6" onClick={handleCardClick}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium truncate" style={{ color: theme.colors.text.primary }}>
                  {project.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
                  {project.description || 'No description provided'}
                </p>
                <div className="flex items-center mt-2 space-x-4 text-sm" style={{ color: theme.colors.text.secondary }}>
                  <span>Code: <span className="font-medium">{project.code}</span></span>
                  {project.projectManager && (
                    <span>Manager: <span className="font-medium">
                      {project.projectManager.firstName} {project.projectManager.lastName}
                    </span></span>
                  )}
                  {project.department && (
                    <span>Dept: <span className="font-medium">{project.department.name}</span></span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  >
                    {formatStatus(project.status)}
                  </span>
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getPriorityColor(getPriority()) }}
                  >
                    {formatPriority(getPriority())}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm" style={{ color: theme.colors.text.secondary }}>
                  <div className="flex items-center">
                    <ViewColumnsIcon className="w-4 h-4 mr-1" />
                    <span>{boardCount}</span>
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    <span>{activeMemberCount}</span>
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="w-4 h-4 mr-1" />
                    <span>{progress}%</span>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>{formatDate(project.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Handle menu click
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <EllipsisVerticalIcon className="w-5 h-5" style={{ color: theme.colors.text.secondary }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
