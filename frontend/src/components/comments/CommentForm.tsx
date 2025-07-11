import React, { useState } from 'react';
import { AiOutlineSend } from 'react-icons/ai';
import UserMentions from '../social/UserMentions';

interface CommentFormProps {
  taskId: number;
  onSubmit: (content: string, mentionedUsers?: number[]) => void;
  isSubmitting: boolean;
  placeholder?: string;
  parentId?: number;
}

const CommentForm: React.FC<CommentFormProps> = ({
  taskId,
  onSubmit,
  isSubmitting,
  placeholder = "Add a comment...",
  parentId,
}) => {
  const [content, setContent] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<number[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content, mentionedUsers);
      setContent('');
      setMentionedUsers([]);
    }
  };

  const handleUserMention = (userId: number) => {
    if (!mentionedUsers.includes(userId)) {
      setMentionedUsers([...mentionedUsers, userId]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <UserMentions
          content={content}
          onContentChange={setContent}
          onUserMention={handleUserMention}
        />
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Post comment"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <AiOutlineSend className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mentioned Users */}
      {mentionedUsers.length > 0 && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Mentioning:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {mentionedUsers.length} user{mentionedUsers.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Character count */}
      <div className="text-xs text-gray-500 text-right">
        {content.length}/1000 characters
      </div>
    </form>
  );
};

export default CommentForm;
