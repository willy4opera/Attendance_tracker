import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCog, FaHistory, FaUsers } from 'react-icons/fa';
import { useBoard } from '../../hooks/useBoards';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import KanbanBoard from '../../components/boards/KanbanBoard';
import BoardActivityPanel from '../../components/boards/BoardActivityPanel';
import NotificationBell from '../../components/notifications/NotificationBell';

const BoardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const boardId = parseInt(id || '0');
  const [showActivity, setShowActivity] = useState(false);
  
  const { board, loading, error } = useBoard(boardId);

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

  if (error || !board) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading board: {error || 'Board not found'}
        <Link to="/boards" className="ml-2 text-blue-600 hover:underline">
          Back to Boards
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/boards"
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <FaArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{board.name}</h1>
            {board.description && (
              <p className="text-sm text-gray-600">{board.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationBell />
          
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
            title="Board Activity"
          >
            <FaHistory className="h-5 w-5" />
          </button>

          <Link
            to={`/boards/${boardId}/settings`}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
            title="Board Settings"
          >
            <FaCog className="h-5 w-5" />
          </Link>

          <button className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100">
            <FaUsers className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          boardId={boardId}
          boardName={board.name}
        />
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

export default BoardView;
