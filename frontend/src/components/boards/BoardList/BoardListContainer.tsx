import React from 'react';
import BoardItem from './BoardItem';
import EmptyBoardList from './EmptyBoardList';
import type { Board } from '../../../types';

interface BoardListContainerProps {
  boards: Board[];
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onStar: (id: string) => void;
  onArchive: (id: string) => void;
  onEdit: (board: Board) => void;
  onUpdate: (id: string | number, data: any) => Promise<any>;
  onCreateClick: () => void;
}

const BoardListContainer: React.FC<BoardListContainerProps> = ({
  boards,
  viewMode,
  onDelete,
  onStar,
  onArchive,
  onEdit,
  onUpdate,
  onCreateClick,
}) => {
  if (boards.length === 0) {
    return <EmptyBoardList onCreateClick={onCreateClick} />;
  }

  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'space-y-4'
    }>
      {boards.map((board) => (
        <BoardItem
          key={board.id} 
          board={board}
          viewMode={viewMode}
          onDelete={onDelete}
          onStar={onStar}
          onArchive={onArchive}
          onEdit={onEdit}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};

export default BoardListContainer;
