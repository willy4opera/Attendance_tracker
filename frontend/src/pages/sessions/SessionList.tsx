import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  VideoCameraIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { Session } from '../../types/session';
import type { SessionStats, SessionFilterType } from '../../components/SessionStats/types';
import sessionService from '../../services/sessionService';
import { useAuth } from '../../contexts/useAuth';
import { Toaster, toast } from 'react-hot-toast';
import { SessionStatsCards, SessionTabs } from '../../components/SessionStats';
import CreateSessionModal from './CreateSessionModal';

interface SessionListProps {
  sessions?: Session[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const SessionList: React.FC<SessionListProps> = ({ 
  sessions = [], 
  loading = false, 
  error = null,
  onRefresh 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
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

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canManageSessions = isAdmin || isModerator;

  // Calculate stats from sessions
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const calculatedStats = calculateStats(sessions);
      setStats(calculatedStats);
    }
  }, [sessions, user]);

  const calculateStats = (sessionList: Session[]): SessionStats => {
    const now = new Date();
    
    const sessionsByStatus = sessionList.reduce((acc, session) => {
      const status = sessionService.getSessionStatus(session);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalAttendees = sessionList.reduce((sum, session) => sum + (session.totalAttendance || 0), 0);
    const averageAttendance = sessionList.length > 0 ? totalAttendees / sessionList.length : 0;
    
    // Calculate attendance rate (assuming max attendees info is available)
    const totalCapacity = sessionList.reduce((sum, session) => sum + (session.maxAttendees || 0), 0);
    const attendanceRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0;

    // Facilitation stats (for admins/moderators)
    const facilitatedSessions = sessionList.filter(session => 
      session.facilitatorId === user?.id
    );

    return {
      total: sessionList.length,
      active: sessionsByStatus.ongoing || 0,
      upcoming: sessionsByStatus.scheduled || 0,
      completed: sessionsByStatus.completed || 0,
      cancelled: sessionsByStatus.cancelled || 0,
      attendance: {
        totalAttendees,
        averageAttendance,
        attendanceRate,
      },
      facilitation: canManageSessions ? {
        sessionsCreated: facilitatedSessions.length,
        totalParticipants: facilitatedSessions.reduce((sum, session) => 
          sum + (session.totalAttendance || 0), 0
        ),
      } : undefined
    };
  };

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const status = sessionService.getSessionStatus(session);
    return matchesSearch && status === statusFilter;
  });

  const handleTabChange = (tab: string) => {
    setStatusFilter(tab);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.completed}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await sessionService.deleteSession(sessionId);
      toast.success('Session deleted successfully');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const handleCopyLink = async (sessionId: string) => {
    try {
      const link = await sessionService.getAttendanceLink(sessionId);
      await navigator.clipboard.writeText(link);
      setCopiedLink(sessionId);
      toast.success('Attendance link copied to clipboard!');
      
      setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy attendance link');
    }
  };

