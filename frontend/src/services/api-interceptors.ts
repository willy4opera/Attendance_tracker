import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { requestDeduplicator } from '../utils/requestDeduplicator';

// Extend the config to include metadata
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, boolean>();

export function setupApiInterceptors(axiosInstance: AxiosInstance) {
  // Request interceptor to log and track requests
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const requestKey = `${config.method}:${config.url}`;
      
      // Log request patterns
      if (ongoingRequests.has(requestKey)) {
        console.warn(`Duplicate request detected: ${requestKey}`);
      }
      
      ongoingRequests.set(requestKey, true);
      
      // Add request timestamp for monitoring
      (config as CustomRequestConfig).metadata = { startTime: Date.now() };
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to track completion and performance
  axiosInstance.interceptors.response.use(
    (response) => {
      const requestKey = `${response.config.method}:${response.config.url}`;
      ongoingRequests.delete(requestKey);
      
      // Log slow requests
      const customConfig = response.config as CustomRequestConfig;
      if (customConfig.metadata) {
        const duration = Date.now() - customConfig.metadata.startTime;
        if (duration > 3000) {
          console.warn(`Slow API call: ${requestKey} took ${duration}ms`);
        }
      }
      
      return response;
    },
    (error) => {
      if (error.config) {
        const requestKey = `${error.config.method}:${error.config.url}`;
        ongoingRequests.delete(requestKey);
      }
      return Promise.reject(error);
    }
  );
}

// Utility to check for ongoing requests
export function hasOngoingRequest(method: string, url: string): boolean {
  return ongoingRequests.has(`${method}:${url}`);
}

// Clear all tracked requests (useful for cleanup)
export function clearRequestTracking() {
  ongoingRequests.clear();
}
