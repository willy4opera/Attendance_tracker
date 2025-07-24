import { io, Socket } from 'socket.io-client';
import config from '../config';
import { getAccessToken } from './api';

class SocketService {
  private socket: Socket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;

  connect(): void {
    if (!config.socket.enabled || this.socket?.connected) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.warn('No auth token available for socket connection');
      // Retry connection after 5 seconds if no token
      this.scheduleReconnect(5000);
      return;
    }

    this.isIntentionalDisconnect = false;

    this.socket = io(config.socket.url, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000, // 20 seconds connection timeout
      // Add these for better stability
      pingInterval: 25000, // Send ping every 25 seconds
      pingTimeout: 60000, // Wait 60 seconds for pong
      autoConnect: true,
      // Reduce transport close timeout
      closeOnBeforeunload: false
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.clearReconnectTimer();
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.stopHeartbeat();
      
      // Only attempt reconnection if it wasn't intentional
      if (!this.isIntentionalDisconnect) {
        // Handle different disconnect reasons
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect with new token
          this.scheduleReconnect(2000);
        } else if (reason === 'transport close' || reason === 'transport error') {
          // Network issue, try to reconnect sooner
          this.scheduleReconnect(1000);
        }
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      // Don't disconnect on error, let socket.io handle reconnection
    });

    // Handle reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      // Try manual reconnection after all attempts failed
      this.scheduleReconnect(10000);
    });

    // Custom heartbeat response
    this.socket.on('pong', () => {
      console.debug('Heartbeat pong received');
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    // Send custom heartbeat every 30 seconds
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(delay: number): void {
    this.clearReconnectTimer();
    
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting manual reconnection...');
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    
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
    } else {
      console.warn(`Cannot emit event '${event}': Socket not connected`);
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

  // Method to manually reconnect
  reconnect(): void {
    if (!this.socket?.connected) {
      this.connect();
    }
  }
}

export default new SocketService();
