import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  ArrowRightIcon, 
  ClockIcon, 
  UserGroupIcon, 
  ExclamationCircleIcon, 
  CheckIcon,
  ChevronLeftIcon,
  BellIcon,
  LinkIcon
 } from '@heroicons/react/24/outline'
import theme from '../../config/theme'
import type { Task, User, Department } from '../../types'

interface DependencyType {
  code: 'FS' | 'SS' | 'FF' | 'SF'
  name: string
  description: string
  icon: React.ReactNode
}

interface NotificationRecipient {
  id: number
  name: string
  email: string
  role: string
}

interface DependencySelectorProps {
  onDependencySelected: (dependency: any) => void
  currentTaskId: number
  availableTasks?: Task[]
  projectMembers?: NotificationRecipient[]
}

const dependencyTypes: DependencyType[] = [
  {
    code: 'FS',
    name: 'Finish-to-Start',
    description: 'This task cannot start until the selected task finishes',
    icon: <span className="text-2xl">→</span>
  },
  {
    code: 'SS',
    name: 'Start-to-Start',
    description: 'This task cannot start until the selected task starts',
    icon: <span className="text-2xl">⇉</span>
  },
  {
    code: 'FF',
    name: 'Finish-to-Finish',
    description: 'This task cannot finish until the selected task finishes',
    icon: <span className="text-2xl">⇶</span>
  },
  {
    code: 'SF',
    name: 'Start-to-Finish',
    description: 'This task cannot finish until the selected task starts',
    icon: <span className="text-2xl">↗</span>
  }
]

