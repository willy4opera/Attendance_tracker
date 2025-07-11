import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentService from '../services/commentService';
import type { CommentResponse } from '../types';

export interface UseCommentsOptions {
  taskId: number;
  page?: number;
  limit?: number;
  enabled?: boolean;
  realTimeUpdates?: boolean;
}

export const useComments = (options: UseCommentsOptions) => {
  const queryClient = useQueryClient();
  const { taskId, page = 1, limit = 20, enabled = true, realTimeUpdates = false } = options;

  const queryKey = ['comments', 'task', taskId, { page, limit }];

  const query = useQuery({
    queryKey,
    queryFn: () => commentService.getTaskComments(taskId, { page, limit }),
    enabled: enabled && !!taskId,
    // Only enable polling if explicitly requested and with reasonable interval
    refetchInterval: realTimeUpdates ? 30000 : false, // 30 seconds if enabled, otherwise no polling
    refetchIntervalInBackground: false, // Don't poll when tab is not active
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
  });

  // Removed the redundant useEffect setInterval - React Query handles polling

  const createCommentMutation = useMutation({
    mutationFn: commentService.createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: commentService.updateComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: commentService.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: commentService.likeComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
    },
  });

  const unlikeCommentMutation = useMutation({
    mutationFn: commentService.unlikeComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
    },
  });

  return {
    comments: query.data?.data || [],
    pagination: query.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createComment: createCommentMutation.mutate,
    updateComment: updateCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
    likeComment: likeCommentMutation.mutate,
    unlikeComment: unlikeCommentMutation.mutate,
    isCreating: createCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
    isLiking: likeCommentMutation.isPending,
    isUnliking: unlikeCommentMutation.isPending,
  };
};
