import React from 'react'
import { ProjectStatus, ProjectPriority } from '../../types'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface ProjectFiltersProps {
  statusFilter: ProjectStatus | ''
  priorityFilter: ProjectPriority | ''
  departmentFilter: string
  onStatusChange: (status: ProjectStatus | '') => void
  onPriorityChange: (priority: ProjectPriority | '') => void
  onDepartmentChange: (departmentId: string) => void
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  statusFilter,
  priorityFilter,
  departmentFilter,
  onStatusChange,
  onPriorityChange,
  onDepartmentChange
}) => {
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  return (
    <div className="flex flex-wrap gap-4">
      {/* Status Filter */}
      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as ProjectStatus | '')}
          className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Priority Filter */}
      <div className="relative">
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as ProjectPriority | '')}
          className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Department Filter */}
      <div className="relative">
        <select
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Departments</option>
          {/* Department options would be populated from API */}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Clear Filters */}
      {(statusFilter || priorityFilter || departmentFilter) && (
        <button
          onClick={() => {
            onStatusChange('')
            onPriorityChange('')
            onDepartmentChange('')
          }}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default ProjectFilters
