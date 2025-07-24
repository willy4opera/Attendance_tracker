import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import config from '../config';
import { apiCache } from '../utils/apiCache';

export interface UseRealTimeUpdatesOptions {
  taskId?: number;
  boardId?: number;
  userId?: number;
  enabled?: boolean;
}

export const useRealTimeUpdates = (options: UseRealTimeUpdatesOptions) => {
  const queryClient = useQueryClient();
  const { taskId, boardId, userId, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !config.socket.enabled) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Create Socket.IO connection
    socketRef.current = io(config.socket.url, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('[RealTime] Connected to socket server');
      
      // Join task room if taskId is provided
      if (taskId) {
        socketRef.current?.emit('join-task', taskId);
        console.log('[RealTime] Joined task room:', taskId);
      }
      
      // Join board room if boardId is provided
      if (boardId) {
        socketRef.current?.emit('join-board', boardId);
        console.log('[RealTime] Joined board room:', boardId);
      }
    });

    // Handle real-time updates
    socketRef.current.on('comment_added', (data) => {
      console.log('[RealTime] comment_added event received:', data);
      
      // Clear the API cache for comment endpoints
      apiCache.invalidatePattern(`GET:/comments/task/${data.taskId}`);
      console.log('[RealTime] Cleared API cache for comments');
      
      // Remove queries from React Query cache to force fresh fetch
      queryClient.removeQueries({ queryKey: ['comments', 'task', data.taskId] });
      
      // Immediately invalidate and refetch comments
      queryClient.invalidateQueries({
        queryKey: ['comments', 'task', data.taskId]
      }).then(() => {
        console.log('[RealTime] Refetching comments after comment_added event');
        queryClient.refetchQueries({ queryKey: ['comments', 'task', data.taskId] });
      });
    });

    socketRef.current.on('comment_updated', (data) => {
      console.log('[RealTime] comment_updated event received:', data);
      apiCache.invalidatePattern(`GET:/comments/task/${data.taskId}`);
      queryClient.removeQueries({ queryKey: ['comments', 'task', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', data.taskId] });
    });

    socketRef.current.on('comment_deleted', (data) => {
      console.log('[RealTime] comment_deleted event received:', data);
      apiCache.invalidatePattern(`GET:/comments/task/${data.taskId}`);
      queryClient.removeQueries({ queryKey: ['comments', 'task', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', data.taskId] });
    });

    socketRef.current.on('comment_liked', (data) => {
      console.log('[RealTime] comment_liked event received:', data);
      apiCache.invalidatePattern(`GET:/comments/task/${data.taskId}`);
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', data.taskId] });
    });

    socketRef.current.on('activity_added', (data) => {
      console.log('[RealTime] activity_added event received:', data);
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    });

    socketRef.current.on('task_updated', (data) => {
      console.log('[RealTime] task_updated event received:', data);
      queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    });

    socketRef.current.on('notification_received', (data) => {
      console.log('[RealTime] notification_received event received:', data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[RealTime] Socket.IO connection error:', error);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[RealTime] Socket.IO disconnected:', reason);
    });

    return () => {
      // Leave task room when component unmounts
      if (taskId && socketRef.current?.connected) {
        socketRef.current.emit('leave-task', taskId);
        console.log('[RealTime] Left task room:', taskId);
      }
      
      // Leave board room when component unmounts
      if (boardId && socketRef.current?.connected) {
        socketRef.current.emit('leave-board', boardId);
        console.log('[RealTime] Left board room:', boardId);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [taskId, boardId, userId, enabled, queryClient]);

  return {
    isConnected: socketRef.current?.connected || false,
    emit: (event: string, data?: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      }
    },
  };
};
