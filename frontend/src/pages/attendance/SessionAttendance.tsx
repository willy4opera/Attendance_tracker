import React, { useState, useEffect } from 'react';
import { Search, Users, Download, QrCode, Link, Mail } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import type {  SessionAttendance as SessionAttendanceData  } from '../../services/attendanceService';
import sessionService from '../../services/sessionService';
import { showErrorToast, showSuccessToast } from '../../utils/toastHelpers';
import type { Session } from '../../services/sessionService';

const SessionAttendance: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [sessionAttendance, setSessionAttendance] = useState<SessionAttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [attendanceLink, setAttendanceLink] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionAttendance();
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await sessionService.getAllSessions();
      setSessions(response.sessions);
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    }
  };

  const fetchSessionAttendance = async () => {
    if (!selectedSession) return;
    
    try {
      setLoading(true);
      const data = await attendanceService.getSessionAttendance(selectedSession);
      setSessionAttendance(data);
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceLink = async () => {
    try {
      const link = await attendanceService.generateAttendanceLink(selectedSession);
      setAttendanceLink(link);
      showSuccessToast('Attendance link generated successfully');
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    }
  };

  const generateQRCode = async () => {
    try {
      // This would call the QR code generation endpoint
      const response = await sessionService.generateSessionQR(selectedSession);
      setQrCodeUrl(response.qrCode.dataURL);
      setShowQRModal(true);
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    }
  };

  const exportAttendance = () => {
    if (!sessionAttendance) return;

    const headers = ['Name', 'Email', 'Status', 'Check In Time', 'Check Out Time', 'Method'];
    const rows = sessionAttendance.attendances.map(record => [
      `${record.user?.firstName} ${record.user?.lastName}`,
      record.user?.email || '',
      record.status,
      record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '',
      record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '',
      record.markedVia || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${sessionAttendance.session.title}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Session</h3>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a session</option>
            {filteredSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} - {new Date(session.sessionDate).toLocaleDateString()} 
                ({session.startTime} - {session.endTime})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Session Attendance Details */}
      {selectedSession && sessionAttendance && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{sessionAttendance.session.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(sessionAttendance.session.sessionDate).toLocaleDateString()} | 
                  {sessionAttendance.session.startTime} - {sessionAttendance.session.endTime}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateAttendanceLink}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Link className="w-4 h-4" />
                  Generate Link
                </button>
                <button
                  onClick={generateQRCode}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <QrCode className="w-4 h-4" />
                  Generate QR
                </button>
                <button
                  onClick={exportAttendance}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Statistics */}
          <div className="px-6 py-4 bg-gray-50 grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{sessionAttendance.stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">{sessionAttendance.stats.present}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-yellow-600">{sessionAttendance.stats.late}</p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-red-600">{sessionAttendance.stats.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-blue-600">{sessionAttendance.stats.excused}</p>
              <p className="text-sm text-gray-500">Excused</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-purple-600">{sessionAttendance.stats.attendanceRate}%</p>
              <p className="text-sm text-gray-500">Rate</p>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessionAttendance.attendances.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.user?.firstName} {record.user?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.user?.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'excused' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">{record.markedVia?.replace('_', ' ') || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {sessionAttendance.attendances.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No attendance records yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance Link Display */}
      {attendanceLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Attendance Link:</h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={attendanceLink}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-md text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(attendanceLink);
                showSuccessToast('Link copied to clipboard');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session QR Code</h3>
            <div className="flex justify-center mb-4">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrCodeUrl;
                  a.download = `qr-code-${selectedSession}.png`;
                  a.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionAttendance;
