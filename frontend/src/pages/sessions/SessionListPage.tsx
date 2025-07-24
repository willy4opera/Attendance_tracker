import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import sessionService from '../../services/sessionService';
import type { Session, SessionFilters } from '../../types/session';
import type { SessionStats, SessionFilterType } from '../../components/SessionStats/types';
import { useAuth } from '../../contexts/useAuth';
import { SessionStatsCards, SessionTabs } from '../../components/SessionStats';
import CreateSessionModal from './CreateSessionModal';
import { Toaster, toast } from 'react-hot-toast';
import theme from '../../config/theme';

const SessionListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    attendance: {
      totalAttendees: 0,
      averageAttendance: 0,
      attendanceRate: 0,
    },
    facilitation: {
      sessionsCreated: 0,
      totalParticipants: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SessionFilterType>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canManage = isAdmin || isModerator;

  // Fetch data
  useEffect(() => {
    fetchData();
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("Fetching data for tab:", activeTab);
      
      // Fetch stats first
      const statsResponse = await fetchStats();
      console.log("Stats response:", statsResponse);
      setStats(statsResponse);

      // Then fetch sessions
      const sessionsResponse = await fetchSessions(activeTab);
      console.log("Sessions response:", sessionsResponse);
      setSessions(sessionsResponse.data?.sessions || []);
      
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load sessions data");
    } finally {
      setLoading(false);
    }
  };
  };

  const fetchStats = async () => {
    try {
      console.log("Fetching stats...");
      // Since we dont have a stats endpoint yet, lets calculate from sessions
      const allSessions = await sessionService.getAllSessions({ limit: 1000 });
      console.log("All sessions response:", allSessions);
      const sessionsData = allSessions.data?.sessions || [];
      console.log("Sessions data:", sessionsData);
      
      const calculatedStats = calculateStats(sessionsData);
      console.log("Calculated stats:", calculatedStats);
      return calculatedStats;
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // Return default stats with some mock data for testing
      return {
        total: 10,
        active: 2,
        upcoming: 5,
        completed: 3,
        cancelled: 0,
        attendance: {
          totalAttendees: 150,
          averageAttendance: 15,
          attendanceRate: 75,
        },
        facilitation: {
          sessionsCreated: 5,
          totalParticipants: 50,
        }
      };
    }
  };
          totalAttendees: 0,
          averageAttendance: 0,
          attendanceRate: 0,
        },
        facilitation: {
          sessionsCreated: 0,
          totalParticipants: 0,
        }
      };
    }
  };

  const fetchSessions = async (filter: SessionFilterType) => {
    const filters: SessionFilters = { 
      limit: 50,
      page: 1 
    };

    if (filter !== 'all') {
      // Map filter to status
      const statusMap = {
        active: 'ongoing',
        upcoming: 'scheduled', 
        completed: 'completed'
      };
      filters.status = statusMap[filter as keyof typeof statusMap] as any;
    }

    return await sessionService.getAllSessions(filters);
  };

  const calculateStats = (sessions: Session[]): SessionStats => {
    const now = new Date();
    
    const sessionsByStatus = sessions.reduce((acc, session) => {
      const status = sessionService.getSessionStatus(session);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalAttendees = sessions.reduce((sum, session) => sum + (session.totalAttendance || 0), 0);
    const averageAttendance = sessions.length > 0 ? totalAttendees / sessions.length : 0;
    
    // Calculate attendance rate (assuming max attendees info is available)
    const totalCapacity = sessions.reduce((sum, session) => sum + (session.maxAttendees || 0), 0);
    const attendanceRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0;

    // Facilitation stats (for admins)
    const facilitatedSessions = sessions.filter(session => 
      session.facilitatorId === user?.id
    );

    return {
      total: sessions.length,
      active: sessionsByStatus.ongoing || 0,
      upcoming: sessionsByStatus.scheduled || 0,
      completed: sessionsByStatus.completed || 0,
      cancelled: sessionsByStatus.cancelled || 0,
      attendance: {
        totalAttendees,
        averageAttendance,
        attendanceRate,
      },
      facilitation: canManage ? {
        sessionsCreated: facilitatedSessions.length,
        totalParticipants: facilitatedSessions.reduce((sum, session) => 
          sum + (session.totalAttendance || 0), 0
        ),
      } : undefined
    };
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as SessionFilterType);
  };

  const handleCreateSuccess = () => {
    fetchData(); // Refresh data after creating a session
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fddc9a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sessions</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and track your training sessions
            </p>
          </div>
          
          {canManage && (
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#fddc9a] hover:bg-black transition-colors"
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
                <PlusIcon className="h-4 w-4 mr-2" />
                New Session
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <SessionStatsCards stats={stats} isAdmin={canManage} />

        {/* Tabs */}
        <SessionTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          stats={stats} 
        />

        {/* Sessions List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1v11a2 2 0 002 2h4a2 2 0 002-2V8l-1-1" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' 
                  ? "Get started by creating your first session."
                  : `No ${activeTab} sessions available.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendees
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const status = sessionService.getSessionStatus(session);
                    const statusClasses = {
                      scheduled: 'bg-blue-100 text-blue-800',
                      ongoing: 'bg-green-100 text-green-800',
                      completed: 'bg-gray-100 text-gray-800',
                      cancelled: 'bg-red-100 text-red-800',
                    };

                    return (
                      <tr key={session.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {session.title}
                            </div>
                            <div className="text-sm text-gray-500 sm:hidden">
                              {formatDate(session.sessionDate)} • {sessionService.formatTime(session.startTime)}
                            </div>
                            {session.location && (
                              <div className="text-xs text-gray-400 truncate max-w-xs">
                                {session.location}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{formatDate(session.sessionDate)}</div>
                          <div className="text-gray-500">
                            {sessionService.formatTime(session.startTime)} - {sessionService.formatTime(session.endTime)}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.totalAttendance || 0} / {session.maxAttendees || '∞'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {canManage && (
        <CreateSessionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default SessionListPage;
