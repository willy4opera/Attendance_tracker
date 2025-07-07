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
  _id?: string; // MongoDB ID
  title: string;
  name?: string; // Alternative name field
  description?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  facilitatorId: string;
  facilitator?: {
    id: string;
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  maxAttendees?: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  meetingType: 'in-person' | 'online' | 'hybrid';
  meetingLink?: string;
  location?: string;
  trackingEnabled: boolean;
  attendanceWindow?: number;
  createdAt: string;
  updatedAt: string;
  enrolledCount?: number;
  capacity?: number;
  attendanceCount?: number;
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
    search?: string;
    status?: string;
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
  async updateSession(sessionId: string, sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await api.put(`/sessions/${sessionId}`, sessionData);
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
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete session');
    }
  }

  // Get session by ID
  async getSessionById(sessionId: string): Promise<Session> {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch session');
    }
  }

  // Format session time for display
  formatSessionTime(session: Session): string {
    const date = new Date(session.sessionDate);
    const dateStr = date.toLocaleDateString();
    return `${dateStr} ${session.startTime} - ${session.endTime}`;
  }

  // Get session status based on current time
  getSessionStatus(session: Session): 'active' | 'upcoming' | 'past' {
    const now = new Date();
    const sessionDate = new Date(session.sessionDate);
    const startTime = new Date(`${session.sessionDate.split('T')[0]}T${session.startTime}`);
    const endTime = new Date(`${session.sessionDate.split('T')[0]}T${session.endTime}`);

    if (now >= startTime && now <= endTime) {
      return 'active';
    } else if (now < startTime) {
      return 'upcoming';
    } else {
      return 'past';
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
