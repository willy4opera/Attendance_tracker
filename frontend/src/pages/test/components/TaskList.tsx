import React from 'react';
import type { Task } from '../types';
import { FaEdit, FaTrash, FaEye, FaClock, FaUser, FaTag } from 'react-icons/fa';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onViewDetails: (task: Task) => void;
  onRefresh: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete, onViewDetails, onRefresh }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No tasks found</p>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-gray-600 text-sm mb-2">{task.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                {task.labels.map((label, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <FaTag className="mr-1" size={10} />
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                {task.creator && (
                  <span className="flex items-center">
                    <FaUser className="mr-1" size={12} />
                    {task.creator.firstName} {task.creator.lastName}
                  </span>
                )}
                {task.dueDate && (
                  <span className="flex items-center">
                    <FaClock className="mr-1" size={12} />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span>Board: {task.list?.board?.name || 'N/A'}</span>
                <span>List: {task.list?.name || 'N/A'}</span>
              </div>

              <div className="mt-2 text-sm text-gray-500">
                <span className="mr-3">👁 {task.watcherCount} watchers</span>
                <span>💬 {task.commentCount} comments</span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onViewDetails(task)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="View Details"
              >
                <FaEye size={16} />
              </button>
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                title="Edit Task"
              >
                <FaEdit size={16} />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete Task"
              >
                <FaTrash size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
