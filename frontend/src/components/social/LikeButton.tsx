import React from 'react';
import { FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa';

interface LikeButtonProps {
  commentId: number;
  likeCount: number;
  isLiked?: boolean;
  onToggleLike: (commentId: number, reactionType: string) => void;
  disabled?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  commentId,
  likeCount,
  isLiked = false,
  onToggleLike,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onToggleLike(commentId, 'like');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm transition-colors ${
        isLiked
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
          : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      {isLiked ? (
        <FaThumbsUp className="h-4 w-4" />
      ) : (
        <FaRegThumbsUp className="h-4 w-4" />
      )}
      <span className="font-medium">{likeCount}</span>
    </button>
  );
};

export default LikeButton;
