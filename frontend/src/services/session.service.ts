import api from './api';

export interface Session {
  _id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  meetingLink?: string;
  location?: string;
  capacity?: number;
  enrolledCount?: number;
  attendanceCount?: number;
  type?: string;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: string;
  };
  parentSession?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SessionStatistics {
  totalSessions: number;
  activeSessions: number;
  upcomingSessions: number;
  pastSessions: number;
  totalAttendance: number;
  averageAttendanceRate: number;
}

export interface SessionFilters {
  search?: string;
  status?: 'active' | 'upcoming' | 'past' | 'all';
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class SessionService {
  async getAllSessions(filters?: SessionFilters): Promise<{ sessions: Session[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && !(key === 'status' && value === 'all')) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await api.get(`/sessions?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async getSessionById(sessionId: string): Promise<Session> {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data.data.session;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await api.post('/sessions', sessionData);
      return response.data.data.session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, sessionData: Partial<Session>): Promise<Session> {
    try {
      const response = await api.patch(`/sessions/${sessionId}`, sessionData);
      return response.data.data.session;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await api.delete(`/sessions/${sessionId}`);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async getSessionStatistics(): Promise<SessionStatistics> {
    try {
      const response = await api.get('/sessions/statistics/summary');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching session statistics:', error);
      throw error;
    }
  }

  async searchSessions(query: string): Promise<Session[]> {
    try {
      const response = await api.get(`/sessions/search/autocomplete?q=${encodeURIComponent(query)}`);
      return response.data.data.sessions;
    } catch (error) {
      console.error('Error searching sessions:', error);
      throw error;
    }
  }

  getSessionStatus(session: Session): 'active' | 'upcoming' | 'past' {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);

    if (now >= startTime && now <= endTime) {
      return 'active';
    } else if (now < startTime) {
      return 'upcoming';
    } else {
      return 'past';
    }
  }

  formatSessionTime(session: Session): string {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const startDate = start.toLocaleDateString('en-US', dateOptions);
    const startTime = start.toLocaleTimeString('en-US', timeOptions);
    const endTime = end.toLocaleTimeString('en-US', timeOptions);
    
    return `${startDate} • ${startTime} - ${endTime}`;
  }
}

export const sessionService = new SessionService();
export default sessionService;
