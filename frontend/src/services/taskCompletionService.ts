import api from './api';
import type { ApiResponse } from '../types';

export interface CompletionLog {
  id: number;
  taskId: number;
  userId: number;
  action: 'completed' | 'uncompleted' | 'submitted-for-review' | 'rejected';
  reason?: string;
  completedAt?: string;
  uncompletedAt?: string;
  metadata?: {
    previousStatus?: string;
    previousCompletedAt?: string;
    userAgent?: string;
    ip?: string;
  };
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
}

export interface CompletionLogResponse {
  log: CompletionLog;
  task: {
    id: number;
    status: string;
    completedAt: string | null;
  };
}

export interface CompletionHistoryResponse {
  logs: CompletionLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CompletionStats {
  stats: {
    totalCompleted: number;
    totalUncompleted: number;
  };
  recentCompletions: Array<CompletionLog & {
    task: {
      id: number;
      title: string;
    };
  }>;
}

class TaskCompletionService {
  // Mark task as completed
  async markAsCompleted(taskId: number | string): Promise<ApiResponse<CompletionLogResponse>> {
    const response = await api.post<ApiResponse<CompletionLogResponse>>(`/tasks/${taskId}/complete`);
    return response.data;
  }

  // Submit task for review
  async submitForReview(taskId: number | string): Promise<ApiResponse<CompletionLogResponse>> {
    const response = await api.post<ApiResponse<CompletionLogResponse>>(`/tasks/${taskId}/complete`);
    return response.data;
  }

  // Approve task completion (admin only)
  async approveCompletion(taskId: number | string): Promise<ApiResponse<CompletionLogResponse>> {
    const response = await api.post<ApiResponse<CompletionLogResponse>>(`/tasks/${taskId}/approve-completion`);
    return response.data;
  }

  // Reject task completion (admin only)
  async rejectCompletion(taskId: number | string, reason: string): Promise<ApiResponse<CompletionLogResponse>> {
    const response = await api.post<ApiResponse<CompletionLogResponse>>(
      `/tasks/${taskId}/reject-completion`,
      { reason }
    );
    return response.data;
  }

  // Mark task as uncompleted (admin only)
  async markAsUncompleted(taskId: number | string, reason: string): Promise<ApiResponse<CompletionLogResponse>> {
    const response = await api.post<ApiResponse<CompletionLogResponse>>(
      `/tasks/${taskId}/uncomplete`,
      { reason }
    );
    return response.data;
  }

  // Get task completion history
  async getCompletionHistory(
    taskId: number | string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<CompletionHistoryResponse>> {
    const response = await api.get<ApiResponse<CompletionHistoryResponse>>(
      `/tasks/${taskId}/completion-history`,
      { params: { page, limit } }
    );
    return response.data;
  }

  // Get user completion statistics
  async getUserCompletionStats(userId?: number | string): Promise<ApiResponse<CompletionStats>> {
    const url = userId ? `/users/${userId}/completion-stats` : '/my-completion-stats';
    const response = await api.get<ApiResponse<CompletionStats>>(url);
    return response.data;
  }
}

export default new TaskCompletionService();
