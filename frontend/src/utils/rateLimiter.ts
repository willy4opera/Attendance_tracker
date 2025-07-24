// Rate limiter implementation to prevent 429 errors
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs?: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;
  private globalRequestCount = 0;
  private globalWindowStart = Date.now();

  constructor(config: RateLimitConfig = {
    maxRequests: 100, // 100 requests
    windowMs: 1000, // per second
    retryAfterMs: 1000 // retry after 1 second
  }) {
    this.config = config;
  }

  async waitIfNeeded(endpoint?: string): Promise<void> {
    const now = Date.now();
    
    // Check global rate limit
    if (now - this.globalWindowStart > this.config.windowMs) {
      this.globalRequestCount = 0;
      this.globalWindowStart = now;
    }

    if (this.globalRequestCount >= this.config.maxRequests) {
      const waitTime = this.config.windowMs - (now - this.globalWindowStart);
      console.log(`Rate limit reached. Waiting ${waitTime}ms before next request...`);
      await this.delay(waitTime);
      this.globalRequestCount = 0;
      this.globalWindowStart = Date.now();
    }

    // Check endpoint-specific rate limit (10 requests per second per endpoint)
    if (endpoint) {
      const endpointRequests = this.requests.get(endpoint) || [];
      const recentRequests = endpointRequests.filter(
        timestamp => now - timestamp < 1000 // 1 second window for endpoints
      );

      if (recentRequests.length >= 10) {
        const oldestRequest = recentRequests[0];
        const waitTime = 1000 - (now - oldestRequest);
        console.log(`Endpoint rate limit for ${endpoint}. Waiting ${waitTime}ms...`);
        await this.delay(waitTime);
      }

      // Clean up old requests
      const validRequests = endpointRequests.filter(
        timestamp => now - timestamp < this.config.windowMs
      );
      this.requests.set(endpoint, [...validRequests, now]);
    }

    this.globalRequestCount++;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.requests.clear();
    this.globalRequestCount = 0;
    this.globalWindowStart = Date.now();
  }
}

// Create a singleton instance with more reasonable limits
export const rateLimiter = new RateLimiter({
  maxRequests: 50, // 50 requests per second globally
  windowMs: 1000, // 1 second window
  retryAfterMs: 200 // retry after 200ms
});

// Request queue to manage concurrent requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrentRequests = 6; // Increase concurrent requests
  private activeRequests = 0;

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++;
          const result = await requestFn();
          this.activeRequests--;
          resolve(result);
        } catch (error) {
          this.activeRequests--;
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      // Wait if we're at max concurrent requests
      while (this.activeRequests >= this.concurrentRequests && this.queue.length > 0) {
        await this.delay(50);
      }

      // Process available slots
      const slotsAvailable = this.concurrentRequests - this.activeRequests;
      const batch = this.queue.splice(0, Math.min(slotsAvailable, this.queue.length));
      
      // Start requests without waiting for them to complete
      batch.forEach(fn => fn());
      
      // Small delay to prevent tight loop
      if (this.queue.length > 0) {
        await this.delay(50);
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const requestQueue = new RequestQueue();

// Enhanced request wrapper with rate limiting and retry logic
export async function rateLimitedRequest<T>(
  requestFn: () => Promise<T>,
  endpoint?: string,
  retries = 3
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      // Wait if rate limit is reached
      await rateLimiter.waitIfNeeded(endpoint);

      // Execute the request through the queue
      const result = await requestQueue.add(requestFn);
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        console.warn(`Rate limit hit (attempt ${i + 1}/${retries}). Waiting before retry...`);
        
        // Extract retry-after header if available
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.min(Math.pow(2, i) * 1000, 5000); // Exponential backoff with max 5 seconds

        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Reset rate limiter after 429
        rateLimiter.reset();
      } else if (i === retries - 1) {
        // Last attempt failed
        throw error;
      } else {
        // Other errors - wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  throw lastError;
}
