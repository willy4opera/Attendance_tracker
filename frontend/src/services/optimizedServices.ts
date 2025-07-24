// This file contains optimized versions of services with search functionality

import { deduplicateRequest, cachedRequest } from '../utils/requestOptimizer';
import api from './api';
import type { User, Department, Project, Session, Task, ApiResponse } from '../types';

// Optimized User Service
export const optimizedUserService = {
  async searchUsers(query: string): Promise<User[]> {
    const key = `search-users:${query}`;
    
    return deduplicateRequest(key, async () => {
      const response = await api.get('/users/search', { params: { q: query } });
      return response.data.data;
    });
  },

  async getUsersWithFilters(filters: any): Promise<ApiResponse<User[]>> {
    const key = `users-filtered:${JSON.stringify(filters)}`;
    
    return cachedRequest(key, async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    }, 5 * 60 * 1000); // Cache for 5 minutes
  },
};

// Optimized Department Service
export const optimizedDepartmentService = {
  async searchDepartments(query: string): Promise<Department[]> {
    const key = `search-departments:${query}`;
    
    return deduplicateRequest(key, async () => {
      const response = await api.get('/departments', { params: { search: query } });
      return response.data.data;
    });
  },

  async getDepartmentsWithFilters(filters: any): Promise<ApiResponse<Department[]>> {
    const key = `departments-filtered:${JSON.stringify(filters)}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get('/departments', { params: filters });
      return response.data;
    }, 10 * 60 * 1000); // Cache for 10 minutes
  },
};

// Optimized Project Service
export const optimizedProjectService = {
  async searchProjects(query: string): Promise<Project[]> {
    const key = `search-projects:${query}`;
    
    return deduplicateRequest(key, async () => {
      const response = await api.get('/projects', { params: { search: query } });
      return response.data.data;
    });
  },

  async getProjectsWithFilters(filters: any): Promise<ApiResponse<Project[]>> {
    const key = `projects-filtered:${JSON.stringify(filters)}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get('/projects', { params: filters });
      return response.data;
    }, 5 * 60 * 1000); // Cache for 5 minutes
  },
};

// Optimized Task Service
export const optimizedTaskService = {
  async searchTasks(boardId: number, query: string): Promise<Task[]> {
    const key = `search-tasks:${boardId}:${query}`;
    
    return deduplicateRequest(key, async () => {
      const response = await api.get(`/boards/${boardId}/tasks`, { 
        params: { search: query } 
      });
      return response.data.data;
    });
  },

  async getTasksWithFilters(boardId: number, filters: any): Promise<Task[]> {
    const key = `tasks-filtered:${boardId}:${JSON.stringify(filters)}`;
    
    return cachedRequest(key, async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const response = await api.get(`/boards/${boardId}/tasks?${params.toString()}`);
      return response.data.data;
    }, 3 * 60 * 1000); // Cache for 3 minutes
  },
};

// Optimized Session Service
export const optimizedSessionService = {
  async searchSessions(query: string): Promise<Session[]> {
    const key = `search-sessions:${query}`;
    
    return deduplicateRequest(key, async () => {
      const response = await api.get('/sessions', { params: { search: query } });
      return response.data.data;
    });
  },

  async getSessionsWithFilters(filters: any): Promise<ApiResponse<Session[]>> {
    const key = `sessions-filtered:${JSON.stringify(filters)}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get('/sessions', { params: filters });
      return response.data;
    }, 5 * 60 * 1000); // Cache for 5 minutes
  },
};

// Optimized Social Service (for user mentions)
export const optimizedSocialService = {
  async searchUsersForMentions(query: string): Promise<any[]> {
    const key = `search-mentions:${query}`;
    
    // Don't cache mention searches as they need to be real-time
    return deduplicateRequest(key, async () => {
      const response = await api.get('/users/search', { 
        params: { q: query, limit: 10 } 
      });
      return response.data.data;
    });
  },
};
