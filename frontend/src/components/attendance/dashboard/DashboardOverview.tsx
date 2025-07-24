import React from 'react';
import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import StatsCards from './StatsCards';
import LiveSessions from './LiveSessions';
import RealTimeUpdates from './RealTimeUpdates';
import RecentAttendanceTable from '../RecentAttendanceTable';
import theme from '../../../config/theme';
import type { AttendanceState } from '../../../types/attendance';

interface DashboardOverviewProps {
  attendanceState: AttendanceState;
  realTimeUpdates: any[];
  activeMonitoringSession: string | null;
  isSocketConnected: boolean;
  onStartLiveSession: (sessionId: string) => void;
  onRetry: () => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  attendanceState,
  realTimeUpdates,
  activeMonitoringSession,
  isSocketConnected,
  onStartLiveSession,
  onRetry
}) => {
  const { todayStats, recentAttendance, liveSessions, loading, error } = attendanceState;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2" 
          style={{ borderBottomColor: theme.colors.primary }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="border rounded-lg p-4"
        style={{ 
          backgroundColor: `${theme.colors.error}10`, 
          borderColor: `${theme.colors.error}30` 
        }}
      >
        <h3 
          className="font-medium"
          style={{ color: theme.colors.error }}
        >Error loading data</h3>
        <p 
          className="text-sm mt-1"
          style={{ color: theme.colors.error }}
        >{error}</p>
        <button 
          onClick={onRetry}
          className="mt-3 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center space-x-1"
          style={{ backgroundColor: theme.colors.error }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - Full Width */}
      <StatsCards stats={todayStats} />

      {/* Grid Layout for Sessions and Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Sessions - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <LiveSessions 
            sessions={liveSessions}
            activeSession={activeMonitoringSession}
            onStartMonitoring={onStartLiveSession}
          />
        </div>

        {/* Real-time Updates - Takes 1 column */}
        <div>
          <RealTimeUpdates 
            updates={realTimeUpdates}
            isConnected={isSocketConnected}
          />
        </div>
      </div>

      {/* Recent Attendance Table - Full Width */}
      <RecentAttendanceTable recentAttendance={recentAttendance} />
    </div>
  );
};

export default DashboardOverview;
