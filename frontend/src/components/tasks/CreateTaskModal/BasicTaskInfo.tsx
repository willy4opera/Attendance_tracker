import React from 'react'
import { Squares2X2Icon, DocumentTextIcon, ExclamationCircleIcon, ViewColumnsIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

interface BasicTaskInfoProps {
  formData: {
    title: string
    description: string
    priority: string
    status: string
    isComplete?: boolean
  }
  errors: Record<string, string>
  onChange: (field: string, value: any) => void
}

const BasicTaskInfo: React.FC<BasicTaskInfoProps> = ({ formData, errors, onChange }) => {
  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626'
  }

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'under-review', label: 'Review' },
    { value: 'done', label: 'Done' }
  ]

  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <Squares2X2Icon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Basic Information
      </h4>
      
      <div className="space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
            Task Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            className={`block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2`}
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: errors.title ? '#ef4444' : theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
            placeholder="Enter task title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <DocumentTextIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9',
              resize: 'vertical',
              minHeight: '100px'
            } as React.CSSProperties}
            placeholder="Enter task description"
            rows={4}
          />
        </div>

        {/* Priority and Status Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
              <ExclamationCircleIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => onChange('priority', e.target.value)}
              className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 cursor-pointer"
              style={{
                '--tw-ring-color': theme.colors.primary,
                borderColor: theme.colors.primary,
                backgroundColor: '#d9d9d9'
              } as React.CSSProperties}
            >
              {Object.entries(priorityColors).map(([value, color]) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
              <ViewColumnsIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => onChange('status', e.target.value)}
              className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 cursor-pointer"
              style={{
                '--tw-ring-color': theme.colors.primary,
                borderColor: theme.colors.primary,
                backgroundColor: '#d9d9d9'
              } as React.CSSProperties}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mark as Complete */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isComplete"
            checked={formData.isComplete || false}
            onChange={(e) => onChange('isComplete', e.target.checked)}
            className="w-5 h-5 rounded cursor-pointer"
            style={{ accentColor: theme.colors.primary }}
          />
          <label htmlFor="isComplete" className="text-sm font-medium cursor-pointer flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <CheckCircleIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Mark as Complete
          </label>
        </div>
      </div>
    </div>
  )
}

export default BasicTaskInfo
