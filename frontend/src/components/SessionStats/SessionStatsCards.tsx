import React from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import theme from '../../config/theme';
import type { SessionStatsCardsProps } from './types';

const SessionStatsCards: React.FC<SessionStatsCardsProps> = ({ stats, isAdmin }) => {
  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.total,
      icon: CalendarDaysIcon,
      color: 'blue',
      show: true,
    },
    {
      title: 'Active Sessions',
      value: stats.active,
      icon: PlayIcon,
      color: 'green',
      show: true,
    },
    {
      title: 'Upcoming',
      value: stats.upcoming,
      icon: ClockIcon,
      color: 'orange',
      show: true,
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'gray',
      show: true,
    },
    {
      title: 'Total Attendees',
      value: stats.attendance.totalAttendees,
      icon: UserGroupIcon,
      color: 'purple',
      show: isAdmin,
    },
    {
      title: 'Avg Attendance',
      value: stats.attendance.averageAttendance.toFixed(1),
      icon: ChartBarIcon,
      color: 'indigo',
      show: true,
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendance.attendanceRate.toFixed(1)}%`,
      icon: AcademicCapIcon,
      color: 'emerald',
      show: true,
    },
    {
      title: 'Sessions Created',
      value: stats.facilitation?.sessionsCreated || 0,
      icon: CalendarDaysIcon,
      color: 'yellow',
      show: isAdmin && stats.facilitation,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      orange: 'bg-orange-500 text-orange-100',
      gray: 'bg-gray-500 text-gray-100',
      purple: 'bg-purple-500 text-purple-100',
      indigo: 'bg-indigo-500 text-indigo-100',
      emerald: 'bg-emerald-500 text-emerald-100',
      yellow: 'bg-yellow-500 text-yellow-100',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const visibleCards = statCards.filter(card => card.show);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
      {visibleCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                  {card.title}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {card.value}
                </p>
              </div>
              <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg flex-shrink-0 ml-2 ${getColorClasses(card.color)}`}>
                <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionStatsCards;
