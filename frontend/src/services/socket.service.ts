import { io, Socket } from 'socket.io-client';
import config from '../config';
import { getAccessToken } from './api';

class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (!config.socket.enabled || this.socket?.connected) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }

    this.socket = io(config.socket.url, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
