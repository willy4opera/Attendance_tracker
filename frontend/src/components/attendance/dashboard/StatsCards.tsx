import React from 'react';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import type { AttendanceStats } from '../../../types/attendance';

interface StatsCardsProps {
  stats: AttendanceStats | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        className="rounded-lg shadow-sm border p-6"
        style={{ 
          backgroundColor: theme.colors.background.paper,
          borderColor: `${theme.colors.text.secondary}30`
        }}
      >
        <div className="flex items-center">
          <ChartBarIcon 
            className="h-8 w-8" 
            style={{ color: theme.colors.primary }}
          />
          <div className="ml-4">
            <p 
              className="text-2xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >{stats.totalSessions}</p>
            <p 
              className="text-sm font-medium"
              style={{ color: theme.colors.text.secondary }}
            >Total Sessions</p>
          </div>
        </div>
      </div>

      <div 
        className="rounded-lg shadow-sm border p-6"
        style={{ 
          backgroundColor: theme.colors.background.paper,
          borderColor: `${theme.colors.text.secondary}30`
        }}
      >
        <div className="flex items-center">
          <UserGroupIcon 
            className="h-8 w-8" 
            style={{ color: theme.colors.success }}
          />
          <div className="ml-4">
            <p 
              className="text-2xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >{stats.attendedSessions}</p>
            <p 
              className="text-sm font-medium"
              style={{ color: theme.colors.text.secondary }}
            >Attended</p>
          </div>
        </div>
      </div>

      <div 
        className="rounded-lg shadow-sm border p-6"
        style={{ 
          backgroundColor: theme.colors.background.paper,
          borderColor: `${theme.colors.text.secondary}30`
        }}
      >
        <div className="flex items-center">
          <ClockIcon 
            className="h-8 w-8" 
            style={{ color: theme.colors.info }}
          />
          <div className="ml-4">
            <p 
              className="text-2xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >{stats.upcomingSessions}</p>
            <p 
              className="text-sm font-medium"
              style={{ color: theme.colors.text.secondary }}
            >Upcoming</p>
          </div>
        </div>
      </div>

      <div 
        className="rounded-lg shadow-sm border p-6"
        style={{ 
          backgroundColor: theme.colors.background.paper,
          borderColor: `${theme.colors.text.secondary}30`
        }}
      >
        <div className="flex items-center">
          <div 
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <span className="text-white font-bold text-sm">%</span>
          </div>
          <div className="ml-4">
            <p 
              className="text-2xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >{Math.round(stats.attendancePercentage || 0)}%</p>
            <p 
              className="text-sm font-medium"
              style={{ color: theme.colors.text.secondary }}
            >Attendance Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
