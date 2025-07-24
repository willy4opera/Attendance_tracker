import React from 'react';
import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import type { TableHeaderProps } from './types';

const TableHeader: React.FC<TableHeaderProps> = ({
  viewMode,
  onViewModeChange,
  recordCount,
}) => {
  return (
    <div
      className="px-4 sm:px-6 py-4 border-b flex items-center justify-between"
      style={{ borderBottomColor: `${theme.colors.text.secondary}30` }}
    >
      <div>
        <h3
          className="text-lg font-medium flex items-center space-x-2"
          style={{ color: theme.colors.text.primary }}
        >
          <span>Recent Attendance</span>
          {recordCount > 0 && (
            <span
              className="text-sm font-normal px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${theme.colors.primary}10`,
                color: theme.colors.primary,
              }}
            >
              {recordCount} records
            </span>
          )}
        </h3>
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-1.5 rounded transition-all ${
            viewMode === 'list'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={{
            color:
              viewMode === 'list'
                ? theme.colors.primary
                : theme.colors.text.secondary,
          }}
          title="List View"
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-1.5 rounded transition-all ${
            viewMode === 'grid'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={{
            color:
              viewMode === 'grid'
                ? theme.colors.primary
                : theme.colors.text.secondary,
          }}
          title="Grid View"
        >
          <Squares2X2Icon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TableHeader;
