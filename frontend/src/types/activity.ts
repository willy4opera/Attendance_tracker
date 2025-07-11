export interface Activity {
  id: number;
  taskId: number;
  userId: number;
  boardId: number;
  activityType: 'created' | 'updated' | 'commented' | 'liked' | 'assigned';
  details: {
    message: string;
    taskId: number;
    taskTitle?: string;
  };
  metadata: Record<string, unknown>;
  visibility: 'public' | 'board' | 'private';
  createdAt: string;
  updatedAt: string;
}
