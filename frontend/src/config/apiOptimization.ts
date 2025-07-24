// Global API optimization configuration

export const API_OPTIMIZATION_CONFIG = {
  // Cache durations (in milliseconds)
  cache: {
    departments: 5 * 60 * 1000,      // 5 minutes
    users: 30 * 1000,                // 30 seconds
    currentUser: 5 * 60 * 1000,      // 5 minutes
    boards: 60 * 1000,               // 1 minute
    tasks: 30 * 1000,                // 30 seconds
    notifications: 15 * 1000,        // 15 seconds
    stats: 60 * 1000,                // 1 minute
  },

  // Debounce delays (in milliseconds)
  debounce: {
    search: 500,                     // 500ms for search inputs
    filter: 300,                     // 300ms for filter changes
    resize: 200,                     // 200ms for window resize
  },

  // Request deduplication window (in milliseconds)
  deduplication: {
    window: 1000,                    // 1 second deduplication window
  },

  // Polling intervals (in milliseconds) - if needed
  polling: {
    notifications: 5 * 60 * 1000,    // 5 minutes (if enabled)
    activities: 60 * 1000,           // 1 minute (if enabled)
  },

  // Stale time for react-query (in milliseconds)
  staleTime: {
    default: 30 * 1000,              // 30 seconds
    static: 5 * 60 * 1000,           // 5 minutes for static data
    dynamic: 15 * 1000,              // 15 seconds for dynamic data
  },

  // Request retry configuration
  retry: {
    count: 3,                        // Number of retries
    delay: 1000,                     // Initial retry delay
    maxDelay: 5000,                  // Maximum retry delay
  },

  // Batch request configuration
  batch: {
    maxBatchSize: 10,                // Maximum requests in a batch
    batchDelay: 50,                  // Delay before processing batch
  },
};

// Helper to get cache duration for a specific endpoint
export function getCacheDuration(endpoint: string): number {
  if (endpoint.includes('departments')) return API_OPTIMIZATION_CONFIG.cache.departments;
  if (endpoint.includes('users')) return API_OPTIMIZATION_CONFIG.cache.users;
  if (endpoint.includes('boards')) return API_OPTIMIZATION_CONFIG.cache.boards;
  if (endpoint.includes('tasks')) return API_OPTIMIZATION_CONFIG.cache.tasks;
  if (endpoint.includes('notifications')) return API_OPTIMIZATION_CONFIG.cache.notifications;
  if (endpoint.includes('stats')) return API_OPTIMIZATION_CONFIG.cache.stats;
  if (endpoint.includes('me') || endpoint.includes('current')) return API_OPTIMIZATION_CONFIG.cache.currentUser;
  
  return API_OPTIMIZATION_CONFIG.staleTime.default;
}

// Helper to determine if an endpoint should be cached
export function shouldCacheEndpoint(method: string, endpoint: string): boolean {
  // Only cache GET requests
  if (method.toUpperCase() !== 'GET') return false;
  
  // Don't cache auth endpoints
  if (endpoint.includes('auth/') && !endpoint.includes('auth/me')) return false;
  
  // Don't cache file uploads/downloads
  if (endpoint.includes('upload') || endpoint.includes('download')) return false;
  
  // Don't cache real-time data
  if (endpoint.includes('realtime') || endpoint.includes('stream')) return false;
  
  return true;
}
