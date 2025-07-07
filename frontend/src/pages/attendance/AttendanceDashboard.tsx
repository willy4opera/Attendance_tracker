import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp, CheckCircle, XCircle, AlertCircle, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />;
      case 'late':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'excused': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'scanner', label: 'QR Scanner', icon: CheckCircle },
    { id: 'history', label: 'My History', icon: Clock },
    ...(user?.role === 'admin' || user?.role === 'moderator' 
      ? [
          { id: 'sessions', label: 'Session Attendance', icon: Users },
          { id: 'mark', label: 'Mark Attendance', icon: Calendar }
        ] 
      : [])
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div 
          className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2"
          style={{ borderColor: theme.colors.primary }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Attendance Dashboard</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block bg-white shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-col lg:flex-row lg:space-x-8 py-2 lg:py-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center space-x-2 px-3 py-3 lg:py-4 text-sm font-medium
                    border-b-2 lg:border-b-2 w-full lg:w-auto text-left
                    transition-colors duration-200
                    ${activeTab === tab.id 
                      ? 'text-black' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  style={{
                    borderBottomColor: activeTab === tab.id ? theme.colors.primary : undefined
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Sessions</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">
                      {todayStats?.totalSessions || 0}
                    </p>
                  </div>
                  <Calendar 
                    className="w-8 h-8 sm:w-12 sm:h-12 opacity-20"
                    style={{ color: theme.colors.primary }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Attended</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                      {todayStats?.attendedSessions || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                      {todayStats?.upcomingSessions || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: theme.colors.primary }}>
                      {todayStats?.attendancePercentage || 0}%
                    </p>
                  </div>
                  <TrendingUp 
                    className="w-8 h-8 sm:w-12 sm:h-12 opacity-20"
                    style={{ color: theme.colors.primary }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Attendance</h2>
              </div>
              
              {recentAttendance.length === 0 ? (
                <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  No attendance records found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check-in Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentAttendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.session?.title || 'Unknown Session'}
                              </div>
                              <div className="text-xs text-gray-500 sm:hidden">
                                {new Date(record.session?.sessionDate || record.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.session?.sessionDate || record.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              <span className="ml-1 capitalize">{record.status}</span>
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'scanner' && <QRCodeScanner />}
        {activeTab === 'history' && <AttendanceHistory />}
        {activeTab === 'sessions' && <SessionAttendance />}
        {activeTab === 'mark' && <MarkAttendance />}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
