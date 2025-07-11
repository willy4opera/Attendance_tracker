import api from './api'
import type {
  Task,
  TasksResponse,
  CreateTaskDto,
  UpdateTaskDto,
  TaskWithStats,
  MoveTaskDto,
  TaskComment,
  CreateTaskCommentDto,
  UpdateTaskCommentDto,
  TaskChecklistItem,
  CreateTaskChecklistItemDto,
  UpdateTaskChecklistItemDto,
  TaskAttachment,
  TaskLabel
} from '../types'

// Updated CreateTaskData based on API guide
export interface CreateTaskData {
  title: string
  description?: string
  taskListId: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  labels?: string[]
  dueDate?: string
  startDate?: string
  assignedTo?: number[]
  assignedDepartments?: number[]
  estimatedHours?: number
  status?: 'todo' | 'in_progress' | 'review' | 'done'
}

export const taskService = {
  // Get task by ID - matches API: GET /api/v1/tasks/:id
  async getTask(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`)
    return response.data.data
  },

  // Create new task - matches API: POST /api/v1/tasks
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post('/tasks', data)
    return response.data.data
  },

  // Update task - matches API: PUT /api/v1/tasks/:id
  async updateTask(id: string, data: Partial<CreateTaskData>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data)
    return response.data.data
  },

  // Delete task - matches API: DELETE /api/v1/tasks/:id
  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },

  // Watch/Unwatch task - matches API: POST /api/v1/tasks/:id/watch
  async watchTask(id: string): Promise<void> {
    await api.post(`/tasks/${id}/watch`)
  },

  async unwatchTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}/watch`)
  },

  // Get tasks for a specific list (through board data)
  async getListTasks(listId: string): Promise<Task[]> {
    // Tasks are retrieved through board data in this API
    const response = await api.get(`/lists/${listId}/tasks`)
    return response.data.data || []
  },

  // Get board tasks
  async getBoardTasks(boardId: string): Promise<Task[]> {
    const response = await api.get(`/boards/${boardId}`)
    const board = response.data.data
    
    // Extract tasks from all lists
    const tasks: Task[] = []
    if (board.lists) {
      board.lists.forEach((list: any) => {
        if (list.tasks) {
          tasks.push(...list.tasks)
        }
      })
    }
    return tasks
  },

  // Move task (drag and drop)
  async moveTask(taskId: string, targetListId: string, position: number): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}/move`, {
      targetListId,
      position
    })
    return response.data.data
  },

  // Task assignees
  async assignTask(taskId: string, userId: string): Promise<Task> {
    const response = await api.post(`/tasks/${taskId}/assignees`, { userId })
    return response.data.data
  },

  async unassignTask(taskId: string, userId: string): Promise<Task> {
    const response = await api.delete(`/tasks/${taskId}/assignees/${userId}`)
    return response.data.data
  },

  // Archive/Unarchive task
  async archiveTask(id: string): Promise<Task> {
    const response = await api.patch(`/tasks/${id}/archive`)
    return response.data.data
  },

  async unarchiveTask(id: string): Promise<Task> {
    const response = await api.patch(`/tasks/${id}/unarchive`)
    return response.data.data
  },

  // Get all tasks for current user with filters
  async getAllTasks(params?: {
    search?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.priority) queryParams.append("priority", params.priority);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await api.get(`/tasks?${queryParams.toString()}`);
    return response.data.data;
  },

  // Duplicate task
  async duplicateTask(id: string): Promise<Task> {
    const response = await api.post(`/tasks/${id}/duplicate`)
    return response.data.data
  }
}

export default taskService

