import React from 'react'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import type { UpdateTaskData } from '../../../services/taskService'

interface TaskDatesTimeProps {
  formData: UpdateTaskData
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

// Helper function to format date for input
const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString) return ''
  
  try {
    // Handle ISO date strings
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

const TaskDatesTime: React.FC<TaskDatesTimeProps> = ({
  formData,
  handleInputChange
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <CalendarIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Timeline
      </h4>
      
      <div className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formatDateForInput(formData.startDate)}
              onChange={handleInputChange}
              className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
              style={{
                '--tw-ring-color': theme.colors.primary,
                borderColor: theme.colors.primary,
                backgroundColor: '#d9d9d9'
              } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formatDateForInput(formData.dueDate)}
              onChange={handleInputChange}
              className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
              style={{
                '--tw-ring-color': theme.colors.primary,
                borderColor: theme.colors.primary,
                backgroundColor: '#d9d9d9'
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <ClockIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Estimated Hours
          </label>
          <input
            type="number"
            name="estimatedHours"
            value={formData.estimatedHours || ''}
            onChange={handleInputChange}
            min="0"
            step="0.5"
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
            placeholder="Enter estimated hours"
          />
        </div>

        {/* Actual Hours (if task has been worked on) */}
        {formData.actualHours !== undefined && (
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
              <ClockIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
              Actual Hours
            </label>
            <input
              type="number"
              name="actualHours"
              value={formData.actualHours || ''}
              onChange={handleInputChange}
              min="0"
              step="0.5"
              className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
              style={{
                '--tw-ring-color': theme.colors.primary,
                borderColor: theme.colors.primary,
                backgroundColor: '#d9d9d9'
              } as React.CSSProperties}
              placeholder="Enter actual hours"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDatesTime
