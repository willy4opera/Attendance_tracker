import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import socialService from '../services/socialService';

export const useSocial = () => {
  const queryClient = useQueryClient();

  const toggleLikeMutation = useMutation({
    mutationFn: ({ commentId, reactionType }: { commentId: number; reactionType?: string }) =>
      socialService.toggleLike(commentId, reactionType),
    onSuccess: (data, variables) => {
      // Update the comment's like count in the cache
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const searchUsersMutation = useMutation({
    mutationFn: socialService.searchUsersForMentions,
  });

  return {
    toggleLike: toggleLikeMutation.mutate,
    searchUsers: searchUsersMutation.mutate,
    isToggling: toggleLikeMutation.isPending,
    isSearching: searchUsersMutation.isPending,
    searchResults: searchUsersMutation.data?.data || [],
  };
};

export const useTaskSocialStats = (taskId: number) => {
  return useQuery({
    queryKey: ['social-stats', 'task', taskId],
    queryFn: () => socialService.getTaskSocialStats(taskId),
    enabled: !!taskId,
  });
};

export const useUserSocialActivity = (userId: number) => {
  return useQuery({
    queryKey: ['social-activity', 'user', userId],
    queryFn: () => socialService.getUserSocialActivity(userId),
    enabled: !!userId,
  });
};
