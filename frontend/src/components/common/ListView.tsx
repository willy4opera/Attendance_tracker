import React from 'react';
import ViewToggle, { ViewMode } from './ViewToggle';
import { 
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface ListViewProps<T> {
  title: string;
  items: T[];
  loading: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  onToggleFilters?: () => void;
  filterComponent?: React.ReactNode;
  actionButton?: React.ReactNode;
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  renderGridItem: (item: T) => React.ReactNode;
  renderListItem: (item: T) => React.ReactNode;
  pagination?: React.ReactNode;
  getItemKey: (item: T) => string;
}

function ListView<T>({
  title,
  items,
  loading,
  viewMode,
  onViewModeChange,
  searchValue,
  onSearchChange,
  onSearch,
  onToggleFilters,
  filterComponent,
  actionButton,
  emptyStateIcon,
  emptyStateTitle = 'No items found',
  emptyStateDescription = 'No items are available at the moment.',
  renderGridItem,
  renderListItem,
  pagination,
  getItemKey,
}: ListViewProps<T>) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actionButton}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <form onSubmit={onSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#fddc9a] focus:border-transparent"
              />
            </div>
            {onToggleFilters && (
              <button
                type="button"
                onClick={onToggleFilters}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FunnelIcon className="h-5 w-5" />
              </button>
            )}
          </form>
          
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </div>

        {/* Filter Component */}
        {filterComponent}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fddc9a]"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          {emptyStateIcon}
          <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyStateTitle}</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyStateDescription}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <React.Fragment key={getItemKey(item)}>
              {renderGridItem(item)}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={getItemKey(item)}>
                {renderListItem(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {pagination}
    </div>
  );
}

export default ListView;
