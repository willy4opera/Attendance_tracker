import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import attendanceService from '../../services/attendanceService';
import { getOverallStats } from '../../services/attendanceStatsService';
import socketService from '../../services/socket.service';
import { useAuth } from '../../contexts/useAuth';
import toast from 'react-hot-toast';
import AttendanceHistory from './AttendanceHistory';
import SessionAttendance from './SessionAttendance';
import MarkAttendance from './MarkAttendance';
import QRCodeScanner from './QRCodeScanner';
import theme from '../../config/theme';
import type { 
  AttendanceStats, 
  RecentAttendance, 
  Attendance,
  AttendanceState,
  LiveAttendanceSession 
} from '../../types/attendance';

// Dashboard component imports
import { DashboardOverview } from '../../components/attendance/dashboard';

const AttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({
    todayStats: null,
    recentAttendance: [],
    liveSessions: [],
    allAttendance: [],
    loading: true,
    error: null
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);
  const [activeMonitoringSession, setActiveMonitoringSession] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    initializeRealTimeListeners();
    
    // Connect socket for real-time updates
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Initial socket connection status
    setIsSocketConnected(socketService.isConnected());

    // Set up socket event listeners to update connection status
    const handleConnect = () => {
      console.log('Dashboard: Socket connected');
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Dashboard: Socket disconnected');
      setIsSocketConnected(false);
    };

    // Add socket event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    // Check connection status periodically
    const connectionCheckInterval = setInterval(() => {
      const connected = socketService.isConnected();
      if (connected !== isSocketConnected) {
        setIsSocketConnected(connected);
      }
    }, 1000);

    return () => {
      // Cleanup listeners
      attendanceService.unsubscribe('attendance-updated', handleAttendanceUpdate);
      attendanceService.unsubscribe('session-updated', handleSessionUpdate);
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      clearInterval(connectionCheckInterval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch attendance state as before
      const stateData = await attendanceService.getAttendanceState();
      
      // Fetch stats from new API
      const statsResponse = await getOverallStats();
      if (statsResponse.status === 'success') {
        const updatedStats = {
          totalSessions: statsResponse.data.totalSessions,
          attendedSessions: statsResponse.data.totalAttendance,
          upcomingSessions: statsResponse.data.upcomingSessions,
          completedSessions: stateData.todayStats?.completedSessions || 0,
          attendancePercentage: statsResponse.data.attendanceRate
        };
        setAttendanceState({ ...stateData, todayStats: updatedStats });
      } else {
        setAttendanceState(stateData);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      setAttendanceState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  };

  const initializeRealTimeListeners = () => {
    attendanceService.subscribe('attendance-updated', handleAttendanceUpdate);
    attendanceService.subscribe('session-updated', handleSessionUpdate);
  };

  const handleAttendanceUpdate = (data: any) => {
    const update = {
      type: 'attendance',
      message: `${data.userName || data.userEmail} marked attendance`,
      time: new Date().toLocaleTimeString(),
      data
    };
    
    setRealTimeUpdates(prev => [update, ...prev.slice(0, 4)]); // Keep last 5 updates
    
    // Refresh dashboard data
    fetchDashboardData();

    toast.success(update.message, {
      icon: '✅',
      duration: 3000,
    });
  };

  const handleSessionUpdate = (data: any) => {
    const update = {
      type: 'session',
      message: `Session updated: ${data.attendeeCount} total attendees`,
      time: new Date().toLocaleTimeString(),
      data
    };
    
    setRealTimeUpdates(prev => [update, ...prev.slice(0, 4)]);
    fetchDashboardData();
  };

  const handleStartLiveSession = async (sessionId: string) => {
    try {
      await attendanceService.startLiveAttendanceSession(sessionId);
      setActiveMonitoringSession(sessionId);
      toast.success('Started monitoring session', { icon: '🎉' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start monitoring');
    }
  };

  const renderOverview = () => (
    <DashboardOverview
      attendanceState={attendanceState}
      realTimeUpdates={realTimeUpdates}
      activeMonitoringSession={activeMonitoringSession}
      isSocketConnected={isSocketConnected}
      onStartLiveSession={handleStartLiveSession}
      onRetry={fetchDashboardData}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'history':
        return <AttendanceHistory />;
      case 'sessions':
        return <SessionAttendance />;
      case 'mark':
        return <MarkAttendance />;
      case 'scanner':
        return <QRCodeScanner />;
      default:
        return renderOverview();
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'history', name: 'History', icon: CalendarDaysIcon },
    { id: 'sessions', name: 'Sessions', icon: UserGroupIcon },
    { id: 'mark', name: 'Mark Attendance', icon: CheckCircleIcon },
    { id: 'scanner', name: 'QR Scanner', icon: ClockIcon }
  ];

  return (
    <div style={{ backgroundColor: theme.colors.background.default, minHeight: '100vh' }}>
      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
        <div 
          className="fixed top-0 left-0 w-64 h-full shadow-xl"
          style={{ backgroundColor: theme.colors.background.paper }}
        >
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderBottomColor: `${theme.colors.text.secondary}30` }}
          >
            <h2 
              className="text-lg font-semibold"
              style={{ color: theme.colors.text.primary }}
            >Attendance Menu</h2>
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              style={{ color: theme.colors.text.secondary }}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? theme.colors.primary : 'transparent',
                    color: isActive ? 'white' : theme.colors.text.primary
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = `${theme.colors.text.secondary}10`;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Header */}
      <div 
        className="shadow-sm border-b"
        style={{ 
          backgroundColor: theme.colors.background.paper,
          borderBottomColor: `${theme.colors.text.secondary}30`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
                style={{ color: theme.colors.text.secondary }}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 
                className="text-2xl font-bold"
                style={{ color: theme.colors.text.primary }}
              >Attendance Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <div 
                  className={`w-2 h-2 rounded-full ${isSocketConnected ? 'animate-pulse' : ''}`}
                  style={{ 
                    backgroundColor: isSocketConnected ? theme.colors.success : theme.colors.text.secondary 
                  }}
                ></div>
                <span style={{ color: theme.colors.text.secondary }}>
                  {isSocketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {user && (
                <div 
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Welcome, {user.firstName} {user.lastName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop navigation */}
      <div 
        className="hidden lg:block border-b"
        style={{ 
          backgroundColor: theme.colors.background.paper,
          borderBottomColor: `${theme.colors.text.secondary}30`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                  style={{
                    borderBottomColor: isActive ? theme.colors.primary : 'transparent',
                    color: isActive ? theme.colors.primary : theme.colors.text.secondary
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = theme.colors.text.primary;
                      e.currentTarget.style.borderBottomColor = `${theme.colors.text.secondary}50`;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = theme.colors.text.secondary;
                      e.currentTarget.style.borderBottomColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
