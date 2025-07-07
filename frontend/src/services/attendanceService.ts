import api from './api';
import { AxiosError } from 'axios';

export interface AttendanceRecord {
  id: string;
  userId: string;
  sessionId: string;
  status: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  checkInTime: string | null;
  checkOutTime: string | null;
  markedVia: 'manual' | 'qr_code' | 'link_click' | 'api';
  ipAddress?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  session?: {
    id: string;
    title: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
  };
}

export interface AttendanceStats {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  recentAttendance: AttendanceRecord[];
}

export interface TodayStats {
  totalSessions: number;
  attendedSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  attendancePercentage: number;
}

export interface SessionAttendance {
  session: any;
  attendances: AttendanceRecord[];
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    attendanceRate: number;
  };
}

export interface MarkAttendanceData {
  userId: string;
  sessionId: string;
  status: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  notes?: string;
}

class AttendanceService {
  // Get today's attendance statistics
  async getTodayStats(): Promise<TodayStats> {
    try {
      const response = await api.get('/attendance/stats/today');
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch today stats');
    }
  }

  // Get recent attendance records for the current user
  async getRecentAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await api.get('/attendance/recent');
      return response.data.data.attendances || [];
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch recent attendance');
    }
  }

  // Get user's attendance history
  async getUserAttendance(userId?: string): Promise<AttendanceRecord[]> {
    try {
      const endpoint = userId 
        ? `/attendance/users/${userId}/attendance` 
        : '/attendance/users/me/attendance';
      const response = await api.get(endpoint);
      return response.data.data.attendances || [];
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch attendance history');
    }
  }

  // Get session attendance (admin/moderator only)
  async getSessionAttendance(sessionId: string): Promise<SessionAttendance> {
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}/attendance`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch session attendance');
    }
  }

  // Generate attendance link for a session
  async generateAttendanceLink(sessionId: string): Promise<string> {
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}/attendance-link`);
      return response.data.data.attendanceUrl;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to generate attendance link');
    }
  }

  // Mark attendance manually (admin/moderator only)
  async markAttendanceManually(data: MarkAttendanceData): Promise<AttendanceRecord> {
    try {
      const response = await api.post('/attendance/manual', data);
      return response.data.data.attendance;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Mark attendance via QR code
  async markAttendanceViaQR(qrData: string): Promise<AttendanceRecord> {
    try {
      const response = await api.post('/attendance/qr-scan', { qrData });
      return response.data.data.attendance;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to mark attendance via QR');
    }
  }

  // Check-in for a session
  async checkIn(sessionId: string): Promise<AttendanceRecord> {
    try {
      const response = await api.post(`/attendance/sessions/${sessionId}/check-in`);
      return response.data.data.attendance;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to check in');
    }
  }

  // Check-out from a session
  async checkOut(sessionId: string): Promise<AttendanceRecord> {
    try {
      const response = await api.post(`/attendance/sessions/${sessionId}/check-out`);
      return response.data.data.attendance;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to check out');
    }
  }
}

export default new AttendanceService();
