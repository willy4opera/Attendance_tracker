export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

export interface CommentLike {
  id: number;
  commentId: number;
  userId: number;
  reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  user: User;
  createdAt: string;
}

export interface Comment {
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
  user: User;
  replies?: Comment[];
  likes?: CommentLike[];
  attachments?: Attachment[];
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
  user: User;
  replies?: CommentResponse[];
  likes?: CommentLike[];
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
  reactionSummary?: Record<string, number>;
}

export interface Attachment {
  type: 'image' | 'youtube';
  url: string;
  name?: string;
  size?: number;
  publicId?: string; // For Cloudinary images
  videoId?: string; // For YouTube videos
  videoUrl?: string; // YouTube watch URL
  thumbnail?: string; // YouTube thumbnail
  privacyStatus?: 'private' | 'unlisted' | 'public';
  width?: number;
  height?: number;
  format?: string;
  uploadedAt?: string;
}
