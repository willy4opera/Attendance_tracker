import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaCheck,
  FaCalendarAlt,
  FaShare,
  FaCheckCircle,
  FaTimes,
  FaClock
} from 'react-icons/fa';
import type { Task } from '../../../types';
import theme from '../../../config/theme';

interface TaskHeaderProps {
  task: Task;
  taskId: string;
  isAdmin: boolean;
  onMarkCompleted: () => void;
  onMarkUncompleted?: () => void;
  onDelete: () => void;
  onShare: () => void;
  onEdit?: () => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  task,
  taskId,
  isAdmin,
  onMarkCompleted,
  onMarkUncompleted,
  onDelete,
  onShare,
  onEdit
}) => {
  // Determine task status based on completedAt
  const isCompleted = task.status === "done";
  
  // Format completion date/time
  const formatCompletionDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

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
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                  {task.title}
                </h1>
                {/* Status Badge based on completedAt */}
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <FaCheckCircle className="h-3 w-3" />
                        <span>Completed</span>
                      </div>
                      {task.completedAt && (
                        <div className="text-xs text-gray-500">
                          <span className="hidden sm:inline">
                            {formatCompletionDate(task.completedAt).date} at {formatCompletionDate(task.completedAt).time}
                          </span>
                          <span className="sm:hidden">
                            {formatCompletionDate(task.completedAt).date}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <FaClock className="h-3 w-3" />
                      <span>In Progress</span>
                    </div>
                  )}
                </div>
              </div>
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
            {/* Completion Button Logic */}
            {isCompleted ? (
              // Task is completed
              isAdmin ? (
                // Admin can mark as uncompleted
                <button
                  onClick={onMarkUncompleted || onEdit}
                  className="flex items-center space-x-1 sm:space-x-2 bg-orange-600 text-white px-2 sm:px-3 md:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-xs sm:text-sm"
                  title="Mark as uncompleted and add comment"
                >
                  <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Mark as Uncompleted</span>
                  <span className="sm:hidden">Reopen</span>
                </button>
              ) : (
                // Regular user sees disabled completed button
                <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-200 text-gray-600 px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm cursor-not-allowed">
                  <FaCheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Completed</span>
                </div>
              )
            ) : (
              // Task is not completed - anyone can mark as completed
              <button
                onClick={onMarkCompleted}
                className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-2 sm:px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
              >
                <FaCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mark as Completed</span>
                <span className="sm:hidden">Complete</span>
              </button>
            )}
            
            <button
              onClick={onShare}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Share"
            >
              <FaShare className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            {onEdit && (
              <button
              onClick={onEdit}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Edit"
            >
              <FaEdit className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            )}
            
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
