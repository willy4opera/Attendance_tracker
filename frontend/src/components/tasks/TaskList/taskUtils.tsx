import React from 'react';
import { 
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiOutlineMinus
} from 'react-icons/ai';
import theme from '../../../config/theme';

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': 
      return `bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800`;
    case 'high': 
      return `bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800`;
    case 'medium': 
      return `bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800`;
    case 'low': 
      return `bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800`;
    default: 
      return `bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600`;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'todo': 
      return `bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600`;
    case 'in-progress': 
      return `bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800`;
    case 'under-review': 
      return `bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800`;
    case 'done': 
      return `bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800`;
    case 'cancelled': 
      return `bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800`;
    default: 
      return `bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600`;
  }
};

export const getPriorityIcon = (priority: string): React.ReactNode => {
  switch (priority) {
    case 'urgent': 
      return <AiOutlineArrowUp className="w-3 h-3" style={{ color: theme.colors.error }} />;
    case 'high': 
      return <AiOutlineArrowUp className="w-3 h-3" style={{ color: theme.colors.warning }} />;
    case 'medium': 
      return <AiOutlineMinus className="w-3 h-3" style={{ color: theme.colors.warning }} />;
    case 'low': 
      return <AiOutlineArrowDown className="w-3 h-3" style={{ color: theme.colors.success }} />;
    default: 
      return <AiOutlineMinus className="w-3 h-3" style={{ color: theme.colors.text.secondary }} />;
  }
};

export const sortTasks = (
  tasks: any[], 
  sortBy: 'created' | 'priority' | 'status' | 'title' | 'dueDate',
  sortOrder: 'asc' | 'desc'
): any[] => {
  if (!tasks) return [];
  
  const sorted = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority': {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                    (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
        break;
      }
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'dueDate': {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = aDate - bDate;
        break;
      }
      case 'created':
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
};

export const getSearchPlaceholder = (searchTerm: string): string => {
  if (searchTerm.length > 0 && searchTerm.length < 5) {
    return `Type ${5 - searchTerm.length} more characters to search...`;
  }
  return window.innerWidth < 640 ? "Search (5+ chars)..." : "Search tasks (minimum 5 characters)...";
};

export const formatStatusDisplay = (status: string): string => {
  switch (status) {
    case 'todo':
      return 'To Do';
    case 'in-progress':
      return 'In Progress';
    case 'under-review':
      return 'Under Review';
    case 'done':
      return 'Done';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};
