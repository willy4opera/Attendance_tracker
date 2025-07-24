import React, { useState } from 'react';
import { useBoards } from '../../hooks/useBoards';
import { useActivities } from '../../hooks/useActivities';
import { useAuth } from '../../contexts/useAuth';
import {
  BoardListHeader,
  BoardListFilters,
  BoardListContainer,
} from '../../components/boards/BoardList';
import CreateBoardModal from '../../components/boards/CreateBoardModal';
import EditBoardModal from '../../components/boards/EditBoardModal';
import type { Board } from '../../types';
import theme from '../../config/theme';

const BoardList: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    visibility: 'all',
    projectId: '',
    sortBy: 'updatedAt',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
  });

  const {
    boards,
    total,
    loading,
    error,
    refetch,
    updateBoard,
    deleteBoard,
    archiveBoard,
  } = useBoards(filters);

  const {
    activities,
    loading: activitiesLoading,
  } = useActivities({ 
    userId: user?.id, 
    page: 1, 
    limit: 5 
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      await deleteBoard(id);
    }
  };

  const handleArchive = async (id: string) => {
    await archiveBoard(id);
  };

  const handleStar = async (id: string) => {
    // TODO: Implement star functionality
    console.log('Star board:', id);
  };

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
  };

  const handleSaveEdit = async (id: string | number, data: any) => {
    const result = await updateBoard(id, data);
    if (result) {
      setEditingBoard(null);
    }
    return result;
  };

  const handleCreateSuccess = (board: any) => {
    refetch(); // Refresh the board list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
        <span className="ml-2" style={{ color: theme.colors.text.secondary }}>Loading boards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.error + '10', color: theme.colors.error }}>
        Error loading boards: {error}
        <button 
          onClick={() => refetch()}
          className="ml-2 hover:underline"
          style={{ color: theme.colors.primary }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.default }}>
        <div className="max-w-7xl mx-auto">
          <BoardListHeader
            total={total}
            onCreateClick={() => setShowCreateModal(true)}
          />
        </div>
      </div>

      {/* Fixed Filters */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-4" style={{ backgroundColor: theme.colors.background.default }}>
        <div className="max-w-7xl mx-auto">
          <BoardListFilters
            filters={filters}
            viewMode={viewMode}
            onFilterChange={handleFilterChange}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto px-4 sm:px-6" style={{ backgroundColor: theme.colors.background.default }}>
        <div className="max-w-7xl mx-auto pb-6">
          {/* Board Grid/List */}
          <BoardListContainer
            boards={boards}
            viewMode={viewMode}
            onDelete={handleDelete}
            onStar={handleStar}
            onArchive={handleArchive}
            onEdit={handleEdit}
            onUpdate={updateBoard}
            onCreateClick={() => setShowCreateModal(true)}
          />

          {/* Recent Activity Section */}
          <div className="mt-8 rounded-lg shadow-sm border p-4" style={{ backgroundColor: theme.colors.background.paper }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>Recent Activity</h2>
            {activitiesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: theme.colors.primary }}></div>
              </div>
            ) : activities.length === 0 ? (
              <p className="text-center py-4" style={{ color: theme.colors.text.secondary }}>No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.colors.primary + '20' }}>
                      <span className="font-medium" style={{ color: theme.colors.primary }}>
                        {activity.user.firstName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p style={{ color: theme.colors.text.primary }}>{activity.details.message}</p>
                      <p className="text-xs" style={{ color: theme.colors.text.secondary }}>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Board Modal */}
      {editingBoard && (
        <EditBoardModal
          board={editingBoard}
          isOpen={true}
          onClose={() => setEditingBoard(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default BoardList;
