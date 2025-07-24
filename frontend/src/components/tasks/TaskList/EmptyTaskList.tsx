import React from 'react';
import { Link } from 'react-router-dom';
import { AiOutlinePlus } from 'react-icons/ai';
import theme from '../../../config/theme';

interface EmptyTaskListProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
}

const EmptyTaskList: React.FC<EmptyTaskListProps> = ({
  searchTerm,
  statusFilter,
  priorityFilter,
}) => {
  const getEmptyMessage = () => {
    if (searchTerm.length > 0 && searchTerm.length < 5) {
      return `Type ${5 - searchTerm.length} more characters to search for tasks`;
    }
    if (searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') {
      return 'Try adjusting your filters or search term to find tasks';
    }
    return 'Get started by creating your first task';
  };

  return (
    <div className="text-center py-8 md:py-12 lg:py-16 px-4">
      <div 
        className="text-4xl md:text-6xl lg:text-7xl mb-4"
        style={{ color: theme.colors.text.secondary }}
      >
        📋
      </div>
      <h3 
        className="text-base md:text-lg lg:text-xl font-medium mb-2"
        style={{ color: theme.colors.text.primary }}
      >
        No tasks found
      </h3>
      <p 
        className="mb-6 text-xs md:text-sm lg:text-base max-w-md mx-auto px-4"
        style={{ color: theme.colors.text.secondary }}
      >
        {getEmptyMessage()}
      </p>
      <Link
        to="/tasks/create"
        className="inline-flex items-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-all duration-200 hover:opacity-90 focus:ring-2 focus:ring-offset-2 text-sm md:text-base"
        style={{ 
          backgroundColor: theme.colors.primary,
          color: '#FFFFFF',
        }}
      >
        <AiOutlinePlus className="w-4 h-4 md:w-5 md:h-5" />
        <span>Create Task</span>
      </Link>
    </div>
  );
};

export default EmptyTaskList;
