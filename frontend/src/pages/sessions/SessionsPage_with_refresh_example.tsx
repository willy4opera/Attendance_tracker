// Example of adding auto-refresh to SessionsPage
import React, { useState, useEffect } from 'react';
import { useAutoRefresh, useRefresh, ResourceType } from '../../contexts/RefreshContext';
import sessionService from '../../services/sessionService';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { triggerRefresh } = useRefresh();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getAllSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when sessions or attendance resources are triggered
  useAutoRefresh(ResourceType.SESSIONS, fetchSessions);
  
  // Also refresh when attendance changes (since they're related)
  useAutoRefresh(ResourceType.ATTENDANCE, fetchSessions, {
    enabled: true,
    dependencies: []
  });

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionService.deleteSession(sessionId);
      
      // Trigger refresh for sessions and related resources
      triggerRefresh(ResourceType.SESSIONS);
      triggerRefresh(ResourceType.ATTENDANCE);
      
      toast.success('Session deleted successfully');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const handleCreateSession = async (sessionData: any) => {
    try {
      await sessionService.createSession(sessionData);
      
      // Trigger refresh
      triggerRefresh(ResourceType.SESSIONS);
      
      toast.success('Session created successfully');
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  // Component render logic...
};
