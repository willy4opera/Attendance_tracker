import api from './api';
import type { AxiosError } from 'axios';
import type { 
  Attendance,
  AttendanceResponse,
  AttendanceFilters,
  AttendanceStats,
  RecentAttendance,
  MarkAttendanceData,
  UpdateAttendanceData,
  AttendanceLinkResponse,
  LiveAttendanceSession,
  AttendanceState
} from '../types/attendance';
import socketService from './socket.service';

class AttendanceService {
  // Real-time event listeners
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeSocketListeners();
  }

  private initializeSocketListeners(): void {
    // Listen for real-time attendance updates
    socketService.on('attendance-marked', (data) => {
      console.log('Real-time attendance update:', data);
      this.notifyListeners('attendance-updated', data);
    });

    socketService.on('session-update', (data) => {
      console.log('Real-time session update:', data);
      this.notifyListeners('session-updated', data);
    });

    socketService.on('live-attendance', (data) => {
      console.log('Live attendance data:', data);
      this.notifyListeners('live-attendance', data);
    });
  }

  // Event subscription methods
  public subscribe(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public unsubscribe(event: string, callback: Function): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(callback);
    }
  }

  private notifyListeners(event: string, data: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => callback(data));
    }
  }

  // Join session room for real-time updates
  public joinSessionRoom(sessionId: string): void {
    socketService.emit('join-session', sessionId);
  }

  public leaveSessionRoom(sessionId: string): void {
    socketService.emit('leave-session', sessionId);
  }

  // Get all attendance records - using the user's own attendance since there's no general endpoint
  async getAllAttendance(filters?: AttendanceFilters): Promise<AttendanceResponse> {
    try {
      // Since there's no general /attendance endpoint, we'll use user's own attendance
      // This is a limitation of the current backend implementation
      const response = await api.get('/attendance/users/me/attendance');
      const attendances = response.data.data.attendances || response.data.data || [];
      
      // Apply client-side filtering if needed
      let filteredAttendances = attendances;
      
      if (filters?.status && filters.status !== 'all') {
        filteredAttendances = filteredAttendances.filter((a: Attendance) => a.status === filters.status);
      }
      
      if (filters?.sessionId) {
        filteredAttendances = filteredAttendances.filter((a: Attendance) => a.sessionId === filters.sessionId);
      }
      
      if (filters?.startDate) {
        filteredAttendances = filteredAttendances.filter((a: Attendance) => {
          const recordDate = a.session?.sessionDate || a.createdAt.split('T')[0];
          return recordDate >= filters.startDate!;
        });
      }
      
      if (filters?.endDate) {
        filteredAttendances = filteredAttendances.filter((a: Attendance) => {
          const recordDate = a.session?.sessionDate || a.createdAt.split('T')[0];
          return recordDate <= filters.endDate!;
        });
      }

      // Apply pagination client-side
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = filteredAttendances.slice(startIndex, endIndex);

      return {
        status: 'success',
        results: paginatedResults.length,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(filteredAttendances.length / limit),
          totalResults: filteredAttendances.length
        },
        data: paginatedResults
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch attendance records');
    }
  }

  // Get attendance for a specific session
  async getSessionAttendance(sessionId: string): Promise<Attendance[]> {
    try {
      console.log('🔍 DEBUG - Getting session attendance for sessionId:', sessionId);
      const response = await api.get(`/attendance/sessions/${sessionId}/attendance`, { skipCache: true });
      console.log('🔍 DEBUG - Session attendance response:', response.data);
      return response.data.data.attendances || response.data.data || [];
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error('❌ DEBUG - Failed to get session attendance:', error);
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch session attendance');
    }
  }

  // Get user's attendance history
  async getUserAttendance(userId?: string): Promise<Attendance[]> {
    try {
      const endpoint = userId ? `/attendance/users/${userId}/attendance` : '/attendance/users/me/attendance';
      const response = await api.get(endpoint);
      return response.data.data.attendances || response.data.data || [];
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch user attendance');
    }
  }

  // Get today's attendance statistics
  async getTodayStats(): Promise<AttendanceStats> {
    try {
      const response = await api.get('/attendance/stats/today');
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch today stats');
    }
  }

  // Get recent attendance records
  async getRecentAttendance(): Promise<RecentAttendance[]> {
    try {
      const response = await api.get('/attendance/recent');
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch recent attendance');
    }
  }

  // Get live/active sessions for attendance marking
  async getLiveSessions(): Promise<LiveAttendanceSession[]> {
    try {
      const response = await api.get('/sessions');
      const sessions = response.data.data?.sessions || response.data.data || [];
      
      const currentTime = new Date();
      const today = currentTime.toISOString().split('T')[0];
      
      // Filter for today's sessions and mark as active/inactive
      const liveSessions: LiveAttendanceSession[] = sessions
        .filter((session: any) => session.sessionDate === today)
        .map((session: any) => {
          const sessionStart = new Date(`${session.sessionDate}T${session.startTime}`);
          const sessionEnd = new Date(`${session.sessionDate}T${session.endTime}`);
          
          const isActive = currentTime >= sessionStart && currentTime <= sessionEnd;
          
          return {
            id: session.id,
            title: session.title,
            sessionDate: session.sessionDate,
            startTime: session.startTime,
            endTime: session.endTime,
            isActive,
            totalAttendance: session.totalAttendance || session.attendanceCount || 0
          };
        })
        .sort((a, b) => {
          // Sort active sessions first, then by start time
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return a.startTime.localeCompare(b.startTime);
        });

      return liveSessions;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch live sessions');
    }
  }

  // Get attendance state for dashboard
  async getAttendanceState(): Promise<AttendanceState> {
    try {
      const [todayStats, recentAttendance, liveSessions] = await Promise.all([
        this.getTodayStats(),
        this.getRecentAttendance(),
        this.getLiveSessions()
      ]);

      // Get user's recent attendance for the allAttendance field
      let allAttendance: Attendance[] = [];
      try {
        const userAttendanceResponse = await this.getAllAttendance({ page: 1, limit: 20 });
        allAttendance = Array.isArray(userAttendanceResponse.data) 
          ? userAttendanceResponse.data 
          : userAttendanceResponse.data.attendances || [];
      } catch (error) {
        console.warn('Failed to fetch user attendance for dashboard:', error);
      }

      return {
        todayStats,
        recentAttendance,
        liveSessions,
        allAttendance,
        loading: false,
        error: null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance data';
      return {
        todayStats: null,
        recentAttendance: [],
        liveSessions: [],
        allAttendance: [],
        loading: false,
        error: errorMessage
      };
    }
  }

  // Mark attendance manually (admin/moderator) - WITH DEBUGGING
  async markAttendanceManually(data: MarkAttendanceData): Promise<Attendance> {
    try {
      console.log('🔍 DEBUG - markAttendanceManually called with data:', data);
      console.log('🔍 DEBUG - API endpoint: POST /attendance/manual');
      
      const response = await api.post('/attendance/manual', data);
      
      console.log('✅ DEBUG - markAttendanceManually success response:', response.data);
      return response.data.data.attendance;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error('❌ DEBUG - markAttendanceManually failed:', {
        error: axiosError.response?.data || axiosError.message,
        data: data,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText
      });
      throw new Error(axiosError.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Update attendance record (admin/moderator) - WITH DEBUGGING
  async updateAttendance(data: UpdateAttendanceData): Promise<Attendance> {
    try {
      const { id, ...updateData } = data;
      
      console.log('🔍 DEBUG - updateAttendance called with:');
      console.log('  - ID:', id);
      console.log('  - Update Data:', updateData);
      console.log('  - Full endpoint: PUT /attendance/' + id);
      console.log('  - Payload being sent:', JSON.stringify(updateData, null, 2));
      
      const response = await api.put(`/attendance/${id}`, updateData);
      
      console.log('✅ DEBUG - updateAttendance success response:', response.data);
      return response.data.data.attendance;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error('❌ DEBUG - updateAttendance failed:', {
        id: data.id,
        updateData: data,
        error: axiosError.response?.data || axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        url: axiosError.config?.url
      });
      throw new Error(axiosError.response?.data?.message || 'Failed to update attendance');
    }
  }

  // Delete attendance record (admin only)
  async deleteAttendance(id: string): Promise<void> {
    try {
      await api.delete(`/attendance/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete attendance');
    }
  }

  async generateAttendanceLink(sessionId: string): Promise<AttendanceLinkResponse> {
  
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}/attendance-link`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to generate attendance link');
    }
  }

  // Mark attendance via link
  async markAttendanceViaLink(sessionId: string, token: string): Promise<Attendance> {
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}/join?token=${token}`);
      return response.data.data.attendance;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to mark attendance');
    }
  }

  // Enhanced method for live session attendance
  async startLiveAttendanceSession(sessionId: string): Promise<{
    session: LiveAttendanceSession;
    attendanceUrl: string;
    frontendUrl: string;
  }> {
    try {
      // Get session details
      const sessionResponse = await api.get(`/sessions/${sessionId}`);
      const session = sessionResponse.data.data.session || sessionResponse.data.data;
      
      // Generate attendance link
      const linkResponse = await this.generateAttendanceLink(sessionId);
      const attendanceUrl = linkResponse.data.attendanceUrl;
      
      // Create frontend URL
      const urlParams = new URLSearchParams(attendanceUrl.split('?')[1]);
      const token = urlParams.get('token');
      const frontendUrl = `${window.location.origin}/attendance/join/${sessionId}?token=${token}`;
      
      // Join session room for real-time updates
      this.joinSessionRoom(sessionId);
      
      const liveSession: LiveAttendanceSession = {
        id: session.id,
        title: session.title,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        isActive: true,
        totalAttendance: session.totalAttendance || 0,
        attendanceUrl,
        expiresAt: linkResponse.data.expiresAt
      };

      return {
        session: liveSession,
        attendanceUrl,
        frontendUrl
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to start live attendance session');
    }
  }

  // Format attendance status for display
  formatStatus(status: string): { text: string; className: string } {
    const statusMap: Record<string, { text: string; className: string }> = {
      present: { text: 'Present', className: 'text-green-600 bg-green-100' },
      late: { text: 'Late', className: 'text-yellow-600 bg-yellow-100' },
      absent: { text: 'Absent', className: 'text-red-600 bg-red-100' },
      excused: { text: 'Excused', className: 'text-blue-600 bg-blue-100' },
      holiday: { text: 'Holiday', className: 'text-purple-600 bg-purple-100' }
    };
    
    return statusMap[status] || { text: status, className: 'text-gray-600 bg-gray-100' };
  }

  // Format marked via method
  formatMarkedVia(method: string): string {
    const methodMap: Record<string, string> = {
      link_click: 'Link',
      manual: 'Manual',
      qr_code: 'QR Code',
      api: 'API',
      self: 'Self'
    };
    
    return methodMap[method] || method;
  }

  // Utility method to get status color classes using brand colors
  getStatusColorClass(status: string): string {
    const statusColors: Record<string, string> = {
      present: 'text-green-700 bg-green-100 border-green-200',
      late: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      absent: 'text-red-700 bg-red-100 border-red-200',
      excused: 'text-blue-700 bg-blue-100 border-blue-200',
      holiday: 'text-purple-700 bg-purple-100 border-purple-200'
    };
    
    return statusColors[status] || 'text-gray-700 bg-gray-100 border-gray-200';
  }

  // Get attendance summary for a date range - client-side implementation
  async getAttendanceSummary(startDate: string, endDate: string): Promise<{
    totalSessions: number;
    attendedSessions: number;
    absentSessions: number;
    lateAttendances: number;
    attendancePercentage: number;
    statusBreakdown: Record<string, number>;
  }> {
    try {
      const response = await this.getAllAttendance({
        startDate,
        endDate,
        limit: 1000 // Get all records for the period
      });

      const attendances = Array.isArray(response.data) 
        ? response.data 
        : response.data.attendances || [];

      const statusBreakdown: Record<string, number> = {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        holiday: 0
      };

      attendances.forEach(attendance => {
        statusBreakdown[attendance.status] = (statusBreakdown[attendance.status] || 0) + 1;
      });

      const totalSessions = attendances.length;
      const attendedSessions = statusBreakdown.present + statusBreakdown.late;
      const absentSessions = statusBreakdown.absent;
      const lateAttendances = statusBreakdown.late;
      const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

      return {
        totalSessions,
        attendedSessions,
        absentSessions,
        lateAttendances,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        statusBreakdown
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new AttendanceService();
