import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCache } from '../utils/apiCache';
import commentService from '../services/commentService';
import type { CommentResponse, Comment, CommentLike } from '../types';

export interface UseCommentsOptions {
  taskId: number;
  page?: number;
  limit?: number;
  enabled?: boolean;
  realTimeUpdates?: boolean;
}

// Updated: 2024-01-18 15:54:00 - Fixed cache invalidation for real-time updates
export const useComments = (options: UseCommentsOptions) => {
  const queryClient = useQueryClient();
  const { taskId, page = 1, limit = 20, enabled = true, realTimeUpdates = false } = options;

  const queryKey = ['comments', 'task', taskId, { page, limit }];

  console.log('[useComments] Initializing query for taskId:', taskId);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[useComments] Fetching comments for task:', taskId, { page, limit });
      const result = await commentService.getTaskComments(taskId, { page, limit });
      console.log('[useComments] Received comments:', result);
      return result;
    },
    enabled: enabled && !!taskId,
    refetchInterval: false, // Disable automatic refetch
    refetchIntervalInBackground: false,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 10 * 1000,
  });

  const createCommentMutation = useMutation({
    mutationFn: commentService.createComment,
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData(queryKey);
      return { previousComments };
    },
    onSuccess: async (data, variables, context) => {
      console.log('[useComments] Create mutation success, invalidating queries...');
      // Clear API cache for this task's comments
      apiCache.invalidatePattern(`GET:/comments/task/${taskId}`);
      // Remove the query from cache completely to force fresh fetch
      queryClient.removeQueries({ queryKey });
      await queryClient.invalidateQueries({ 
        queryKey: ['comments', 'task', taskId],
        exact: false 
      });
      // Force immediate update
      queryClient.setQueryData(queryKey, (old: any) => old);
      await query.refetch();
    },
    onError: (err, newComment, context) => {
      console.error('[useComments] Create mutation error:', err);
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
    },
    onSettled: async () => {
      console.log('[useComments] Create mutation settled, forcing refetch...');
      await query.refetch();
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: commentService.updateComment,
    onSuccess: async () => {
      console.log('[useComments] Update mutation success, invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
      await query.refetch();
    },
    onError: (error) => {
      console.error('[useComments] Update mutation error:', error);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: commentService.deleteComment,
    onSuccess: async () => {
      console.log('[useComments] Delete mutation success, invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['comments', 'task', taskId] });
      await query.refetch();
    },
    onError: (error) => {
      console.error('[useComments] Delete mutation error:', error);
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: ({ commentId, reactionType }: { commentId: number; reactionType: string }) => {
      console.log('[useComments] Calling toggleCommentLike:', { commentId, reactionType });
      return commentService.toggleCommentLike(commentId, reactionType);
    },
    onMutate: async ({ commentId, reactionType }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the data
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.data) return old;
        
        const currentUserId = Number(localStorage.getItem('userId') || '0');
        
        const updateCommentLikes = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              // Initialize likes array if it doesn't exist
              const likes = comment.likes || [];
              const existingLikeIndex = likes.findIndex(like => like.userId === currentUserId);
              
              let newLikes = [...likes];
              let newLikeCount = comment.likeCount || 0;
              let newReactionSummary = { ...(comment.reactionSummary || {}) };

              if (existingLikeIndex >= 0) {
                // User already reacted - update or remove
                const existingLike = newLikes[existingLikeIndex];
                if (existingLike.reactionType === reactionType) {
                  // Remove reaction
                  newLikes.splice(existingLikeIndex, 1);
                  newLikeCount = Math.max(0, newLikeCount - 1);
                  newReactionSummary[reactionType] = Math.max(0, (newReactionSummary[reactionType] || 0) - 1);
                  if (newReactionSummary[reactionType] === 0) {
                    delete newReactionSummary[reactionType];
                  }
                } else {
                  // Change reaction type
                  newReactionSummary[existingLike.reactionType] = Math.max(0, (newReactionSummary[existingLike.reactionType] || 0) - 1);
                  if (newReactionSummary[existingLike.reactionType] === 0) {
                    delete newReactionSummary[existingLike.reactionType];
                  }
                  newReactionSummary[reactionType] = (newReactionSummary[reactionType] || 0) + 1;
                  newLikes[existingLikeIndex] = { ...existingLike, reactionType: reactionType as any };
                }
              } else {
                // Add new reaction
                const newLike: CommentLike = {
                  id: Date.now(), // Temporary ID
                  commentId: commentId,
                  userId: currentUserId,
                  reactionType: reactionType as any,
                  user: {
                    id: currentUserId,
                    firstName: localStorage.getItem('userFirstName') || '',
                    lastName: localStorage.getItem('userLastName') || '',
                    email: localStorage.getItem('userEmail') || '',
                    profilePicture: localStorage.getItem('userProfilePicture') || undefined
                  },
                  createdAt: new Date().toISOString()
                };
                newLikes.push(newLike);
                newLikeCount++;
                newReactionSummary[reactionType] = (newReactionSummary[reactionType] || 0) + 1;
              }

              return {
                ...comment,
                likes: newLikes,
                likeCount: newLikeCount,
                reactionSummary: newReactionSummary
              };
            }
            
            // Recursively update replies
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentLikes(comment.replies)
              };
            }
            
            return comment;
          });
        };

        return {
          ...old,
          data: updateCommentLikes(old.data)
        };
      });

      return { previousData, commentId, reactionType };
    },
    onSuccess: async (data, variables, context) => {
      console.log('[useComments] Toggle like mutation success, response:', data);
      
      // Update the cache with the server response
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.data) return old;
        
        const updateCommentWithServerData = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === context.commentId) {
              // Update with server data while preserving the likes array structure
              return {
                ...comment,
                likeCount: data.data.likeCount,
                reactionSummary: data.data.reactionSummary || comment.reactionSummary || {},
                // Keep the optimistically updated likes array if server doesn't return it
                likes: comment.likes || []
              };
            }
            
            // Recursively update replies
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentWithServerData(comment.replies)
              };
            }
            
            return comment;
          });
        };

        return {
          ...old,
          data: updateCommentWithServerData(old.data)
        };
      });
      
      // Don't refetch immediately - let the optimistic update persist
      // Only refetch after a delay to sync with server state
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['comments', 'task', taskId],
          refetchType: 'none' // Don't refetch immediately
        });
      }, 2000);
    },
    onError: (error, variables, context) => {
      console.error('[useComments] Toggle like mutation error:', error);
      // Revert the optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    }
  });

  // Extract comments data
  const rawCommentsData = query.data?.data || [];
  // Deduplicate comments in case of duplicates from backend
  const commentsData = rawCommentsData.filter((comment, index, self) => 
    index === self.findIndex((c) => c.id === comment.id)
  );
  console.log('[useComments] Returning comments:', commentsData.length, 'items');
  if (commentsData.length > 0) {
    console.log('[useComments] First comment data:', {
      id: commentsData[0].id,
      content: commentsData[0].content?.substring(0, 50) + '...',
      likeCount: commentsData[0].likeCount,
      likes: commentsData[0].likes,
      userReaction: commentsData[0].userReaction,
      firstLike: commentsData[0].likes?.[0]
    });
  }

  return {
    comments: commentsData,
    pagination: query.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createComment: createCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    likeComment: async (commentId: number, reactionType: string = 'like') => {
      try {
        console.log('[useComments] likeComment called:', { commentId, reactionType });
        const result = await toggleLikeMutation.mutateAsync({ commentId, reactionType });
        console.log('[useComments] likeComment result:', result);
        return result;
      } catch (error) {
        console.error('[useComments] likeComment error:', error);
        throw error;
      }
    },
    unlikeComment: async (commentId: number, reactionType: string = 'like') => {
      try {
        console.log('[useComments] unlikeComment called:', { commentId, reactionType });
        const result = await toggleLikeMutation.mutateAsync({ commentId, reactionType });
        console.log('[useComments] unlikeComment result:', result);
        return result;
      } catch (error) {
        console.error('[useComments] unlikeComment error:', error);
        throw error;
      }
    },
    isCreating: createCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
    isLiking: toggleLikeMutation.isPending,
    isUnliking: toggleLikeMutation.isPending,
  };
};
