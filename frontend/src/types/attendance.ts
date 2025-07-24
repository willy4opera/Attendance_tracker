// Attendance Types
export interface Attendance {
  id: string;
  userId: string;
  sessionId: string;
  status: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  markedVia: 'link_click' | 'manual' | 'qr_code' | 'api' | 'self';
  userAgent?: string;
  markedBy?: string;
  markedAt: string;
  notes?: string;
  location?: any;
  ipAddress?: string;
  deviceInfo?: any;
  isLate: boolean;
  lateMinutes: number;
  duration?: number;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    department?: string;
  };
  session?: {
    id: string;
    title: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
    meetingType?: string;
  };
  markedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  sessionId?: string;
  userId?: string;
  status?: 'all' | 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  startDate?: string;
  endDate?: string;
  markedVia?: string;
}

export interface AttendanceResponse {
  status: string;
  results: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
  data: Attendance[] | {
    attendances: Attendance[];
  };
}

export interface AttendanceStats {
  totalSessions: number;
  attendedSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  attendancePercentage: number;
}

export interface RecentAttendance {
  id: string;
  sessionTitle: string;
  date: string;
  time: string;
  status: string;
  markedAt: string;
}

export interface MarkAttendanceData {
  userId: string;
  sessionId: string;
  status: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  notes?: string;
}

export interface UpdateAttendanceData {
  id: string;
  status?: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  isApproved?: boolean;
}

export interface AttendanceLinkResponse {
  status: string;
  data: {
    attendanceUrl: string;
    session: {
      id: string;
      title: string;
      date: string;
      time: string;
      meetingType: string;
    };
    expiresAt: string;
  };
}

// Additional types for enhanced attendance functionality
export interface LiveAttendanceSession {
  id: string;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  totalAttendance: number;
  attendanceUrl?: string;
  expiresAt?: string;
}

export interface AttendanceState {
  todayStats: AttendanceStats | null;
  recentAttendance: RecentAttendance[];
  liveSessions: LiveAttendanceSession[];
  allAttendance: Attendance[];
  loading: boolean;
  error: string | null;
}
