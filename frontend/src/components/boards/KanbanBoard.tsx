import React, { useState } from 'react';
import { useBoardLists } from '../../hooks/useBoards';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import TaskList from './TaskList';
import BoardActivityPanel from './BoardActivityPanel';

interface KanbanBoardProps {
  boardId: number;
  boardName?: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ boardId, boardName }) => {
  const [showActivity, setShowActivity] = useState(false);
  const { lists, loading, error, createList, updateList, deleteList } = useBoardLists(boardId);

  // Enable real-time updates for this board
  useRealTimeUpdates({ boardId, enabled: true });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading board...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading board: {error}
        <button 
          onClick={() => window.location.reload()}
          className="ml-2 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Board Header */}
      {boardName && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{boardName}</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {lists.length} list{lists.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
        {lists.map((list) => (
          <TaskList 
            key={list.id} 
            list={list} 
            onUpdate={updateList} 
            onDelete={deleteList} 
          />
        ))}
        
        {/* Add New List Button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => createList({ 
              name: 'New List', 
              position: lists.length 
            })}
            className="bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg p-4 w-64 h-32 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">+</div>
              <div className="text-sm font-medium">Add a list</div>
            </div>
          </button>
        </div>
      </div>

      {/* Activity Panel */}
      <BoardActivityPanel
        boardId={boardId}
        isOpen={showActivity}
        onToggle={() => setShowActivity(!showActivity)}
      />
    </div>
  );
};

export default KanbanBoard;
