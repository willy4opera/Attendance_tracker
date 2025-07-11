import api from './api';
import type { ApiResponse, LikeResponse } from '../types';

export interface SocialStats {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface UserMention {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

class SocialService {
  // Like/unlike a comment
  async toggleLike(
    commentId: number,
    reactionType: string = 'like'
  ): Promise<ApiResponse<LikeResponse>> {
    const response = await api.post(`/comments/${commentId}/like`, {
      reactionType,
    });
    return response.data;
  }

  // Get social stats for a task
  async getTaskSocialStats(taskId: number): Promise<ApiResponse<SocialStats>> {
    const response = await api.get(`/tasks/${taskId}/social-stats`);
    return response.data;
  }

  // Search users for mentions
  async searchUsersForMentions(query: string): Promise<ApiResponse<UserMention[]>> {
    const response = await api.get(`/users/search`, {
      params: { query, limit: 10 },
    });
    return response.data;
  }

  // Get user's social activity
  async getUserSocialActivity(userId: number): Promise<ApiResponse<any>> {
    const response = await api.get(`/activities/user/${userId}/social`);
    return response.data;
  }
}

export default new SocialService();
