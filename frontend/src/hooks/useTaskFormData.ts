import { useState, useEffect, useCallback } from 'react'
import taskDataService from '../services/taskDataService'
import type { TaskFormData, TaskRelatedData } from '../services/taskDataService'
import type { User, Department } from '../types'

interface UseTaskFormDataResult {
  formData: Partial<TaskFormData>
  setFormData: React.Dispatch<React.SetStateAction<Partial<TaskFormData>>>
  taskRelatedData: TaskRelatedData | null
  loading: boolean
  error: string | null
  
  // Helper methods
  updateAssignedUsers: (users: User[]) => void
  updateAssignedDepartments: (departments: Department[]) => void
  updateField: (field: keyof TaskFormData, value: any) => void
  validateForm: () => boolean
  getUpdateData: () => any
  
  // Data for UI
  selectedProject: string
  selectedBoard: string
  availableLists: any[]
  selectedUsers: User[]
  selectedDepartments: Department[]
  allUsers: User[]
  allDepartments: Department[]
}

export function useTaskFormData(taskId: string): UseTaskFormDataResult {
  const [formData, setFormData] = useState<Partial<TaskFormData>>({})
  const [taskRelatedData, setTaskRelatedData] = useState<TaskRelatedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Derived states
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedBoard, setSelectedBoard] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])

  // Fetch task data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!taskId) return
      
      try {
        setLoading(true)
        setError(null)
        
        const data = await taskDataService.fetchTaskData(taskId)
        setTaskRelatedData(data)
        
        // Prepare form data
        const preparedFormData = taskDataService.prepareFormData(data)
        setFormData(preparedFormData)
        
        // Set derived states
        setSelectedProject(data.project?.id?.toString() || '')
        setSelectedBoard(data.board?.id?.toString() || '')
        setSelectedUsers(data.assignedUsers || [])
        setSelectedDepartments(data.assignedDepartments || [])
      } catch (err) {
        console.error('Error loading task data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load task data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [taskId])

  // Update assigned users
  const updateAssignedUsers = useCallback((users: User[]) => {
    setSelectedUsers(users)
    const userIds = users.map(user => {
      const id = user.id || (user as any)._id || (user as any).userId
      return typeof id === 'string' ? parseInt(id) : id
    }).filter(id => id > 0)
    
    setFormData(prev => ({
      ...prev,
      assignedTo: userIds
    }))
  }, [])

  // Update assigned departments
  const updateAssignedDepartments = useCallback((departments: Department[]) => {
    setSelectedDepartments(departments)
    const deptIds = departments.map(dept => {
      const id = dept.id
      return typeof id === 'string' ? parseInt(id) : id
    }).filter(id => id > 0)
    
    setFormData(prev => ({
      ...prev,
      assignedDepartments: deptIds
    }))
  }, [])

  // Update a single field
  const updateField = useCallback((field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Validate form
  const validateForm = useCallback(() => {
    const validation = taskDataService.validateFormData(formData)
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors)
    }
    return validation.isValid
  }, [formData])

  // Get update data for API
  const getUpdateData = useCallback(() => {
    return taskDataService.prepareUpdateData(formData)
  }, [formData])

  return {
    formData,
    setFormData,
    taskRelatedData,
    loading,
    error,
    
    // Helper methods
    updateAssignedUsers,
    updateAssignedDepartments,
    updateField,
    validateForm,
    getUpdateData,
    
    // Data for UI
    selectedProject,
    selectedBoard,
    availableLists: taskRelatedData?.availableLists || [],
    selectedUsers,
    selectedDepartments,
    allUsers: taskRelatedData?.allUsers || [],
    allDepartments: taskRelatedData?.allDepartments || []
  }
}
