import React from 'react'
import { PlusIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

interface TaskLabelsProps {
  labels: string[]
  newLabel: string
  setNewLabel: (label: string) => void
  handleAddLabel: () => void
  handleRemoveLabel: (label: string) => void
}

const TaskLabels: React.FC<TaskLabelsProps> = ({
  labels,
  newLabel,
  setNewLabel,
  handleAddLabel,
  handleRemoveLabel
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <TagIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Labels
      </h4>
      
      <div className="space-y-3">
        {/* Add Label Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
            className="flex-1 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 border-2"
            style={{
              '--tw-ring-color': theme.colors.primary,
              borderColor: theme.colors.primary,
              backgroundColor: '#d9d9d9'
            } as React.CSSProperties}
            placeholder="Add a label"
          />
          <button
            type="button"
            onClick={handleAddLabel}
            className="px-4 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Labels Display */}
        {labels && labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {labels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  color: theme.colors.primary
                }}
              >
                {label}
                <button
                  type="button"
                  onClick={() => handleRemoveLabel(label)}
                  className="ml-2 hover:opacity-70 transition-opacity"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskLabels
