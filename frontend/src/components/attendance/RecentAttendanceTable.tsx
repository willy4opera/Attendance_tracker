import React, { useState } from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import attendanceService from '../../services/attendanceService';
import theme from '../../config/theme';
import type { RecentAttendance } from '../../types/attendance';

interface RecentAttendanceTableProps {
  recentAttendance: RecentAttendance[];
  maxItems?: number;
}

const RecentAttendanceTable: React.FC<RecentAttendanceTableProps> = ({ 
  recentAttendance, 
  maxItems = 10 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const getStatusIcon = (status: string) => {
    const iconClass = "w-5 h-5";
    switch (status) {
      case 'present':
        return <CheckCircleIcon className={iconClass} style={{ color: theme.colors.success }} />;
      case 'late':
        return <ExclamationTriangleIcon className={iconClass} style={{ color: theme.colors.warning }} />;
      case 'absent':
        return <XCircleIcon className={iconClass} style={{ color: theme.colors.error }} />;
      case 'excused':
        return <ExclamationTriangleIcon className={iconClass} style={{ color: theme.colors.info }} />;
      default:
        return <ClockIcon className={iconClass} style={{ color: theme.colors.text.secondary }} />;
    }
  };

  const getStatusColor = (status: string) => {
    return attendanceService.getStatusColorClass(status);
  };

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relative: getRelativeTime(d)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderListView = () => (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: `${theme.colors.text.secondary}20` }}>
          <thead>
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Status
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Session
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell"
                  style={{ color: theme.colors.text.secondary }}>
                Date
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell"
                  style={{ color: theme.colors.text.secondary }}>
                Time
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.secondary }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: `${theme.colors.text.secondary}10` }}>
            {recentAttendance.slice(0, maxItems).map((record, index) => {
              const { date, time, relative } = formatDateTime(record.markedAt);
              return (
                <tr key={record.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-3 py-4 whitespace-nowrap">
                    {getStatusIcon(record.status)}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                        {record.sessionTitle}
                      </div>
                      <div className="text-xs sm:hidden" style={{ color: theme.colors.text.secondary }}>
                        {relative}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                      {date}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                      {time}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {attendanceService.formatStatus(record.status).text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recentAttendance.slice(0, maxItems).map((record) => {
        const { date, time, relative } = formatDateTime(record.markedAt);
        return (
          <div key={record.id}
               className="group relative rounded-lg border p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
               style={{ 
                 backgroundColor: theme.colors.background.paper,
                 borderColor: `${theme.colors.text.secondary}20`
               }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(record.status)}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                  {attendanceService.formatStatus(record.status).text}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors"
                  style={{ color: theme.colors.text.primary }}>
                {record.sessionTitle}
              </h4>
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t"
                   style={{ borderColor: `${theme.colors.text.secondary}10` }}>
                <div className="flex items-center space-x-1 text-xs"
                     style={{ color: theme.colors.text.secondary }}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{relative}</span>
                </div>
                <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
                  {time}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full rounded-lg shadow-sm border"
         style={{ 
           backgroundColor: theme.colors.background.paper,
           borderColor: `${theme.colors.text.secondary}30`
         }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between"
           style={{ borderBottomColor: `${theme.colors.text.secondary}30` }}>
        <div>
          <h3 className="text-lg font-medium flex items-center space-x-2"
              style={{ color: theme.colors.text.primary }}>
            <span>Recent Attendance</span>
            {recentAttendance.length > 0 && (
              <span className="text-sm font-normal px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${theme.colors.primary}10`,
                      color: theme.colors.primary
                    }}>
                {recentAttendance.length} records
              </span>
            )}
          </h3>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-gray-700 shadow-sm' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={{ 
              color: viewMode === 'list' ? theme.colors.primary : theme.colors.text.secondary 
            }}
            title="List View"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-all ${
              viewMode === 'grid' 
                ? 'bg-white dark:bg-gray-700 shadow-sm' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={{ 
              color: viewMode === 'grid' ? theme.colors.primary : theme.colors.text.secondary 
            }}
            title="Grid View"
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 sm:p-6">
        {recentAttendance.length > 0 ? (
          viewMode === 'list' ? renderListView() : renderGridView()
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                 style={{ backgroundColor: `${theme.colors.text.secondary}10` }}>
              <ClockIcon className="w-8 h-8" style={{ color: theme.colors.text.secondary }} />
            </div>
            <h3 className="text-sm font-medium mb-1"
                style={{ color: theme.colors.text.primary }}>
              No Recent Attendance
            </h3>
            <p className="text-sm"
               style={{ color: theme.colors.text.secondary }}>
              Attendance records will appear here once marked.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentAttendanceTable;
