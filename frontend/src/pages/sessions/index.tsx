import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SessionList from './SessionList';
import sessionService from '../../services/sessionService';
import { useAuth } from '../../contexts/useAuth';
import type { Session } from '../../types/session';
import type { SessionStats } from '../../components/SessionStats/types';

const SessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get pagination params from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const status = searchParams.get('status') || 'all';

  // Fetch statistics separately (only counts, no heavy payload)
  const fetchStatistics = async () => {
    try {
      const statistics = await sessionService.getSessionStatistics();
      
      // Format stats to match the expected interface
      const formattedStats: SessionStats = {
        total: statistics.total,
        active: statistics.active,
        upcoming: statistics.upcoming,
        completed: statistics.completed,
        cancelled: statistics.cancelled,
        attendance: {
          totalAttendees: statistics.attendance.totalAttendees,
          averageAttendance: statistics.attendance.averageAttendance,
          attendanceRate: statistics.attendance.attendanceRate
        },
        facilitation: user && statistics.facilitation ? {
          sessionsCreated: statistics.facilitation.sessionsCreated,
          totalParticipants: statistics.facilitation.totalParticipants
        } : {
          sessionsCreated: 0,
          totalParticipants: 0
        }
      };
      
      setStats(formattedStats);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  // Fetch sessions based on current status/tab
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new by-status endpoint for better performance
      const response = await sessionService.getSessionsByStatus(status, page, limit);
      setSessions(response.data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Combined refresh function
  const handleRefresh = async () => {
    await Promise.all([
      fetchStatistics(),
      fetchSessions()
    ]);
  };

  // Fetch statistics once on mount
  useEffect(() => {
    fetchStatistics();
  }, [user]); // Re-fetch if user changes

  // Fetch sessions when page, limit, or status changes
  useEffect(() => {
    fetchSessions();
  }, [page, limit, status]);

  // Handle status change from tabs
  useEffect(() => {
    const handleStatusChange = () => {
      const currentStatus = searchParams.get('status') || 'all';
      if (currentStatus !== status) {
        fetchSessions();
      }
    };
    
    handleStatusChange();
  }, [searchParams]);

  return (
    <SessionList 
      sessions={sessions}
      stats={stats || undefined} // Pass undefined instead of null to use component's default
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
    />
  );
};

export default SessionsPage;
