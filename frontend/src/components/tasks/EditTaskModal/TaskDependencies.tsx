import React from 'react'
import { LinkIcon, XMarkIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import type { Task } from '../../../types'

interface TaskDependenciesProps {
  dependencies: number[]
  availableTasks: Task[]
  onShowDependencySelector: () => void
  onRemoveDependency: (taskId: number) => void
}

const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  dependencies,
  availableTasks,
  onShowDependencySelector,
  onRemoveDependency
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: theme.colors.secondary }}>
        <LinkIcon className="h-4 w-4" style={{ color: theme.colors.secondary }} />
        Dependencies
      </h4>
      
      <div className="space-y-3">
        {/* Add Dependency Button */}
        <button
          type="button"
          onClick={onShowDependencySelector}
          className="w-full rounded-xl px-4 py-3 text-left transition-all duration-200 border-2 hover:opacity-90"
          style={{
            borderColor: theme.colors.primary,
            backgroundColor: '#d9d9d9',
            color: theme.colors.secondary
          }}
        >
          <span className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Add dependency
          </span>
        </button>

        {/* Dependencies List */}
        {dependencies.length > 0 && (
          <div className="space-y-2">
            {dependencies.map((depId) => {
              const depTask = availableTasks.find(t => t.id === depId)
              if (!depTask) return null
              
              return (
                <div
                  key={depId}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    backgroundColor: `${theme.colors.primary}10`,
                    border: `1px solid ${theme.colors.primary}20`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                    <span className="text-sm" style={{ color: theme.colors.secondary }}>
                      {depTask.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveDependency(depId)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        
        {dependencies.length === 0 && (
          <p className="text-sm text-center py-3" style={{ color: `${theme.colors.secondary}80` }}>
            No dependencies added
          </p>
        )}
      </div>
    </div>
  )
}

export default TaskDependencies
