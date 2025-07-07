import api from './api';
import { AxiosError } from 'axios';

export interface SessionFilters {
  search: string;
  status: string;
  page: number;
  limit: number;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  facilitatorId: string;
  maxAttendees?: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  meetingType: 'in-person' | 'online' | 'hybrid';
  meetingLink?: string;
  location?: string;
  trackingEnabled: boolean;
  attendanceWindow?: number;
  createdAt: string;
  updatedAt: string;
  facilitator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SessionsResponse {
  sessions: Session[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

class SessionService {
  // Get all sessions with optional filters
  async getAllSessions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SessionsResponse> {
    try {
      const response = await api.get('/sessions', { params });
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch sessions');
    }
  }

  // Get a single session by ID
  async getSession(id: string): Promise<Session> {
    try {
      const response = await api.get(`/sessions/${id}`);
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch session');
    }
  }

  // Create a new session
  async createSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await api.post('/sessions', sessionData);
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create session');
    }
  }

  // Update a session
  async updateSession(id: string, sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await api.put(`/sessions/${id}`, sessionData);
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update session');
    }
  }

  // Delete a session
  async deleteSession(id: string): Promise<void> {
    try {
      await api.delete(`/sessions/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete session');
    }
  }

  // Generate QR code for a session
  async generateSessionQR(sessionId: string): Promise<{ qrCode: { dataURL: string; url: string; expiresAt: string } }> {
    try {
      const response = await api.post(`/qrcode/sessions/${sessionId}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to generate QR code');
    }
  }
}

export default new SessionService();
