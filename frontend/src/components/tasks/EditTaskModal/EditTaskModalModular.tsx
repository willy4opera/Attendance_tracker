import React, { useState, useEffect } from 'react'
import {
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { useProjects } from '../../../hooks/useProjects'
import { useBoards } from '../../../hooks/useBoards'
import { useTask, useTasks } from '../../../hooks/useTasks'
import taskService from '../../../services/taskService';
import type { UpdateTaskData } from '../../../services/taskService'
import type { User, Department, Project, Board, Task } from '../../../types'
import { showToast } from '../../../utils/toast'
import theme from '../../../config/theme'
import Swal from 'sweetalert2'

// Import modular components
import BasicTaskInfo from './BasicTaskInfo'
import ProjectBoardSelection from './ProjectBoardSelection'
import TaskDatesTime from './TaskDatesTime'
import TaskLabels from './TaskLabels'
import TaskAssignment from './TaskAssignment'
import TaskAssignmentDisplay from './TaskAssignmentDisplay'
import TaskLocationInfo from './TaskLocationInfo'
import TaskDependencies from './TaskDependencies'
import TaskDependenciesDisplay from './TaskDependenciesDisplay'
import DependencySelectorModal from '../CreateTaskModal/DependencySelectorModal'

interface TaskList {
  id: number
  name: string
  boardId: number
  position: number
}

interface ExtendedUpdateTaskData extends UpdateTaskData {
  dependencies?: number[]
  boardId?: number
  projectId?: number
}

interface EditTaskModalProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const EditTaskModalModular: React.FC<EditTaskModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { task, loading: isLoading, error } = useTask(taskId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditingAssignment, setIsEditingAssignment] = useState(false)
  const [isEditingDependencies, setIsEditingDependencies] = useState(false)

  const [formData, setFormData] = useState<ExtendedUpdateTaskData>({
    title: '',
    description: '',
    priority: 'medium',
    labels: [],
    assignedTo: [],
    assignedDepartments: [],
    taskListId: 0,
    dependencies: [],
    startDate: undefined,
    dueDate: undefined,
    estimatedHours: undefined,
    actualHours: undefined,
    status: 'todo',
    coverImage: undefined,
    coverColor: undefined,
    customFields: {}
  })

  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedBoard, setSelectedBoard] = useState<string>('')
  const [availableLists, setAvailableLists] = useState<TaskList[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDependencySelector, setShowDependencySelector] = useState(false)

  // Hooks
  const { projects } = useProjects({ limit: 100 })
  const { boards } = useBoards({ 
    projectId: selectedProject || undefined,
    limit: 100 
  })
  const { tasks: availableTasks } = useTasks({ limit: 100 })

  // Fetch board data with lists when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetchBoardLists(selectedBoard)
    }
  }, [selectedBoard])

