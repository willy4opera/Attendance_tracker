import React from 'react'
import { Link } from 'react-router-dom'
import { PencilIcon, TrashIcon, ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

interface ProjectHeaderProps {
  project: any
  onDelete: () => void
}

export function ProjectHeader({ project, onDelete }: ProjectHeaderProps) {
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
        return { bg: theme.colors.secondary + '20', text: theme.colors.secondary }
    }
  }

  const statusColors = getStatusColor()

  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-6 sticky-header"
      style={{ backgroundColor: theme.colors.background.paper }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Link 
            to="/projects"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: theme.colors.secondary }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
                {project.name}
              </h1>
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
              >
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              {project.description || 'No description available'}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm" style={{ color: theme.colors.text.secondary }}>
              <span>Code: <strong style={{ color: theme.colors.secondary }}>{project.code}</strong></span>
              {project.department && (
                <span>Department: <strong style={{ color: theme.colors.secondary }}>{project.department.name}</strong></span>
              )}
              {project.startDate && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {new Date(project.startDate).toLocaleDateString()} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${project.id}/edit`}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover-button-primary"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.text.primary
            }}
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: theme.colors.error,
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
