import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import activityService from '../services/activityService';
import type { ActivityResponse } from '../types';

export interface UseActivitiesOptions {
  userId?: number;
  boardId?: number;
  page?: number;
  limit?: number;
  activityType?: string;
  enabled?: boolean;
}

export const useActivities = (options: UseActivitiesOptions) => {
  const queryClient = useQueryClient();
  const { userId, boardId, page = 1, limit = 20, activityType, enabled = true } = options;

  // Determine query key based on what we're fetching
  const queryKey = userId 
    ? ['activities', 'user', userId, { page, limit, activityType }]
    : ['activities', 'board', boardId, { page, limit, activityType }];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (userId) {
        return activityService.getUserActivityFeed(userId, { page, limit, activityType });
      }
      if (boardId) {
        return activityService.getBoardActivityFeed(boardId, { page, limit, activityType });
      }
      throw new Error('Either userId or boardId must be provided');
    },
    enabled: enabled && (!!userId || !!boardId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createActivityMutation = useMutation({
    mutationFn: activityService.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  return {
    activities: query.data?.data?.data || [],
    total: query.data?.data?.total || 0,
    page: query.data?.data?.page || 1,
    totalPages: query.data?.data?.totalPages || 1,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createActivity: createActivityMutation.mutate,
    isCreating: createActivityMutation.isPending,
  };
};

export const useActivityStats = (userId: number, timeRange?: '1d' | '7d' | '30d') => {
  return useQuery({
    queryKey: ['activity-stats', userId, timeRange],
    queryFn: () => activityService.getActivityStats(userId, timeRange),
    enabled: !!userId,
  });
};
