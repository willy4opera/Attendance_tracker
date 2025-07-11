export interface Like {
  id: number;
  commentId: number;
  userId: number;
  reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: string;
  updatedAt: string;
}

export interface SocialStats {
  likes: number;
  comments: number;
  shares: number;
}
