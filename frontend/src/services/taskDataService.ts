import api from './api'
import { boardService } from './boardService'
import { projectService } from './projectService'
import userService from './userService'
import departmentService from './departmentService'
import type { Task, User, Department, Board, Project } from '../types'

export interface TaskFormData {
  title: string
  description?: string
  taskListId: number
  boardId?: number
  projectId?: number
  position?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in-progress' | 'under-review' | 'done' | 'cancelled'
  assignedTo: number[]
  assignedDepartments: number[]
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  labels: string[]
  checklist?: any[]
  dependencies?: number[]
  coverImage?: string
  coverColor?: string
  customFields?: Record<string, any>
}

export interface TaskRelatedData {
  task: Task | null
  project: Project | null
  board: Board | null
  availableLists: any[]
  assignedUsers: User[]
  assignedDepartments: Department[]
  allUsers: User[]
  allDepartments: Department[]
  dependencies: {
    predecessors: any[]
    successors: any[]
  }
}

class TaskDataService {
  /**
   * Fetch all task-related data for editing
   */
  async fetchTaskData(taskId: string): Promise<TaskRelatedData> {
    try {
      // 1. Fetch the task with all its relationships
      const taskResponse = await api.get(`/tasks/${taskId}`)
      const task = taskResponse.data.data

      if (!task) {
        throw new Error('Task not found')
      }

      // 2. Extract project and board info from the task's list
      const boardId = task.list?.boardId || task.boardId
      const board = task.list?.board || null
      const projectId = board?.projectId

      // 3. Fetch additional data in parallel
      const [
        projectData,
        boardData,
        usersData,
        departmentsData
      ] = await Promise.all([
        projectId ? projectService.getProject(projectId.toString()) : Promise.resolve(null),
        boardId ? boardService.getBoard(boardId.toString()) : Promise.resolve(null),
        userService.getAllUsers({ limit: 100 }),
        departmentService.getAllDepartments({ limit: 100 })
      ])

      // 4. Get available lists from the board
      let availableLists: any[] = []
      if (boardData) {
        // Board data should contain lists
        availableLists = boardData.lists || []
      }

      // 5. Extract assigned users and departments
      const assignedUsers = task.assignedUsers || []
      const assignedDepartments = task.assignedDepartmentDetails || []

      // 6. Format dependencies
      const dependencies = task.dependencies || {
        predecessors: [],
        successors: []
      }

      return {
        task,
        project: projectData,
        board: boardData,
        availableLists,
        assignedUsers,
        assignedDepartments,
        allUsers: usersData.users || [],
        allDepartments: departmentsData.departments || [],
        dependencies
      }
    } catch (error) {
      console.error('Error fetching task data:', error)
      throw error
    }
  }

  /**
   * Prepare form data from task for editing
   */
  prepareFormData(taskData: TaskRelatedData): TaskFormData {
    const { task, board, project } = taskData

    if (!task) {
      throw new Error('No task data available')
    }

    return {
      title: task.title || '',
      description: task.description || '',
      taskListId: task.taskListId || task.list?.id || 0,
      boardId: board?.id,
      projectId: project?.id,
      position: task.position,
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      assignedTo: task.assignedTo || [],
      assignedDepartments: task.assignedDepartments || [],
      startDate: task.startDate,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      labels: task.labels || [],
      checklist: task.checklist || [],
      dependencies: taskData.dependencies.predecessors.map(dep => dep.id),
      coverImage: task.coverImage,
      coverColor: task.coverColor,
      customFields: task.customFields || {}
    }
  }

  /**
   * Convert form data to API update format
   */
  prepareUpdateData(formData: Partial<TaskFormData>): any {
    // Remove undefined values and fields that shouldn't be sent to API
    const updateData: any = {}

    // Core fields
    if (formData.title !== undefined) updateData.title = formData.title
    if (formData.description !== undefined) updateData.description = formData.description
    if (formData.taskListId !== undefined) updateData.taskListId = formData.taskListId
    if (formData.priority !== undefined) updateData.priority = formData.priority
    if (formData.status !== undefined) updateData.status = formData.status
    
    // Assignment fields
    if (formData.assignedTo !== undefined) updateData.assignedTo = formData.assignedTo
    if (formData.assignedDepartments !== undefined) updateData.assignedDepartments = formData.assignedDepartments
    
    // Date fields
    if (formData.startDate !== undefined) updateData.startDate = formData.startDate
    if (formData.dueDate !== undefined) updateData.dueDate = formData.dueDate
    
    // Hours fields
    if (formData.estimatedHours !== undefined) updateData.estimatedHours = formData.estimatedHours
    if (formData.actualHours !== undefined) updateData.actualHours = formData.actualHours
    
    // Array fields
    if (formData.labels !== undefined) updateData.labels = formData.labels
    if (formData.checklist !== undefined) updateData.checklist = formData.checklist
    
    // Visual fields
    if (formData.coverImage !== undefined) updateData.coverImage = formData.coverImage
    if (formData.coverColor !== undefined) updateData.coverColor = formData.coverColor
    
    // Custom fields
    if (formData.customFields !== undefined) updateData.customFields = formData.customFields

    return updateData
  }

  /**
   * Validate form data before submission
   */
  validateFormData(formData: Partial<TaskFormData>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    if (!formData.title || formData.title.trim() === '') {
      errors.title = 'Task title is required'
    }

    if (!formData.taskListId || formData.taskListId === 0) {
      errors.taskListId = 'Task list is required'
    }

    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate)
      const due = new Date(formData.dueDate)
      if (start > due) {
        errors.dueDate = 'Due date must be after start date'
      }
    }

    if (formData.estimatedHours !== undefined && formData.estimatedHours < 0) {
      errors.estimatedHours = 'Estimated hours cannot be negative'
    }

    if (formData.actualHours !== undefined && formData.actualHours < 0) {
      errors.actualHours = 'Actual hours cannot be negative'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

export default new TaskDataService()

// Explicit type exports to ensure they're available
export type { TaskFormData, TaskRelatedData }
