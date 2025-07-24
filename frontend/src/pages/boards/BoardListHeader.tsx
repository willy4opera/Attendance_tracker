import React from 'react';
import { FaPlus } from 'react-icons/fa';
import NotificationBell from '../../components/notifications/NotificationBell';
import theme from '../../config/theme';

interface BoardListHeaderProps {
  total: number;
  onCreateBoard: () => void;
}

const BoardListHeader: React.FC<BoardListHeaderProps> = ({ total, onCreateBoard }) => {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-4 pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            Boards
          </h1>
          <p style={{ color: theme.colors.text.secondary }}>
            {total} board{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <button
            onClick={onCreateBoard}
            className="px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
              e.currentTarget.style.color = theme.colors.primary;
            }}
          >
            <FaPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Board</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardListHeader;
