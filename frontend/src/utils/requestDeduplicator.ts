// Request deduplication to prevent multiple identical requests
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private cacheDuration = 1000; // 1 second cache for pending requests

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if we have a pending request for this key
    const pending = this.pendingRequests.get(key);
    
    if (pending) {
      const now = Date.now();
      // If the request is still fresh, return the same promise
      if (now - pending.timestamp < this.cacheDuration) {
        console.log(`Deduplicating request for: ${key}`);
        return pending.promise;
      } else {
        // Clean up stale request
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = requestFn()
      .then(result => {
        // Clean up after completion
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        // Clean up on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();
