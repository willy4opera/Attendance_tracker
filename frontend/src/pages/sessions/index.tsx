import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SessionList from './SessionList';
import sessionService from '../../services/sessionService';
import type { Session } from '../../types/session';

const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get pagination params from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sessionService.getAllSessions({
        page,
        limit
      });
      setSessions(response.data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, limit]);

  return (
    <SessionList 
      sessions={sessions}
      loading={loading}
      error={error}
      onRefresh={fetchSessions}
    />
  );
};

export default SessionsPage;
