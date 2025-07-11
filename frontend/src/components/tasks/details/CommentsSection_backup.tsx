import React, { useState, useRef, useEffect } from 'react';
import {
  FaImage,
  FaPaperclip,
  FaTimes,
  FaThumbsUp,
  FaComment,
  FaShare,
  FaSmile,
  FaHeart,
  FaLaugh,
  FaSurprise,
  FaSadTear,
  FaAngry
} from 'react-icons/fa';
import UserAvatar from '../../social/UserAvatar';
import commentService from '../../../services/commentService';
import { showToast } from '../../../utils/toast';
import type { Comment, User } from '../../../types/comment';

interface CommentsSectionProps {
  comments: Comment[];
  isCommentsLoading: boolean;
  commentsError: any;
  onAddComment: (newComment: string, attachments: File[], replyingTo: number | null) => Promise<void>;
  onRefreshComments: () => void;
  taskId: number;
  currentUser: User | null;
}

const EMOJI_REACTIONS = [
  { emoji: '👍', type: 'like', icon: FaThumbsUp },
  { emoji: '❤️', type: 'love', icon: FaHeart },
  { emoji: '😂', type: 'laugh', icon: FaLaugh },
  { emoji: '😮', type: 'wow', icon: FaSurprise },
  { emoji: '😢', type: 'sad', icon: FaSadTear },
  { emoji: '😡', type: 'angry', icon: FaAngry }
];

const EMOJI_SUGGESTIONS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '🔥', '💯', '💪', '👏', '🙌', '🤝', '👐', '🙏', '✨', '🎉'
];

