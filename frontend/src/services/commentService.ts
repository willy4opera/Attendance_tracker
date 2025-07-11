import api from './api';
import type { ApiResponse, PaginatedResponse, CommentResponse, LikeResponse } from '../types';

export interface CommentFilters {
  page?: number;
  limit?: number;
}

export interface CreateCommentData {
  taskId: number;
  content: string;
  parentId?: number;
  attachments?: File[];
  videoPrivacy?: 'private' | 'unlisted' | 'public';
}

export interface UpdateCommentData {
  content: string;
}

export interface ShareCommentData {
  commentId: number;
  recipients: string[];
  message?: string;
}

class CommentService {
  // Get comments for a task
  async getTaskComments(
    taskId: number,
    filters: CommentFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<CommentResponse>>> {
    const response = await api.get(`/comments/task/${taskId}`, {
      params: filters,
    });
    return response.data;
  }

  // Create a comment with attachments
  async createComment(data: CreateCommentData): Promise<ApiResponse<CommentResponse>> {
    const formData = new FormData();
    formData.append('taskId', data.taskId.toString());
    formData.append('content', data.content);
    
    if (data.parentId) {
      formData.append('parentId', data.parentId.toString());
    }
    
    if (data.videoPrivacy) {
      formData.append('videoPrivacy', data.videoPrivacy);
    }

    // Handle file attachments
    if (data.attachments && data.attachments.length > 0) {
      const images: File[] = [];
      const videos: File[] = [];

      data.attachments.forEach(file => {
        if (file.type.startsWith('image/')) {
          images.push(file);
        } else if (file.type.startsWith('video/')) {
          videos.push(file);
        }
      });

      // Append images
      images.forEach(image => {
        formData.append('images', image);
      });

      // Append videos
      videos.forEach(video => {
        formData.append('videos', video);
      });
    }

    const response = await api.post('/comments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Update a comment
  async updateComment(commentId: number, data: UpdateCommentData): Promise<ApiResponse<CommentResponse>> {
    const response = await api.put(`/comments/${commentId}`, data);
    return response.data;
  }

  // Delete a comment
  async deleteComment(commentId: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  }

  // Like/unlike a comment (toggle)
  async toggleCommentLike(
    commentId: number,
    reactionType: string = 'like'
  ): Promise<ApiResponse<LikeResponse>> {
    const response = await api.post(`/comments/${commentId}/like`, {
      reactionType,
    });
    return response.data;
  }

  // Share a comment
  async shareComment(data: ShareCommentData): Promise<ApiResponse<void>> {
    const response = await api.post('/comments/share', data);
    return response.data;
  }

  // Generate shareable link for a comment
  generateShareableLink(commentId: number, taskId: number): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/tasks/${taskId}?comment=${commentId}`;
  }
}

export default new CommentService();
