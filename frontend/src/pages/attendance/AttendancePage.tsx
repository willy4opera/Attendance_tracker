import React, { useEffect, useState } from 'react';
import attendanceService from '../../services/attendanceService';
import type { AttendanceRecord, TodayStats } from '../../services/attendanceService';
import toast from 'react-hot-toast';

const AttendancePage: React.FC = () => {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const todayStatsData = await attendanceService.getTodayStats();
        const recentAttendanceData = await attendanceService.getRecentAttendance();
        setTodayStats(todayStatsData);
        setRecentAttendance(recentAttendanceData);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Attendance Dashboard</h1>
      
      {todayStats && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Today's Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl sm:text-3xl font-bold">{todayStats.totalSessions}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl sm:text-3xl font-bold">{todayStats.attendedSessions}</p>
              <p className="text-sm text-gray-600">Checked In</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl sm:text-3xl font-bold">{todayStats.upcomingSessions}</p>
              <p className="text-sm text-gray-600">Upcoming Sessions</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Attendance</h2>
        {recentAttendance.length > 0 ? (
          <div className="space-y-3">
            {recentAttendance.map((record) => (
              <div key={record.id} className="border-b pb-3 last:border-b-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <p className="font-medium">{record.session?.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    record.status === 'absent' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent attendance records found.</p>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
