import React from 'react';
import { FaTh } from 'react-icons/fa';
import theme from '../../../config/theme';

interface EmptyBoardListProps {
  onCreateClick: () => void;
}

const EmptyBoardList: React.FC<EmptyBoardListProps> = ({ onCreateClick }) => {
  return (
    <div className="text-center py-12">
      <div className="mb-4" style={{ color: theme.colors.text.secondary }}>
        <FaTh className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg">No boards found</p>
        <p className="text-sm mt-2">Get started by creating your first board</p>
      </div>
      <button
        onClick={onCreateClick}
        className="inline-block px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
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
        Create Your First Board
      </button>
    </div>
  );
};

export default EmptyBoardList;
