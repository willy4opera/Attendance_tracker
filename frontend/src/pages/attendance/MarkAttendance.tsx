import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Save } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import sessionService from '../../services/sessionService';
import type { Session } from '../../services/sessionService';
import userService from '../../services/userService';
import type { User } from '../../services/userService';
import { showErrorToast, showSuccessToast } from '../../utils/toastHelpers';

interface AttendanceEntry {
  userId: string;
  status: 'present' | 'late' | 'absent' | 'excused' | 'holiday';
  notes?: string;
}

const MarkAttendance: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchExistingAttendance();
    }
  }, [selectedSession]);

  const fetchData = async () => {
    try {
      const [sessionsData, usersData] = await Promise.all([
        sessionService.getAllSessions(),
        userService.getAllUsers()
      ]);
      setSessions(sessionsData.sessions);
      setUsers(usersData.users);
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    }
  };

  const fetchExistingAttendance = async () => {
    if (!selectedSession) return;
    
    try {
      const sessionAttendance = await attendanceService.getSessionAttendance(selectedSession);
      const existingData = new Map<string, AttendanceEntry>();
      
      sessionAttendance.attendances.forEach(record => {
        existingData.set(record.userId, {
          userId: record.userId,
          status: record.status,
          notes: record.notes
        });
      });
      
      // Initialize attendance for all users
      users.forEach(user => {
        if (!existingData.has(user.id)) {
          existingData.set(user.id, {
            userId: user.id,
            status: 'absent',
            notes: ''
          });
        }
      });
      
      setAttendanceData(existingData);
    } catch (error) {
      // If no attendance records exist, initialize all as absent
      const newData = new Map<string, AttendanceEntry>();
      users.forEach(user => {
        newData.set(user.id, {
          userId: user.id,
          status: 'absent',
          notes: ''
        });
      });
      setAttendanceData(newData);
    }
  };

  const handleStatusChange = (userId: string, status: string) => {
    const newData = new Map(attendanceData);
    const entry = newData.get(userId) || { userId, status: 'absent' as const };
    entry.status = status as any;
    newData.set(userId, entry);
    setAttendanceData(newData);
  };

  const handleNotesChange = (userId: string, notes: string) => {
    const newData = new Map(attendanceData);
    const entry = newData.get(userId) || { userId, status: 'absent' as const };
    entry.notes = notes;
    newData.set(userId, entry);
    setAttendanceData(newData);
  };

  const applyBulkStatus = () => {
    if (!bulkStatus) return;
    
    const newData = new Map(attendanceData);
    filteredUsers.forEach(user => {
      const entry = newData.get(user.id) || { userId: user.id, status: 'absent' as const };
      entry.status = bulkStatus as any;
      newData.set(user.id, entry);
    });
    setAttendanceData(newData);
    setBulkStatus('');
    showSuccessToast('Bulk status applied');
  };

  const saveAttendance = async () => {
    if (!selectedSession) {
      showErrorToast(new Error('Please select a session'));
      return;
    }

    try {
      setLoading(true);
      const promises = Array.from(attendanceData.values()).map(entry =>
        attendanceService.markAttendanceManually({
          userId: entry.userId,
          sessionId: selectedSession,
          status: entry.status,
          notes: entry.notes
        })
      );
      
      await Promise.all(promises);
      showSuccessToast('Attendance saved successfully');
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 border-green-300';
      case 'late': return 'bg-yellow-100 border-yellow-300';
      case 'absent': return 'bg-red-100 border-red-300';
      case 'excused': return 'bg-blue-100 border-blue-300';
      case 'holiday': return 'bg-purple-100 border-purple-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Attendance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title} - {new Date(session.sessionDate).toLocaleDateString()} 
                  ({session.startTime} - {session.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Marking */}
      {selectedSession && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Mark Attendance</h3>
              <button
                onClick={saveAttendance}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Search and Bulk Actions */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Bulk Action</option>
                  <option value="present">Mark All Present</option>
                  <option value="absent">Mark All Absent</option>
                  <option value="late">Mark All Late</option>
                  <option value="excused">Mark All Excused</option>
                  <option value="holiday">Mark All Holiday</option>
                </select>
                <button
                  onClick={applyBulkStatus}
                  disabled={!bulkStatus}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const attendance = attendanceData.get(user.id) || { userId: user.id, status: 'absent', notes: '' };
                
                return (
                  <div
                    key={user.id}
                    className={`p-4 border rounded-lg transition-colors ${getStatusColor(attendance.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <UserCheck className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <select
                          value={attendance.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                          <option value="holiday">Holiday</option>
                        </select>
                        
                        <input
                          type="text"
                          placeholder="Notes (optional)"
                          value={attendance.notes || ''}
                          onChange={(e) => handleNotesChange(user.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
