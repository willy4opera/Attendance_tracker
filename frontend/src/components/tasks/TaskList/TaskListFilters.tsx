import React from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import theme from '../../../config/theme';

type SortOption = 'created' | 'priority' | 'status' | 'title' | 'dueDate';

interface TaskListFiltersProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onSortChange: (sortBy: SortOption, sortOrder: 'asc' | 'desc') => void;
}

const TaskListFilters: React.FC<TaskListFiltersProps> = ({
  searchTerm,
  statusFilter,
  priorityFilter,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSortChange,
}) => {
  const getSearchPlaceholder = () => {
    if (searchTerm.length > 0 && searchTerm.length < 5) {
      return `Type ${5 - searchTerm.length} more characters to search...`;
    }
    return window.innerWidth < 640 ? "Search (5+ chars)..." : "Search tasks (minimum 5 characters)...";
  };

  return (
    <div 
      className="rounded-lg shadow-sm border p-3 md:p-4 lg:p-6"
      style={{ 
        backgroundColor: `${theme.colors.primary}05`,
        borderColor: `${theme.colors.primary}20`,
        boxShadow: `0 1px 3px ${theme.colors.primary}15`
      }}
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <AiOutlineSearch 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5"
            style={{ color: theme.colors.text.secondary }}
          />
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 border rounded-lg focus:ring-2 focus:ring-offset-2 text-sm md:text-base transition-colors"
            style={{
              borderColor: searchTerm.length > 0 && searchTerm.length < 5 
                ? `${theme.colors.warning}50` 
                : `${theme.colors.text.secondary}30`,
              backgroundColor: `${theme.colors.primary}05`,
              color: theme.colors.text.primary,
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

        {/* Filters Row */}
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
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 md:py-2.5 border rounded-lg focus:ring-2 focus:ring-offset-2 text-xs md:text-sm transition-colors"
              style={{
                borderColor: `${theme.colors.text.secondary}30`,
                backgroundColor: `${theme.colors.primary}05`,
                color: theme.colors.text.primary,
              }}
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
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
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="w-full px-3 py-2 md:py-2.5 border rounded-lg focus:ring-2 focus:ring-offset-2 text-xs md:text-sm transition-colors"
              style={{
                borderColor: `${theme.colors.text.secondary}30`,
                backgroundColor: `${theme.colors.primary}05`,
                color: theme.colors.text.primary,
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
                onSortChange(field as SortOption, order as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 md:py-2.5 border rounded-lg focus:ring-2 focus:ring-offset-2 text-xs md:text-sm transition-colors"
              style={{
                borderColor: `${theme.colors.text.secondary}30`,
                backgroundColor: `${theme.colors.primary}05`,
                color: theme.colors.text.primary,
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
  );
};

export default TaskListFilters;
