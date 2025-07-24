import React, { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import theme from '../../config/theme';

// Import modular components
import TaskListHeader from '../../components/tasks/TaskList/TaskListHeader';
import TaskListFilters from '../../components/tasks/TaskList/TaskListFilters';
import TaskListContainer from '../../components/tasks/TaskList/TaskListContainer';
import { 
  getPriorityColor, 
  getStatusColor, 
  getPriorityIcon, 
  sortTasks 
} from '../../components/tasks/TaskList/taskUtils';

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
    return sortTasks(tasks || [], sortBy, sortOrder);
  }, [tasks, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: SortOption, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderBottomColor: theme.colors.primary }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="border rounded-lg p-6 max-w-md w-full"
          style={{ 
            backgroundColor: `${theme.colors.error}10`,
            borderColor: `${theme.colors.error}30`,
            color: theme.colors.error
          }}
        >
          <p className="text-sm md:text-base font-medium mb-2">Error loading tasks</p>
          <p className="text-xs md:text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full overflow-x-hidden"
      style={{ 
        backgroundColor: `${theme.colors.primary}08`,
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header Section */}
        <TaskListHeader 
          totalTasks={sortedTasks.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Filters Section */}
        <TaskListFilters 
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onSortChange={handleSortChange}
        />

        {/* Tasks Container */}
        <TaskListContainer 
          tasks={sortedTasks}
          viewMode={viewMode}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          getPriorityIcon={getPriorityIcon}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
        />
      </div>
    </div>
  );
};

export default TaskList;