  const SessionCard = ({ session }: { session: Session }) => {
    const status = sessionService.getSessionStatus(session);
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 text-left leading-tight break-words pr-2">
                {session.title}
              </h3>
              {getStatusBadge(status)}
            </div>
          </div>

          {session.description && (
            <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 text-left break-words">
              {session.description}
            </p>
          )}

          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-500">
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">{new Date(session.sessionDate).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center text-xs sm:text-sm text-gray-500">
              <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">{sessionService.formatTime(session.startTime)} - {sessionService.formatTime(session.endTime)}</span>
            </div>

            {session.meetingType && (
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                {session.meetingType === 'online' ? (
                  <VideoCameraIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                ) : (
                  <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                )}
                <span className="capitalize truncate">{session.meetingType}</span>
              </div>
            )}

            <div className="flex items-center text-xs sm:text-sm text-gray-500">
              <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span>{session.totalAttendance || 0} attendees</span>
            </div>
          </div>

          {session.tags && session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
              {session.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[#fddc9a] text-black"
                >
                  {tag}
                </span>
              ))}
              {session.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{session.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-200">
            <Link
              to={`/sessions/${session.id}`}
              className="flex-1 flex items-center justify-center px-2 py-1.5 text-xs border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 min-w-0"
            >
              <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="hidden xs:inline">View</span>
            </Link>

            <button
              onClick={() => handleCopyLink(session.id)}
              className="flex items-center justify-center px-2 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {copiedLink === session.id ? (
                <CheckIcon className="h-3 w-3 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="h-3 w-3" />
              )}
            </button>

            {canManageSessions && (
              <>
                <Link
                  to={`/sessions/${session.id}/edit`}
                  className="flex items-center justify-center px-2 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-3 w-3" />
                </Link>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="flex items-center justify-center px-2 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced mobile-optimized row for very small screens
  const MobileSessionRow = ({ session }: { session: Session }) => {
    const status = sessionService.getSessionStatus(session);
    
    return (
      <div className="p-4 border-b border-gray-100 bg-white hover:bg-gray-50">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="font-medium text-gray-900 text-sm leading-tight break-words">
              {session.title}
            </h3>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
              <span>{new Date(session.sessionDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>{sessionService.formatTime(session.startTime)}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusBadge(status)}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <UserGroupIcon className="h-3 w-3 mr-1" />
            <span>{session.totalAttendance || 0}</span>
            {session.meetingType && (
              <>
                <span className="mx-1">•</span>
                <span className="capitalize">{session.meetingType}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/sessions/${session.id}`}
              className="text-[#fddc9a] hover:text-[#000000] p-1"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleCopyLink(session.id)}
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              {copiedLink === session.id ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" />
              )}
            </button>
            {canManageSessions && (
              <>
                <Link
                  to={`/sessions/${session.id}/edit`}
                  className="text-[#fddc9a] hover:text-[#000000] p-1"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SessionRow = ({ session }: { session: Session }) => {
    const status = sessionService.getSessionStatus(session);
    
    return (
      <tr className="hover:bg-gray-50 border-b border-gray-100">
        {/* Title column - always visible, more space on mobile */}
        <td className="py-3 px-2 sm:px-4 text-left" style={{ maxWidth: '200px', minWidth: '150px' }}>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 text-sm leading-tight break-words" title={session.title}>
              {session.title}
            </div>
            {session.description && (
              <div className="text-xs text-gray-500 line-clamp-1 mt-1 break-words" title={session.description}>
                {session.description}
              </div>
            )}
          </div>
        </td>

        {/* Date & Time column - hidden on very small screens, show on sm+ */}
        <td className="hidden sm:table-cell py-3 px-2 sm:px-4 text-left" style={{ minWidth: '120px' }}>
          <div className="text-sm text-gray-900 whitespace-nowrap">
            {new Date(session.sessionDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
            {sessionService.formatTime(session.startTime)} - {sessionService.formatTime(session.endTime)}
          </div>
        </td>

        {/* Meeting Type column - hidden on small screens, show on md+ */}
        <td className="hidden md:table-cell py-3 px-2 sm:px-4 text-left" style={{ minWidth: '80px' }}>
          <div className="text-sm text-gray-900 capitalize truncate">
            {session.meetingType || 'N/A'}
          </div>
        </td>

        {/* Attendees column - show on mobile but as combined status cell */}
        <td className="py-3 px-2 sm:px-4 text-left sm:text-center" style={{ minWidth: '60px' }}>
          {/* Mobile: Show attendees and status together */}
          <div className="sm:hidden">
            <div className="text-sm text-gray-900 mb-1">
              {session.totalAttendance || 0} attendees
            </div>
            {getStatusBadge(status)}
          </div>
          {/* Desktop: Show only attendees */}
          <div className="hidden sm:block text-sm text-gray-900">
            {session.totalAttendance || 0}
          </div>
        </td>

        {/* Status column - hidden on mobile, show on sm+ */}
        <td className="hidden sm:table-cell py-3 px-2 sm:px-4 text-left" style={{ minWidth: '100px' }}>
          {getStatusBadge(status)}
        </td>

        {/* Actions column - always visible but compact on mobile */}
        <td className="py-3 px-2 sm:px-4 text-right" style={{ minWidth: '80px' }}>
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/sessions/${session.id}`}
              className="text-[#fddc9a] hover:text-[#000000] p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title="View Session"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleCopyLink(session.id)}
              className="text-gray-600 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title="Copy Link"
            >
              {copiedLink === session.id ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" />
              )}
            </button>
            {canManageSessions && (
              <>
                <Link
                  to={`/sessions/${session.id}/edit`}
                  className="text-[#fddc9a] hover:text-[#000000] p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title="Edit Session"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="text-red-600 hover:text-red-900 p-1.5 rounded-md hover:bg-red-100 transition-colors"
                  title="Delete Session"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <Toaster position="top-right" />
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Sessions</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-700 break-words">
                Manage and track all your sessions
              </p>
            </div>
            {canManageSessions && (
              <div className="flex-shrink-0">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-[#fddc9a] bg-black hover:text-black hover:bg-[#fddc9a] transition-colors duration-200"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Create </span>Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-4 sm:mb-6">
          <SessionStatsCards stats={stats} isAdmin={canManageSessions} />
        </div>

        {/* Session Tabs */}
        <div className="mb-4 sm:mb-6">
          <SessionTabs 
            activeTab={statusFilter as SessionFilterType} 
            onTabChange={handleTabChange} 
            stats={stats} 
          />
        </div>

        {/* Search and View Controls */}
        <div className="mb-4 sm:mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-8 sm:pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#fddc9a] focus:border-[#fddc9a]"
                  placeholder="Search sessions..."
                />
              </div>
            </div>
            
            <div className="flex justify-center sm:justify-end">
              <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Content */}
        {loading ? (
          <div className="flex justify-center items-center h-32 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#fddc9a]"></div>
          </div>
        ) : sessions && sessions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 lg:py-12 bg-white rounded-lg shadow-sm">
            <CalendarIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 px-4">
              Get started by creating a new session.
            </p>
            {canManageSessions && (
              <div className="mt-4 sm:mt-6">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-[#fddc9a] bg-black hover:text-black hover:bg-[#fddc9a] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fddc9a]"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Create Session
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {filteredSessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="w-full">
            {/* Mobile List View - Compact rows for very small screens */}
            <div className="sm:hidden bg-white rounded-lg shadow-sm overflow-hidden">
              {filteredSessions.map(session => (
                <MobileSessionRow key={session.id} session={session} />
              ))}
            </div>

            {/* Desktop/Tablet List View - Responsive table for larger screens */}
            <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '600px' }}>
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4" 
                          style={{ minWidth: '150px' }}>
                        Session
                      </th>
                      <th className="hidden sm:table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4"
                          style={{ minWidth: '120px' }}>
                        Date & Time
                      </th>
                      <th className="hidden md:table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4"
                          style={{ minWidth: '80px' }}>
                        Type
                      </th>
                      <th className="text-left sm:text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4"
                          style={{ minWidth: '60px' }}>
                        <span className="sm:hidden">Details</span>
                        <span className="hidden sm:inline">Attendees</span>
                      </th>
                      <th className="hidden sm:table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4"
                          style={{ minWidth: '100px' }}>
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-2 sm:px-4"
                          style={{ minWidth: '80px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredSessions.map(session => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && filteredSessions.length === 0 && sessions.length > 0 && (
          <div className="text-center py-6 sm:py-8 lg:py-12 bg-white rounded-lg shadow-sm">
            <MagnifyingGlassIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 px-4">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    
      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          onRefresh?.();
        }}
      />
    </div>
  );
};

export default SessionList;
