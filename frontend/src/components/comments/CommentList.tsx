import React from 'react';
import { useComments } from '../../hooks/useComments';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import type { CommentResponse } from '../../types';

interface CommentListProps {
  taskId: number;
  className?: string;
}

const CommentList: React.FC<CommentListProps> = ({ taskId, className = '' }) => {
  const {
    comments,
    total,
    isLoading,
    error,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    isCreating,
  } = useComments({ taskId });

  const toggleLike = (commentId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikeComment(commentId);
    } else {
      likeComment(commentId);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 p-4 bg-red-50 rounded-lg ${className}`}>
        Error loading comments: {error.message}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment Form */}
      <div className="bg-gray-50 rounded-lg p-4">
        <CommentForm
          taskId={taskId}
          onSubmit={(content) => createComment({ taskId, content })}
          isSubmitting={isCreating}
          placeholder="Add a comment..."
        />
      </div>

      {/* Comments Timeline */}
      <div className="space-y-1">
        {comments.length === 0 ? (
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-lg mb-2">💬</div>
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Activity & Comments
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {total} comment{total !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Timeline Container */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Comments */}
              <div className="space-y-6">
                {comments.map((comment, index) => (
                  <div key={comment.id} className="relative flex items-start space-x-4">
                    {/* Timeline Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-full">
                        {comment.user.profilePicture ? (
                          <img
                            src={comment.user.profilePicture}
                            alt={`${comment.user.firstName} ${comment.user.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {comment.user.firstName.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <CommentItem
                        comment={comment}
                        onUpdate={(content) => updateComment({ commentId: comment.id, data: { content } })}
                        onDelete={() => deleteComment(comment.id)}
                        onToggleLike={(reactionType) => toggleLike(comment.id, comment.isLikedByUser)}
                        isTimeline={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Real-time updates enabled</span>
        </div>
      </div>

    </div>
  );
};

export default CommentList;
