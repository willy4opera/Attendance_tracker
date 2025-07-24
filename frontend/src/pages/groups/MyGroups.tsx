import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaSearch, 
  FaList,
  FaUserFriends,
  FaPlus,
  FaTh
} from 'react-icons/fa';
import { AiOutlineTeam } from 'react-icons/ai';

import userGroupService from '../../services/userGroupService';
// import { useAuth } from '../../contexts/useAuth';
import theme from '../../config/theme';
import notify from '../../utils/notifications';
import type { Group } from '../../types';
import GroupCard from '../../components/groups/GroupCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MyGroups: React.FC = () => {
  const navigate = useNavigate();
  // const { } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View and filter states
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Filtered groups
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  // Fetch user's groups
  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userGroups = await userGroupService.getUserGroups();
      console.log('Fetched groups:', userGroups); // Debug log
      
      // Ensure userGroups is an array
      const groupsArray = Array.isArray(userGroups) ? userGroups : [];
      setGroups(groupsArray);
      setFilteredGroups(groupsArray);
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setError('Failed to load your groups');
      notify.toast.error('Failed to load your groups');
      // Set empty arrays to prevent filter errors
      setGroups([]);
      setFilteredGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter groups based on search and filters
  useEffect(() => {
    // Ensure groups is an array before filtering
    if (!Array.isArray(groups)) {
      setFilteredGroups([]);
      return;
    }

    let filtered = groups;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(group => 
        group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter (would need member role info from API)
    if (roleFilter !== 'all') {
      // This would require additional API data about user's role in each group
      // For now, we'll keep all groups
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => 
        statusFilter === 'active' ? group.isActive : !group.isActive
      );
    }

    setFilteredGroups(filtered);
  }, [groups, searchQuery, roleFilter, statusFilter]);

  // Load groups on mount
  useEffect(() => {
    fetchMyGroups();
  }, []);

  // Handle group navigation
  const handleGroupClick = (groupId: string | number) => {
    navigate(`/groups/${groupId}`);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Get summary stats - ensure groups is an array
  const stats = {
    total: Array.isArray(groups) ? groups.length : 0,
    active: Array.isArray(groups) ? groups.filter(g => g.isActive).length : 0,
    totalMembers: Array.isArray(groups) ? groups.reduce((sum, g) => sum + ((g as Group & { membersCount?: number }).membersCount || 0), 0) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
              <p className="text-gray-600 mt-1">
                Groups you're a member of ({stats.total} total)
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded-lg border overflow-hidden">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    view === 'grid'
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={view === 'grid' ? {
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.primary
                  } : {}}
                >
                  <FaTh className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    view === 'list'
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={view === 'list' ? {
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.primary
                  } : {}}
                >
                  <FaList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-100">
                  <FaUsers className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <AiOutlineTeam className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <FaUserFriends className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'member')}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Groups Display */}
        {error ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Groups</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchMyGroups}
              className="px-4 py-2 rounded-lg transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {groups.length === 0 ? 'No Groups Yet' : 'No Groups Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {groups.length === 0 
                ? "You're not a member of any groups yet."
                : 'Try adjusting your search or filters.'
              }
            </p>
            {groups.length === 0 && (
              <button
                onClick={() => navigate('/admin/groups')}
                className="px-4 py-2 rounded-lg transition-colors hover:opacity-90 inline-flex items-center gap-2"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.primary
                }}
              >
                <FaPlus className="w-4 h-4" />
                Browse Groups
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${
            view === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                view={view}
                onClick={() => handleGroupClick(group.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGroups;
