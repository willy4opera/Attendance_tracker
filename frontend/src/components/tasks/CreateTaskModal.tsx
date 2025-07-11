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
  TrashIcon
} from '@heroicons/react/24/outline'
import { useProjects } from '../../hooks/useProjects'
import { useBoards } from '../../hooks/useBoards'
import { useTasks } from '../../hooks/useTasks'
import { UserSelector } from '../common/UserSelector'
import { taskService, type CreateTaskData } from '../../services/taskService'
import type { Project, Board, User, Department } from '../../types'

interface TaskList {
  id: number
  name: string
  boardId: number
  position: number
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (task: any) => void
  initialProjectId?: string
  initialBoardId?: string
  initialListId?: string
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProjectId,
  initialBoardId,
  initialListId
}) => {
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    taskListId: initialListId ? parseInt(initialListId) : 0,
    priority: 'medium',
    labels: [],
    assignedTo: [],
    assignedDepartments: []
  })

  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || '')
  const [selectedBoard, setSelectedBoard] = useState<string>(initialBoardId || '')
  const [availableLists, setAvailableLists] = useState<TaskList[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Hooks
  const { projects } = useProjects({ limit: 100 })
  const { boards } = useBoards({ 
    projectId: selectedProject || undefined,
    limit: 100 
  })

  // Fetch board data with lists when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetchBoardLists(selectedBoard)
    }
  }, [selectedBoard])

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
      }
    } catch (error) {
      console.error('Error fetching board lists:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'taskListId' ? parseInt(value) : value
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

  const handleUserSelection = (users: User[]) => {
    setSelectedUsers(users)
    setFormData(prev => ({
      ...prev,
      assignedTo: users.map(user => parseInt(user.id.toString()))
    }))
  }

  const handleDepartmentSelection = (departments: Department[]) => {
    setSelectedDepartments(departments)
    setFormData(prev => ({
      ...prev,
      assignedDepartments: departments.map(dept => dept.id)
    }))
  }

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
      return
    }

    setIsSubmitting(true)
    try {
      const task = await taskService.createTask(formData)
      onSuccess(task)
      onClose()
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        taskListId: 0,
        priority: 'medium',
        labels: [],
        assignedTo: [],
        assignedDepartments: []
      })
      setSelectedProject('')
      setSelectedBoard('')
      setSelectedUsers([])
      setSelectedDepartments([])
    } catch (error) {
      console.error('Error creating task:', error)
      setErrors({ submit: 'Failed to create task. Please try again.' })
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="bg-white px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task title"
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Project-Board-List Hierarchy */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Location</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FolderIcon className="h-4 w-4 inline mr-1" />
                        Project *
                      </label>
                      <select
                        value={selectedProject}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      {errors.project && <p className="text-red-500 text-sm mt-1">{errors.project}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <ViewColumnsIcon className="h-4 w-4 inline mr-1" />
                        Board *
                      </label>
                      <select
                        value={selectedBoard}
                        onChange={(e) => handleBoardChange(e.target.value)}
                        disabled={!selectedProject}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Select a board</option>
                        {boards.map(board => (
                          <option key={board.id} value={board.id}>
                            {board.name}
                          </option>
                        ))}
                      </select>
                      {errors.board && <p className="text-red-500 text-sm mt-1">{errors.board}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <ListBulletIcon className="h-4 w-4 inline mr-1" />
                        List *
                      </label>
                      <select
                        name="taskListId"
                        value={formData.taskListId}
                        onChange={handleInputChange}
                        disabled={!selectedBoard}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value={0}>Select a list</option>
                        {availableLists.map(list => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                      {errors.taskListId && <p className="text-red-500 text-sm mt-1">{errors.taskListId}</p>}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Timeline</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate || ''}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate || ''}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      name="estimatedHours"
                      value={formData.estimatedHours || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.5"
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Assignments */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Assignments</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <UserGroupIcon className="h-4 w-4 inline mr-1" />
                        Assign to Users
                      </label>
                      <UserSelector
                        selectedUsers={selectedUsers}
                        onSelectionChange={handleUserSelection}
                        multiple={true}
                        placeholder="Select users to assign"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                        Assign to Departments
                      </label>
                      <select
                        multiple
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => {
                          const selectedIds = Array.from(e.target.selectedOptions).map(option => parseInt(option.value))
                          setFormData(prev => ({ ...prev, assignedDepartments: selectedIds }))
                        }}
                      >
                        <option value="">Select departments</option>
                        {/* TODO: Add department options from API */}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Labels</h4>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a label"
                      />
                      <button
                        type="button"
                        onClick={handleAddLabel}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {formData.labels && formData.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.labels.map((label, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {label}
                            <button
                              type="button"
                              onClick={() => handleRemoveLabel(label)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Context Information */}
                {selectedProject && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Task Location</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📁 Project: <span className="font-medium">{getSelectedProjectName()}</span></div>
                      {selectedBoard && (
                        <div>📋 Board: <span className="font-medium">{getSelectedBoardName()}</span></div>
                      )}
                      {formData.taskListId > 0 && (
                        <div>📝 List: <span className="font-medium">
                          {availableLists.find(l => l.id === formData.taskListId)?.name}
                        </span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateTaskModal
