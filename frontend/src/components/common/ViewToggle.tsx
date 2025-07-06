import React from 'react';
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange, className = '' }) => {
  return (
    <div className={`flex border border-gray-300 rounded-md ${className}`}>
      <button
        onClick={() => onViewModeChange('grid')}
        className={`px-3 py-2 ${
          viewMode === 'grid'
            ? 'bg-black text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        } transition-colors rounded-l-md`}
        title="Grid view"
        aria-label="Grid view"
      >
        <Squares2X2Icon className="h-5 w-5" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`px-3 py-2 ${
          viewMode === 'list'
            ? 'bg-black text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        } transition-colors rounded-r-md border-l border-gray-300`}
        title="List view"
        aria-label="List view"
      >
        <ListBulletIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ViewToggle;
export type { ViewMode };
