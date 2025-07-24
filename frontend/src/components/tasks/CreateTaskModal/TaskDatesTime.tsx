import React, { useEffect } from 'react'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

interface TaskDatesTimeProps {
  formData: {
    startDate?: string
    dueDate?: string
    estimatedHours?: number
  }
  onChange: (field: string, value: any) => void
}

const TaskDatesTime: React.FC<TaskDatesTimeProps> = ({ formData, onChange }) => {
  const today = new Date().toISOString().split('T')[0]

  // Add CSS for black calendar icons
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .date-input-black::-webkit-calendar-picker-indicator {
        filter: invert(100%);
        opacity: 0.8;
        cursor: pointer;
      }
      .date-input-black::-webkit-calendar-picker-indicator:hover {
        opacity: 1;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <CalendarIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Dates & Time
      </h4>

      <div className="space-y-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
            Start Date
          </label>
          <input
            type="date"
            value={formData.startDate || ""}
            onChange={(e) => onChange('startDate', e.target.value)}
            min={today}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 date-input-black"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9',
              color: theme.colors.secondary
            } as React.CSSProperties}
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.secondary }}>
            Due Date
          </label>
          <input
            type="date"
            value={formData.dueDate || ""}
            onChange={(e) => onChange('dueDate', e.target.value)}
            min={formData.startDate || today}
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2 date-input-black"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9',
              color: theme.colors.secondary
            } as React.CSSProperties}
          />
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
            <ClockIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
            Estimated Hours
          </label>
          <input
            type="number"
            value={formData.estimatedHours || ''}
            onChange={(e) => onChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)}
            min="0"
            step="0.5"
            className="block w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9',
              color: theme.colors.secondary
            } as React.CSSProperties}
            placeholder="e.g., 8"
          />
        </div>

        {/* Time Summary */}
        {(formData.startDate || formData.dueDate) && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.primary + '10' }}>
            <p className="text-xs font-medium" style={{ color: theme.colors.secondary }}>
              Timeline Summary
            </p>
            {formData.startDate && (
              <p className="text-xs mt-1" style={{ color: theme.colors.secondary + 'cc' }}>
                Start: {new Date(formData.startDate).toLocaleDateString()}
              </p>
            )}
            {formData.dueDate && (
              <p className="text-xs" style={{ color: theme.colors.secondary + 'cc' }}>
                Due: {new Date(formData.dueDate).toLocaleDateString()}
              </p>
            )}
            {formData.startDate && formData.dueDate && (
              <p className="text-xs mt-1 font-medium" style={{ color: theme.colors.secondary }}>
                Duration: {Math.ceil((new Date(formData.dueDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDatesTime
