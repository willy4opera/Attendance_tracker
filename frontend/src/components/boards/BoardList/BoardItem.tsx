import React from 'react';
import BoardCard from '../../boards/BoardCard';
import type { Board } from '../../../types';

interface BoardItemProps {
  board: Board;
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onStar: (id: string) => void;
  onArchive: (id: string) => void;
  onEdit: (board: Board) => void;
  onUpdate: (id: string | number, data: any) => Promise<any>;
}

const BoardItem: React.FC<BoardItemProps> = ({
  board,
  viewMode,
  onDelete,
  onStar,
  onArchive,
  onEdit,
  onUpdate,
}) => {
  return (
    <BoardCard 
      board={board}
      viewMode={viewMode}
      onDelete={onDelete}
      onStar={onStar}
      onArchive={onArchive}
      onEdit={onEdit}
      onUpdate={onUpdate}
    />
  );
};

export default BoardItem;
