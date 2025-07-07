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
    return <div>Loading...</div>;
  }

  return (
    <div className="attendance-page">
      <h1>Attendance Dashboard</h1>
      {todayStats && (
        <div className="today-stats">
          <h2>Today's Stats</h2>
          <p>Total Sessions: {todayStats.sessionsToday}</p>
          <p>Checked In: {todayStats.checkedIn}</p>
          <p>Upcoming Sessions: {todayStats.upcomingSessions.length}</p>
        </div>
      )}
      {recentAttendance.length > 0 ? (
        <div className="recent-attendance">
          <h2>Recent Attendance</h2>
          <ul>
            {recentAttendance.map((record) => (
              <li key={record.id}>
                Session: {record.session?.title}, Status: {record.status}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No recent attendance records found.</p>
      )}
    </div>
  );
};

export default AttendancePage;
