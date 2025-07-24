import React, { useState, useEffect } from 'react';
import type { Task, Comment } from '../types';
import taskService from '../../../services/taskService';
import { FaTimes, FaEye, FaEyeSlash, FaComment, FaLink, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  onUpdate: (taskId: number, data: any) => void;
  onRefresh: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose, onUpdate, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'dependencies'>('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTaskDetails();
  }, [task.id]);

  const loadTaskDetails = async () => {
    setLoading(true);
    try {
      const [taskDetailsRes, commentsRes, depsRes] = await Promise.all([
        taskService.getTaskById(task.id),
        taskService.getTaskComments(task.id),
        taskService.getTaskDependencies(task.id)
      ]);

      const taskDetails = taskDetailsRes.data;
      setComments(commentsRes.data || []);
      setDependencies(depsRes.data || []);
      
      // Check if current user is watching (assuming user ID is 4 based on the example)
      setIsWatching(taskDetails.watchers?.some((w: any) => w.id === 4) || false);
    } catch (error) {
      console.error('Failed to load task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatch = async () => {
    try {
      const response = await taskService.toggleWatchTask(task.id);
      toast.success(response.message);
      setIsWatching(!isWatching);
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to toggle watch status');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await taskService.addComment({
        taskId: task.id,
        content: commentText
      });
      toast.success('Comment added successfully');
      setCommentText('');
      loadTaskDetails();
    } catch (error: any) {
      toast.error('Failed to add comment');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await onUpdate(task.id, { status: newStatus });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Created by {task.creator?.firstName} {task.creator?.lastName} on{' '}
                {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleToggleWatch}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                isWatching
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isWatching ? <FaEyeSlash className="inline mr-1" /> : <FaEye className="inline mr-1" />}
              {isWatching ? 'Unwatch' : 'Watch'}
            </button>
            
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dependencies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dependencies ({dependencies.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-gray-700">{task.description || 'No description provided'}</p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Task Information</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-gray-500">Priority</dt>
                          <dd className="text-sm font-medium capitalize">{task.priority}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Status</dt>
                          <dd className="text-sm font-medium capitalize">{task.status.replace('_', ' ')}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Board / List</dt>
                          <dd className="text-sm font-medium">
                            {task.list?.board?.name} / {task.list?.name}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Dates & Time</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-gray-500">Start Date</dt>
                          <dd className="text-sm font-medium">
                            {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Due Date</dt>
                          <dd className="text-sm font-medium">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Estimated Hours</dt>
                          <dd className="text-sm font-medium">{task.estimatedHours || 'Not set'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Labels */}
                  {task.labels.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Labels</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.labels.map((label, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{task.watcherCount}</div>
                        <div className="text-sm text-gray-500">Watchers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{task.commentCount}</div>
                        <div className="text-sm text-gray-500">Comments</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{task.attachmentCount}</div>
                        <div className="text-sm text-gray-500">Attachments</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Comment
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {comments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No comments yet</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {comment.user.profilePicture ? (
                              <img
                                src={comment.user.profilePicture}
                                alt={comment.user.firstName}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {comment.user.firstName[0]}{comment.user.lastName[0]}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="font-medium">
                                  {comment.user.firstName} {comment.user.lastName}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1 text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'dependencies' && (
                <div className="space-y-4">
                  {dependencies.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No dependencies</p>
                  ) : (
                    <div className="space-y-4">
                      {dependencies.map((dep) => (
                        <div key={dep.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm text-gray-500">
                                {dep.dependencyType === 'FS' && 'Finish to Start'}
                                {dep.dependencyType === 'SS' && 'Start to Start'}
                                {dep.dependencyType === 'FF' && 'Finish to Finish'}
                                {dep.dependencyType === 'SF' && 'Start to Finish'}
                              </span>
                              <div className="mt-1">
                                <span className="font-medium">{dep.predecessorTask?.title}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">{dep.successorTask?.title}</span>
                              </div>
                              {dep.lagTime > 0 && (
                                <span className="text-sm text-gray-500 mt-1 block">
                                  Lag time: {dep.lagTime} days
                                </span>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              dep.predecessorTask?.status === 'done'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {dep.predecessorTask?.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
