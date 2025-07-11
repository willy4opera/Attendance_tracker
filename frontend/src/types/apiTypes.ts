export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profilePicture?: string;
  };
  token: string;
  refreshToken: string;
}

export interface CommentResponse {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  parentId?: number;
  likeCount: number;
  reactionSummary: Record<string, number>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  replies?: CommentResponse[];
  likes?: Array<{
    id: number;
    userId: number;
    reactionType: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface ActivityResponse {
  id: number;
  taskId: number;
  userId: number;
  boardId: number;
  activityType: string;
  details: {
    message: string;
    taskId: number;
    taskTitle?: string;
  };
  metadata: Record<string, unknown>;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  task?: {
    id: number;
    title: string;
    list?: {
      id: number;
      name: string;
      board?: {
        id: number;
        name: string;
      };
    };
  };
  board?: {
    id: number;
    name: string;
  };
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}
