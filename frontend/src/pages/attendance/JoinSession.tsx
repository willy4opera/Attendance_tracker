import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ExternalLink, X } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import type { AttendanceRecord } from '../../services/attendanceService';

const JoinSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const markAttendance = async () => {
      if (!sessionId || !token) {
        setError('Invalid attendance link');
        setLoading(false);
        return;
      }

      try {
        const record = await attendanceService.markAttendanceViaLink(sessionId, token);
        setAttendanceRecord(record);
        setSuccess(true);
        
        // Extract meeting link from session or response
        const link = record.session?.meetingLink || 
                    (record as any).meetingLink || 
                    (record as any).metadata?.meetingLink;
        
        if (link) {
          setMeetingLink(link);
          setShowModal(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to mark attendance');
      } finally {
        setLoading(false);
      }
    };

    markAttendance();
  }, [sessionId, token]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (showModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showModal && countdown === 0 && meetingLink) {
      window.location.href = meetingLink;
    }
  }, [showModal, countdown, meetingLink]);

  const handleJoinNow = () => {
    if (meetingLink) {
      window.location.href = meetingLink;
    }
  };

  const handleCancelRedirect = () => {
    setShowModal(false);
    setCountdown(5); // Reset countdown
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            Marking your attendance...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {success ? (
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Attendance Marked!
            </h1>
            <p className="text-gray-600 mb-6">
              Your attendance has been successfully recorded.
            </p>
            
            {attendanceRecord && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-700">Session:</span>{' '}
                    <span className="text-gray-600">
                      {attendanceRecord.session?.title || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Date:</span>{' '}
                    <span className="text-gray-600">
                      {new Date(attendanceRecord.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>{' '}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      attendanceRecord.status === 'present' 
                        ? 'bg-green-100 text-green-800'
                        : attendanceRecord.status === 'late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {attendanceRecord.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Attendance Failed
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">
                {error || 'An unknown error occurred'}
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>

      {/* Modal for meeting redirect */}
      {showModal && meetingLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={handleCancelRedirect}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <ExternalLink className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Ready to Join Meeting?
              </h2>
              <p className="text-gray-600 mb-4">
                Your attendance has been marked. You will be redirected to the meeting.
              </p>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {countdown}
                </div>
                <p className="text-sm text-gray-500">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleJoinNow}
                  className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Now
                </button>
                <button
                  onClick={handleCancelRedirect}
                  className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                You will be redirected to: {new URL(meetingLink).hostname}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinSession;
