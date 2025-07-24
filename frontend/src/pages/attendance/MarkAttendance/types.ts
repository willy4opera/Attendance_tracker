import type { Session } from "../../../types/session";
import type { User } from "../../../types";
import type { Attendance } from '../../../types/attendance';

export interface AttendanceEntry {
  userId: string;
  status: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  notes?: string;
  isModified?: boolean;
}

export interface AttendanceStats {
  totalUsers: number;
  markedUsers: number;
  modifiedUsers: number;
  presentUsers: number;
  lateUsers: number;
  absentUsers: number;
  excusedUsers: number;
  unmarkedUsers: number;
}

export interface MarkAttendanceState {
  sessions: Session[];
  users: User[];
  selectedSession: string;
  searchTerm: string;
  attendanceData: Map<string, AttendanceEntry>;
  existingAttendance: Attendance[];
  loading: boolean;
  saving: boolean;
  bulkStatus: string;
  showFilters: boolean;
  statusFilter: string;
  departmentFilter: string;
  attendanceLink: string;
  generatingLink: boolean;
  showPreview: boolean;
  autoSave: boolean;
}
