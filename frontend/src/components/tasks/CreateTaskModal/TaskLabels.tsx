import React, { useState } from 'react'
import { TagIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

interface TaskLabelsProps {
  labels: string[]
  onAddLabel: (label: string) => void
  onRemoveLabel: (label: string) => void
}

const TaskLabels: React.FC<TaskLabelsProps> = ({ labels, onAddLabel, onRemoveLabel }) => {
  const [newLabel, setNewLabel] = useState('')

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      onAddLabel(newLabel.trim())
      setNewLabel('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLabel()
    }
  }

  const labelColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
  ]

  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <TagIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Labels
      </h4>

      <div className="space-y-4">
        {/* Current Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {labels.map((label, index) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: labelColors[index % labelColors.length] }}
              >
                {label}
                <button
                  type="button"
                  onClick={() => onRemoveLabel(label)}
                  className="ml-1 hover:opacity-80"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add New Label */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
            placeholder="Add a label..."
          />
          <button
            type="button"
            onClick={handleAddLabel}
            className="px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1 border-2"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.primary,
              borderColor: theme.colors.secondary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary
              e.currentTarget.style.color = theme.colors.secondary
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary
              e.currentTarget.style.color = theme.colors.primary
              e.currentTarget.style.borderColor = theme.colors.secondary
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskLabels
