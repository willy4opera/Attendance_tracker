import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBoard, useBoards } from '../../hooks/useBoards';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import {
  BoardViewHeader,
  BoardViewMainContent,
  BoardViewControls,
  compressImage,
  validateImageSize
} from '../../components/boards/BoardView';
import EditBoardModal from '../../components/boards/EditBoardModal';
import type { Board } from '../../types';
import theme from '../../config/theme';

const BoardView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const boardId = parseInt(id || '0');
  const { board, loading, error, refetch } = useBoard(boardId);
  const [showActivity, setShowActivity] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const { updateBoard } = useBoards();

  // Enable real-time updates for this board
  useRealTimeUpdates({ boardId, enabled: true });

  const handleEdit = () => {
    if (board) {
      setEditingBoard(board);
    }
  };

  const handleSaveEdit = async (id: string | number, data: any) => {
    const result = await updateBoard(id, data);
    if (result) {
      setEditingBoard(null);
      refetch(); // Refresh the board view after editing
    }
    return result;
  };

  const handleEditHeader = () => {
    if (board) {
      setHeaderTitle(board.name);
      setHeaderImage(board.backgroundImage || null);
      setIsEditingHeader(true);
    }
  };

  const handleSaveHeader = async () => {
    if (board) {
      await updateBoard(board.id, {
        name: headerTitle,
        backgroundImage: headerImage
      });
      setIsEditingHeader(false);
      refetch();
    }
  };

  const handleCancelHeader = () => {
    setIsEditingHeader(false);
    setHeaderTitle('');
    setHeaderImage(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Check file size (limit to 5MB)
        if (!validateImageSize(file, 5)) {
          alert('Image size should be less than 5MB');
          return;
        }
        
        // Compress image before setting
        const compressedImage = await compressImage(file, 1200, 800, 0.85);
        setHeaderImage(compressedImage);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try a different image.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
        <span className="ml-2" style={{ color: theme.colors.text.secondary }}>Loading board...</span>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading board: {error || 'Board not found'}
        <Link to="/boards" className="ml-2 hover:underline" style={{ color: theme.colors.primary }}>
          Back to Boards
        </Link>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)', // Adjust for header height
      width: '100%',
      position: 'relative'
    }}>
      {/* Fixed Header */}
      <div style={{ flexShrink: 0 }}>
        <BoardViewHeader
          board={board}
          onEditHeader={handleEditHeader}
          onEdit={handleEdit}
          isEditingHeader={isEditingHeader}
          headerTitle={headerTitle}
          headerImage={headerImage}
          setHeaderTitle={setHeaderTitle}
          handleSaveHeader={handleSaveHeader}
          handleCancelHeader={handleCancelHeader}
          handleImageUpload={handleImageUpload}
        />

        {/* Fixed Controls */}
        <div className="px-6 py-2 border-b" style={{ backgroundColor: theme.colors.background.paper }}>
          <BoardViewControls
            boardId={board.id}
            showActivity={showActivity}
            onToggleActivity={() => setShowActivity(!showActivity)}
          />
        </div>
      </div>

      {/* Main Content with proper overflow handling */}
      <div style={{ 
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
      }}>
        <BoardViewMainContent
          boardId={board.id}
          boardName={board.name}
          showActivity={showActivity}
        />
      </div>

      {/* Edit Board Modal */}
      {editingBoard && (
        <EditBoardModal
          board={editingBoard}
          isOpen={!!editingBoard}
          onClose={() => setEditingBoard(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default BoardView;
