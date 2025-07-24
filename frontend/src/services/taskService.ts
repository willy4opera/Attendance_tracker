import api from './api';
import type { Task, CreateTaskDto, UpdateTaskDto } from '../types/task';

// Define proper response interfaces matching the actual API
export interface ApiTasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ApiTaskResponse {
  success: boolean;
  data: Task;
}

export interface ApiOperationResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Legacy interfaces for backward compatibility
export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TaskResponse extends Task {}

export interface OperationResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Request parameter types
export interface GetTasksParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: number;
  boardId?: number;
  listId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetTasksByListParams {
  page?: number;
  limit?: number;
}

export interface GetCommentsParams {
  page?: number;
  limit?: number;
}

export interface CreateTaskData extends CreateTaskDto {}

export interface UpdateTaskData extends UpdateTaskDto {}

export interface CreateCommentData {
  taskId: number;
  content: string;
  attachments?: string[];
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentsResponse {
  success: boolean;
  data: any[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface WatchResponse {
  success: boolean;
  message: string;
  data: {
    watching: boolean;
  };
}

// TaskService class implementation
class TaskService {
  // Task CRUD operations - now properly handling the API response format
  async getTasks(params?: GetTasksParams): Promise<TasksResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await api.get<ApiTasksResponse>(`/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    
    // Transform the API response to the expected format
    const apiResponse = response.data;
    return {
      tasks: apiResponse.data.tasks,
      total: apiResponse.data.total,
      page: apiResponse.data.page,
      totalPages: apiResponse.data.totalPages
    };
  }

  async getTaskById(id: number): Promise<TaskResponse> {
    const response = await api.get<ApiTaskResponse>(`/tasks/${id}`);
    // Return the task data directly
    return response.data.data;
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post<ApiTaskResponse>('/tasks', data);
    return response.data.data;
  }

  async updateTask(id: number, data: UpdateTaskData): Promise<Task> {
    const response = await api.put<ApiTaskResponse>(`/tasks/${id}`, data);
    return response.data.data;
  }

  async deleteTask(id: number): Promise<OperationResponse> {
    const response = await api.delete<ApiOperationResponse>(`/tasks/${id}`);
    return response.data;
  }

  // Task actions
  async toggleWatchTask(id: number): Promise<WatchResponse> {
    const response = await api.post<WatchResponse>(`/tasks/${id}/watch`);
    return response.data;
  }

  async getTasksByList(listId: number, params?: GetTasksByListParams): Promise<TasksResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await api.get<ApiTasksResponse>(`/tasks/list/${listId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    
    // Transform the API response to the expected format
    const apiResponse = response.data;
    return {
      tasks: apiResponse.data.tasks,
      total: apiResponse.data.total,
      page: apiResponse.data.page,
      totalPages: apiResponse.data.totalPages
    };
  }

  // Comments
  async getTaskComments(taskId: number, params?: GetCommentsParams): Promise<CommentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await api.get(`/comments/task/${taskId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    return response.data;
  }

  async addComment(data: CreateCommentData): Promise<OperationResponse> {
    const response = await api.post('/comments', data);
    return response.data;
  }

  async updateComment(id: number, data: UpdateCommentData): Promise<OperationResponse> {
    const response = await api.put(`/comments/${id}`, data);
    return response.data;
  }

  async deleteComment(id: number): Promise<OperationResponse> {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  }

  // Task notifications
  async getTaskNotifications(taskId: number, params?: GetCommentsParams): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await api.get(`/tasks/${taskId}/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    return response.data;
  }

  // Convenience methods that maintain backward compatibility
  getAllTasks(params?: GetTasksParams): Promise<TasksResponse> {
    return this.getTasks(params);
  }

  getTask(id: number): Promise<Task> {
    return this.getTaskById(id);
  }

  async getListTasks(listId: string | number): Promise<Task[]> {
    const result = await this.getTasksByList(Number(listId));
    return result.tasks;
  }

  // Board tasks (for compatibility with existing hooks)
  async getBoardTasks(boardId: string | number): Promise<Task[]> {
    const response = await api.get<ApiTasksResponse>(`/tasks?boardId=${boardId}`);
    return response.data.data.tasks;
  }

  // Task movement and assignment (for compatibility)
  async moveTask(taskId: number, targetListId: number, position?: number): Promise<Task> {
    const response = await api.put<ApiTaskResponse>(`/tasks/${taskId}/move`, { targetListId, position });
    return response.data.data;
  }

  async assignTask(taskId: number, userId: number): Promise<Task> {
    const response = await api.post<ApiTaskResponse>(`/tasks/${taskId}/assign`, { userId });
    return response.data.data;
  }

  async unassignTask(taskId: number, userId: number): Promise<Task> {
    const response = await api.delete<ApiTaskResponse>(`/tasks/${taskId}/assign/${userId}`);
    return response.data.data;
  }

  // Enhanced methods for better data handling
  async getTasksWithStats(params?: GetTasksParams): Promise<{tasks: Task[], stats: any}> {
    const result = await this.getTasks(params);
    // Could calculate stats here if needed
    return {
      tasks: result.tasks,
      stats: {
        total: result.total,
        byStatus: this.groupTasksByStatus(result.tasks),
        byPriority: this.groupTasksByPriority(result.tasks)
      }
    };
  }

  // Helper methods
  private groupTasksByStatus(tasks: Task[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupTasksByPriority(tasks: Task[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Fetch all tasks without pagination limits
  async getAllTasksNoPagination(params?: Omit<GetTasksParams, 'page' | 'limit'>): Promise<Task[]> {
    const allTasks: Task[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const limit = 100; // Fetch 100 at a time for efficiency

    while (hasMorePages) {
      const response = await this.getTasks({
        ...params,
        page: currentPage,
        limit: limit
      });
      
      allTasks.push(...response.tasks);
      
      hasMorePages = currentPage < response.totalPages;
      currentPage++;
    }

    return allTasks;
  }

  // Fetch all tasks for a specific list without pagination limits
  async getAllListTasksNoPagination(listId: number): Promise<Task[]> {
    const allTasks: Task[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const limit = 100; // Fetch 100 at a time for efficiency

    while (hasMorePages) {
      const response = await this.getTasksByList(listId, {
        page: currentPage,
        limit: limit
      });
      
      allTasks.push(...response.tasks);
      
      hasMorePages = currentPage < response.totalPages;
      currentPage++;
    }

    return allTasks;
  }

  // Fetch all board tasks without pagination limits
  async getAllBoardTasksNoPagination(boardId: string | number): Promise<Task[]> {
    return this.getAllTasksNoPagination({ boardId: Number(boardId) });
  }

}

// Export singleton instance
const taskService = new TaskService();
export default taskService;

