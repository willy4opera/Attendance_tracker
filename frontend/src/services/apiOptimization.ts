import { apiCache, cachedRequest } from '../utils/apiCache';
import api from './api';

// Batch multiple department requests into one
let departmentBatchQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];
let departmentBatchTimeout: NodeJS.Timeout | null = null;

export async function getDepartmentOptimized(): Promise<any> {
  return new Promise((resolve, reject) => {
    departmentBatchQueue.push({ resolve, reject });

    if (!departmentBatchTimeout) {
      departmentBatchTimeout = setTimeout(async () => {
        const currentQueue = [...departmentBatchQueue];
        departmentBatchQueue = [];
        departmentBatchTimeout = null;

        try {
          // Make a single request for all queued requests
          const result = await cachedRequest(
            'departments',
            () => api.get('/departments'),
            60000 // Cache for 1 minute
          );

          // Resolve all queued promises with the same result
          currentQueue.forEach(({ resolve }) => resolve(result));
        } catch (error) {
          // Reject all queued promises
          currentQueue.forEach(({ reject }) => reject(error));
        }
      }, 50); // Wait 50ms to batch requests
    }
  });
}

// Pre-fetch common data on app initialization
export async function prefetchCommonData(): Promise<void> {
  const requests = [
    cachedRequest('departments', () => api.get('/departments'), 60000),
    cachedRequest('current-user', () => api.get('/auth/me'), 300000), // 5 minutes
  ];

  try {
    await Promise.all(requests);
    console.log('Common data prefetched successfully');
  } catch (error) {
    console.error('Error prefetching common data:', error);
  }
}

// Debounced search function
const searchDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

export function debouncedSearch(
  endpoint: string,
  query: string,
  delay: number = 300
): Promise<any> {
  return new Promise((resolve, reject) => {
    const key = `${endpoint}-search`;
    
    // Clear existing timer
    const existingTimer = searchDebounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      searchDebounceTimers.delete(key);
      
      try {
        const result = await api.get(endpoint, { params: { q: query } });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);

    searchDebounceTimers.set(key, timer);
  });
}

// Invalidate cache when data changes
export function invalidateCache(pattern?: string): void {
  if (pattern) {
    apiCache.invalidatePattern(pattern);
  } else {
    apiCache.clear();
  }
}

// Export optimized API methods
export const optimizedApi = {
  getDepartments: getDepartmentOptimized,
  prefetchCommonData,
  debouncedSearch,
  invalidateCache,
  
  // Add more optimized methods as needed
  getUsers: (params?: any) => 
    cachedRequest(
      `users-${JSON.stringify(params || {})}`,
      () => api.get('/users', { params }),
      30000 // 30 seconds cache
    ),
    
  getTasks: (params?: any) =>
    cachedRequest(
      `tasks-${JSON.stringify(params || {})}`,
      () => api.get('/tasks', { params }),
      15000 // 15 seconds cache
    ),
    
  getBoards: () =>
    cachedRequest(
      'boards',
      () => api.get('/boards'),
      60000 // 1 minute cache
    ),
};
