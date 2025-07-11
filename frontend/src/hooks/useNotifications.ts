import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notificationService';
import type { Notification, NotificationFilters } from '../types/notification';
import { useAuth } from '../contexts/useAuth';

export interface UseNotificationsOptions extends NotificationFilters {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { page = 1, limit = 20, type, isRead, enabled = true, refetchInterval = false } = options;

  const queryKey = ['notifications', user?.id, { page, limit, type, isRead }];

  const query = useQuery({
    queryKey,
    queryFn: () => notificationService.getUserNotifications(user!.id, { page, limit, type, isRead }),
    enabled: enabled && !!user?.id,
    refetchInterval: refetchInterval || false, // Default to no polling
    staleTime: 2 * 60 * 1000, // 2 minutes - notifications are fresh for 2 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-count', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-count', user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-count', user?.id] });
    },
  });

  return {
    notifications: query.data?.data?.notifications || [],
    pagination: query.data?.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  };
};

export const useUnreadCount = (enablePolling = false) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: () => notificationService.getUnreadCount(user!.id),
    enabled: !!user?.id,
    // Only poll if explicitly enabled, and with much longer interval
    refetchInterval: enablePolling ? 5 * 60 * 1000 : false, // 5 minutes if enabled
    staleTime: 2 * 60 * 1000, // 2 minutes - count is fresh for 2 minutes
  });
};

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: () => notificationService.getNotificationSettings(user!.id),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
  });

  const updateSettingsMutation = useMutation({
    mutationFn: notificationService.updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
    },
  });

  return {
    settings: query.data?.data || {},
    isLoading: query.isLoading,
    error: query.error,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};

export const useNotificationPermission = () => {
  const { user } = useAuth();

  const requestPermission = async () => {
    const granted = await notificationService.requestPushPermission();
    if (granted && user?.id) {
      try {
        await notificationService.subscribeToPush(user.id);
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    }
    return granted;
  };

  return {
    permission: typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'denied',
    requestPermission,
  };
};
