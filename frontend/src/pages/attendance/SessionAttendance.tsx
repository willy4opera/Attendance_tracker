import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  LinkIcon,
  EnvelopeIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import attendanceService from '../../services/attendanceService';
import sessionService from '../../services/sessionService';
import toast from 'react-hot-toast';
import type { Attendance, LiveAttendanceSession } from '../../types/attendance';
import type { Session } from "../../types/session";

const SessionAttendance: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [sessionAttendance, setSessionAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [attendanceLink, setAttendanceLink] = useState('');
  const [liveSession, setLiveSession] = useState<LiveAttendanceSession | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
    initializeRealTimeListeners();

    return () => {
      // Cleanup listeners
      attendanceService.unsubscribe('attendance-updated', handleAttendanceUpdate);
      if (isMonitoring && selectedSession) {
        attendanceService.leaveSessionRoom(selectedSession);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionAttendance();
      checkIfSessionIsLive();
    }
  }, [selectedSession]);

  const initializeRealTimeListeners = () => {
    attendanceService.subscribe('attendance-updated', handleAttendanceUpdate);
  };

  const handleAttendanceUpdate = (data: any) => {
    if (data.sessionId === selectedSession) {
      const update = {
        type: 'attendance',
        message: `${data.userName || data.userEmail} marked attendance`,
        time: new Date().toLocaleTimeString(),
        data
      };
      
      setRealTimeUpdates(prev => [update, ...prev.slice(0, 4)]); // Keep last 5 updates
      
      // Refresh attendance data
      fetchSessionAttendance();

      toast.success(update.message, {
        icon: '✅',
        duration: 3000,
      });
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await sessionService.getAllSessions();
      setSessions(response.data?.sessions || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch sessions');
    }
  };

  const fetchSessionAttendance = async () => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      const data = await attendanceService.getSessionAttendance(selectedSession);
      setSessionAttendance(data);
    } catch (error) {
      toast.error('Failed to fetch session attendance');
    } finally {
      setLoading(false);
    }
  };

  const checkIfSessionIsLive = async () => {
    if (!selectedSession) return;

    try {
      const liveSessions = await attendanceService.getLiveSessions();
      const currentLiveSession = liveSessions.find(s => s.id === selectedSession);
      setLiveSession(currentLiveSession || null);
    } catch (error) {
      console.error('Failed to check live session status:', error);
    }
  };

  const generateAttendanceLink = async () => {
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    try {
      const response = await attendanceService.generateAttendanceLink(selectedSession);
      const backendUrl = response.data.attendanceUrl;
      
      // Create frontend URL
      const urlParams = new URLSearchParams(backendUrl.split('?')[1]);
      const token = urlParams.get('token');
      const frontendUrl = `${window.location.origin}/attendance/join/${selectedSession}?token=${token}`;
      
      setAttendanceLink(frontendUrl);
      
      // Generate QR code URL (you might want to use a QR code service)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(frontendUrl)}`);
      
      toast.success('Attendance link generated successfully!');
    } catch (error) {
      toast.error('Failed to generate attendance link');
    }
  };

  const startLiveMonitoring = async () => {
    if (!selectedSession) return;

    try {
      await attendanceService.startLiveAttendanceSession(selectedSession);
      setIsMonitoring(true);
      toast.success('Started live monitoring', { icon: '🎉' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start monitoring');
    }
  };

  const stopLiveMonitoring = () => {
    if (selectedSession) {
      attendanceService.leaveSessionRoom(selectedSession);
      setIsMonitoring(false);
      setRealTimeUpdates([]);
      toast.success('Stopped monitoring session');
    }
  };

  const copyLink = () => {
    if (attendanceLink) {
      navigator.clipboard.writeText(attendanceLink);
      toast.success('Link copied to clipboard!', { icon: '📋' });
    }
  };

  const exportAttendance = () => {
    if (sessionAttendance.length === 0) {
      toast.error('No attendance data to export');
      return;
    }

    const selectedSessionData = sessions.find(s => s.id === selectedSession);
    const csvData = [
      ['Name', 'Email', 'Status', 'Check-in Time', 'Duration', 'Marked Via', 'Late Minutes'],
      ...sessionAttendance.map(record => [
        `${record.user?.firstName || ''} ${record.user?.lastName || ''}`.trim(),
        record.user?.email || '',
        record.status,
        record.checkInTime ? new Date(record.checkInTime).toLocaleString() : 'N/A',
        record.duration ? `${record.duration} minutes` : 'N/A',
        attendanceService.formatMarkedVia(record.markedVia),
        record.isLate ? record.lateMinutes || 0 : 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${selectedSessionData?.title || 'session'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance data exported successfully!');
  };

  const filteredAttendance = sessionAttendance.filter(record =>
    searchTerm === '' || 
    record.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStats = () => {
    const total = sessionAttendance.length;
    const present = sessionAttendance.filter(r => r.status === 'present').length;
    const late = sessionAttendance.filter(r => r.status === 'late').length;
    const absent = sessionAttendance.filter(r => r.status === 'absent').length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, late, absent, attendanceRate };
  };

  const stats = getAttendanceStats();
  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Session Attendance Management</h2>
            <p className="text-sm text-gray-600">Select a session to view and manage attendance</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchSessions}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533]"
          >
            <option value="">Select a session...</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} - {new Date(session.sessionDate).toLocaleDateString()} 
                ({session.startTime} - {session.endTime})
                {session.totalAttendance ? ` - ${session.totalAttendance} attendees` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSession && (
        <>
          {/* Session Info and Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedSessionData?.title}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span>Date: {selectedSessionData && new Date(selectedSessionData.sessionDate).toLocaleDateString()}</span>
                  <span>Time: {selectedSessionData?.startTime} - {selectedSessionData?.endTime}</span>
                  {liveSession && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      liveSession.isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {liveSession.isActive ? (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                          Live Now
                        </>
                      ) : (
                        'Scheduled'
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {liveSession?.isActive && !isMonitoring && (
                  <button
                    onClick={startLiveMonitoring}
                    className="flex items-center space-x-1 bg-[#be8533] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#a06b1f] transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Start Monitoring</span>
                  </button>
                )}

                {isMonitoring && (
                  <button
                    onClick={stopLiveMonitoring}
                    className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <StopIcon className="w-4 h-4" />
                    <span>Stop Monitoring</span>
                  </button>
                )}

                <button
                  onClick={generateAttendanceLink}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Generate Link</span>
                </button>

                <button
                  onClick={exportAttendance}
                  disabled={sessionAttendance.length === 0}
                  className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Attendance Link */}
            {attendanceLink && (
              <div className="mt-4 p-4 bg-[#fddc9a] rounded-lg border-2 border-[#be8533]">
                <h4 className="font-semibold text-[#a06b1f] mb-2">Attendance Link Generated</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={attendanceLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-[#be8533] rounded-md text-sm font-mono"
                  />
                  <button
                    onClick={copyLink}
                    className="bg-[#be8533] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#a06b1f] flex items-center space-x-1"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-sm text-[#a06b1f] mt-2">
                  Share this link with participants to mark their attendance
                </p>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-[#be8533]" />
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                  <p className="text-sm font-medium text-gray-600">Late</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-[#be8533] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">%</span>
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                  <p className="text-sm font-medium text-gray-600">Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Attendance Records ({filteredAttendance.length})
                    </h3>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533] w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#be8533]"></div>
                    </div>
                  ) : filteredAttendance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check-in Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAttendance.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {record.user?.firstName} {record.user?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">{record.user?.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  attendanceService.getStatusColorClass(record.status)
                                }`}>
                                  {attendanceService.formatStatus(record.status).text}
                                  {record.isLate && ` (+${record.lateMinutes || 0}m)`}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.checkInTime 
                                  ? new Date(record.checkInTime).toLocaleString()
                                  : new Date(record.createdAt).toLocaleString()
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {attendanceService.formatMarkedVia(record.markedVia)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.duration ? `${record.duration}m` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'No results match your search.' : 'No one has marked attendance yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Updates */}
            <div className="space-y-6">
              {isMonitoring && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Live Updates</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Monitoring</span>
                    </div>
                  </div>
                  <div className="p-6">
                    {realTimeUpdates.length > 0 ? (
                      <div className="space-y-3">
                        {realTimeUpdates.map((update, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-gray-900">{update.message}</p>
                                <p className="text-xs text-gray-500">{update.time}</p>
                              </div>
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">
                        No real-time updates yet...
                        <br />
                        <span className="text-xs">Waiting for attendance events</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code</h3>
                  <div className="text-center">
                    <img src={qrCodeUrl} alt="Attendance QR Code" className="mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      Participants can scan this QR code to mark attendance
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SessionAttendance;
