import React from 'react';
import { FaTh, FaList } from 'react-icons/fa';
import theme from '../../../config/theme';

interface BoardFilters {
  search: string;
  visibility: string;
  projectId: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

interface BoardListFiltersProps {
  filters: BoardFilters;
  viewMode: 'grid' | 'list';
  onFilterChange: (key: string, value: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const BoardListFilters: React.FC<BoardListFiltersProps> = ({
  filters,
  viewMode,
  onFilterChange,
  onViewModeChange,
}) => {
  return (
    <div className="rounded-lg shadow-sm border p-4 mb-6" style={{ backgroundColor: theme.colors.background.paper }}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search boards..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: theme.colors.primary + '40',
              backgroundColor: theme.colors.background.default
            }}
          />
        </div>
        
        <select
          value={filters.visibility}
          onChange={(e) => onFilterChange('visibility', e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
          style={{
            borderColor: theme.colors.primary + '40',
            backgroundColor: theme.colors.background.default
          }}
        >
          <option value="all">All Boards</option>
          <option value="private">Private</option>
          <option value="department">Department</option>
          <option value="organization">Organization</option>
          <option value="public">Public</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all"
          style={{
            borderColor: theme.colors.primary + '40',
            backgroundColor: theme.colors.background.default
          }}
        >
          <option value="updatedAt">Last Updated</option>
          <option value="createdAt">Created Date</option>
          <option value="name">Name</option>
        </select>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className="p-2 rounded-md transition-all duration-200"
            style={{
              backgroundColor: viewMode === 'grid' ? theme.colors.primary : 'transparent',
              color: viewMode === 'grid' ? theme.colors.secondary : theme.colors.text.secondary
            }}
            title="Grid view"
          >
            <FaTh className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className="p-2 rounded-md transition-all duration-200"
            style={{
              backgroundColor: viewMode === 'list' ? theme.colors.primary : 'transparent',
              color: viewMode === 'list' ? theme.colors.secondary : theme.colors.text.secondary
            }}
            title="List view"
          >
            <FaList className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardListFilters;
