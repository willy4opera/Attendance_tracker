import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  TagIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  VideoCameraIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  PaperClipIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import sessionService from '../../services/sessionService';
import attendanceService from '../../services/attendanceService';
import { useAuth } from '../../contexts/useAuth';
import type { Session } from '../../types/session';
import type { Attendance } from '../../types/attendance';
import { Toaster, toast } from 'react-hot-toast';
import theme from '../../config/theme';
import EditSessionModal from './EditSessionModal';
import { FileViewerModal } from "../../components/FileViewer";

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canManage = isAdmin || isModerator;

  useEffect(() => {
    if (id) {
      fetchSessionDetails();
    }
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const sessionData = await sessionService.getSessionById(id!);
      setSession(sessionData);
      
      if (canManage) {
        try {
          const attendanceData = await attendanceService.getSessionAttendance(id!);
          setAttendances(attendanceData);
        } catch (error) {
          console.error('Failed to fetch attendance:', error);
        }
      }
    } catch (error) {
      toast.error('Failed to load session details');
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await sessionService.deleteSession(id!);
      toast.success('Session deleted successfully');
      navigate('/sessions');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = await sessionService.getAttendanceLink(id!);
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Attendance link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error('Failed to copy attendance link');
    }
  };

  const handleFileView = (file: any) => {
    setSelectedFile(file);
    setIsFileViewerOpen(true);
  };

  const handleFileDownload = async (file: any, index: number) => {
    try {
      console.log(`Starting download for file: ${file.name || file.originalName || file.filename}`);
      console.log(`File URL: ${file.url}`);
      
      if (!file.url) {
        throw new Error("File URL is missing");
      }

      let downloadUrl = file.url;
      if (file.url.startsWith("/")) {
        downloadUrl = `${window.location.origin}${file.url}`;
      }
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name || file.originalName || file.filename || `file-${index}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Download initiated successfully for: ${link.download}`);
      toast.success(`Starting download: ${link.download}`);
      
    } catch (error: any) {
      console.error("Download failed:", error);
      console.error("File object:", file);
      toast.error(`Failed to download file: ${error.message || "Unknown error"}`);
    }
  };

  const handleEditModalSuccess = () => {
    fetchSessionDetails();
  };

  const getStatusBadge = () => {
    if (!session) return null;
    const status = sessionService.getSessionStatus(session);
    const statusClasses = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs sm:text-sm font-medium rounded-full ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fddc9a]"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Session not found</h2>
        <Link to="/sessions" className="mt-4 text-[#fddc9a] hover:text-black">
          Back to sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <Toaster position="top-right" />
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/sessions')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          <span className="text-sm sm:text-base">Back to sessions</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div 
            className="relative p-4 sm:p-6 lg:p-8"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)`
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 opacity-10">
              <CalendarIcon className="w-full h-full" style={{ color: theme.colors.primary }} />
            </div>
            
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3" style={{ color: theme.colors.primary }}>
                    {session.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    {getStatusBadge()}
                    {session.tags && session.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs sm:text-sm bg-[#fddc9a] bg-opacity-20 text-[#fddc9a] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {canManage && (
                  <div className="flex flex-row sm:flex-col lg:flex-row gap-2 sm:gap-2 lg:gap-2">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex-1 sm:flex-none p-2 sm:p-2.5 bg-[#fddc9a] text-black rounded-lg hover:bg-black hover:text-[#fddc9a] transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 sm:flex-none p-2 sm:p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        {new Date(session.sessionDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        {sessionService.formatTime(session.startTime)} - {sessionService.formatTime(session.endTime)}
                      </span>
                    </div>

                    {session.meetingType && (
                      <div className="flex items-center text-gray-600">
                        {session.meetingType === 'online' ? (
                          <VideoCameraIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-gray-400 flex-shrink-0" />
                        ) : (
                          <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm sm:text-base capitalize">{session.meetingType}</span>
                      </div>
                    )}

                    {session.location && (
                      <div className="flex items-start text-gray-600">
                        <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm sm:text-base break-words">{session.location}</span>
                      </div>
                    )}

                    {session.meetingLink && (
                      <div className="flex items-start text-gray-600">
                        <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                        <a 
                          href={session.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm sm:text-base text-[#fddc9a] hover:text-black transition-colors break-words"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}

                    <div className="flex items-center text-gray-600">
                      <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        {session.totalAttendance || 0} / {session.maxAttendees || '∞'} attendees
                      </span>
                    </div>
                  </div>
                </div>

                {session.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm sm:text-base text-gray-600 whitespace-pre-wrap break-words">
                      {session.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center px-4 py-3 bg-[#fddc9a] text-black rounded-lg hover:bg-black hover:text-[#fddc9a] transition-colors text-sm sm:text-base"
                    >
                      {copiedLink ? (
                        <>
                          <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Copy Attendance Link
                        </>
                      )}
                    </button>

                    {canManage && (
                      <Link
                        to={`/attendance/sessions/${id}`}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                      >
                        <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        View Attendance
                      </Link>
                    )}
                  </div>
                </div>

                {/* Files Section */}
                {session.files && session.files.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Attachments ({session.files.length})
                    </h3>
                    <ul className="space-y-4">
                      {session.files.map((file, index) => (
                        <li key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start mb-3">
                            <PaperClipIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 break-all pr-2">
                                {file.name || file.originalName || file.filename || "Unknown file"}
                              </h4>
                            </div>
                          </div>
                          
                          <div className="mb-3 ml-6 sm:ml-8">
                            <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                              {file.size && (
                                <div>
                                  <span className="font-medium">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              )}
                              {file.mimeType && (
                                <div>
                                  <span className="font-medium">Type:</span> {file.mimeType.split("/")[1]?.toUpperCase() || file.mimeType}
                                </div>
                              )}
                              {file.uploadedAt && (
                                <div>
                                  <span className="font-medium">Uploaded:</span> {new Date(file.uploadedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                              onClick={() => handleFileView(file)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            >
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View
                            </button>
                            <button
                              onClick={() => handleFileDownload(file, index)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border transition-colors"
                              style={{
                                backgroundColor: theme.colors.primary,
                                borderColor: theme.colors.primary,
                                color: theme.colors.secondary
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.secondary;
                                e.currentTarget.style.borderColor = theme.colors.secondary;
                                e.currentTarget.style.color = theme.colors.primary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.primary;
                                e.currentTarget.style.borderColor = theme.colors.primary;
                                e.currentTarget.style.color = theme.colors.secondary;
                              }}
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                              Download
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Attendance Preview for Admin/Moderator */}
                {canManage && attendances.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Attendees ({attendances.length})
                    </h3>
                    <div className="space-y-2">
                      {attendances.slice(0, 5).map((attendance) => (
                        <div key={attendance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="h-8 w-8 bg-[#fddc9a] rounded-full flex items-center justify-center text-black font-semibold text-sm flex-shrink-0">
                              {attendance.user?.firstName?.[0]}{attendance.user?.lastName?.[0]}
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attendance.user?.firstName} {attendance.user?.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{attendance.user?.email}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                            attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                            attendance.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {attendance.status}
                          </span>
                        </div>
                      ))}
                      {attendances.length > 5 && (
                        <Link
                          to={`/attendance/sessions/${id}`}
                          className="block text-center text-sm text-[#fddc9a] hover:text-black transition-colors pt-2"
                        >
                          View all {attendances.length} attendees →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Session Modal */}
      {canManage && (
        <EditSessionModal
          isOpen={isEditModalOpen}
          sessionId={id!}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditModalSuccess}
        />
      )}

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={isFileViewerOpen}
        onClose={() => setIsFileViewerOpen(false)}
        file={selectedFile}
      />
    </div>
  );
};

export default SessionDetails;
