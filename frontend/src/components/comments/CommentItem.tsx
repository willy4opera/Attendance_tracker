import React, { useState } from 'react';
import { FaRegThumbsUp, FaThumbsUp, FaReply } from 'react-icons/fa';
import { AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import type { CommentResponse } from '../../types';

interface CommentItemProps {
  comment: CommentResponse;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onToggleLike: (reactionType: string) => void;
  isTimeline?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onUpdate, 
  onDelete, 
  onToggleLike,
  isTimeline = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const { id, content, user, likeCount, createdAt, isEdited, editedAt } = comment;

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onUpdate(editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const containerClass = isTimeline 
    ? "bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full"
    : "flex items-start space-x-3 bg-white rounded-lg p-4 shadow-sm border";

  return (
    <div className={containerClass}>
      {!isTimeline && (
        /* User Avatar for non-timeline view */
        <div className="bg-blue-500 rounded-full h-8 w-8 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {user.firstName.charAt(0)}
        </div>
      )}

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 text-sm">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(createdAt)}
            </span>
            {isEdited && (
              <span className="text-xs text-gray-400 italic">
                (edited {editedAt ? formatDate(editedAt) : ''})
              </span>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-yellow-500 rounded"
              title="Edit comment"
            >
              <AiOutlineEdit className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
              title="Delete comment"
            >
              <AiOutlineDelete className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Edit your comment..."
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-gray-800 text-sm mb-3 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onToggleLike('like')}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                title="Like this comment"
              >
                <FaRegThumbsUp className="h-3 w-3" />
                <span className="text-xs">{likeCount || 0}</span>
              </button>
              
              <button
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                title="Reply to comment"
              >
                <FaReply className="h-3 w-3" />
                <span className="text-xs">Reply</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
