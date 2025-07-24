import React, { useState, useEffect } from 'react'
import { 
  ArrowRightIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import theme from '../../config/theme'
import type { Task, TaskDependency } from '../../types'

interface DependencyVisualizationProps {
  tasks: Task[]
  dependencies: TaskDependency[]
  onDependencyClick?: (dependency: TaskDependency) => void
  onEditDependency?: (dependency: TaskDependency) => void
  notificationStatuses?: Record<number, {
    sent: boolean
    read: boolean
    lastSentAt?: string
  }>
}

const DependencyVisualization: React.FC<DependencyVisualizationProps> = ({
  tasks,
  dependencies,
  onDependencyClick,
  onEditDependency,
  notificationStatuses = {}
}) => {
  const [selectedDependency, setSelectedDependency] = useState<TaskDependency | null>(null)
  const [viewMode, setViewMode] = useState<'graph' | 'timeline'>('graph')

  const getDependencyColor = (type: string): string => {
    switch (type) {
      case 'FS': return theme.colors.primary
      case 'SS': return theme.colors.info
      case 'FF': return theme.colors.warning
      case 'SF': return theme.colors.error
      default: return theme.colors.primary
    }
  }

  const getTaskById = (taskId: number): Task | undefined => {
    return tasks.find(t => t.id === taskId)
  }

  const renderDependencyLine = (dep: TaskDependency, index: number) => {
    const predecessor = getTaskById(dep.predecessorTaskId)
    const successor = getTaskById(dep.successorTaskId)
    
    if (!predecessor || !successor) return null

    const notificationStatus = notificationStatuses[dep.id]
    
    return (
      <div 
        key={dep.id}
        className="relative mb-4 p-4 rounded-lg cursor-pointer transition-all duration-200"
        style={{ 
          backgroundColor: selectedDependency?.id === dep.id 
            ? theme.colors.primary + '20' 
            : theme.colors.primary + '10',
          border: `2px solid ${selectedDependency?.id === dep.id ? theme.colors.primary : 'transparent'}`
        }}
        onClick={() => {
          setSelectedDependency(dep)
          onDependencyClick?.(dep)
        }}
        onMouseEnter={(e) => {
          if (selectedDependency?.id !== dep.id) {
            e.currentTarget.style.backgroundColor = theme.colors.primary + '15'
          }
        }}
        onMouseLeave={(e) => {
          if (selectedDependency?.id !== dep.id) {
            e.currentTarget.style.backgroundColor = theme.colors.primary + '10'
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Predecessor Task */}
            <div className="text-sm">
              <p className="font-medium" style={{ color: theme.colors.primary }}>
                {predecessor.title}
              </p>
              <p className="text-xs opacity-70" style={{ color: theme.colors.primary }}>
                #{predecessor.id}
              </p>
            </div>

            {/* Dependency Arrow */}
            <div className="flex items-center gap-2">
              <div 
                className="px-2 py-1 rounded text-xs font-bold"
                style={{ 
                  backgroundColor: getDependencyColor(dep.type) + '20',
                  color: getDependencyColor(dep.type)
                }}
              >
                {dep.type}
              </div>
              <ArrowRightIcon 
                className="h-5 w-5" 
                style={{ color: getDependencyColor(dep.type) }}
              />
              {dep.lagTime > 0 && (
                <div className="flex items-center gap-1 text-xs" style={{ color: theme.colors.primary }}>
                  <ClockIcon className="h-3 w-3" />
                  {dep.lagTime} {dep.lagUnit}
                </div>
              )}
            </div>

            {/* Successor Task */}
            <div className="text-sm">
              <p className="font-medium" style={{ color: theme.colors.primary }}>
                {successor.title}
              </p>
              <p className="text-xs opacity-70" style={{ color: theme.colors.primary }}>
                #{successor.id}
              </p>
            </div>
          </div>

          {/* Notification Status */}
          <div className="flex items-center gap-2">
            {notificationStatus?.sent ? (
              <div className="flex items-center gap-1">
                <BellIcon 
                  className="h-4 w-4" 
                  style={{ color: notificationStatus.read ? theme.colors.success : theme.colors.warning }}
                />
                <span className="text-xs" style={{ color: theme.colors.primary }}>
                  {notificationStatus.read ? 'Read' : 'Sent'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 opacity-50">
                <BellIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                <span className="text-xs" style={{ color: theme.colors.primary }}>
                  Not sent
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dependency Details (shown when selected) */}
        {selectedDependency?.id === dep.id && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: theme.colors.primary + '30' }}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1" style={{ color: theme.colors.primary }}>
                  Created At
                </p>
                <p className="opacity-70" style={{ color: theme.colors.primary }}>
                  {new Date(dep.createdAt).toLocaleDateString()}
                </p>
              </div>
              {notificationStatus?.lastSentAt && (
                <div>
                  <p className="font-medium mb-1" style={{ color: theme.colors.primary }}>
                    Last Notification
                  </p>
                  <p className="opacity-70" style={{ color: theme.colors.primary }}>
                    {new Date(notificationStatus.lastSentAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            
            {onEditDependency && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditDependency(dep)
                }}
                className="mt-3 px-3 py-1 rounded text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.primary,
                  border: `1px solid ${theme.colors.primary}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary
                  e.currentTarget.style.color = theme.colors.secondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary
                  e.currentTarget.style.color = theme.colors.primary
                }}
              >
                Edit Dependency
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold" style={{ color: theme.colors.primary }}>
          Task Dependencies
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'graph' ? 'shadow-lg' : ''
            }`}
            style={{
              backgroundColor: viewMode === 'graph' ? theme.colors.primary : theme.colors.secondary,
              color: viewMode === 'graph' ? theme.colors.secondary : theme.colors.primary,
              border: `2px solid ${theme.colors.primary}`
            }}
          >
            Graph View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'timeline' ? 'shadow-lg' : ''
            }`}
            style={{
              backgroundColor: viewMode === 'timeline' ? theme.colors.primary : theme.colors.secondary,
              color: viewMode === 'timeline' ? theme.colors.secondary : theme.colors.primary,
              border: `2px solid ${theme.colors.primary}`
            }}
          >
            Timeline View
          </button>
        </div>
      </div>

      {/* Dependencies List */}
      {dependencies.length === 0 ? (
        <div 
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: theme.colors.primary + '10' }}
        >
          <p className="text-sm opacity-70" style={{ color: theme.colors.primary }}>
            No dependencies defined for this project
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep, index) => renderDependencyLine(dep, index))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary + '10' }}>
        <h4 className="text-sm font-bold mb-3" style={{ color: theme.colors.primary }}>
          Dependency Types
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['FS', 'SS', 'FF', 'SF'].map(type => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getDependencyColor(type) }}
              />
              <span className="text-xs" style={{ color: theme.colors.primary }}>
                {type === 'FS' && 'Finish-to-Start'}
                {type === 'SS' && 'Start-to-Start'}
                {type === 'FF' && 'Finish-to-Finish'}
                {type === 'SF' && 'Start-to-Finish'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DependencyVisualization
