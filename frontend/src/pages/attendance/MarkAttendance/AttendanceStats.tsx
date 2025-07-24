import React from 'react';
import theme from '../../../config/theme';
import type { AttendanceStats } from './types';

interface AttendanceStatsProps {
  stats: AttendanceStats;
}

const AttendanceStatsComponent: React.FC<AttendanceStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.info }}>{stats.markedUsers}</p>
          <p className="text-sm text-gray-600">Marked</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.warning }}>{stats.modifiedUsers}</p>
          <p className="text-sm text-gray-600">Modified</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>{stats.presentUsers}</p>
          <p className="text-sm text-gray-600">Present</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.warning }}>{stats.lateUsers}</p>
          <p className="text-sm text-gray-600">Late</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: theme.colors.error }}>{stats.absentUsers}</p>
          <p className="text-sm text-gray-600">Absent</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-600">{stats.excusedUsers}</p>
          <p className="text-sm text-gray-600">Excused</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.unmarkedUsers}</p>
          <p className="text-sm text-gray-600">Unmarked</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatsComponent;
