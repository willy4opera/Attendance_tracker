import type { Attendance } from "../../../types/attendance";
import type { User } from "../../../types";
import type { AttendanceEntry, AttendanceStats } from './types';

export const getFilteredUsers = (
  users: User[],
  searchTerm: string,
  statusFilter: string,
  departmentFilter: string,
  attendanceData: Map<string, AttendanceEntry>
): User[] => {
  let filtered = users.filter(user =>
    searchTerm === '' || 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (statusFilter !== 'all') {
    filtered = filtered.filter(user => {
      const attendance = attendanceData.get(user.id);
      if (statusFilter === 'not_marked') {
        return !attendance;
      }
      if (statusFilter === 'modified') {
        return attendance?.isModified;
      }
      return attendance?.status === statusFilter;
    });
  }

  if (departmentFilter !== 'all') {
    filtered = filtered.filter(user => user.department?.name === departmentFilter);
  }

  return filtered;
};

export const getAttendanceStats = (
  users: User[],
  attendanceData: Map<string, AttendanceEntry>
): AttendanceStats => {
  const totalUsers = users.length;
  const markedUsers = attendanceData.size;
  const modifiedUsers = Array.from(attendanceData.values()).filter(a => a.isModified).length;
  const presentUsers = Array.from(attendanceData.values()).filter(a => a.status === 'present').length;
  const lateUsers = Array.from(attendanceData.values()).filter(a => a.status === 'late').length;
  const absentUsers = Array.from(attendanceData.values()).filter(a => a.status === 'absent').length;
  const excusedUsers = Array.from(attendanceData.values()).filter(a => a.status === 'excused').length;

  return {
    totalUsers,
    markedUsers,
    modifiedUsers,
    presentUsers,
    lateUsers,
    absentUsers,
    excusedUsers,
    unmarkedUsers: totalUsers - markedUsers
  };
};

export const getDepartments = (users: User[]): string[] => {
  const departments = new Set(users.map(u => u.department?.name).filter(Boolean));
  return Array.from(departments);
};

export const exportAttendanceCSV = (
  attendanceData: Map<string, AttendanceEntry>,
  users: User[],
  existingAttendance: Attendance[],
  sessionTitle?: string
) => {
  const csvData = [];
  const headers = ['Name', 'Email', 'Department', 'Status', 'Notes', 'Marked At'];
  csvData.push(headers.join(','));

  attendanceData.forEach((attendance, userId) => {
    const user = users.find(u => u.id === userId);
    const existingRecord = existingAttendance.find(r => r.userId === userId);
    
    if (user) {
      const row = [
        `"${user.firstName} ${user.lastName}"`,
        user.email,
        user.department?.name || 'N/A',
        attendance.status,
        `"${attendance.notes || ''}"`,
        existingRecord?.markedAt ? new Date(existingRecord.markedAt).toLocaleString() : 'Not marked'
      ];
      csvData.push(row.join(','));
    }
  });

  const csvBlob = new Blob([csvData.join('\n')], { type: 'text/csv' });
  const csvUrl = URL.createObjectURL(csvBlob);
  const link = document.createElement('a');
  link.href = csvUrl;
  link.download = `attendance-${sessionTitle || 'session'}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(csvUrl);
};
