
import React from 'react';
import { FaCalendarAlt, FaClock, FaFlag, FaCheckCircle, FaExclamationCircle, FaClipboardCheck } from 'react-icons/fa';
import type { Task } from '../../../types';
import theme from '../../../config/theme';
import TaskMilestones from './TaskMilestones';

interface TaskDetailsSectionProps {
  task: Task;
}

const TaskDetailsSection: React.FC<TaskDetailsSectionProps> = ({ task }) => {
  // Function to determine if task was completed on time
  const getCompletionStatus = () => {
    if (task.status !== 'done') {
      return null;
    }

    if (!task.dueDate) {
      return {
        status: 'completed',
        message: 'Completed',
        color: theme.colors.primary,
        icon: FaCheckCircle,
        bgColor: '#e6f3ff'
      };
    }

    const dueDate = new Date(task.dueDate);
    if (!task.completedAt) return null;
    const completedDate = new Date(task.completedAt);
    
    // Reset time to compare only dates
    dueDate.setHours(0, 0, 0, 0);
    completedDate.setHours(0, 0, 0, 0);

    if (completedDate <= dueDate) {
      const daysEarly = Math.floor((dueDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'on-time',
        message: daysEarly > 0 ? `Completed ${daysEarly} day${daysEarly > 1 ? 's' : ''} early` : 'Completed on time',
        color: '#10b981', // green
        icon: FaCheckCircle,
        bgColor: '#d1fae5'
      };
    } else {
      const daysLate = Math.floor((completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'late',
        message: `Completed ${daysLate} day${daysLate > 1 ? 's' : ''} late`,
        color: '#ef4444', // red
        icon: FaExclamationCircle,
        bgColor: '#fee2e2'
      };
    }
  };

  const completionStatus = getCompletionStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><FaClipboardCheck className="mr-2" /> Task Details</h2>
      
      {/* Completion Status - Show at top if task is completed */}
      {completionStatus && (
        <div 
          className="flex items-center space-x-3 p-3 rounded-lg mb-4"
          style={{ backgroundColor: completionStatus.bgColor }}
        >
          <completionStatus.icon 
            className="h-5 w-5 flex-shrink-0" 
            style={{ color: completionStatus.color }}
          />
          <div className="min-w-0">
            <span className="text-sm font-medium" style={{ color: completionStatus.color }}>
              {completionStatus.message}
            </span>
            {task.status === 'done' && task.completedAt && (
              <span className="block text-xs mt-1" style={{ color: theme.colors.secondary }}>
                on {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Date Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {task.startDate && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FaCalendarAlt className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <span className="text-sm break-words" style={{ color: theme.colors.primary }}>
                {new Date(task.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
        
        {task.dueDate && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FaClock className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <span className="text-sm break-words" style={{ color: theme.colors.primary }}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
              {/* Show overdue warning if task is not completed and past due */}
              {task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date() && (
                <span className="block text-xs mt-1 text-red-600 font-medium">
                  Overdue
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Milestones */}
      <TaskMilestones taskStatus={task.status} />
    </div>
  );
};

export default TaskDetailsSection;