const DependencySelector: React.FC<DependencySelectorProps> = ({
  onDependencySelected,
  currentTaskId,
  availableTasks = [],
  projectMembers = []
}) => {
  const [step, setStep] = useState(1)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dependencyType, setDependencyType] = useState<DependencyType | null>(null)
  const [lagTime, setLagTime] = useState<number>(0)
  const [lagUnit, setLagUnit] = useState<'hours' | 'days'>('hours')
  const [notificationRecipients, setNotificationRecipients] = useState<NotificationRecipient[]>([])
  const [notificationMessage, setNotificationMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Filter tasks based on search query
  const filteredTasks = availableTasks.filter(task =>
    task.id !== currentTaskId &&
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Generate notification preview
  useEffect(() => {
    if (selectedTask && dependencyType) {
      const defaultMessage = `Task dependency created: This task has a ${dependencyType.name} dependency with "${selectedTask.title}".`
      setNotificationMessage(defaultMessage)
      
      // Auto-select notification recipients
      const defaultRecipients = projectMembers.filter(member => 
        member.role === 'owner' || member.role === 'manager'
      )
      setNotificationRecipients(defaultRecipients)
    }
  }, [selectedTask, dependencyType, projectMembers])

  const validateDependency = (): boolean => {
    const errors: string[] = []
    
    if (!selectedTask) {
      errors.push('Please select a task')
    }
    
    if (!dependencyType) {
      errors.push('Please select a dependency type')
    }
    
    if (lagTime < 0) {
      errors.push('Lag time cannot be negative')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleTaskSelection = (task: Task) => {
    setSelectedTask(task)
    setStep(2)
    setValidationErrors([])
  }

  const handleDependencyTypeSelection = (type: DependencyType) => {
    setDependencyType(type)
    setStep(3)
    setValidationErrors([])
  }

  const handleRecipientToggle = (recipient: NotificationRecipient) => {
    setNotificationRecipients(prev => {
      const exists = prev.some(r => r.id === recipient.id)
      if (exists) {
        return prev.filter(r => r.id !== recipient.id)
      }
      return [...prev, recipient]
    })
  }

  const handleFinish = () => {
    if (validateDependency() && selectedTask && dependencyType) {
      onDependencySelected({
        predecessorTaskId: selectedTask.id,
        successorTaskId: currentTaskId,
        type: dependencyType.code,
        lagTime: lagTime,
        lagUnit: lagUnit,
        notificationRecipients: notificationRecipients.map(r => r.id),
        notificationMessage: notificationMessage
      })
    }
  }

  const goToStep = (stepNumber: number) => {
    if (stepNumber < step) {
      setStep(stepNumber)
    }
  }

  return (
    <div className="w-full" style={{ backgroundColor: theme.colors.background.paper }}>
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6 px-2">
        {[1, 2, 3, 4].map((stepNum) => (
          <React.Fragment key={stepNum}>
            <div 
              className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                step >= stepNum ? 'opacity-100' : 'opacity-50'
              }`}
              onClick={() => goToStep(stepNum)}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                  step === stepNum 
                    ? 'shadow-lg transform scale-110' 
                    : ''
                }`}
                style={{
                  backgroundColor: step >= stepNum ? theme.colors.primary : theme.colors.background.paper,
                  color: step >= stepNum ? theme.colors.text.primary : theme.colors.text.secondary,
                  border: `2px solid ${theme.colors.primary}`
                }}
              >
                {stepNum}
              </div>
              <span 
                className="text-xs mt-2 font-medium"
                style={{ color: theme.colors.text.primary }}
              >
                {stepNum === 1 && 'Select Task'}
                {stepNum === 2 && 'Type'}
                {stepNum === 3 && 'Configure'}
                {stepNum === 4 && 'Review'}
              </span>
            </div>
            {stepNum < 4 && (
              <div 
                className="flex-1 h-0.5 transition-all duration-300"
                style={{
                  backgroundColor: step > stepNum ? theme.colors.primary : theme.colors.primary + '30'
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.error + '20' }}>
          {validationErrors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm" style={{ color: theme.colors.error }}>
              <ExclamationCircleIcon className="h-4 w-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Task Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.text.primary }}>
              Select Predecessor Task
            </h3>
            <p className="text-sm opacity-80 mb-4" style={{ color: theme.colors.text.primary }}>
              Choose the task that this task depends on
            </p>
          </div>
          
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{ 
              backgroundColor: theme.colors.background.default,
              border: `1px solid ${theme.colors.primary}30`
            }}
          >
            <MagnifyingGlassIcon className="h-5 w-5" style={{ color: theme.colors.text.secondary }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: theme.colors.text.primary }}
            />
          </div>      {/* Note about task visibility */}
      {filteredTasks.length > 0 && (
        <p className="text-xs opacity-60 mb-2" style={{ color: theme.colors.text.secondary }}>
          Showing tasks from the current board and your created tasks
        </p>
      )}



          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-center py-8 text-sm opacity-60" style={{ color: theme.colors.text.primary }}>
                No tasks found
              </p>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:transform hover:translate-x-1"
                  style={{ 
                    backgroundColor: theme.colors.background.default,
                    border: `1px solid ${theme.colors.primary}20`
                  }}
                  onClick={() => handleTaskSelection(task)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary
                    e.currentTarget.style.borderColor = theme.colors.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.background.default
                    e.currentTarget.style.borderColor = theme.colors.primary + '20'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium" style={{ color: theme.colors.text.primary }}>
                        {task.title}
                      </h4>
                      <p className="text-xs opacity-70 mt-1" style={{ color: theme.colors.text.primary }}>
                        ID: #{task.id} • Status: {task.status}
                      </p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4" style={{ color: theme.colors.text.primary }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 2: Dependency Type Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: theme.colors.text.primary }}>
              <LinkIcon className="h-5 w-5" style={{ color: theme.colors.text.primary }} />
              Select Dependency Type
            </h3>
            <p className="text-sm opacity-80 mb-4" style={{ color: theme.colors.text.primary }}>
              Choose how these tasks are related
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dependencyTypes.map(type => (
              <div
                key={type.code}
                className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:transform hover:scale-105"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  border: `2px solid ${theme.colors.primary}`
                }}
                onClick={() => handleDependencyTypeSelection(type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary
                  e.currentTarget.style.borderColor = theme.colors.secondary
                  const icons = e.currentTarget.querySelectorAll('span, h4, p')
                  icons.forEach(el => {
                    if (el instanceof HTMLElement) {
                      el.style.color = theme.colors.primary
                    }
                  })
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary
                  e.currentTarget.style.borderColor = theme.colors.primary
                  const icons = e.currentTarget.querySelectorAll('span, h4, p')
                  icons.forEach(el => {
                    if (el instanceof HTMLElement) {
                      el.style.color = theme.colors.text.primary
                    }
                  })
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div style={{ color: theme.colors.text.primary }}>{type.icon}</div>
                  <h4 className="font-bold" style={{ color: theme.colors.text.primary }}>
                    {type.name}
                  </h4>
                </div>
                <p className="text-xs opacity-80" style={{ color: theme.colors.text.primary }}>
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Configuration */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.text.primary }}>
              Configure Dependency
            </h3>
            <p className="text-sm opacity-80 mb-4" style={{ color: theme.colors.text.primary }}>
              Set lag time and notification preferences
            </p>
          </div>

          {/* Lag Time */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: theme.colors.background.default }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="h-5 w-5" style={{ color: theme.colors.text.primary }} />
              <h4 className="font-medium" style={{ color: theme.colors.text.primary }}>Lag Time</h4>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={lagTime}
                onChange={(e) => setLagTime(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 rounded-md text-center font-medium"
                style={{
                  backgroundColor: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.primary}30`
                }}
              />
              <select 
                value={lagUnit} 
                onChange={(e) => setLagUnit(e.target.value as 'hours' | 'days')}
                className="px-3 py-2 rounded-md font-medium cursor-pointer"
                style={{
                  backgroundColor: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.primary}30`
                }}
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <p className="text-xs mt-2 opacity-70" style={{ color: theme.colors.text.primary }}>
              Time delay between predecessor and successor tasks
            </p>
          </div>

          {/* Notification Recipients */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: theme.colors.background.default }}
          >
            <div className="flex items-center gap-2 mb-3">
              <UserGroupIcon className="h-5 w-5" style={{ color: theme.colors.text.primary }} />
              <h4 className="font-medium" style={{ color: theme.colors.text.primary }}>
                Notification Recipients
              </h4>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {projectMembers.map(member => (
                <label 
                  key={member.id} 
                  className="flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-200"
                  style={{ backgroundColor: theme.colors.background.paper }}
                >
                  <input
                    type="checkbox"
                    checked={notificationRecipients.some(r => r.id === member.id)}
                    onChange={() => handleRecipientToggle(member)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: theme.colors.primary }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: theme.colors.text.primary }}>
                      {member.name}
                    </p>
                    <p className="text-xs opacity-70" style={{ color: theme.colors.text.primary }}>
                      {member.role} • {member.email}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notification Message */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: theme.colors.background.default }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BellIcon className="h-5 w-5" style={{ color: theme.colors.text.primary }} />
              <h4 className="font-medium" style={{ color: theme.colors.text.primary }}>
                Notification Message
              </h4>
            </div>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm"
              rows={3}
              placeholder="Custom notification message..."
              style={{
                backgroundColor: theme.colors.background.paper,
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.primary}30`,
                resize: 'none'
              }}
            />
          </div>

          <button 
            onClick={() => setStep(4)}
            className="w-full py-3 rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.text.primary,
              border: `2px solid ${theme.colors.primary}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary
              e.currentTarget.style.color = theme.colors.primary
              e.currentTarget.style.borderColor = theme.colors.secondary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary
              e.currentTarget.style.color = theme.colors.text.primary
              e.currentTarget.style.borderColor = theme.colors.primary
            }}
          >
            Continue to Review
          </button>
        </div>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.text.primary }}>
              Review Dependency
            </h3>
            <p className="text-sm opacity-80 mb-4" style={{ color: theme.colors.text.primary }}>
              Confirm your dependency configuration
            </p>
          </div>

          <div 
            className="p-4 rounded-lg space-y-3"
            style={{ backgroundColor: theme.colors.background.default }}
          >
            <div className="flex items-start gap-2">
              <LinkIcon className="h-4 w-4 mt-0.5" style={{ color: theme.colors.text.primary }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                  Dependency
                </p>
                <p className="text-sm opacity-80" style={{ color: theme.colors.text.primary }}>
                  {selectedTask?.title} ({dependencyType?.name})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ClockIcon className="h-4 w-4 mt-0.5" style={{ color: theme.colors.text.primary }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                  Lag Time
                </p>
                <p className="text-sm opacity-80" style={{ color: theme.colors.text.primary }}>
                  {lagTime} {lagUnit}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <UserGroupIcon className="h-4 w-4 mt-0.5" style={{ color: theme.colors.text.primary }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                  Recipients ({notificationRecipients.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {notificationRecipients.map(r => (
                    <span 
                      key={r.id} 
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: theme.colors.background.paper,
                        color: theme.colors.text.primary,
                        border: `1px solid ${theme.colors.primary}30`
                      }}
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <BellIcon className="h-4 w-4 mt-0.5" style={{ color: theme.colors.text.primary }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                  Notification Preview
                </p>
                <p className="text-sm opacity-80 italic" style={{ color: theme.colors.text.primary }}>
                  "{notificationMessage}"
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: 'transparent',
                color: theme.colors.text.primary,
                border: `2px solid ${theme.colors.primary}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ChevronLeftIcon className="h-5 w-5 inline mr-1" />
              Back
            </button>
            <button 
              onClick={handleFinish}
              className="flex-1 py-3 rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105 flex items-center justify-center gap-2"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.text.primary,
                border: `2px solid ${theme.colors.primary}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary
                e.currentTarget.style.color = theme.colors.primary
                e.currentTarget.style.borderColor = theme.colors.secondary
                e.currentTarget.style.boxShadow = `0 0 20px ${theme.colors.primary}60`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary
                e.currentTarget.style.color = theme.colors.text.primary
                e.currentTarget.style.borderColor = theme.colors.primary
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <CheckIcon className="h-5 w-5" />
              Create Dependency
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DependencySelector
