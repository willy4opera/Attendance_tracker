import React, { useState, useEffect } from 'react';
import groupService from '../../../services/groupService';
import { useNavigate } from 'react-router-dom';
import theme from '../../../config/theme';
import Swal from 'sweetalert2';
import { FaUsers, FaHistory, FaChartLine, FaList, FaTh, FaPlus } from 'react-icons/fa';
import type { Group } from '../../../types';
import CreateGroupModal from './CreateGroupModal';

const GroupDashboard: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalGroups: 0,
    activeGroups: 0,
    totalMembers: 0,
    recentActivity: 0
  });

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupService.getGroups();
      
      // Handle different response structures
      let groupsData: Group[] = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          // If response is directly an array
          groupsData = response;
        } else if (response.groups && Array.isArray(response.groups)) {
          // If response has groups property
          groupsData = response.groups;
        } else if (response.data && Array.isArray(response.data)) {
          // If response has data property
          groupsData = response.data;
        }
      }
      
      setGroups(groupsData);
      
      // Calculate analytics with safe array operations
      const activeGroups = groupsData.filter(g => g?.isActive).length;
      setAnalytics({
        totalGroups: groupsData.length,
        activeGroups,
        totalMembers: 0, // This would need to be fetched from API
        recentActivity: Math.floor(Math.random() * 20) // Mock data
      });
    } catch (err) {
      console.error('Error fetching groups:', err);
      setGroups([]); // Set empty array on error
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load groups. Please try again.',
        icon: 'error',
        confirmButtonColor: theme.colors.error
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupClick = async (group: Group) => {
    const result = await Swal.fire({
      title: `Open ${group.name}?`,
      text: 'You will be redirected to group details page.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: theme.colors.primary,
      cancelButtonColor: theme.colors.error,
      confirmButtonText: 'Yes, open details!',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      navigate(`/admin/groups/${group.id}`);
    }
  };

  const handleCreateGroup = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchGroups(); // Refresh the groups list
    Swal.fire({
      title: 'Success!',
      text: 'Group created successfully.',
      icon: 'success',
      confirmButtonColor: theme.colors.success
    });
  };

  const AnalyticsCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    color: string;
  }) => (
    <div 
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold" style={{ color: theme.colors.secondary }}>
            {value}
          </p>
        </div>
        <div 
          className="p-3 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: theme.colors.primary }}
            >
              Group Dashboard
            </h1>
            <p className="text-gray-600">Manage and monitor your organization's groups</p>
          </div>
          
          {/* Create Group Button */}
          <button
            onClick={handleCreateGroup}
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 hover:shadow-lg transform hover:-translate-y-0.5"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.primary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
              e.currentTarget.style.color = theme.colors.primary;
            }}
          >
            <FaPlus size={16} />
            Create Group
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Total Groups"
            value={analytics.totalGroups}
            icon={FaUsers}
            color={theme.colors.primary}
          />
          <AnalyticsCard
            title="Active Groups"
            value={analytics.activeGroups}
            icon={FaHistory}
            color={theme.colors.success}
          />
          <AnalyticsCard
            title="Total Members"
            value={analytics.totalMembers}
            icon={FaChartLine}
            color={theme.colors.info}
          />
          <AnalyticsCard
            title="Recent Activity"
            value={analytics.recentActivity}
            icon={FaHistory}
            color={theme.colors.warning}
          />
        </div>

        {/* View Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                view === 'list'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: view === 'list' ? theme.colors.primary : 'white'
              }}
              onClick={() => setView('list')}
            >
              <FaList size={16} />
              List View
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                view === 'grid'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: view === 'grid' ? theme.colors.primary : 'white'
              }}
              onClick={() => setView('grid')}
            >
              <FaTh size={16} />
              Grid View
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {groups?.length || 0} {(groups?.length || 0) === 1 ? 'group' : 'groups'}
          </div>
        </div>

        {/* Groups Display */}
        {!groups || groups.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-600 mb-4">Create your first group to get started.</p>
            <button
              onClick={handleCreateGroup}
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 mx-auto hover:shadow-lg"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.secondary,
              }}
            >
              <FaPlus size={16} />
              Create Your First Group
            </button>
          </div>
        ) : (
          <>
            {view === 'list' ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      onClick={() => handleGroupClick(group)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 
                            className="text-lg font-semibold mb-2"
                            style={{ color: theme.colors.secondary }}
                          >
                            {group.name}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {group.description || 'No description available.'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {group.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                            →
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
                    onClick={() => handleGroupClick(group)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: group.color || theme.colors.primary + '20',
                          color: group.color || theme.colors.primary
                        }}
                      >
                        <FaUsers size={20} />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <h3 
                      className="text-lg font-semibold mb-2 line-clamp-2"
                      style={{ color: theme.colors.secondary }}
                    >
                      {group.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {group.description || 'No description available.'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default GroupDashboard;
