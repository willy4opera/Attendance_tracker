import React from 'react'
import { PlusIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import type { Task } from '../../../types'

interface TaskDependenciesProps {
  dependencies: number[]
  availableTasks: Task[]
  onShowDependencySelector: () => void
  onRemoveDependency: (depId: number) => void
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
        Task Dependencies
      </h4>
      
      <div className="space-y-4">
        <div>
          {/* Current dependencies list */}
          {dependencies && dependencies.length > 0 && (
            <div className="mb-3">
              <p className="text-sm mb-2" style={{ color: theme.colors.text.secondary }}>
                Selected dependencies:
              </p>
              <div className="space-y-2">
                {dependencies.map((depId) => {
                  const depTask = availableTasks.find(t => t.id === depId)
                  return (
                    <div 
                      key={depId} 
                      className="flex items-center justify-between p-3 rounded-lg" 
                      style={{ 
                        backgroundColor: '#f5f5f5',
                        border: `1px solid ${theme.colors.secondary}`
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: '#000000' }}>
                        {depTask?.title || `Task #${depId}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveDependency(depId)}
                        className="p-1 rounded hover:bg-red-100 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Add dependency button */}
          <button
            type="button"
            onClick={onShowDependencySelector}
            className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#f5f5f5',
              color: '#000000',
              border: `2px solid ${theme.colors.secondary}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary
              e.currentTarget.style.color = '#000000'
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.color = '#000000'
              e.currentTarget.style.borderColor = theme.colors.secondary
            }}
          >
            <PlusIcon className="h-5 w-5" />
            Add Task Dependency
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskDependencies
