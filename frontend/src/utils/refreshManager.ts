// Simple event-based refresh manager
class RefreshManager {
  private listeners: Map<string, Set<() => void>> = new Map();
  private refreshTimestamps: Map<string, number> = new Map();

  // Subscribe to refresh events
  subscribe(resourceType: string, callback: () => void): () => void {
    if (!this.listeners.has(resourceType)) {
      this.listeners.set(resourceType, new Set());
    }
    
    this.listeners.get(resourceType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(resourceType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(resourceType);
        }
      }
    };
  }

  // Trigger refresh for a resource type
  trigger(resourceType: string | string[]) {
    const types = Array.isArray(resourceType) ? resourceType : [resourceType];
    
    types.forEach(type => {
      console.log(`🔄 Refreshing: ${type}`);
      this.refreshTimestamps.set(type, Date.now());
      
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error(`Error in refresh callback for ${type}:`, error);
          }
        });
      }
    });
  }

  // Get last refresh timestamp
  getLastRefresh(resourceType: string): number | null {
    return this.refreshTimestamps.get(resourceType) || null;
  }

  // Check if resource is stale
  isStale(resourceType: string, maxAgeMs: number = 5 * 60 * 1000): boolean {
    const lastRefresh = this.getLastRefresh(resourceType);
    if (!lastRefresh) return true;
    return Date.now() - lastRefresh > maxAgeMs;
  }
}

// Create singleton instance
export const refreshManager = new RefreshManager();

// Resource types
export const ResourceTypes = {
  ATTENDANCE: 'attendance',
  SESSIONS: 'sessions',
  USERS: 'users',
  DEPARTMENTS: 'departments',
  STATISTICS: 'statistics',
  REPORTS: 'reports',
} as const;

// Helper hook for React components
import { useEffect, useRef } from 'react';

export function useAutoRefresh(
  resourceType: string,
  refreshCallback: () => void,
  deps: any[] = []
) {
  const callbackRef = useRef(refreshCallback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = refreshCallback;
  });

  useEffect(() => {
    const unsubscribe = refreshManager.subscribe(resourceType, () => {
      callbackRef.current();
    });

    return unsubscribe;
  }, [resourceType]);

  // Check if stale on mount
  useEffect(() => {
    if (refreshManager.isStale(resourceType)) {
      console.log(`📊 ${resourceType} is stale, refreshing...`);
      callbackRef.current();
    }
  }, deps);
}
