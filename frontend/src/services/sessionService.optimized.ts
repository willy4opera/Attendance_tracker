import api from './api';
import { cachedRequest } from '../utils/apiCache';
import { requestDeduplicator } from '../utils/requestDeduplicator';
import { API_OPTIMIZATION_CONFIG } from '../config/apiOptimization';
import type { AxiosError } from 'axios';

export interface Session {
  id: string;
  name: string;
  sessionType: string;
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  location?: string;
  description?: string;
  maxAttendees?: number;
  requiresApproval?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  limit: number;
}

export interface SessionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'upcoming' | 'past';
  startDate?: string;
  endDate?: string;
}

class OptimizedSessionService {
  // Get session status
  getSessionStatus(session: Session): 'active' | 'upcoming' | 'past' {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const startTime = new Date(`${session.date}T${session.startTime}`);
    const endTime = new Date(`${session.date}T${session.endTime}`);

    if (session.isActive && now >= startTime && now <= endTime) {
      return 'active';
    } else if (now < startTime) {
      return 'upcoming';
    } else {
      return 'past';
    }
  }

  // Get all sessions with caching and deduplication
  async getAllSessions(params?: SessionFilters): Promise<SessionsResponse> {
    // Build cache key from params
    const cacheKey = `sessions:${JSON.stringify(params || {})}`;
    
    try {
      // Use request deduplication to prevent multiple simultaneous requests
      return await requestDeduplicator.deduplicate(
        cacheKey,
        async () => {
          // Use caching for sessions list
          return await cachedRequest(
            cacheKey,
            async () => {
              const response = await api.get('/sessions', { params });
              return response.data.data;
            },
            30 * 1000 // Cache for 30 seconds since sessions can change frequently
          );
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch sessions');
    }
  }

  // Create a new session (no caching needed)
  async createSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await api.post('/sessions', sessionData);
      // Invalidate sessions cache after creation
      this.invalidateSessionsCache();
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create session');
    }
  }

  // Update a session
  async updateSession(sessionId: string, sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await api.put(`/sessions/${sessionId}`, sessionData);
      // Invalidate caches after update
      this.invalidateSessionsCache();
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update session');
    }
  }

  // Delete a session
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/sessions/${sessionId}`);
      // Invalidate caches after deletion
      this.invalidateSessionsCache();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete session');
    }
  }

  // Get session by ID with caching
  async getSessionById(sessionId: string): Promise<Session> {
    const cacheKey = `session:${sessionId}`;
    
    try {
      return await cachedRequest(
        cacheKey,
        async () => {
          const response = await api.get(`/sessions/${sessionId}`);
          return response.data.data.session;
        },
        60 * 1000 // Cache individual session for 1 minute
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch session');
    }
  }

  // Mark attendance
  async markAttendance(sessionId: string, data: { 
    action: 'check-in' | 'check-out',
    location?: { latitude: number; longitude: number }
  }): Promise<any> {
    try {
      const response = await api.post(`/sessions/${sessionId}/attendance`, data);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Get session attendance
  async getSessionAttendance(sessionId: string): Promise<any[]> {
    const cacheKey = `session-attendance:${sessionId}`;
    
    try {
      return await cachedRequest(
        cacheKey,
        async () => {
          const response = await api.get(`/sessions/${sessionId}/attendance`);
          return response.data.data.attendance;
        },
        15 * 1000 // Cache attendance for 15 seconds
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch attendance');
    }
  }

  // Helper method to invalidate sessions cache
  private invalidateSessionsCache(): void {
    // Clear all sessions-related cache entries
    const { apiCache } = require('../utils/apiCache');
    apiCache.invalidatePattern('^sessions:');
    apiCache.invalidatePattern('^session:');
    apiCache.invalidatePattern('^session-attendance:');
  }
}

export default new OptimizedSessionService();
