import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import type { AttendanceRecord, TodayStats } from '../../services/attendanceService';
import { useAuth } from '../../contexts/useAuth';
import { showErrorToast } from '../../utils/toastHelpers';
import AttendanceHistory from './AttendanceHistory';
import SessionAttendance from './SessionAttendance';
import MarkAttendance from './MarkAttendance';
import QRCodeScanner from './QRCodeScanner';
import theme from '../../config/theme';

const AttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, recent] = await Promise.all([
        attendanceService.getTodayStats(),
        attendanceService.getRecentAttendance()
      ]);
      setTodayStats(stats);
      setRecentAttendance(recent);
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'late':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'excused':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Today's Statistics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : todayStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sessions</p>
                <p className="text-2xl font-semibold text-black">{todayStats.totalSessions}</p>
              </div>
              <Calendar className="w-8 h-8" style={{ color: theme.colors.primary }} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attended</p>
                <p className="text-2xl font-semibold text-black">{todayStats.attendedSessions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-semibold text-black">{todayStats.attendancePercentage}%</p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: theme.colors.primary }} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Attendance */}
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
        <div className="px-6 py-4 border-b border-gray-200" style={{ borderBottomColor: theme.colors.primary + '30' }}>
          <h3 className="text-lg font-medium text-black">Recent Attendance</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : recentAttendance && recentAttendance.length > 0 ? (
            <div className="space-y-4">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium text-black">{record.sessionTitle || record.session?.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.date || record.session?.sessionDate || '').toLocaleDateString()} {record.time ? record.time : ''} 
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    record.status === 'absent' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent attendance records</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Attendance Management</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? `border-[${theme.colors.primary}] text-black`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={activeTab === 'overview' ? { borderBottomColor: theme.colors.primary } : {}}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? `border-[${theme.colors.primary}] text-black`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={activeTab === 'history' ? { borderBottomColor: theme.colors.primary } : {}}
          >
            My Attendance
          </button>
          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <>
              <button
                onClick={() => setActiveTab('session-attendance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'session-attendance'
                    ? `border-[${theme.colors.primary}] text-black`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={activeTab === 'session-attendance' ? { borderBottomColor: theme.colors.primary } : {}}
              >
                Session Attendance
              </button>
              <button
                onClick={() => setActiveTab('mark-attendance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'mark-attendance'
                    ? `border-[${theme.colors.primary}] text-black`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={activeTab === 'mark-attendance' ? { borderBottomColor: theme.colors.primary } : {}}
              >
                Mark Attendance
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('qr-scanner')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'qr-scanner'
                ? `border-[${theme.colors.primary}] text-black`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={activeTab === 'qr-scanner' ? { borderBottomColor: theme.colors.primary } : {}}
          >
            QR Scanner
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'history' && <AttendanceHistory />}
        {activeTab === 'session-attendance' && <SessionAttendance />}
        {activeTab === 'mark-attendance' && <MarkAttendance />}
        {activeTab === 'qr-scanner' && <QRCodeScanner />}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
