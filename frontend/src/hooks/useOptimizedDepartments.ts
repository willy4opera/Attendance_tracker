import { useQuery } from '@tanstack/react-query';
import { requestDeduplicator } from '../utils/requestDeduplicator';
import { cachedRequest } from '../utils/apiCache';
import departmentService from '../services/departmentService';
import type { Department } from '../types';

interface UseDepartmentsOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export const useOptimizedDepartments = (options: UseDepartmentsOptions = {}) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  return useQuery({
    queryKey: ['departments', 'all'],
    queryFn: async () => {
      // Use request deduplication to prevent multiple simultaneous requests
      return requestDeduplicator.deduplicate(
        'departments-all',
        async () => {
          // Use cache to prevent unnecessary API calls
          return cachedRequest(
            'departments-all',
            async () => {
              const response = await departmentService.getAllDepartments({
                isActive: true,
                limit: 1000
              });
              return response.departments;
            },
            5 * 60 * 1000 // Cache for 5 minutes
          );
        }
      );
    },
    enabled,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

// Hook for single department
export const useOptimizedDepartment = (id: number | string, options: UseDepartmentsOptions = {}) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
  } = options;

  return useQuery({
    queryKey: ['departments', id],
    queryFn: async () => {
      return requestDeduplicator.deduplicate(
        `department-${id}`,
        async () => {
          return cachedRequest(
            `department-${id}`,
            () => departmentService.getDepartmentById(Number(id)),
            5 * 60 * 1000
          );
        }
      );
    },
    enabled: enabled && !!id,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
