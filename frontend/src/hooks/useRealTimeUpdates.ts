import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import config from '../config';

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
      console.log('Socket.IO connected');
      
      // Subscribe to relevant channels
      if (taskId) {
        socketRef.current?.emit('subscribe', `task_${taskId}`);
      }
      
      if (boardId) {
        socketRef.current?.emit('subscribe', `board_${boardId}`);
      }
      
      if (userId) {
        socketRef.current?.emit('subscribe', `user_${userId}`);
      }
    });

    // Handle real-time updates
    socketRef.current.on('comment_added', (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', data.taskId] });
    });

    socketRef.current.on('comment_updated', (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', data.taskId] });
    });

    socketRef.current.on('comment_deleted', (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', data.taskId] });
    });

    socketRef.current.on('comment_liked', (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', data.taskId] });
    });

    socketRef.current.on('activity_added', (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    });

    socketRef.current.on('task_updated', (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    });

    socketRef.current.on('notification_received', (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    return () => {
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
