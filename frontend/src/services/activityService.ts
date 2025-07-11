import api from './api';
import type { ApiResponse, PaginatedResponse, ActivityResponse } from '../types';

export interface ActivityFilters {
  page?: number;
  limit?: number;
  activityType?: string;
  timeRange?: '1d' | '7d' | '30d';
}

class ActivityService {
  // Get user activity feed
  async getUserActivityFeed(
    userId: number,
    filters: ActivityFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<ActivityResponse>>> {
    const response = await api.get(`/activities/user/${userId}`, {
      params: filters,
    });
    return response.data;
  }

  // Get board activity feed
  async getBoardActivityFeed(
    boardId: number,
    filters: ActivityFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<ActivityResponse>>> {
    const response = await api.get(`/activities/board/${boardId}`, {
      params: filters,
    });
    return response.data;
  }

  // Create activity
  async createActivity(data: {
    taskId?: number;
    boardId: number;
    activityType: string;
    description: string;
    visibility?: 'public' | 'board' | 'private';
  }): Promise<ApiResponse<ActivityResponse>> {
    const response = await api.post('/activities', data);
    return response.data;
  }

  // Get activity stats
  async getActivityStats(
    userId: number,
    timeRange?: '1d' | '7d' | '30d'
  ): Promise<ApiResponse<any>> {
    const response = await api.get(`/activities/stats/${userId}`, {
      params: { timeRange },
    });
    return response.data;
  }
}

export default new ActivityService();
