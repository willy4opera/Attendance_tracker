import React from 'react'
import { Squares2X2Icon, DocumentTextIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import type { UpdateTaskData } from '../../../services/taskService'

interface BasicTaskInfoProps {
  formData: UpdateTaskData
  errors: Record<string, string>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

const BasicTaskInfo: React.FC<BasicTaskInfoProps> = ({
  formData,
  errors,
  handleInputChange
}) => {
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
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
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
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
            placeholder="Enter task description"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default BasicTaskInfo
