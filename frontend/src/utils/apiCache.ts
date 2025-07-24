// Simple in-memory cache for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 30000; // 30 seconds default
  private pendingRequests: Map<string, Promise<any>> = new Map();

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get or clear pending request
  getPendingRequest(key: string): Promise<any> | null {
    return this.pendingRequests.get(key) || null;
  }

  setPendingRequest(key: string, promise: Promise<any>): void {
    this.pendingRequests.set(key, promise);
  }

  clearPendingRequest(key: string): void {
    this.pendingRequests.delete(key);
  }
}

export const apiCache = new ApiCache();

// Wrapper function for cached API calls with deduplication
export async function cachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache hit for ${key}`);
    return cached;
  }

  // Check if there's already a pending request for this key
  const pendingRequest = apiCache.getPendingRequest(key);
  if (pendingRequest) {
    console.log(`Request already in progress for ${key}, waiting...`);
    return pendingRequest;
  }

  // No cache hit and no pending request, make the request
  console.log(`Cache miss for ${key}, fetching...`);
  
  // Create the request promise and store it as pending
  const requestPromise = requestFn()
    .then(data => {
      // Store in cache
      apiCache.set(key, data, ttl);
      // Clear pending request
      apiCache.clearPendingRequest(key);
      return data;
    })
    .catch(error => {
      // Clear pending request on error
      apiCache.clearPendingRequest(key);
      throw error;
    });

  // Store as pending request
  apiCache.setPendingRequest(key, requestPromise);
  
  return requestPromise;
}
