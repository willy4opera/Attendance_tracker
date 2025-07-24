import React from 'react';
import { FaPlus } from 'react-icons/fa';
import theme from '../../../config/theme';

interface BoardListHeaderProps {
  total: number;
  onCreateClick: () => void;
}

const BoardListHeader: React.FC<BoardListHeaderProps> = ({ total, onCreateClick }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>Boards</h1>
        <p style={{ color: theme.colors.text.secondary }}>{total} board{total !== 1 ? 's' : ''} total</p>
      </div>
      <button
        onClick={onCreateClick}
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
        <span>Create Board</span>
      </button>
    </div>
  );
};

export default BoardListHeader;
