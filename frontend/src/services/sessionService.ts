import api from './api';
import type { AxiosError } from 'axios';
import type { 
  Session, 
  SessionsResponse, 
  SessionFilters, 
  CreateSessionData, 
  UpdateSessionData,
  UserOption
} from '../types/session';

class SessionService {
  // Get all sessions with filters (keeping for backward compatibility)
  async getAllSessions(filters?: SessionFilters): Promise<SessionsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/sessions?${params.toString()}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch sessions');
    }
  }

  // NEW: Get session statistics (counts only)
  async getSessionStatistics(): Promise<any> {
    try {
      const response = await api.get('/sessions/statistics/summary');
      return response.data.data.statistics;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch session statistics');
    }
  }

  // NEW: Get sessions by status with pagination
  async getSessionsByStatus(status: string, page: number = 1, limit: number = 10): Promise<SessionsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await api.get(`/sessions/by-status?${params.toString()}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch sessions by status');
    }
  }

  // Get single session by ID
  async getSessionById(id: string): Promise<Session> {
    try {
      const response = await api.get(`/sessions/${id}`);
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch session');
    }
  }

  // Create new session
  async createSession(data: CreateSessionData): Promise<Session> {
    try {
      // Automatically calculate expectedAttendeesCount if expectedAttendees is provided
      const sessionData = {
        ...data,
        expectedAttendeesCount: data.expectedAttendees?.length || 0
      };
      
      const response = await api.post('/sessions', sessionData);
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create session');
    }
  }

  // Update session
  async updateSession(data: UpdateSessionData): Promise<Session> {
    try {
      const { id, ...updateData } = data;
      
      // Automatically calculate expectedAttendeesCount if expectedAttendees is provided
      const sessionData = {
        ...updateData,
        ...(updateData.expectedAttendees && {
          expectedAttendeesCount: updateData.expectedAttendees.length
        })
      };
      
      const response = await api.patch(`/sessions/${id}`, sessionData);
      return response.data.data.session;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update session');
    }
  }

  // Delete session
  async deleteSession(id: string): Promise<void> {
    try {
      await api.delete(`/sessions/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete session');
    }
  }

  // Get users for expected attendees selection
  async getUsersForSelection(search?: string): Promise<UserOption[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50'); // Reasonable limit for dropdown
      
      const response = await api.get(`/users?${params.toString()}`);
      const users = response.data.data.users || response.data.data || response.data.users || [];
      
      return users.map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }));
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch users');
    }
  }

  // Get session status (keeping for backward compatibility)
  getSessionStatus(session: Session): 'scheduled' | 'ongoing' | 'completed' | 'cancelled' {
    if (session.status === 'cancelled') return 'cancelled';
    
    const now = new Date();
    const sessionDate = new Date(session.sessionDate);
    const startTime = new Date(`${session.sessionDate}T${session.startTime}`);
    const endTime = new Date(`${session.sessionDate}T${session.endTime}`);

    if (now >= startTime && now <= endTime) {
      return 'ongoing';
    } else if (now < startTime) {
      return 'scheduled';
    } else {
      return 'completed';
    }
  }

  // Format session time for display
  formatSessionTime(session: Session): string {
    if (!session.sessionDate || !session.startTime) return "Time not set";
    
    const sessionDate = new Date(session.sessionDate);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    };
    
    const dateStr = sessionDate.toLocaleDateString("en-US", options);
    const startTime = this.formatTime(session.startTime);
    const endTime = session.endTime ? ` - ${this.formatTime(session.endTime)}` : "";
    
    return `${dateStr}, ${startTime}${endTime}`;
  }

  // Helper to format time string
  formatTime(timeStr: string): string {
    if (!timeStr) return "";
    
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  }

  // Get attendance rate for a session
  getAttendanceRate(session: Session): number {
    if (session.expectedAttendeesCount && session.expectedAttendeesCount > 0) {
      // Use expected count if available
      const actualAttendance = session.attendances?.filter(a => 
        a.status === 'present' || a.status === 'late'
      ).length || 0;
      return Math.round((actualAttendance / session.expectedAttendeesCount) * 100);
    } else if (session.attendances && session.attendances.length > 0) {
      // Fall back to actual attendance records
      const attended = session.attendances.filter(a => 
        a.status === 'present' || a.status === 'late'
      ).length;
      return Math.round((attended / session.attendances.length) * 100);
    }
    return 0;
  }

  // Get session attendance link
  async getAttendanceLink(sessionId: string): Promise<string> {
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}/attendance-link`);
      return response.data.data.attendanceUrl;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to generate attendance link');
    }
  }

  // Add files to session
  async addFilesToSession(sessionId: number | string, files: any[]): Promise<any> {
    try {
      const response = await api.post(`/sessions/${sessionId}/files`, {
        files: files
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to upload files');
    }
  }

  // Remove file from session
  async removeFileFromSession(sessionId: number, fileId: number): Promise<void> {
    try {
      await api.delete(`/sessions/${sessionId}/files/${fileId}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to remove file');
    }
  }

  // Get session statistics (backward compatibility - redirects to new endpoint)
  async getSessionStats(): Promise<any> {
    return this.getSessionStatistics();
  }

  // Get filtered sessions (backward compatibility - redirects to new endpoint)
  async getFilteredSessions(filter: string, filters?: any): Promise<any> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    return this.getSessionsByStatus(filter, page, limit);
  }
}

export default new SessionService();
