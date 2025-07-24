import React, { useState } from 'react'
import { PlusIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import type { Task } from '../../../types'

interface TaskDependenciesProps {
  dependencies: number[]
  availableTasks: Task[]
  setFormData: React.Dispatch<React.SetStateAction<any>>
}

const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  dependencies,
  availableTasks,
  setFormData
}) => {
  const [showSelector, setShowSelector] = useState(false)
  const [selectedDependency, setSelectedDependency] = useState<string>('')

  const handleAddDependency = () => {
    if (selectedDependency && !dependencies.includes(parseInt(selectedDependency))) {
      setFormData((prev: any) => ({
        ...prev,
        dependencies: [...prev.dependencies, parseInt(selectedDependency)]
      }))
      setSelectedDependency('')
      setShowSelector(false)
    }
  }

  const handleRemoveDependency = (depId: number) => {
    setFormData((prev: any) => ({
      ...prev,
      dependencies: prev.dependencies.filter((id: number) => id !== depId)
    }))
  }

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
                This task depends on:
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
                      <div>
                        <span className="text-sm font-medium" style={{ color: '#000000' }}>
                          {depTask?.title || `Task #${depId}`}
                        </span>
                        {depTask && (
                          <span className="text-xs ml-2" style={{ color: theme.colors.text.secondary }}>
                            ({depTask.status})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(depId)}
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
          
          {/* Add dependency selector */}
          {showSelector ? (
            <div className="space-y-3">
              <select
                value={selectedDependency}
                onChange={(e) => setSelectedDependency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a task this depends on...</option>
                {availableTasks
                  .filter(task => !dependencies.includes(task.id))
                  .map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.status})
                    </option>
                  ))
                }
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddDependency}
                  disabled={!selectedDependency}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Dependency
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSelector(false)
                    setSelectedDependency('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSelector(true)}
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
          )}
        </div>
        
        {/* Dependency type info */}
        {dependencies.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            <p>Dependencies are created as Finish-to-Start (FS) by default.</p>
            <p>The selected tasks must be completed before this task can start.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDependencies
