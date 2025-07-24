import api from './api'

export interface TaskDependency {
  id: number
  predecessorTaskId: number
  successorTaskId: number
  dependencyType: 'FS' | 'SS' | 'FF' | 'SF'
  lagTime: number
  isActive: boolean
  metadata: any
  createdBy: number
  updatedBy: number
  createdAt: string
  updatedAt: string
  predecessorTask?: {
    id: number
    title: string
    status: string
    startDate: string | null
    dueDate: string | null
    createdBy: number
  }
  successorTask?: {
    id: number
    title: string
    status: string
    startDate: string | null
    dueDate: string | null
    createdBy: number
  }
  creator?: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateDependencyData {
  predecessorTaskId: number
  successorTaskId: number
  dependencyType?: 'FS' | 'SS' | 'FF' | 'SF'
  lagTime?: number
  notifyUsers?: boolean
}

export const dependencyService = {
  // Create a new dependency
  async createDependency(data: CreateDependencyData): Promise<TaskDependency> {
    const response = await api.post('/dependencies', data)
    return response.data.data
  },

  // Get task dependencies
  async getTaskDependencies(taskId: string | number, direction: 'both' | 'predecessor' | 'successor' = 'both'): Promise<TaskDependency[]> {
    const response = await api.get(`/dependencies/tasks/${taskId}`, {
      params: { direction }
    })
    return response.data.data
  },

  // Update dependency
  async updateDependency(id: string | number, data: Partial<CreateDependencyData>): Promise<TaskDependency> {
    const response = await api.put(`/dependencies/${id}`, data)
    return response.data.data
  },

  // Delete dependency
  async deleteDependency(id: string | number): Promise<void> {
    await api.delete(`/dependencies/${id}`)
  },

  // Get project dependencies
  async getProjectDependencies(projectId: string | number, includeInactive = false): Promise<TaskDependency[]> {
    const response = await api.get(`/dependencies/project/${projectId}`, {
      params: { includeInactive }
    })
    return response.data.data
  },

  // Validate task dependencies
  async validateTaskDependencies(taskId: string | number, newStatus: string): Promise<{
    valid: boolean
    violations: any[]
    warnings: any[]
  }> {
    const response = await api.post(`/dependencies/tasks/${taskId}/validate`, { newStatus })
    return response.data
  },

  // Check for circular dependencies
  async checkCircularDependency(predecessorTaskId: number, successorTaskId: number): Promise<{
    hasCircular: boolean
    message: string
  }> {
    const response = await api.post('/dependencies/check-circular', {
      predecessorTaskId,
      successorTaskId
    })
    return response.data
  },

  // Get dependency chain for a task
  async getDependencyChain(taskId: string | number, direction: 'forward' | 'backward' = 'forward'): Promise<TaskDependency[]> {
    const response = await api.get(`/dependencies/tasks/${taskId}/chain`, {
      params: { direction }
    })
    return response.data.data
  }
}

export default dependencyService
