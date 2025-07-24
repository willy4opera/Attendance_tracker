import React from 'react';
import KanbanBoard from '../../boards/KanbanBoard';
import BoardActivityPanel from '../../boards/BoardActivityPanel';
import theme from '../../../config/theme';

interface BoardViewMainContentProps {
  boardId: number;
  boardName: string;
  showActivity: boolean;
}

const BoardViewMainContent: React.FC<BoardViewMainContentProps> = ({
  boardId,
  boardName,
  showActivity,
}) => {
  return (
    <div 
      className="h-full w-full"
      style={{ 
        backgroundColor: theme.colors.background.default,
        width: '100%',
        height: '100%',
        overflow: 'visible'
      }}
    >
      {showActivity ? (
        <BoardActivityPanel boardId={boardId} />
      ) : (
        <KanbanBoard boardId={boardId} boardName={boardName} />
      )}
    </div>
  );
};

export default BoardViewMainContent;
