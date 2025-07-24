// Session Types
export interface Session {
  id: string;
  title: string;
  description?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  facilitatorId?: string;
  meetingLink?: string;
  meetingType?: 'online' | 'offline' | 'hybrid';
  location?: string;
  maxAttendees?: number;
  tags?: string[];
  category?: string;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  totalAttendance: number;
  attendanceCount?: string;
  qrCode?: string;
  files?: SessionFile[];
  
  // New expected attendees fields
  expectedAttendees?: string[]; // Array of user IDs
  expectedAttendeesCount?: number; // Cached count for performance
  
  createdAt: string;
  updatedAt: string;
  
  // Relations
  facilitator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attendances?: SessionAttendance[];
}

export interface SessionAttendance {
  id: string;
  userId: string;
  sessionId: string;
  status: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  markedVia: 'manual' | 'qr_code' | 'link_click' | 'api' | 'self';
  markedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SessionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
}

export interface SessionsResponse {
  status: string;
  results: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
  data: {
    sessions: Session[];
  };
}

export interface CreateSessionData {
  title: string;
  description?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  facilitatorId?: string;
  meetingLink?: string;
  meetingType?: 'online' | 'offline' | 'hybrid';
  location?: string;
  maxAttendees?: number;
  tags?: string[];
  category?: string;
  
  // New expected attendees fields
  expectedAttendees?: string[]; // Array of user IDs expected to attend
}

export interface UpdateSessionData extends Partial<CreateSessionData> {
  id: string;
}

export interface SessionFile {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// User selection interface for expected attendees
export interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string; // Computed full name for display
}
