import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaFilter, FaTh, FaList, FaBell } from 'react-icons/fa';
import { useBoards } from '../../hooks/useBoards';
import { useActivities } from '../../hooks/useActivities';
import { useAuth } from '../../contexts/useAuth';
import BoardCard from '../../components/boards/BoardCard';
import NotificationBell from '../../components/notifications/NotificationBell';
import type { Board } from '../../types';

const BoardList: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading boards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading boards: {error}
        <button 
          onClick={() => refetch()}
          className="ml-2 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
          <p className="text-gray-600">{total} board{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <Link
            to="/boards/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FaPlus className="h-4 w-4" />
            <span>Create Board</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search boards..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filters.visibility}
            onChange={(e) => handleFilterChange('visibility', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Boards</option>
            <option value="private">Private</option>
            <option value="department">Department</option>
            <option value="organization">Organization</option>
            <option value="public">Public</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FaTh className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FaList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Board Grid/List */}
      {boards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <FaTh className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No boards found</p>
          </div>
          <Link
            to="/boards/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Your First Board
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {boards.map((board) => (
            <BoardCard 
              key={board.id} 
              board={board}
              viewMode={viewMode}
              onDelete={handleDelete}
              onStar={handleStar}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Recent Activity Sidebar */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {activitiesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {activity.user.firstName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{activity.details.message}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardList;
