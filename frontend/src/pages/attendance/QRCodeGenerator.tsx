import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  QrCodeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import attendanceService from '../../services/attendanceService';
import sessionService from '../../services/sessionService';
import toast from 'react-hot-toast';
import type { Session } from '../../types/session';

const QRCodeGenerator: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [attendanceLink, setAttendanceLink] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
    } else {
      navigate('/attendance/sessions');
    }
  }, [sessionId]);

  const loadSessionDetails = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      // Load session details from session service
      const sessionData = await sessionService.getSessionById(sessionId);
      setSession(sessionData.data?.session || sessionData);
    } catch (error) {
      toast.error('Failed to load session details');
      navigate('/attendance/sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!sessionId) return;

    setIsGenerating(true);
    try {
      // Generate attendance link using attendance service
      const response = await attendanceService.generateAttendanceLink(sessionId);
      const backendUrl = response.data.attendanceUrl;
      
      // Create frontend URL
      const urlParams = new URLSearchParams(backendUrl.split('?')[1]);
      const token = urlParams.get('token');
      const frontendUrl = `${window.location.origin}/attendance/join/${sessionId}?token=${token}`;
      
      setAttendanceLink(frontendUrl);
      setExpiresAt(response.data.expiresAt);
      
      // Generate QR code URL using a QR code service
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(frontendUrl)}`;
      setQrCodeUrl(qrUrl);
      
      toast.success('QR code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateQRCode = async () => {
    await generateQRCode();
  };

  const copyToClipboard = async () => {
    if (attendanceLink) {
      try {
        await navigator.clipboard.writeText(attendanceLink);
        setCopied(true);
        toast.success('Link copied to clipboard!', { icon: '📋' });
        setTimeout(() => setCopied(false), 3000);
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qr-code-${session?.title || 'session'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded!');
    }
  };

  const isSessionActive = () => {
    if (!session) return false;
    
    const now = new Date();
    const sessionStart = new Date(`${session.sessionDate}T${session.startTime}`);
    const sessionEnd = new Date(`${session.sessionDate}T${session.endTime}`);
    
    return now >= sessionStart && now <= sessionEnd;
  };

  const getSessionStatus = () => {
    if (!session) return { text: 'Unknown', color: 'gray' };
    
    const now = new Date();
    const sessionStart = new Date(`${session.sessionDate}T${session.startTime}`);
    const sessionEnd = new Date(`${session.sessionDate}T${session.endTime}`);
    
    if (now < sessionStart) {
      return { text: 'Upcoming', color: 'blue' };
    } else if (now >= sessionStart && now <= sessionEnd) {
      return { text: 'Live Now', color: 'green' };
    } else {
      return { text: 'Ended', color: 'gray' };
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#be8533]"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Session not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested session could not be loaded.</p>
        <button
          onClick={() => navigate('/attendance/sessions')}
          className="mt-4 bg-[#be8533] text-white px-4 py-2 rounded-md hover:bg-[#a06b1f] transition-colors"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  const status = getSessionStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status.color === 'green' ? 'bg-green-100 text-green-800' :
                status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status.color === 'green' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>}
                {status.text}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>{new Date(session.sessionDate).toLocaleDateString()}</p>
              <p>{formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
              {session.meetingLink && (
                <p className="mt-1">
                  <a 
                    href={session.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#be8533] hover:text-[#a06b1f] underline"
                  >
                    Meeting Link
                  </a>
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/attendance/sessions')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h2>
          
          {qrCodeUrl ? (
            <div className="text-center">
              <img 
                src={qrCodeUrl} 
                alt="Attendance QR Code" 
                className="mx-auto mb-4 border border-gray-200 rounded-lg"
              />
              
              <div className="space-y-3">
                <button
                  onClick={downloadQRCode}
                  className="w-full bg-[#be8533] text-white px-4 py-2 rounded-md hover:bg-[#a06b1f] transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>Download QR Code</span>
                </button>
                
                <button
                  onClick={regenerateQRCode}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <ArrowPathIcon className="w-5 h-5" />
                  )}
                  <span>{isGenerating ? 'Regenerating...' : 'Regenerate QR Code'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCodeIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No QR Code Generated</h3>
              <p className="mt-1 text-sm text-gray-500">Generate a QR code for easy attendance marking</p>
              
              <button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="mt-4 bg-[#be8533] text-white px-6 py-2 rounded-md hover:bg-[#a06b1f] disabled:opacity-50 transition-colors flex items-center space-x-2 mx-auto"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <QrCodeIcon className="w-5 h-5" />
                )}
                <span>{isGenerating ? 'Generating...' : 'Generate QR Code'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Attendance Link */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Link</h2>
          
          {attendanceLink ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shareable Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={attendanceLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                      copied 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {expiresAt && (
                <div className="text-xs text-gray-500">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Expires: {new Date(expiresAt).toLocaleString()}
                </div>
              )}

              <div className="bg-[#fddc9a] border border-[#be8533] rounded-lg p-4">
                <h4 className="font-medium text-[#a06b1f] mb-2">How to Use</h4>
                <ul className="text-sm text-[#a06b1f] space-y-1">
                  <li>• Share this link with participants</li>
                  <li>• Participants click the link to mark attendance</li>
                  <li>• QR code can be scanned for quick access</li>
                  <li>• Link expires after the session ends</li>
                </ul>
              </div>

              {isSessionActive() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Session is currently active!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Participants can now use this link to mark their attendance.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Link Generated</h3>
              <p className="mt-1 text-sm text-gray-500">Generate a QR code to create an attendance link</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">For Session Organizers</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. Generate the QR code using the button above</li>
              <li>2. Display the QR code on screen or print it</li>
              <li>3. Share the attendance link with participants</li>
              <li>4. Monitor attendance in real-time</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">For Participants</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. Scan the QR code with your mobile device</li>
              <li>2. Or click on the shared attendance link</li>
              <li>3. Confirm your attendance when prompted</li>
              <li>4. Your attendance will be recorded automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