const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  isCommentsLoading,
  commentsError,
  onAddComment,
  onRefreshComments,
  taskId,
  currentUser
}) => {
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [showReplyInput, setShowReplyInput] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiClick = (emoji: string) => {
    setNewComment((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await onAddComment(newComment, attachments, null);
      setNewComment("");
      setAttachments([]);
      showToast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      showToast.error('Failed to add comment');
    }
  };

  const handleReplySubmit = async (commentId: number) => {
    if (!replyText.trim()) return;
    try {
      await onAddComment(replyText, [], commentId);
      setReplyText("");
      setShowReplyInput(null);
      showToast.success('Reply added successfully!');
    } catch (error) {
      console.error('Error submitting reply:', error);
      showToast.error('Failed to add reply');
    }
  };

  const handleReaction = async (commentId: number, reactionType: string) => {
    try {
      const response = await commentService.toggleCommentLike(commentId, reactionType);
      setShowReactionPicker(null);
      onRefreshComments();
      showToast.success(response.data.liked ? 'Reaction added!' : 'Reaction removed!');
    } catch (error) {
      console.error('Error updating reaction:', error);
      showToast.error('Failed to update reaction');
    }
  };

  const handleShare = (commentId: number) => {
    const link = commentService.generateShareableLink(commentId, taskId);
    navigator.clipboard.writeText(link);
    showToast.success('Comment link copied to clipboard!');
  };

  const getUserLikedReaction = (comment: Comment) => {
    if (!comment.likes || !currentUser) return null;
    
    const userLike = comment.likes.find(like => like.userId === currentUser.id);
    return userLike ? userLike.reactionType : null;
  };

  const renderReactionSummary = (comment: Comment) => {
    if (!comment.reactionSummary || Object.keys(comment.reactionSummary).length === 0) {
      return null;
    }

    const totalReactions = Object.values(comment.reactionSummary).reduce((sum, count) => sum + count, 0);

    return (
      <div className="flex items-center space-x-2 mt-3">
        <div className="flex items-center space-x-1 bg-gray-200 rounded-full px-2 py-1">
          {Object.entries(comment.reactionSummary).map(([type, count]) => {
            const reaction = EMOJI_REACTIONS.find(r => r.type === type);
            if (!reaction || count === 0) return null;

            return (
              <span key={type} className="text-sm">
                {reaction.emoji}
              </span>
            );
          })}
          <span className="text-xs text-gray-600 ml-1">{totalReactions}</span>
        </div>
      </div>
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const userReaction = getUserLikedReaction(comment);
    
    return (
      <div key={comment.id} className="relative">
        <div className={`p-5 rounded-lg ${isReply ? 'ml-8' : ''}`} style={{backgroundColor: '#f8f9fa'}}>
          <div className="flex items-start space-x-4">
            <UserAvatar user={comment.user} size="md" />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <p className="text-base font-semibold text-gray-900">
                  {comment.user?.firstName} {comment.user?.lastName}
                </p>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
                {comment.isEdited && (
                  <span className="text-sm text-gray-400">(edited)</span>
                )}
              </div>

              <p className="text-sm text-gray-700 mt-2">{comment.content}</p>

              {renderReactionSummary(comment)}

              <div className="flex flex-col md:flex-row justify-around items-center mt-4 border-t border-gray-200 pt-3 space-y-2 md:space-y-0">
                <div className="relative">
                  <button
                    onClick={() => setShowReactionPicker(showReactionPicker === comment.id ? null : comment.id)}
                    className={`flex items-center space-x-2 text-sm hover:text-blue-700 ${
                      userReaction ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    <FaThumbsUp className="h-4 w-4" />
                    <span>Like</span>
                    {comment.likeCount > 0 && (
                      <span className="text-xs bg-gray-200 rounded-full px-2 py-1">
                        {comment.likeCount}
                      </span>
                    )}
                  </button>

                  {showReactionPicker === comment.id && (
                    <div className="absolute z-10 bottom-full mb-2 bg-white border rounded-lg shadow-lg p-3">
                      <div className="flex space-x-2">
                        {EMOJI_REACTIONS.map((reaction) => (
                          <button
                            key={reaction.type}
                            onClick={() => handleReaction(comment.id, reaction.type)}
                            className={`p-2 hover:bg-gray-100 rounded text-lg ${
                              userReaction === reaction.type ? 'bg-blue-100' : ''
                            }`}
                            title={reaction.type}
                          >
                            {reaction.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowReplyInput(showReplyInput === comment.id ? null : comment.id)}
                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-700"
                >
                  <FaComment className="h-4 w-4" />
                  <span>Comment</span>
                  {comment.replies && comment.replies.length > 0 && (
                    <span className="text-xs bg-gray-200 rounded-full px-2 py-1">
                      {comment.replies.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleShare(comment.id)}
                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-700"
                >
                  <FaShare className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>

              {showReplyInput === comment.id && (
                <div className="mt-4 flex items-start space-x-3">
                  <UserAvatar user={currentUser} size="sm" />
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => setShowReplyInput(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isReply && <div className="absolute left-4 top-0 h-full border-l-2 border-gray-300 -z-10"></div>}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border p-4 sm:p-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-8">
        Comments ({comments.length})
      </h2>

      {/* Main Comment Input */}
      <div className="mb-6 sm:mb-8 border rounded-lg p-3 sm:p-5 bg-gray-100">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <UserAvatar user={currentUser} size="md" />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a public comment..."
              className="w-full p-2 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />

            {attachments.length > 0 && (
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded border">
                    {file.type.startsWith('image/') ?
                      <FaImage className="text-blue-500" /> :
                      <FaPaperclip className="text-gray-500" />
                    }
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="text-gray-500 hover:text-blue-600 p-2 sm:p-3 rounded"
                  title="Add image"
                >
                  <FaImage className="h-5 w-5" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-blue-600 p-2 sm:p-3 rounded"
                  title="Add attachment"
                >
                  <FaPaperclip className="h-5 w-5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-500 hover:text-blue-600 p-2 sm:p-3 rounded"
                    title="Add emoji"
                  >
                    <FaSmile className="h-5 w-5" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute z-10 bottom-full mb-2 bg-white border rounded-lg shadow-lg p-3 w-64 sm:w-80">
                      <div className="grid grid-cols-8 gap-1 sm:gap-2">
                        {EMOJI_SUGGESTIONS.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => handleEmojiClick(emoji)}
                            className="p-1 sm:p-2 hover:bg-gray-100 rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!newComment.trim()}
                className="px-5 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 sm:space-y-6">
        {isCommentsLoading ? (
          <div className="text-center py-10 text-gray-500">Loading comments...</div>
        ) : commentsError ? (
          <div className="text-center py-10 text-red-500">
            Error loading comments: {commentsError.message}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;


