import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import attendanceService from '../../../services/attendanceService';
import sessionService from '../../../services/sessionService';
import userService from '../../../services/user.service';
import socketService from '../../../services/socket.service';
import type { MarkAttendanceState, AttendanceEntry } from './types';
import type { MarkAttendanceData, Attendance } from '../../../types/attendance';
import { getFilteredUsers } from './utils';
import { refreshManager, ResourceTypes, useAutoRefresh } from '../../../utils/refreshManager';

export const useAttendanceData = () => {
  const [state, setState] = useState<MarkAttendanceState>({
    sessions: [],
    users: [],
    selectedSession: '',
    searchTerm: '',
    attendanceData: new Map(),
    existingAttendance: [],
    loading: false,
    saving: false,
    bulkStatus: '',
    showFilters: false,
    statusFilter: 'all',
    departmentFilter: 'all',
    attendanceLink: '',
    generatingLink: false,
    showPreview: false,
    autoSave: false,
  });

  // Use refs to prevent duplicate fetches and track state
  const fetchingAttendanceRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const updateState = useCallback((updates: Partial<MarkAttendanceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      updateState({ loading: true });
      const [sessionsData, usersData] = await Promise.all([
        sessionService.getAllSessions(),
        userService.getAllUsers()
      ]);
      updateState({
        sessions: sessionsData.data?.sessions || sessionsData.sessions || [],
        users: usersData.data?.users || usersData.users || [],
        loading: false
      });
    } catch (error) {
      toast.error('Failed to load data');
      updateState({ loading: false });
    }
  }, [updateState]);

  // Centralized fetch with deduplication
  const fetchExistingAttendance = useCallback(async (force = false) => {
    if (!state.selectedSession) return;
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // If not forcing and we fetched recently, skip
    if (!force && timeSinceLastFetch < 500) {
      console.log('⏭️ Skipping attendance fetch (too recent)');
      return fetchPromiseRef.current || Promise.resolve();
    }

    // If already fetching, return the existing promise
    if (fetchingAttendanceRef.current && fetchPromiseRef.current) {
      console.log('⏭️ Returning existing fetch promise');
      return fetchPromiseRef.current;
    }

    // Create new fetch promise
    fetchingAttendanceRef.current = true;
    lastFetchTimeRef.current = now;
    
    const fetchPromise = (async () => {
      try {
        console.log('🔍 Fetching attendance for session:', state.selectedSession);
        const data = await attendanceService.getSessionAttendance(state.selectedSession, { skipCache: true });
        
        // Initialize attendance map with existing data
        const newAttendanceMap = new Map<string, AttendanceEntry>();
        
        // Set existing attendance
        data.forEach(record => {
          if (record.userId) {
            newAttendanceMap.set(record.userId, {
              userId: record.userId,
              status: record.status,
              notes: record.notes || '',
              isModified: false
            });
          }
        });
        
        updateState({ 
          existingAttendance: data,
          attendanceData: newAttendanceMap 
        });
      } catch (error) {
        toast.error('Failed to load existing attendance');
      } finally {
        fetchingAttendanceRef.current = false;
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [state.selectedSession, updateState]);

  // Socket setup
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    const handleAttendanceUpdate = (data: any) => {
      console.log('📡 Received attendance update:', data);
      
      if ((data.attendance?.sessionId === state.selectedSession || 
           data.sessionId === state.selectedSession) && state.selectedSession) {
        
        const currentUserId = localStorage.getItem('userId');
        if (data.user?.id !== currentUserId && data.attendance?.updatedBy !== currentUserId) {
          toast.success('Attendance updated', {
            icon: '🔄',
            duration: 2000
          });
          // Force refresh when socket update received
          fetchExistingAttendance(true);
        }
      }
    };

    socketService.on('attendance-update', handleAttendanceUpdate);

    return () => {
      socketService.off('attendance-update', handleAttendanceUpdate);
    };
  }, [state.selectedSession, fetchExistingAttendance]);

  // Join/leave session rooms
  useEffect(() => {
    if (state.selectedSession) {
      socketService.emit('join-session', state.selectedSession);
      
      return () => {
        socketService.emit('leave-session', state.selectedSession);
      };
    }
  }, [state.selectedSession]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch attendance when session changes
  useEffect(() => {
    if (state.selectedSession) {
      fetchExistingAttendance();
      updateState({ attendanceLink: '' });
    }
  }, [state.selectedSession, fetchExistingAttendance, updateState]);

  // Auto-save functionality
  useEffect(() => {
    if (state.autoSave && state.attendanceData.size > 0) {
      const hasModified = Array.from(state.attendanceData.values()).some(entry => entry.isModified);
      if (hasModified) {
        const timeoutId = setTimeout(() => {
          saveAttendance(true);
        }, 2000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [state.attendanceData, state.autoSave]);

  const generateAttendanceLink = useCallback(async () => {
    if (!state.selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    try {
      updateState({ generatingLink: true });
      const response = await attendanceService.generateAttendanceLink(state.selectedSession);
      updateState({ 
        attendanceLink: response.data.attendanceUrl,
        generatingLink: false 
      });
      toast.success('Attendance link generated successfully!');
    } catch (error) {
      toast.error('Failed to generate attendance link');
      updateState({ generatingLink: false });
    }
  }, [state.selectedSession, updateState]);

  const handleStatusChange = useCallback((userId: string, status: string) => {
    const newMap = new Map(state.attendanceData);
    const existing = newMap.get(userId) || { userId, status: 'absent' as const, notes: '', isModified: false };
    const existingRecord = state.existingAttendance.find(r => r.userId === userId);
    
    newMap.set(userId, {
      ...existing,
      status: status as AttendanceEntry['status'],
      isModified: !existingRecord || existingRecord.status !== status || existing.notes !== (existingRecord.notes || '')
    });
    updateState({ attendanceData: newMap });
  }, [state.attendanceData, state.existingAttendance, updateState]);

  const handleNotesChange = useCallback((userId: string, notes: string) => {
    const newMap = new Map(state.attendanceData);
    const existing = newMap.get(userId) || { userId, status: 'absent' as const, notes: '', isModified: false };
    const existingRecord = state.existingAttendance.find(r => r.userId === userId);
    
    newMap.set(userId, {
      ...existing,
      notes,
      isModified: !existingRecord || existing.status !== existingRecord.status || notes !== (existingRecord.notes || '')
    });
    updateState({ attendanceData: newMap });
  }, [state.attendanceData, state.existingAttendance, updateState]);

  const saveAttendance = useCallback(async (silent = false) => {
    if (!state.selectedSession) {
      if (!silent) toast.error('Please select a session first');
      return;
    }

    const modifiedEntries = Array.from(state.attendanceData.values())
      .filter(entry => entry.isModified);

    if (modifiedEntries.length === 0) {
      if (!silent) toast.info('No changes to save');
      return;
    }

    updateState({ saving: true });

    try {
      if (!silent) {
        console.log('💾 Saving attendance...', {
          sessionId: state.selectedSession,
          modifiedCount: modifiedEntries.length,
          entries: modifiedEntries
        });
      }

      const promises = [];
      
      for (const entry of modifiedEntries) {
        const existingRecord = state.existingAttendance.find(r => r.userId === entry.userId);
        
        if (existingRecord) {
          const updateData = {
            id: existingRecord.id,
            status: entry.status,
            notes: entry.notes
          };
          
          promises.push(
            attendanceService.updateAttendance(updateData)
          );
        } else {
          const markData: MarkAttendanceData = {
            userId: entry.userId,
            sessionId: state.selectedSession,
            status: entry.status,
            notes: entry.notes
          };
          
          promises.push(
            attendanceService.markAttendanceManually(markData)
          );
        }
      }

      await Promise.all(promises);
      
      if (!silent) {
        toast.success(`Attendance saved successfully! (${modifiedEntries.length} changes)`);
      }
      
      // Only trigger refresh for other resources
      refreshManager.trigger([ResourceTypes.STATISTICS, ResourceTypes.USERS]);
      
      // Force refresh our own attendance data after save
      await fetchExistingAttendance(true);
      
    } catch (error) {
      console.error('💥 Failed to save attendance:', error);
      if (!silent) toast.error('Failed to save attendance');
    } finally {
      updateState({ saving: false });
    }
  }, [state.selectedSession, state.attendanceData, state.existingAttendance, fetchExistingAttendance, updateState]);

  const copyAttendanceLink = useCallback(async () => {
    if (!state.attendanceLink) return;
    
    try {
      await navigator.clipboard.writeText(state.attendanceLink);
      toast.success('Attendance link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  }, [state.attendanceLink]);

  const applyBulkStatus = useCallback(() => {
    if (!state.bulkStatus) {
      toast.error('Please select a status for bulk update');
      return;
    }

    const filteredUsers = getFilteredUsers(
      state.users,
      state.searchTerm,
      state.statusFilter,
      state.departmentFilter,
      state.attendanceData
    );
    
    const newMap = new Map(state.attendanceData);
    
    filteredUsers.forEach(user => {
      const existing = newMap.get(user.id) || { userId: user.id, status: 'absent' as const, notes: '', isModified: false };
      const existingRecord = state.existingAttendance.find(r => r.userId === user.id);
      
      newMap.set(user.id, {
        ...existing,
        status: state.bulkStatus as AttendanceEntry['status'],
        isModified: !existingRecord || existingRecord.status !== state.bulkStatus || existing.notes !== (existingRecord.notes || '')
      });
    });
    
    updateState({ attendanceData: newMap });
    toast.success(`Applied ${state.bulkStatus} status to ${filteredUsers.length} users`);
  }, [state.bulkStatus, state.users, state.searchTerm, state.statusFilter, state.departmentFilter, state.attendanceData, state.existingAttendance, updateState]);

  return {
    state,
    updateState,
    fetchData,
    fetchExistingAttendance,
    generateAttendanceLink,
    copyAttendanceLink,
    handleStatusChange,
    handleNotesChange,
    saveAttendance,
    applyBulkStatus
  };
};
