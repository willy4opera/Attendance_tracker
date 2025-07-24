import React, { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  CheckIcon, 
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  FolderIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  PlusIcon,
  TrashIcon,
  Squares2X2Icon,
  TagIcon,
  ExclamationCircleIcon,
  ClockIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import theme from '../../../config/theme'
import Swal from 'sweetalert2'

// Import services
import { type CreateTaskData } from '../../../services/taskService'
import { dependencyService } from '../../../services/dependencyService'

// Import components
import BasicTaskInfo from './BasicTaskInfo'
import ProjectBoardSelection from './ProjectBoardSelection'
import TaskAssignment from './TaskAssignment'
import TaskDatesTime from './TaskDatesTime'
import TaskLabels from './TaskLabels'
import TaskDependencies from './TaskDependencies'
import DependencySelectorModal from './DependencySelectorModal'

// Import hooks
import { useProjects } from '../../../hooks/useProjects'
import { useBoards } from '../../../hooks/useBoards'

// Import types
import type { Task, Project, Board, User, Department } from '../../../types'

interface TaskList {
  id: number
  name: string
  boardId: number
  position: number
}

interface ExtendedCreateTaskData extends CreateTaskData {
  isComplete?: boolean
  dependencies?: number[]
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (task: any) => void
  initialProjectId?: string
  initialBoardId?: string
  initialListId?: string
}

const CreateTaskModalModular: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProjectId,
  initialBoardId,
  initialListId
}) => {
  // Form state
  const [formData, setFormData] = useState<ExtendedCreateTaskData>({
    title: '',
    description: '',
    taskListId: initialListId ? parseInt(initialListId) : 0,
    priority: 'medium',
    labels: [],
    assignedTo: [],
    assignedDepartments: [],
    startDate: '',
    dueDate: '',
    estimatedHours: undefined,
    status: 'todo',
    isComplete: false,
    dependencies: []
  })

  // Selection states
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || '')
  const [selectedBoard, setSelectedBoard] = useState<string>(initialBoardId || '')
  const [availableLists, setAvailableLists] = useState<TaskList[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])
  
  // UI state
  const [newLabel, setNewLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDependencySelector, setShowDependencySelector] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Hooks
  const { projects } = useProjects({ limit: 100 })
  const { boards } = useBoards({ 
    projectId: selectedProject || undefined,
    limit: 100 
  })

  // Fetch board data when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetchBoardData(selectedBoard)
    }
  }, [selectedBoard])

  const fetchBoardData = async (boardId: string) => {
    try {
      const response = await fetch(`/api/v1/boards/${boardId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      const data = await response.json()
      if (data.success && data.data.lists) {
        setAvailableLists(data.data.lists)
        // Extract all tasks from all lists
        const allTasks = data.data.lists.flatMap((list: any) => list.tasks || [])
        setAvailableTasks(allTasks)
      }
    } catch (error) {
      console.error('Error fetching board data:', error)
    }
  }

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : Number(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'taskListId' ? parseInt(value) : value
      }))
    }
    
    // Clear error for the field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value
    setSelectedProject(projectId)
    setSelectedBoard('')
    setFormData(prev => ({ ...prev, taskListId: 0, dependencies: [] }))
    setAvailableLists([])
    setAvailableTasks([])
  }

  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const boardId = e.target.value
    setSelectedBoard(boardId)
    setFormData(prev => ({ ...prev, taskListId: 0, dependencies: [] }))
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

  const handleRemoveLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels?.filter(label => label !== labelToRemove) || []
    }))
  }

  const handleRemoveDependency = (depId: number) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies?.filter(id => id !== depId) || []
    }))
  }

  const handleAddDependency = (dependencyId: number) => {
    if (!formData.dependencies?.includes(dependencyId)) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...(prev.dependencies || []), dependencyId]
      }))
    }
  }

  const validateForm = () => {
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

    if (!formData.taskListId || formData.taskListId === 0) {
      newErrors.list = 'Please select a list'
    }

    // Validate dates
    if (formData.startDate && formData.dueDate) {
      const startDate = new Date(formData.startDate)
      const dueDate = new Date(formData.dueDate)
      if (startDate > dueDate) {
        newErrors.dueDate = 'Due date must be after start date'
      }
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
        color: theme.colors.text.primary
      })
      return
    }

    // Show confirmation dialog
    const confirmResult = await Swal.fire({
      title: 'Create Task?',
      html: `
        <div style="text-align: left;">
          <p><strong>Title:</strong> ${formData.title}</p>
          ${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}
          <p><strong>Priority:</strong> ${formData.priority}</p>
          <p><strong>Status:</strong> ${formData.isComplete ? 'Complete' : formData.status}</p>
          ${formData.startDate ? `<p><strong>Start Date:</strong> ${new Date(formData.startDate).toLocaleDateString()}</p>` : ''}
          ${formData.dueDate ? `<p><strong>Due Date:</strong> ${new Date(formData.dueDate).toLocaleDateString()}</p>` : ''}
          ${formData.estimatedHours ? `<p><strong>Estimated Hours:</strong> ${formData.estimatedHours}</p>` : ''}
          ${selectedUsers.length > 0 ? `<p><strong>Assigned to:</strong> ${selectedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}</p>` : ''}
          ${selectedDepartments.length > 0 ? `<p><strong>Assigned departments:</strong> ${selectedDepartments.map(d => d.name).join(', ')}</p>` : ''}
          ${formData.dependencies && formData.dependencies.length > 0 ? `<p><strong>Dependencies:</strong> ${formData.dependencies.length} task(s)</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: theme.colors.secondary,
      cancelButtonColor: theme.colors.primary,
      confirmButtonText: 'Yes, create it!',
      cancelButtonText: 'Cancel',
      background: theme.colors.background.paper,
      color: theme.colors.text.primary
    })

    if (!confirmResult.isConfirmed) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Step 1: Create the task without dependencies
      const taskData: CreateTaskData = {
        title: formData.title,
        description: formData.description,
        taskListId: formData.taskListId,
        priority: formData.priority,
        labels: formData.labels,
        dueDate: formData.dueDate,
        startDate: formData.startDate,
        assignedTo: selectedUsers.map(u => u.id),
        assignedDepartments: selectedDepartments.map(d => d.id),
        estimatedHours: formData.estimatedHours,
        status: formData.isComplete ? 'done' : formData.status
      }

      const createdTask = await taskService.createTask(taskData)

      // Step 2: Create dependencies if any
      if (formData.dependencies && formData.dependencies.length > 0) {
        const dependencyPromises = formData.dependencies.map(predecessorId => 
          dependencyService.createDependency({
            predecessorTaskId: predecessorId,
            successorTaskId: createdTask.id,
            dependencyType: 'FS', // Default to Finish-to-Start
            lagTime: 0,
            notifyUsers: true
          })
        )

        try {
          await Promise.all(dependencyPromises)
        } catch (depError) {
          console.error('Error creating dependencies:', depError)
          // Don't show error - dependencies might already exist or other non-critical errors
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Task Created!',
        text: 'Your task has been created successfully.',
        showConfirmButton: false,
        timer: 2000,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        iconColor: theme.colors.primary,
        customClass: {
          popup: 'rounded-2xl'
        }
      })

      onSuccess(createdTask)
      handleClose()
    } catch (error: any) {
      console.error('Error creating task:', error)
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to create task. Please try again.',
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

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
      setFormData({
        title: '',
        description: '',
        taskListId: 0,
        priority: 'medium',
        labels: [],
        assignedTo: [],
        assignedDepartments: [],
        startDate: '',
        dueDate: '',
        estimatedHours: undefined,
        status: 'todo',
        isComplete: false,
        dependencies: []
      })
      setSelectedProject('')
      setSelectedBoard('')
      setAvailableLists([])
      setAvailableTasks([])
      setSelectedUsers([])
      setSelectedDepartments([])
      setNewLabel('')
      setErrors({})
      onClose()
    }
  }

  const getSelectedProjectName = () => {
    return projects.find(p => p.id.toString() === selectedProject)?.name || ''
  }

  const getSelectedBoardName = () => {
    return boards.find(b => b.id.toString() === selectedBoard)?.name || ''
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Project and Board Selection */}
              <ProjectBoardSelection
                selectedProject={selectedProject}
                selectedBoard={selectedBoard}
                projects={projects}
                boards={boards}
                availableLists={availableLists}
                formData={formData}
                errors={errors}
                handleProjectChange={handleProjectChange}
                handleBoardChange={handleBoardChange}
                handleInputChange={handleInputChange}
              />

              {/* Basic Task Info */}
              <BasicTaskInfo
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
              />

              {/* Task Assignment */}
              <TaskAssignment
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                selectedDepartments={selectedDepartments}
                setSelectedDepartments={setSelectedDepartments}
                assignedTo={formData.assignedTo || []}
                assignedDepartments={formData.assignedDepartments || []}
                setFormData={setFormData}
              />

              {/* Dates and Time */}
              <TaskDatesTime
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
              />

              {/* Labels */}
              <TaskLabels
                labels={formData.labels || []}
                newLabel={newLabel}
                setNewLabel={setNewLabel}
                handleAddLabel={handleAddLabel}
                handleRemoveLabel={handleRemoveLabel}
              />

              {/* Dependencies */}
              <TaskDependencies
                dependencies={formData.dependencies || []}
                availableTasks={availableTasks}
                onShowDependencySelector={() => setShowDependencySelector(true)}
                onRemoveDependency={handleRemoveDependency}
              />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dependency Selector Modal */}
      <DependencySelectorModal
        isOpen={showDependencySelector}
        onClose={() => setShowDependencySelector(false)}
        onDependencySelected={handleAddDependency}
        currentTaskId={0} // For new tasks, we don't have an ID yet
        availableTasks={availableTasks}
        projectMembers={[]} // You can pass actual project members if needed
      />
    </>
  )
}

export default CreateTaskModalModular
