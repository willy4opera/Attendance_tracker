import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaCheck,
  FaCalendarAlt,
  FaShare
} from 'react-icons/fa';
import type { Task } from '../../../types';

interface TaskHeaderProps {
  task: Task;
  taskId: string;
  isAdmin: boolean;
  onMarkCompleted: () => void;
  onDelete: () => void;
  onShare: () => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  task,
  taskId,
  isAdmin,
  onMarkCompleted,
  onDelete,
  onShare
}) => {
  return (
    <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-start space-x-3 sm:space-x-4 w-full sm:w-auto">
            <Link 
              to={task.list?.board?.id ? `/boards/${task.list.board.id}` : '/boards'}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <FaArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                {task.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">
                in {task.list?.name} • {task.list?.board?.name}
              </p>
              {task.startDate && task.dueDate && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  <FaCalendarAlt className="inline-block mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {new Date(task.startDate).toLocaleDateString()} - {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                  <span className="sm:hidden">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto justify-end">
            {isAdmin && task.status !== 'done' && (
              <button
                onClick={onMarkCompleted}
                className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-2 sm:px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
              >
                <FaCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mark as Completed</span>
                <span className="sm:hidden">Done</span>
              </button>
            )}
            
            <button
              onClick={onShare}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Share"
            >
              <FaShare className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <Link
              to={`/tasks/${taskId}/edit`}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Edit"
            >
              <FaEdit className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            
            {isAdmin && (
              <button
                onClick={onDelete}
                className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Delete"
              >
                <FaTrash className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;
