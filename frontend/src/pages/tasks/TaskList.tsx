import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  AiOutlinePlus, 
  AiOutlineSearch, 
  AiOutlineAppstore,
  AiOutlineUnorderedList,
  AiOutlineCalendar,
  AiOutlineMessage,
  AiOutlineEye,
  AiOutlineTags,
  AiOutlineProject,
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiOutlineMinus
} from 'react-icons/ai';
import { useTasks } from '../../hooks/useTasks';
import theme from '../../config/theme';

type ViewMode = 'list' | 'grid';
type SortOption = 'created' | 'priority' | 'status' | 'title' | 'dueDate';

const TaskList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Debounce search term - only call API when search has 5+ characters or is empty
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 5 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { tasks, isLoading, error } = useTasks({
    search: debouncedSearchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter
  });

  // Memoized sorted and filtered tasks
  const sortedTasks = useMemo(() => {
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
  }, [tasks, sortBy, sortOrder]);

  const getPriorityColor = useCallback((priority: string) => {
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
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'todo': 
        return `bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600`;
      case 'in_progress': 
        return `bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800`;
      case 'review': 
        return `bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800`;
      case 'done': 
        return `bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800`;
      case 'cancelled': 
        return `bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800`;
      default: 
        return `bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600`;
    }
  }, []);

  const getPriorityIcon = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return <AiOutlineArrowUp className="w-3 h-3" style={{ color: theme.colors.error }} />;
      case 'high': return <AiOutlineArrowUp className="w-3 h-3" style={{ color: theme.colors.warning }} />;
      case 'medium': return <AiOutlineMinus className="w-3 h-3" style={{ color: theme.colors.warning }} />;
      case 'low': return <AiOutlineArrowDown className="w-3 h-3" style={{ color: theme.colors.success }} />;
      default: return <AiOutlineMinus className="w-3 h-3" style={{ color: theme.colors.text.secondary }} />;
    }
  }, []);

  const getSearchPlaceholder = () => {
    if (searchTerm.length > 0 && searchTerm.length < 5) {
      return `Type ${5 - searchTerm.length} more characters to search...`;
    }
    return "Search tasks (minimum 5 characters)...";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderBottomColor: theme.colors.primary }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="border rounded-lg p-4 mx-4"
        style={{ 
          backgroundColor: `${theme.colors.error}10`,
          borderColor: `${theme.colors.error}30`,
          color: theme.colors.error
        }}
      >
        <p className="text-sm md:text-base">Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: `${theme.colors.primary}08`,
        boxShadow: `0 0 0 1px ${theme.colors.primary}15, 0 2px 4px ${theme.colors.primary}10`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-4 md:space-y-6">
        
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
          <div className="space-y-1">
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-bold"
              style={{ color: theme.colors.text.primary }}
            >
              All Tasks
            </h1>
            <p 
              className="text-xs sm:text-sm lg:text-base"
              style={{ color: theme.colors.text.secondary }}
            >
              Manage and track all your tasks ({sortedTasks.length} total)
            </p>
          </div>
          
          {/* Action Buttons - Mobile Stack */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/tasks/create"
              className="flex items-center justify-center space-x-2 px-4 py-2.5 text-white rounded-lg transition-all duration-200 hover:opacity-90 focus:ring-2 focus:ring-offset-2 text-sm md:text-base"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: theme.colors.secondary,
                focusRingColor: theme.colors.primary
              }}
            >
              <AiOutlinePlus className="w-4 h-4 md:w-5 md:h-5" />
              <span>New Task</span>
            </Link>
            
            {/* View Toggle - Mobile Friendly */}
            <div 
              className="flex rounded-lg p-1"
              style={{ backgroundColor: `${theme.colors.primary}05` }}
            >
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                  viewMode === 'list' ? 'shadow-sm' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? theme.colors.primary : 'transparent',
                  color: viewMode === 'list' ? theme.colors.secondary : theme.colors.text.secondary
                }}
              >
                <AiOutlineUnorderedList className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                  viewMode === 'grid' ? 'shadow-sm' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? theme.colors.primary : 'transparent',
                  color: viewMode === 'grid' ? theme.colors.secondary : theme.colors.text.secondary
                }}
              >
                <AiOutlineAppstore className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search Section - Mobile First */}
        <div 
          className="rounded-lg shadow-sm border p-3 md:p-4 lg:p-6"
          style={{ 
            backgroundColor: `${theme.colors.primary}05`,
            borderColor: `${theme.colors.primary}20`,
            boxShadow: `0 1px 3px ${theme.colors.primary}15`
          }}
        >
          <div className="space-y-4">
            {/* Search Bar - Mobile Optimized */}
            <div className="relative">
              <AiOutlineSearch 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5"
                style={{ color: theme.colors.text.secondary }}
              />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 border rounded-lg focus:ring-2 focus:ring-offset-2 text-sm md:text-base transition-colors"
                style={{
                  borderColor: searchTerm.length > 0 && searchTerm.length < 5 
                    ? `${theme.colors.warning}50` 
                    : `${theme.colors.text.secondary}30`,
                  backgroundColor: `${theme.colors.primary}05`,
                  color: theme.colors.text.primary,
                  focusRingColor: theme.colors.primary
                }}
              />
              {searchTerm.length > 0 && searchTerm.length < 5 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${theme.colors.warning}20`,
                      color: theme.colors.warning
                    }}
                  >
                    {5 - searchTerm.length} more
                  </span>
                </div>
              )}
            </div>

            {/* Filters Row - Mobile Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {/* Status Filter */}
              <div>
                <label 
                  className="block text-xs md:text-sm font-medium mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 md:py-2.5 border rounded-lg focus:ring-2 focus:ring-offset-2 text-xs md:text-sm transition-colors"
                  style={{
                    borderColor: `${theme.colors.text.secondary}30`,
                    backgroundColor: `${theme.colors.primary}05`,
                    color: theme.colors.text.primary,
                    focusRingColor: theme.colors.primary
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label 
                  className="block text-xs md:text-sm font-medium mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 md:py-2.5 border rounded-lg focus:ring-2 focus:ring-offset-2 text-xs md:text-sm transition-colors"
                  style={{
                    borderColor: `${theme.colors.text.secondary}30`,
                    backgroundColor: `${theme.colors.primary}05`,
                    color: theme.colors.text.primary,
                    focusRingColor: theme.colors.primary
                  }}
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label 
                  className="block text-xs md:text-sm font-medium mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as SortOption);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full px-3 py-2 md:py-2.5 border rounded-lg focus:ring-2 focus:ring-offset-2 text-xs md:text-sm transition-colors"
                  style={{
                    borderColor: `${theme.colors.text.secondary}30`,
                    backgroundColor: `${theme.colors.primary}05`,
                    color: theme.colors.text.primary,
                    focusRingColor: theme.colors.primary
                  }}
                >
                  <option value="created-desc">Newest First</option>
                  <option value="created-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="priority-desc">High Priority First</option>
                  <option value="priority-asc">Low Priority First</option>
                  <option value="dueDate-asc">Due Date (Soon)</option>
                  <option value="dueDate-desc">Due Date (Later)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section - Responsive Layout */}
        <div 
          className="rounded-lg shadow-sm border"
          style={{ 
            backgroundColor: `${theme.colors.primary}05`,
            borderColor: `${theme.colors.primary}20`,
            boxShadow: `0 1px 3px ${theme.colors.primary}15`
          }}
        >
          {sortedTasks && sortedTasks.length === 0 ? (
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
                {searchTerm.length > 0 && searchTerm.length < 5
                  ? `Type ${5 - searchTerm.length} more characters to search for tasks`
                  : searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters or search term to find tasks'
                  : 'Get started by creating your first task'}
              </p>
              <Link
                to="/tasks/create"
                className="inline-flex items-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-all duration-200 hover:opacity-90 focus:ring-2 focus:ring-offset-2 text-sm md:text-base"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.secondary,
                  focusRingColor: theme.colors.primary
                }}
              >
                <AiOutlinePlus className="w-4 h-4 md:w-5 md:h-5" />
                <span>Create Task</span>
              </Link>
            </div>
          ) : (
            <div className={`p-3 md:p-4 lg:p-6 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6' 
                : 'space-y-3 md:space-y-4'
            }`}>
              {sortedTasks?.map((task) => (
                <div
                  key={task.id}
                  className={`group shadow-sm border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md ${
                    viewMode === 'grid'
                      ? 'p-3 md:p-4'
                      : 'p-3 md:p-4 lg:p-6'
                  }`}
                  style={{ 
                    backgroundColor: `${theme.colors.primary}03`,
                    borderColor: `${theme.colors.text.secondary}20`,
                  }}
                >
                  <div className={`${viewMode === 'grid' ? 'space-y-2 md:space-y-3' : 'flex flex-col md:flex-row md:items-start md:justify-between gap-3'}`}>
                    {/* Task Content */}
                    <div className={`${viewMode === 'grid' ? '' : 'flex-1 min-w-0'}`}>
                      {/* Title and Priority - Mobile First */}
                      <div className="flex items-start space-x-2 md:space-x-3 mb-2">
                        <div className="flex items-center space-x-1 md:space-x-2 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getPriorityIcon(task.priority)}
                          </div>
                          <Link
                            to={`/tasks/${task.id}`}
                            className="text-sm md:text-base lg:text-lg font-semibold transition-colors truncate hover:opacity-80"
                            style={{ 
                              color: theme.colors.text.primary,
                            }}
                          >
                            {task.title}
                          </Link>
                        </div>
                        
                        {/* Status and Priority Badges - Mobile Stack */}
                        <div className={`flex ${viewMode === 'grid' ? 'flex-col space-y-1' : 'flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2'} flex-shrink-0`}>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Description - Responsive */}
                      {task.description && (
                        <p 
                          className="mb-2 md:mb-3 text-xs md:text-sm lg:text-base line-clamp-2"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          {task.description}
                        </p>
                      )}
                      
                      {/* Meta Information - Mobile Stack */}
                      <div className={`${
                        viewMode === 'grid' 
                          ? 'space-y-1 md:space-y-2' 
                          : 'flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 md:gap-4'
                      } text-xs md:text-sm`}
                      style={{ color: theme.colors.text.secondary }}
                      >
                        
                        {/* Board and List Info */}
                        <div className="flex items-center space-x-1 truncate">
                          <AiOutlineProject className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Board:</span>
                          <Link
                            to={`/boards/${task.list?.board?.id}`}
                            className="font-medium transition-colors truncate hover:opacity-80"
                            style={{ 
                              color: theme.colors.info,
                            }}
                          >
                            {task.list?.board?.name}
                          </Link>
                        </div>
                        
                        <div className="flex items-center space-x-1 truncate">
                          <AiOutlineUnorderedList className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="hidden sm:inline">List:</span>
                          <span 
                            className="font-medium truncate"
                            style={{ color: theme.colors.text.primary }}
                          >
                            {task.list?.name}
                          </span>
                        </div>
                        
                        {/* Due Date */}
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <AiOutlineCalendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Due:</span>
                            <span 
                              className="font-medium"
                              style={{
                                color: new Date(task.dueDate) < new Date() 
                                  ? theme.colors.error 
                                  : theme.colors.text.primary
                              }}
                            >
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* Stats - Mobile Compact */}
                        <div className="flex items-center space-x-3 md:space-x-4">
                          {task.commentCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <AiOutlineMessage className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{task.commentCount}</span>
                            </div>
                          )}
                          
                          {task.watcherCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <AiOutlineEye className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{task.watcherCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Labels - Mobile Responsive */}
                    {task.labels && task.labels.length > 0 && (
                      <div className={`${
                        viewMode === 'grid' ? 'mt-2 md:mt-3' : 'mt-2 md:mt-0 md:flex md:items-center md:space-x-2 md:ml-4 md:flex-shrink-0'
                      }`}>
                        <div className="flex flex-wrap gap-1">
                          {task.labels.slice(0, viewMode === 'grid' ? 2 : 3).map((label, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: `${theme.colors.primary}20`,
                                color: theme.colors.text.primary,
                                border: `1px solid ${theme.colors.primary}30`
                              }}
                            >
                              <AiOutlineTags className="w-2 h-2 md:w-3 md:h-3" />
                              <span className="truncate max-w-16 md:max-w-none">{label}</span>
                            </span>
                          ))}
                          {task.labels.length > (viewMode === 'grid' ? 2 : 3) && (
                            <span 
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: `${theme.colors.text.secondary}20`,
                                color: theme.colors.text.secondary
                              }}
                            >
                              +{task.labels.length - (viewMode === 'grid' ? 2 : 3)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskList;