// Main effect to populate form when task data is loaded
  useEffect(() => {
    const loadTaskData = async () => {
      if (task) {
        console.log('Loading task data:', task)
        
        // Basic task info
        setFormData({
          title: task.title || '',
          description: task.description || '',
          priority: task.priority || 'medium',
          status: task.status || 'todo',
          labels: task.labels || [],
          assignedTo: [],  // Will be set after fetching users
          assignedDepartments: task.assignedDepartments || [],
          taskListId: task.taskListId || 0,
          startDate: task.startDate,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          coverImage: task.coverImage,
          coverColor: task.coverColor,
          customFields: task.customFields || {},
          dependencies: task.dependencies || []
        })

        // Process assigned users - handle both IDs and objects
        if (task.assignedTo && Array.isArray(task.assignedTo)) {
          const userPromises: Promise<User | null>[] = [];
          
          for (const userItem of task.assignedTo) {
            if (typeof userItem === 'object' && userItem !== null) {
              // Already have user object
              userPromises.push(Promise.resolve(userItem as User));
            } else if (typeof userItem === 'number' || typeof userItem === 'string') {
              // Have user ID, need to fetch
              userPromises.push(
                fetch(`/api/v1/users/${userItem}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                  }
                })
                .then(res => res.json())
                .then(data => data.success && data.data ? data.data : null)
                .catch(err => {
                  console.error(`Failed to fetch user ${userItem}:`, err);
                  return null;
                })
              );
            }
          }
          
          const users = await Promise.all(userPromises);
          const validUsers = users.filter(user => user !== null) as User[];
          
          if (validUsers.length > 0) {
            setSelectedUsers(validUsers);
            setFormData(prev => ({
              ...prev,
              assignedTo: validUsers.map(user => user.id || user._id)
            }));
          }
        }

// Process assigned departments - handle both IDs and objects
        if (task.assignedDepartments && Array.isArray(task.assignedDepartments)) {
          const deptPromises: Promise<Department | null>[] = [];
          
          // First, fetch all departments if we have IDs to look up
          const hasIds = task.assignedDepartments.some(item => 
            typeof item === 'number' || typeof item === 'string'
          );
          
          let allDepartments: Department[] = [];
          if (hasIds) {
            try {
              const response = await fetch('/api/v1/departments', {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
              });
              const data = await response.json();
              if (data.success && data.data && data.data.departments) {
                allDepartments = data.data.departments;
              }
            } catch (err) {
          console.log("Fetched departments:", allDepartments);
              console.error('Failed to fetch departments:', err);
            }
          }
          
          for (const deptItem of task.assignedDepartments) {
            if (typeof deptItem === 'object' && deptItem !== null) {
              // Already have department object
              deptPromises.push(Promise.resolve(deptItem as Department));
            } else if (typeof deptItem === 'number' || typeof deptItem === 'string') {
              // Have department ID, find it in the fetched list
              const dept = allDepartments.find(d => 
                d.id === deptItem || d.id === Number(deptItem)
              );
              deptPromises.push(Promise.resolve(dept || null));
            }
          }
          
          const departments = await Promise.all(deptPromises);
          const validDepartments = departments.filter(dept => dept !== null) as Department[];
          
          if (validDepartments.length > 0) {
            setSelectedDepartments(validDepartments);
          }
        }

        // Set project and board from the task's list hierarchy
        if (task.list?.board) {
          const board = task.list.board
          setSelectedBoard(board.id.toString())
          
          // If the board has a projectId, set it
          if ((board as any).projectId) {
            setSelectedProject((board as any).projectId.toString())
          }
        } else if (task.boardId) {
          setSelectedBoard(task.boardId.toString())
        }

        // Set the list
        if (task.taskListId) {
          setFormData(prev => ({
            ...prev,
            taskListId: task.taskListId
          }))
        }
      }
    };

    loadTaskData();
  }, [task])

  // Update assignedTo when selectedUsers changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      assignedTo: selectedUsers.map(user => {
        const userId = user.id || user._id || (user as any).userId
        if (typeof userId === 'number') {
          return userId
        } else if (typeof userId === 'string') {
          return parseInt(userId) || 0
        }
        return 0
      }).filter(id => id > 0)
    }))
  }, [selectedUsers])

  const fetchBoardLists = async (boardId: string) => {
    try {
      const response = await fetch(`/api/v1/boards/${boardId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      const data = await response.json()
      if (data.success && data.data.lists) {
        setAvailableLists(data.data.lists)
        
        // If task already has a taskListId, ensure it's in the available lists
        if (task?.taskListId) {
          const listExists = data.data.lists.some(
            (list: TaskList) => list.id === task.taskListId
          )
          if (!listExists) {
            console.warn('Task list not found in board lists')
          }
        }
      }
    } catch (error) {
      console.error('Error fetching board lists:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    let processedValue: any = value
    
    // Handle numeric fields
    if (name === 'taskListId' || name === 'estimatedHours' || name === 'actualHours') {
      processedValue = value ? parseInt(value) : undefined
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
    setSelectedBoard('')
    setFormData(prev => ({ ...prev, taskListId: 0 }))
    setAvailableLists([])
  }

  const handleBoardChange = (boardId: string) => {
    setSelectedBoard(boardId)
    setFormData(prev => ({ ...prev, taskListId: 0 }))
  }

  const handleAddLabel = () => {
    if (newLabel.trim() && !formData.labels?.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...(prev.labels || []), newLabel.trim()]
      }))
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (label: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels?.filter(l => l !== label) || []
    }))
  }

  const handleDepartmentSelection = (departments: Department[]) => {
    setSelectedDepartments(departments)
    setFormData(prev => ({
      ...prev,
      assignedDepartments: departments.map(dept => dept.id)
    }))
  }

  // Handle single dependency addition (matches DependencySelectorModal interface)
  const handleAddDependency = (depId: number) => {
    if (!formData.dependencies?.includes(depId)) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...(prev.dependencies || []), depId]
      }))
    }
    setShowDependencySelector(false)
  }

  const handleRemoveDependency = (taskId: number, type?: 'predecessor' | 'successor') => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies?.filter(id => id !== taskId) || []
    }))
  }

  // Prepare dependency data for display component

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required'
    }

    if (!selectedProject) {
      newErrors.project = 'Please select a project'
    }

    if (!selectedBoard) {
      newErrors.board = 'Please select a board'
    }

    if (!formData.taskListId) {
      newErrors.taskListId = 'Please select a task list'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields',
        confirmButtonColor: theme.colors.primary,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      })
      return
    }

    // Show confirmation dialog
    const confirmResult = await Swal.fire({
      title: 'Update Task?',
      html: `
        <div style="text-align: left;">
          <p><strong>Title:</strong> ${formData.title}</p>
          ${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}
          <p><strong>Priority:</strong> ${formData.priority}</p>
          <p><strong>Status:</strong> ${formData.status}</p>
          ${formData.startDate ? `<p><strong>Start Date:</strong> ${new Date(formData.startDate).toLocaleDateString()}</p>` : ''}
          ${formData.dueDate ? `<p><strong>Due Date:</strong> ${new Date(formData.dueDate).toLocaleDateString()}</p>` : ''}
          ${formData.estimatedHours ? `<p><strong>Estimated Hours:</strong> ${formData.estimatedHours}</p>` : ''}
          ${formData.actualHours ? `<p><strong>Actual Hours:</strong> ${formData.actualHours}</p>` : ''}
          ${formData.labels && formData.labels.length > 0 ? `<p><strong>Labels:</strong> ${formData.labels.join(', ')}</p>` : ''}
          ${selectedUsers.length > 0 ? `<p><strong>Assigned to:</strong> ${selectedUsers.map(u => u.firstName + ' ' + u.lastName).join(', ')}</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: theme.colors.primary,
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
      background: theme.colors.background.paper,
      color: theme.colors.text.primary,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3 font-semibold',
        cancelButton: 'rounded-xl px-6 py-3 font-semibold'
      }
    })

    if (!confirmResult.isConfirmed) return

    setIsSubmitting(true)
    try {
      // Prepare update data - include board and project IDs
      const updateData: ExtendedUpdateTaskData = {
        ...formData,
        boardId: parseInt(selectedBoard),
        projectId: parseInt(selectedProject)
      }
      
      // Debug logging
      console.log('Update request data:', {
        updateData,
        assignedTo: updateData.assignedTo,
        selectedUsers: selectedUsers.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))
      })

      await taskService.updateTask(taskId, updateData)
      
      Swal.fire({
        icon: 'success',
        title: 'Task Updated!',
        text: 'Your task has been updated successfully.',
        showConfirmButton: false,
        timer: 2000,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        iconColor: theme.colors.primary,
        customClass: {
          popup: 'rounded-2xl'
        }
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating task:', error)
      console.error('Request data:', formData)
      console.error('Selected users:', selectedUsers)
      console.error('FormData assignedTo:', formData.assignedTo)
      
      // Log validation errors if available
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors)
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update task. Please try again.',
        confirmButtonColor: theme.colors.primary,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedProjectName = () => {
    return projects.find(p => p.id.toString() === selectedProject)?.name || ''
  }

  const getSelectedBoardName = () => {
    return boards.find(b => b.id.toString() === selectedBoard)?.name || ''
  }

  if (!isOpen) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
              <span style={{ color: theme.colors.secondary }}>Loading task details...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="text-red-600">
              <p className="font-medium">Error loading task</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 rounded-xl text-white transition-colors"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header with gradient */}
          <div 
            className="relative p-6 pb-4 flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)`
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <PencilIcon className="w-full h-full" style={{ color: theme.colors.primary }} />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: theme.colors.primary + '20' }}
                >
                  <PencilIcon className="w-6 h-6" style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    Edit Task
                  </h2>
                  <p className="text-sm mt-1" style={{ color: theme.colors.primary + '80' }}>
                    Update task details and properties
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="bg-white px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <BasicTaskInfo
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                />

                {/* Toggle between display and edit mode for dependencies */}
                {isEditingDependencies ? (
                  <TaskDependencies
                    dependencies={formData.dependencies || []}
                    availableTasks={availableTasks}
                    onShowDependencySelector={() => setShowDependencySelector(true)}
                    onRemoveDependency={handleRemoveDependency}
                  />
                ) : (
                  <TaskDependenciesDisplay
                    taskId={parseInt(taskId)}
                    onAddDependency={() => {
                      setIsEditingDependencies(true)
                      setShowDependencySelector(true)
                    }}
                    onRemoveDependency={handleRemoveDependency}
                    isEditMode={true}
                    availableTasks={availableTasks}
                    projectMembers={selectedUsers.map(user => ({ 
                      id: user.id || user._id || (user as any).userId || 0, 
                      name: user.name || user.username || "Unknown", 
                      email: user.email || "", 
                      role: "member" 
                    }))}
                  />
                )}
              </div>

              {/* Middle Column */}
              <div className="space-y-6">
                <ProjectBoardSelection
                  formData={formData}
                  selectedProject={selectedProject}
                  selectedBoard={selectedBoard}
                  projects={projects}
                  boards={boards}
                  availableLists={availableLists}
                  errors={errors}
                  handleProjectChange={handleProjectChange}
                  handleBoardChange={handleBoardChange}
                  handleInputChange={handleInputChange}
                />

                <TaskDatesTime
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Toggle between display and edit mode for assignment */}
                {isEditingAssignment ? (
                  <TaskAssignment
                    selectedUsers={selectedUsers}
                    selectedDepartments={selectedDepartments}
                    onUsersChange={setSelectedUsers}
                    onDepartmentsChange={handleDepartmentSelection}
                  />
                ) : (
                  <TaskAssignmentDisplay
                    assignedUsers={selectedUsers}
                    assignedDepartments={selectedDepartments}
                    onEditUsers={() => setIsEditingAssignment(true)}
                    onEditDepartments={() => setIsEditingAssignment(true)}
                    onUpdateAssignedUsers={setSelectedUsers}
                    boardId={selectedBoard}
                  />
                )}

                <TaskLabels
                  labels={formData.labels || []}
                  newLabel={newLabel}
                  setNewLabel={setNewLabel}
                  handleAddLabel={handleAddLabel}
                  handleRemoveLabel={handleRemoveLabel}
                />

                <TaskLocationInfo
                  selectedProject={selectedProject}
                  selectedBoard={selectedBoard}
                  taskListId={formData.taskListId}
                  getSelectedProjectName={getSelectedProjectName}
                  getSelectedBoardName={getSelectedBoardName}
                  availableLists={availableLists}
                />
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mt-6 p-4 rounded-xl flex items-center gap-2" style={{ backgroundColor: '#fee', color: '#c00' }}>
                <ExclamationCircleIcon className="h-5 w-5" />
                <p className="text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t flex justify-end space-x-3" style={{ borderColor: theme.colors.border }}>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: '#d9d9d9',
                  color: theme.colors.secondary
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center hover:opacity-90"
                style={{ backgroundColor: theme.colors.primary }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = theme.colors.secondary
                    e.currentTarget.style.color = theme.colors.primary
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = theme.colors.primary
                    e.currentTarget.style.color = '#ffffff'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: theme.colors.primary }}></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Update Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dependency Selector Modal */}
      {showDependencySelector && (
        <DependencySelectorModal
          isOpen={showDependencySelector}
          onClose={() => setShowDependencySelector(false)}
          onDependencySelected={handleAddDependency}
          currentTaskId={parseInt(taskId)}
          availableTasks={availableTasks.filter(t => t.id !== parseInt(taskId))}
          projectMembers={selectedUsers.map(user => ({ 
            id: user.id || user._id || (user as any).userId || 0, 
            name: user.name || user.username || 'Unknown', 
            email: user.email || '', 
            role: 'member' 
          }))}
        />
      )}
    </div>
  )
}

export default EditTaskModalModular
