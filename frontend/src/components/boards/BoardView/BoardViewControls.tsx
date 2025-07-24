import React from 'react';
import { Link } from 'react-router-dom';
import { FaCog, FaHistory, FaUsers } from 'react-icons/fa';
import theme from '../../../config/theme';

interface BoardViewControlsProps {
  boardId: number;
  showActivity: boolean;
  onToggleActivity: () => void;
}

const BoardViewControls: React.FC<BoardViewControlsProps> = ({
  boardId,
  showActivity,
  onToggleActivity,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onToggleActivity}
        className="p-2 rounded-lg transition-all duration-200"
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
        title={showActivity ? 'Show Board' : 'Show Activity'}
      >
        {showActivity ? <FaCog className="h-5 w-5" /> : <FaHistory className="h-5 w-5" />}
      </button>
      
      <Link
        to={`/boards/${boardId}/settings`}
        className="p-2 rounded-lg transition-all duration-200"
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
        title="Board Settings"
      >
        <FaCog className="h-5 w-5" />
      </Link>
      
      <Link
        to={`/boards/${boardId}/members`}
        className="p-2 rounded-lg transition-all duration-200"
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
        title="Board Members"
      >
        <FaUsers className="h-5 w-5" />
      </Link>
    </div>
  );
};

export default BoardViewControls;
