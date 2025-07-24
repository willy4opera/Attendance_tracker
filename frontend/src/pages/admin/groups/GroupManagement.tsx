import React, { useState, useEffect, useCallback } from 'react';
import { 
  AiOutlinePlus, 
  AiOutlineSearch, 
  AiOutlineEdit, 
  AiOutlineDelete,
  AiOutlineEye,
  AiOutlineUserAdd,
  AiOutlineTeam,
  AiOutlineFilter
} from 'react-icons/ai';
import { FaUsers, FaUserShield } from 'react-icons/fa';

import groupService from '../../../services/groupService';
import type { Group, GroupWithStats, GroupFilters, GroupMemberRole } from '../../../types';
import { useAuth } from '../../../contexts/useAuth';
import theme from '../../../config/theme';
import notify from '../../../utils/notifications';
import CreateGroupModal from './CreateGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupDetailsModal from './GroupDetailsModal';
import AssignAdminModal from './AssignAdminModal';

interface GroupManagementProps {}

const GroupManagement: React.FC<GroupManagementProps> = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);

  // Filter and pagination states
  const [filters, setFilters] = useState<GroupFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private' | 'invite-only'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);

  // Load groups
  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filterParams: GroupFilters = {
        ...filters,
        search: searchQuery || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      };

      if (visibilityFilter !== 'all') {
        filterParams.sortBy = visibilityFilter as any;
      }

      const response = await groupService.getAllGroupsForAdmin(filterParams);
      setGroups(response.groups as GroupWithStats[]);
      setTotalPages(response.totalPages);
      setTotalGroups(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load groups';
      setError(errorMessage);
      notify.error('Failed to load groups');
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, statusFilter, visibilityFilter]);

  // Load groups on component mount and filter changes
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  // Filter handlers
  const handleStatusFilter = (status: typeof statusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleVisibilityFilter = (visibility: typeof visibilityFilter) => {
    setVisibilityFilter(visibility);
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  };

  // Group action handlers
  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setShowCreateModal(true);
  };

  const handleEditGroup = (group: GroupWithStats) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  const handleViewGroup = (group: GroupWithStats) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  const handleAssignAdmin = (group: GroupWithStats) => {
    setSelectedGroup(group);
    setShowAssignAdminModal(true);
  };

  const handleDeleteGroup = async (group: GroupWithStats) => {
    if (!window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await groupService.deleteGroup(group.id);
      notify.success('Group deleted successfully');
      loadGroups();
    } catch (err) {
      notify.error('Failed to delete group');
      console.error('Error deleting group:', err);
    }
  };

  // Modal close handlers
  const handleModalClose = (shouldRefresh = false) => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowAssignAdminModal(false);
    setSelectedGroup(null);
    
    if (shouldRefresh) {
      loadGroups();
    }
  };

  const renderGroupCard = (group: GroupWithStats) => (
    <div 
      key={group.id} 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
      style={{ borderColor: theme.colors.primary + '20' }}
    >
      {/* Group Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: group.color || theme.colors.primary,
                color: theme.colors.secondary 
              }}
            >
              <FaUsers className="text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{group.name}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {group.description || 'No description provided'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                group.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {group.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Group Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
              {group.stats?.totalMembers || group.membersCount || 0}
            </div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
              {group.stats?.admins || group.adminsCount || 0}
            </div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
              {group.stats?.activeMembers || 0}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>

        {/* Group Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewGroup(group)}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
              style={{ 
                backgroundColor: 'transparent',
                color: theme.colors.secondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              title="View Details"
            >
              <AiOutlineEye className="text-lg" />
            </button>
            <button
              onClick={() => handleAssignAdmin(group)}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
              style={{ 
                backgroundColor: 'transparent',
                color: theme.colors.secondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              title="Assign Admin"
            >
              <FaUserShield className="text-lg" />
            </button>
            <button
              onClick={() => handleEditGroup(group)}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
              style={{ 
                backgroundColor: 'transparent',
                color: theme.colors.secondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              title="Edit Group"
            >
              <AiOutlineEdit className="text-lg" />
            </button>
            <button
              onClick={() => handleDeleteGroup(group)}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-red-50 text-red-600"
              title="Delete Group"
            >
              <AiOutlineDelete className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Group Management</h1>
            <p className="text-gray-600 mt-1">Manage groups, members, and permissions</p>
          </div>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            style={{ 
              backgroundColor: theme.colors.primary,
              color: theme.colors.secondary 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
              e.currentTarget.style.color = theme.colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = theme.colors.secondary;
            }}
          >
            <AiOutlinePlus className="text-lg" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:outline-none"
              style={{ 
                borderColor: theme.colors.primary,
                focusRingColor: theme.colors.primary + '50'
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: theme.colors.primary }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => handleVisibilityFilter(e.target.value as typeof visibilityFilter)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
            style={{ borderColor: theme.colors.primary }}
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="invite-only">Invite Only</option>
          </select>

          {/* Results Info */}
          <div className="flex items-center text-sm text-gray-600">
            <AiOutlineFilter className="mr-2" />
            {totalGroups} group{totalGroups !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      {error ? (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadGroups}
            className="px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: theme.colors.primary,
              color: theme.colors.secondary 
            }}
          >
            Try Again
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12">
          <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No groups found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || visibilityFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Get started by creating your first group.'}
          </p>
          {!searchQuery && statusFilter === 'all' && visibilityFilter === 'all' && (
            <button
              onClick={handleCreateGroup}
              className="px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: theme.colors.secondary 
              }}
            >
              Create Group
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(renderGroupCard)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                        currentPage === page
                          ? 'font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                      style={currentPage === page ? {
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.secondary
                      } : {}}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => handleModalClose(true)}
        />
      )}

      {showEditModal && selectedGroup && (
        <EditGroupModal
          isOpen={showEditModal}
          group={selectedGroup}
          onClose={() => handleModalClose(true)}
        />
      )}

      {showDetailsModal && selectedGroup && (
        <GroupDetailsModal
          isOpen={showDetailsModal}
          group={selectedGroup}
          onClose={() => handleModalClose()}
        />
      )}

      {showAssignAdminModal && selectedGroup && (
        <AssignAdminModal
          isOpen={showAssignAdminModal}
          group={selectedGroup}
          onClose={() => handleModalClose(true)}
        />
      )}
    </div>
  );
};

export default GroupManagement;
