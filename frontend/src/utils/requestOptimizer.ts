// Request deduplication to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  // Check if request is already pending
  if (pendingRequests.has(key)) {
    console.log(`Request deduplicated for key: ${key}`);
    return pendingRequests.get(key)!;
  }

  // Create new request
  const promise = requestFn()
    .then(result => {
      pendingRequests.delete(key);
      return result;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, promise);
  return promise;
};

// Simple debounce implementation
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

// Simple throttle implementation
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Batch request queue for combining multiple requests
export class BatchRequestQueue<K, V> {
  private queue: Map<K, { resolve: (value: V) => void; reject: (error: any) => void }[]> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private delay: number;
  private processBatch: (keys: K[]) => Promise<Map<K, V>>;

  constructor(
    processBatch: (keys: K[]) => Promise<Map<K, V>>,
    batchSize = 10,
    delay = 50
  ) {
    this.processBatch = processBatch;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }
      this.queue.get(key)!.push({ resolve, reject });
      this.scheduleProcess();
    });
  }

  private scheduleProcess() {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.processQueue();
    }, this.delay);
  }

  private async processQueue() {
    if (this.queue.size === 0) {
      this.timer = null;
      return;
    }

    // Get keys to process (up to batchSize)
    const keysToProcess = Array.from(this.queue.keys()).slice(0, this.batchSize);
    const batchMap = new Map<K, { resolve: (value: V) => void; reject: (error: any) => void }[]>();
    
    // Move items to batch
    keysToProcess.forEach(key => {
      batchMap.set(key, this.queue.get(key)!);
      this.queue.delete(key);
    });

    try {
      const results = await this.processBatch(keysToProcess);
      
      // Resolve all promises
      batchMap.forEach((promises, key) => {
        const result = results.get(key);
        promises.forEach(({ resolve }) => resolve(result as V));
      });
    } catch (error) {
      // Reject all promises
      batchMap.forEach((promises) => {
        promises.forEach(({ reject }) => reject(error));
      });
    }

    this.timer = null;
    if (this.queue.size > 0) {
      this.scheduleProcess();
    }
  }
}

// Request cache with TTL
export class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 60000) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  set(key: string, data: any, ttlMs = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Global request cache instance
export const requestCache = new RequestCache();

// Cached request wrapper
export const cachedRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>,
  ttlMs = 300000
): Promise<T> => {
  // Check cache first
  const cached = requestCache.get(key);
  if (cached !== null) {
    console.log(`Cache hit for key: ${key}`);
    return cached;
  }

  // Use deduplication for the actual request
  const data = await deduplicateRequest(key, requestFn);
  
  // Cache the result
  requestCache.set(key, data, ttlMs);
  
  return data;
};
