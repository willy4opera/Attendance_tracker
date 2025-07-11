import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaClock, FaUser, FaTag, FaTimes } from 'react-icons/fa';
import { useTask } from '../../hooks/useTasks';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { useAuth } from '../../contexts/useAuth';
import TaskComments from '../../components/tasks/TaskComments';
import TaskActivityFeed from '../../components/tasks/TaskActivityFeed';
import UserAvatar from '../../components/social/UserAvatar';
import TaskHeader from '../../components/tasks/details/TaskHeader';
import TaskDetailsSection from '../../components/tasks/details/TaskDetailsSection';
import CommentsSection from '../../components/tasks/details/CommentsSection';
import { useComments } from '../../hooks/useComments';
import type { Task } from '../../types';
import { taskService } from '../../services/taskService';
import { showToast } from '../../utils/toast';

const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const taskId = id || '0';
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(true);
  const [showActivity, setShowActivity] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const { task, loading: isLoading, error, refreshTask } = useTask(taskId);
  const {
    comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    createComment,
    refetch: refetchComments
  } = useComments({ taskId: parseInt(taskId) });

  // Enable real-time updates for this task
  useRealTimeUpdates({ taskId: parseInt(taskId), enabled: true });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading task...</span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading task: {error || 'Task not found'}
        <Link to="/boards" className="ml-2 text-blue-600 hover:underline">
          Back to Boards
        </Link>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const updateTask = async (id: string, data: any) => {
    try {
      await taskService.updateTask(id, data);
      refreshTask();
      showToast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      showToast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      showToast.success('Task deleted successfully');
      window.history.back();
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast.error('Failed to delete task');
    }
  };

  const markAsCompleted = async () => {
    await updateTask(taskId, { status: 'done', completedAt: new Date().toISOString() });
  };

  const handleAddComment = async (newComment: string, attachments: File[], replyingTo: number | null) => {
    try {
      // Create comment with createComment from useComments
      await createComment({
        taskId: parseInt(taskId),
        content: newComment,
        parentId: replyingTo || undefined,
        attachments: attachments,
      });
      showToast.success('Comment added successfully');
      refetchComments(); // Refresh comments after adding
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast.error('Failed to add comment');
    }
  };

  const shareTask = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast.success('Task link copied to clipboard!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const Sidebar = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Task Details */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          {task.dueDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FaClock className="h-4 w-4" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {task.estimatedHours && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <p className="text-sm text-gray-600">{task.estimatedHours}h</p>
            </div>
          )}

          {task.actualHours && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Hours</label>
              <p className="text-sm text-gray-600">{task.actualHours}h</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignees */}
      {task.assignedTo && task.assignedTo.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignees</h2>
          <div className="space-y-2">
            {task.assignedTo.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <UserAvatar user={user} size="sm" />
                <span className="text-sm text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Labels</h2>
          <div className="flex flex-wrap gap-2">
            {task.labels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <FaTag className="h-3 w-3 mr-1" />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Creator */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Created By</h2>
        <div className="flex items-center space-x-3">
          <UserAvatar user={task.creator} size="sm" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {task.creator.firstName} {task.creator.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use TaskHeader Component */}
      <TaskHeader
        task={task}
        taskId={taskId}
        isAdmin={isAdmin}
        onMarkCompleted={markAsCompleted}
        onDelete={() => deleteTask(taskId)}
        onShare={shareTask}
      />

      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden px-4 sm:px-6 mb-4">
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showMobileSidebar ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Task Description */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              {task.description ? (
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </div>

            {/* Use TaskDetailsSection Component */}
            <TaskDetailsSection task={task} />

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Checklist</h2>
                <div className="space-y-2">
                  {task.checklist.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => {
                          const newChecklist = [...task.checklist];
                          newChecklist[index].completed = e.target.checked;
                          updateTask(taskId, { checklist: newChecklist });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Use CommentsSection Component */}
            <CommentsSection
              comments={comments || []}
              isCommentsLoading={isCommentsLoading}
              commentsError={commentsError}
              onAddComment={handleAddComment}
              onRefreshComments={refetchComments}
              taskId={parseInt(taskId)}
              currentUser={user ? {
                id: typeof user.id === 'number' ? user.id : parseInt(user.id as string) || parseInt(user._id),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profilePicture: user.profilePicture
              } : null}
            />

            {/* Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <TaskActivityFeed
                taskId={parseInt(taskId)}
                boardId={task.list?.board?.id || 0}
                isOpen={showActivity}
                onToggle={() => setShowActivity(!showActivity)}
              />
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile Sidebar */}
          {showMobileSidebar && (
            <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto">
              <div className="min-h-screen px-4 sm:px-6 py-6">
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50" 
                  onClick={() => setShowMobileSidebar(false)}
                ></div>
                
                {/* Sidebar Content */}
                <div className="relative bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                  <Sidebar />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
