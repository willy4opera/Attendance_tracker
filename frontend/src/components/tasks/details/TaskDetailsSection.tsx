import React from 'react';
import { FaCalendarAlt, FaClock, FaFlag } from 'react-icons/fa';
import type { Task } from '../../../types';

interface TaskDetailsSectionProps {
  task: Task;
}

const TaskDetailsSection: React.FC<TaskDetailsSectionProps> = ({ task }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
      
      {/* Date Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {task.startDate && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FaCalendarAlt className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <span className="text-sm text-gray-600 break-words">
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
              <span className="text-sm text-gray-600 break-words">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Milestones */}
      <div>
        <h3 className="text-base sm:text-md font-medium text-gray-900 mb-3">Milestones</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <FaFlag className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">Initial Setup Complete</span>
            </div>
            <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex-shrink-0">
              Completed
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <FaFlag className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">Development Phase</span>
            </div>
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded flex-shrink-0">
              In Progress
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <FaFlag className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">Testing & Review</span>
            </div>
            <span className="ml-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsSection;
