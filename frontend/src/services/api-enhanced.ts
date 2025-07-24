import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';
import { rateLimitedRequest } from '../utils/rateLimiter';
import { setupApiInterceptors } from './api-interceptors';
import { cachedRequest } from '../utils/apiCache';
import { requestDeduplicator } from '../utils/requestDeduplicator';
import { API_OPTIMIZATION_CONFIG, getCacheDuration, shouldCacheEndpoint } from '../config/apiOptimization';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipCache?: boolean;
  skipDeduplication?: boolean;
}

// Create the base axios instance
const axiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Setup API interceptors for monitoring and optimization
setupApiInterceptors(axiosInstance);

// Token management
let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    console.log('Response error:', error.response?.status, error.response?.data);
    
    // Handle 401 errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh the token
      if (refreshToken) {
        try {
          const response = await axios.post(`${config.api.baseUrl}/auth/refresh`, {
            refreshToken
          });
          
          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens
          setTokens(token, newRefreshToken);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearTokens();
        window.location.href = '/login';
      }
    }
    
    // Don't intercept rate limit errors - let the rate limiter handle them
    if (error.response?.status === 429) {
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Enhanced rate-limited API wrapper with caching and deduplication
class EnhancedApi {
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url, config.api.baseUrl);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  private async makeRequest<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: CustomAxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const endpoint = this.extractEndpoint(url);
    
    // Skip optimization for certain requests
    if (config?.skipCache || config?.skipDeduplication) {
      return rateLimitedRequest(
        () => axiosInstance.request<T>({ ...config, method, url, data }),
        endpoint,
        API_OPTIMIZATION_CONFIG.retry.count
      );
    }

    // For GET requests, use caching and deduplication
    if (method === 'GET' && shouldCacheEndpoint(method, endpoint)) {
      const cacheKey = `${method}:${url}:${JSON.stringify(config?.params || {})}`;
      const cacheDuration = getCacheDuration(endpoint);

      return requestDeduplicator.deduplicate(
        cacheKey,
        async () => {
          return cachedRequest(
            cacheKey,
            () => rateLimitedRequest(
              () => axiosInstance.request<T>({ ...config, method, url }),
              endpoint,
              API_OPTIMIZATION_CONFIG.retry.count
            ),
            cacheDuration
          );
        }
      );
    }

    // For non-GET requests, just use rate limiting and deduplication
    const dedupeKey = `${method}:${url}:${JSON.stringify(data || {})}`;
    return requestDeduplicator.deduplicate(
      dedupeKey,
      () => rateLimitedRequest(
        () => axiosInstance.request<T>({ ...config, method, url, data }),
        endpoint,
        API_OPTIMIZATION_CONFIG.retry.count
      )
    );
  }

  async get<T = any>(url: string, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>('GET', url, undefined, config);
  }

  async post<T = any>(url: string, data?: any, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>('POST', url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>('PUT', url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>('PATCH', url, data, config);
  }

  async delete<T = any>(url: string, config?: CustomAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>('DELETE', url, undefined, config);
  }
}

// Create the enhanced API instance
const api = new EnhancedApi();

// Token management functions
export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

// Export both the enhanced API and the raw axios instance (for special cases)
export default api;
export { axiosInstance };
