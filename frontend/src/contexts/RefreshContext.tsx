import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface RefreshContextType {
  // Trigger a refresh for a specific resource type
  triggerRefresh: (resourceType: string) => void;
  // Subscribe to refresh events for a specific resource type
  subscribeToRefresh: (resourceType: string, callback: () => void) => () => void;
  // Get the last refresh timestamp for a resource type
  getLastRefresh: (resourceType: string) => number | null;
  // Force refresh all resources
  refreshAll: () => void;
  // Check if a resource needs refresh (based on staleness)
  isStale: (resourceType: string, maxAge?: number) => boolean;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

// Default max age in milliseconds (5 minutes)
const DEFAULT_MAX_AGE = 5 * 60 * 1000;

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTimestamps, setRefreshTimestamps] = useState<Record<string, number>>({});
  const [subscribers, setSubscribers] = useState<Record<string, Set<() => void>>>({});
  const isRefreshing = useRef<Set<string>>(new Set());

  const triggerRefresh = useCallback((resourceType: string, skipRelated = false) => {
    // Prevent circular refresh
    if (isRefreshing.current.has(resourceType)) {
      return;
    }

    console.log(`🔄 Triggering refresh for: ${resourceType}`);
    isRefreshing.current.add(resourceType);
    
    // Update timestamp
    setRefreshTimestamps(prev => ({
      ...prev,
      [resourceType]: Date.now()
    }));

    // Notify all subscribers for this resource type
    const resourceSubscribers = subscribers[resourceType];
    if (resourceSubscribers) {
      resourceSubscribers.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in refresh callback for ${resourceType}:`, error);
        }
      });
    }

    // Trigger related resources only if not skipping
    if (!skipRelated) {
      const relatedResources = getRelatedResources(resourceType);
      relatedResources.forEach(related => {
        if (related !== resourceType && !isRefreshing.current.has(related)) {
          triggerRefresh(related, true); // Skip related to prevent deep recursion
        }
      });
    }

    // Clear the refreshing flag after a small delay
    setTimeout(() => {
      isRefreshing.current.delete(resourceType);
    }, 100);
  }, [subscribers]);

  const subscribeToRefresh = useCallback((resourceType: string, callback: () => void) => {
    setSubscribers(prev => {
      const current = prev[resourceType] || new Set();
      current.add(callback);
      return {
        ...prev,
        [resourceType]: current
      };
    });

    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const current = prev[resourceType];
        if (current) {
          current.delete(callback);
          if (current.size === 0) {
            const { [resourceType]: _, ...rest } = prev;
            return rest;
          }
        }
        return prev;
      });
    };
  }, []);

  const getLastRefresh = useCallback((resourceType: string) => {
    return refreshTimestamps[resourceType] || null;
  }, [refreshTimestamps]);

  const refreshAll = useCallback(() => {
    console.log('🔄 Refreshing all resources');
    const allResourceTypes = Object.keys(subscribers);
    // Clear all refreshing flags before bulk refresh
    isRefreshing.current.clear();
    allResourceTypes.forEach(resourceType => {
      triggerRefresh(resourceType, true); // Skip related for bulk refresh
    });
  }, [subscribers, triggerRefresh]);

  const isStale = useCallback((resourceType: string, maxAge: number = DEFAULT_MAX_AGE) => {
    const lastRefresh = refreshTimestamps[resourceType];
    if (!lastRefresh) return true;
    return Date.now() - lastRefresh > maxAge;
  }, [refreshTimestamps]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Refresh Context State:', {
        timestamps: refreshTimestamps,
        subscriberCounts: Object.entries(subscribers).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value.size
        }), {}),
        currentlyRefreshing: Array.from(isRefreshing.current)
      });
    }
  }, [refreshTimestamps, subscribers]);

  const value: RefreshContextType = {
    triggerRefresh: (resourceType: string) => triggerRefresh(resourceType, false),
    subscribeToRefresh,
    getLastRefresh,
    refreshAll,
    isStale
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
};

// Helper function to define related resources
function getRelatedResources(resourceType: string): string[] {
  const resourceMap: Record<string, string[]> = {
    'attendance': ['sessions', 'statistics'],
    'sessions': ['attendance', 'statistics'],
    'users': ['attendance', 'departments'],
    'departments': ['users'],
    'statistics': [], // No related resources to prevent circular deps
  };

  return resourceMap[resourceType] || [];
}

// Custom hook to use the refresh context
export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

// Custom hook for auto-refresh on specific resources
export const useAutoRefresh = (
  resourceType: string,
  refreshCallback: () => void,
  options?: {
    enabled?: boolean;
    maxAge?: number;
    refreshOnMount?: boolean;
    dependencies?: any[];
  }
) => {
  const { enabled = true, maxAge, refreshOnMount = true, dependencies = [] } = options || {};
  const { subscribeToRefresh, isStale, triggerRefresh } = useRefresh();
  const hasRefreshedOnMount = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Check if data is stale on mount and refresh if needed
    if (refreshOnMount && !hasRefreshedOnMount.current && isStale(resourceType, maxAge)) {
      console.log(`📊 ${resourceType} is stale, refreshing...`);
      hasRefreshedOnMount.current = true;
      refreshCallback();
      triggerRefresh(resourceType);
    }

    // Subscribe to refresh events
    const unsubscribe = subscribeToRefresh(resourceType, refreshCallback);

    return unsubscribe;
  }, [enabled, resourceType, refreshOnMount, ...dependencies]);
};

// Resource types enum for type safety
export enum ResourceType {
  ATTENDANCE = 'attendance',
  SESSIONS = 'sessions',
  USERS = 'users',
  DEPARTMENTS = 'departments',
  STATISTICS = 'statistics',
  REPORTS = 'reports',
  SETTINGS = 'settings'
}
