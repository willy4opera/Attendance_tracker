export interface Notification {
  id: string;
  userId: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'announcement' | 'dependency' | 'task_assignment';
  title: string;
  message: string;
  data: {
    taskId?: number;
    commentId?: number;
    boardId?: number;
    projectId?: number;
    activityId?: number;
    mentionedBy?: {
      id: number;
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
    task?: {
      id: number;
      title: string;
    };
    board?: {
      id: number;
      name: string;
    };
  };
  read: boolean;
  readAt: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  types: {
    comments: boolean;
    mentions: boolean;
    likes: boolean;
    tasks: boolean;
    reminders: boolean;
    announcements: boolean;
  };
}

export interface NotificationSettings {
  userId: number;
  preferences: NotificationPreferences;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}
