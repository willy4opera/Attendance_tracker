import { useCallback, useRef } from 'react';
import { throttle } from '../utils/requestOptimizer';

export const useThrottledAction = <T extends (...args: any[]) => any>(
  action: T,
  delay: number = 1000
): T => {
  const throttledActionRef = useRef(throttle(action, delay));

  return useCallback((...args: Parameters<T>) => {
    return throttledActionRef.current(...args);
  }, []) as T;
};

// Example: Throttled save function
export const useThrottledSave = (
  saveFn: (data: any) => Promise<void>,
  delay: number = 2000
) => {
  const throttledSave = useThrottledAction(saveFn, delay);
  
  return {
    save: throttledSave,
  };
};

// Example: Throttled refresh
export const useThrottledRefresh = (
  refreshFn: () => Promise<void>,
  delay: number = 5000
) => {
  const throttledRefresh = useThrottledAction(refreshFn, delay);
  
  return {
    refresh: throttledRefresh,
  };
};
