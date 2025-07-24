import React, { useEffect, useState, useRef } from 'react';
import { 
  ClockIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  LinkIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  QrCodeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import attendanceService from '../../services/attendanceService';
import socketService from '../../services/socket.service';
import theme from '../../config/theme';
import toast from 'react-hot-toast';
import type { 
  Attendance, 
  AttendanceState, 
  LiveAttendanceSession 
} from '../../types/attendance';

interface LiveSessionCardProps {
  session: LiveAttendanceSession;
  onStartSession: (sessionId: string) => void;
  onViewAttendance: (sessionId: string) => void;
  isActive: boolean;
}

const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ 
  session, 
  onStartSession, 
  onViewAttendance, 
  isActive 
}) => {
  const [attendanceCount, setAttendanceCount] = useState(session.totalAttendance);

  useEffect(() => {
    setAttendanceCount(session.totalAttendance);
  }, [session.totalAttendance]);

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = () => {
    if (session.isActive) return 'border-green-500 bg-green-50';
    return 'border-orange-300 bg-orange-50';
  };

  const getStatusText = () => {
    if (session.isActive) return 'Live Now';
    const sessionStart = new Date(`${session.sessionDate}T${session.startTime}`);
    const now = new Date();
    
    if (sessionStart > now) return 'Upcoming';
    return 'Ended';
  };

  const getStatusTextColor = () => {
    if (session.isActive) return 'text-green-700';
    return 'text-orange-700';
  };

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${getStatusColor()}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{session.title}</h3>
          <p className="text-sm text-gray-600">
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusTextColor()} whitespace-nowrap`}>
          {session.isActive && <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>}
          {getStatusText()}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
          <span>{attendanceCount} present</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {session.isActive && !isActive && (
            <button
              onClick={() => onStartSession(session.id)}
              className="w-full sm:w-auto px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: theme.colors.text.primary 
              }}
            >
              <PlayIcon className="w-4 h-4" />
              <span>Start Monitoring</span>
            </button>
          )}
          
          {isActive && session.isActive && (
            <div className="w-full sm:w-auto bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium text-center">
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Monitoring Live</span>
              </div>
            </div>
          )}

          <button
            onClick={() => onViewAttendance(session.id)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center justify-center space-x-1"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const AttendancePage: React.FC = () => {
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({
    todayStats: null,
    recentAttendance: [],
    liveSessions: [],
    allAttendance: [],
    loading: true,
    error: null
  });

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [attendanceLink, setAttendanceLink] = useState<string>('');
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);
  const [sessionAttendances, setSessionAttendances] = useState<Record<string, Attendance[]>>({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const realtimeUpdatesRef = useRef<HTMLDivElement>(null);

  // Initialize data and real-time listeners
  useEffect(() => {
    loadAttendanceData();
    initializeRealTimeListeners();
    
    // Connect to socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Initial socket connection status
    setIsSocketConnected(socketService.isConnected());

    // Set up socket event listeners to update connection status
    const handleConnect = () => {
      console.log('AttendancePage: Socket connected');
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('AttendancePage: Socket disconnected');
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
    }, 2000);

    return () => {
      // Clean up listeners
      attendanceService.unsubscribe('attendance-updated', handleAttendanceUpdate);
      attendanceService.unsubscribe('session-updated', handleSessionUpdate);
      attendanceService.unsubscribe('live-attendance', handleLiveAttendance);
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      clearInterval(connectionCheckInterval);
      
      if (activeSession) {
        attendanceService.leaveSessionRoom(activeSession);
      }
    };
  }, []);

  const loadAttendanceData = async () => {
    try {
      // Load data separately to handle failures gracefully
      let todayStats = null;
      let recentAttendance: any[] = [];
      let liveSessions: LiveAttendanceSession[] = [];
      let allAttendance: Attendance[] = [];

      // Try to get today's stats - if it fails, create mock data
      try {
        todayStats = await attendanceService.getTodayStats();
      } catch (error) {
        console.warn('Failed to load today stats, using fallback:', error);
        // Create fallback stats based on available data
        try {
          const sessions = await attendanceService.getLiveSessions();
          const userAttendance = await attendanceService.getUserAttendance();
          
          todayStats = {
            totalSessions: sessions.length,
            attendedSessions: userAttendance.length,
            upcomingSessions: sessions.filter(s => !s.isActive).length,
            completedSessions: sessions.filter(s => s.isActive).length,
            attendancePercentage: sessions.length > 0 ? (userAttendance.length / sessions.length) * 100 : 0
          };
        } catch {
          todayStats = {
            totalSessions: 0,
            attendedSessions: 0,
            upcomingSessions: 0,
            completedSessions: 0,
            attendancePercentage: 0
          };
        }
      }

      // Try to get recent attendance
      try {
        recentAttendance = await attendanceService.getRecentAttendance();
      } catch (error) {
        console.warn('Failed to load recent attendance:', error);
        recentAttendance = [];
      }

      // Try to get live sessions
      try {
        liveSessions = await attendanceService.getLiveSessions();
      } catch (error) {
        console.warn('Failed to load live sessions:', error);
        liveSessions = [];
      }

      // Try to get user attendance
      try {
        const userAttendanceResponse = await attendanceService.getAllAttendance({ page: 1, limit: 20 });
        allAttendance = Array.isArray(userAttendanceResponse.data) 
          ? userAttendanceResponse.data 
          : userAttendanceResponse.data.attendances || [];
      } catch (error) {
        console.warn('Failed to load user attendance:', error);
        allAttendance = [];
      }

      setAttendanceState({
        todayStats,
        recentAttendance,
        liveSessions,
        allAttendance,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Failed to load attendance data:', error);
      setAttendanceState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
      toast.error('Failed to load attendance data');
    }
  };

  const initializeRealTimeListeners = () => {
    attendanceService.subscribe('attendance-updated', handleAttendanceUpdate);
    attendanceService.subscribe('session-updated', handleSessionUpdate);
    attendanceService.subscribe('live-attendance', handleLiveAttendance);
  };

  const handleAttendanceUpdate = (data: any) => {
    const update = {
      type: 'attendance',
      message: `${data.userName || data.userEmail} marked attendance`,
      time: new Date().toLocaleTimeString(),
      data
    };
    
    setRealTimeUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
    
    // Refresh attendance data
    loadAttendanceData();
    
    // Update session attendance if viewing
    if (activeSession === data.sessionId) {
      loadSessionAttendance(data.sessionId);
    }

    toast.success(update.message, {
      icon: '✅',
      duration: 3000,
    });

    // Scroll to top of updates
    setTimeout(() => {
      realtimeUpdatesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSessionUpdate = (data: any) => {
    const update = {
      type: 'session',
      message: `Session updated: ${data.attendeeCount} total attendees`,
      time: new Date().toLocaleTimeString(),
      data
    };
    
    setRealTimeUpdates(prev => [update, ...prev.slice(0, 9)]);
    loadAttendanceData();
  };

  const handleLiveAttendance = (data: any) => {
    console.log('Live attendance data received:', data);
    setRealTimeUpdates(prev => [
      {
        type: 'live',
        message: 'Live attendance data updated',
        time: new Date().toLocaleTimeString(),
        data
      },
      ...prev.slice(0, 9)
    ]);
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      const result = await attendanceService.startLiveAttendanceSession(sessionId);
      setActiveSession(sessionId);
      setAttendanceLink(result.frontendUrl);
      
      toast.success('Live attendance session started!', {
        icon: '🎉',
        duration: 4000,
      });

      // Load initial attendance for this session
      loadSessionAttendance(sessionId);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start session');
    }
  };

  const handleStopSession = () => {
    if (activeSession) {
      attendanceService.leaveSessionRoom(activeSession);
      setActiveSession(null);
      setAttendanceLink('');
      setRealTimeUpdates([]);
      toast.success('Stopped monitoring session');
    }
  };

  const handleViewAttendance = async (sessionId: string) => {
    try {
      await loadSessionAttendance(sessionId);
      toast.success('Loading session attendance...');
    } catch (error) {
      toast.error('Failed to load session attendance');
    }
  };

  const loadSessionAttendance = async (sessionId: string) => {
    try {
      const attendances = await attendanceService.getSessionAttendance(sessionId);
      setSessionAttendances(prev => ({
        ...prev,
        [sessionId]: attendances
      }));
    } catch (error) {
      console.error('Failed to load session attendance:', error);
    }
  };

  const copyAttendanceLink = () => {
    if (attendanceLink) {
      navigator.clipboard.writeText(attendanceLink);
      toast.success('Attendance link copied to clipboard!', {
        icon: '📋',
      });
    }
  };

  const { todayStats, recentAttendance, liveSessions, loading, error } = attendanceState;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.colors.primary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading attendance data</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={loadAttendanceData}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="hidden sm:inline">{isSocketConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {activeSession && (
              <button
                onClick={handleStopSession}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-700"
              >
                <StopIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{isSocketConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                {activeSession && (
                  <button
                    onClick={handleStopSession}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center space-x-1"
                  >
                    <StopIcon className="w-4 h-4" />
                    <span>Stop Monitoring</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-6">
        {/* Today's Stats */}
        {todayStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 lg:h-8 lg:w-8" style={{ color: theme.colors.primary }} />
                <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{todayStats.totalSessions}</p>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Sessions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center">
                <UserGroupIcon className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{todayStats.attendedSessions}</p>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Attended</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{todayStats.upcomingSessions}</p>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Upcoming</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center">
                <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.primary }}>
                  <span className="text-white font-bold text-xs lg:text-sm">%</span>
                </div>
                <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{Math.round(todayStats.attendancePercentage || 0)}%</p>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Attendance Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Sessions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Live Sessions</h2>
            </div>

            {liveSessions.length > 0 ? (
              <div className="space-y-4">
                {liveSessions.map((session) => (
                  <LiveSessionCard
                    key={session.id}
                    session={session}
                    onStartSession={handleStartSession}
                    onViewAttendance={handleViewAttendance}
                    isActive={activeSession === session.id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8 text-center">
                <ClockIcon className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions today</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later or create a new session.
                </p>
              </div>
            )}

            {/* Active Session Controls */}
            {activeSession && attendanceLink && (
              <div className="rounded-lg p-4 lg:p-6 border-2" style={{ backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }}>
                <h3 className="font-semibold mb-3" style={{ color: theme.colors.text.primary }}>Active Monitoring Session</h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      value={attendanceLink}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md text-sm font-mono min-w-0"
                      style={{ borderBottomColor: theme.colors.primary }}
                    />
                    <button
                      onClick={copyAttendanceLink}
                      className="w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      style={{ 
                        backgroundColor: theme.colors.primary, 
                        color: theme.colors.text.primary 
                      }}
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                    Share this link with participants to mark attendance
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Updates */}
          <div className="space-y-4">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Real-time Updates</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Live Activity</h3>
              </div>
              <div className="p-4 max-h-60 lg:max-h-80 overflow-y-auto">
                {realTimeUpdates.length > 0 ? (
                  <div className="space-y-3" ref={realtimeUpdatesRef}>
                    {realTimeUpdates.map((update, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 break-words">{update.message}</p>
                            <p className="text-xs text-gray-500">{update.time}</p>
                          </div>
                          <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ml-2 ${
                            update.type === 'attendance' ? 'bg-green-500' :
                            update.type === 'session' ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`} style={{ backgroundColor: update.type === 'live' ? theme.colors.primary : undefined }}></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 lg:py-8">
                    <p className="text-sm text-gray-500">
                      No real-time updates yet...
                      <br />
                      <span className="text-xs">Start monitoring a session to see live updates</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Recent Attendance</h3>
              </div>
              <div className="p-4">
                {recentAttendance.length > 0 ? (
                  <div className="space-y-3">
                    {recentAttendance.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex justify-between items-center text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{record.sessionTitle}</p>
                          <p className="text-xs text-gray-500">{new Date(record.markedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                          attendanceService.formatStatus(record.status).className
                        }`}>
                          {attendanceService.formatStatus(record.status).text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent attendance</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
