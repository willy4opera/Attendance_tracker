import React, { useState } from 'react';
import { FaHistory, FaTimes, FaFilter } from 'react-icons/fa';
import ActivityFeed from '../activities/ActivityFeed';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface BoardActivityPanelProps {
  boardId: number;
  isOpen: boolean;
  onToggle: () => void;
}

const BoardActivityPanel: React.FC<BoardActivityPanelProps> = ({
  boardId,
  isOpen,
  onToggle,
}) => {
  const [filters, setFilters] = useState({
    activityType: '',
    timeRange: '7d' as '1d' | '7d' | '30d',
  });

  // Enable real-time updates for this board
  useRealTimeUpdates({ boardId, enabled: isOpen });

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed right-4 top-20 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Board Activity"
      >
        <FaHistory className="h-5 w-5" />
      </button>

      {/* Activity Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Board Activity
            </h2>
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <FaFilter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.activityType}
                onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="commented">Commented</option>
                <option value="liked">Liked</option>
                <option value="assigned">Assigned</option>
              </select>
              
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({ ...filters, timeRange: e.target.value as '1d' | '7d' | '30d' })}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="flex-1 overflow-y-auto">
            <ActivityFeed
              boardId={boardId}
              className="p-4"
            />
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default BoardActivityPanel;
