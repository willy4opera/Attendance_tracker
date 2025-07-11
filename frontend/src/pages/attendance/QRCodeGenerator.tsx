import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, Download, RefreshCw, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import qrcodeService from '../../services/qrcodeService';
import type { QRCodeData } from '../../services/qrcodeService';
import sessionService from '../../services/sessionService';
import { showErrorToast, showSuccessToast } from '../../utils/toastHelpers';
import theme from '../../config/theme';

const QRCodeGenerator: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSessionAndQR();
    }
  }, [sessionId]);

  const loadSessionAndQR = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      // Load session details
      const sessionData = await sessionService.getSessionById(sessionId);
      setSession(sessionData);

      // Try to get existing QR code
      try {
        const existingQR = await qrcodeService.getSessionQR(sessionId);
        setQrCode(existingQR);
      } catch (error) {
        // No existing QR code, that's okay
        console.log('No existing QR code found');
      }
    } catch (error) {
      showErrorToast((error as Error).message || 'Failed to load session details');
      navigate('/sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!sessionId) return;
    
    setIsGenerating(true);
    try {
      const newQR = await qrcodeService.generateSessionQR(sessionId);
      setQrCode(newQR);
      showSuccessToast('QR code generated successfully!');
    } catch (error) {
      showErrorToast((error as Error).message || 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode?.dataURL) return;

    const link = document.createElement('a');
    link.download = `session-${sessionId}-qr.png`;
    link.href = qrCode.dataURL;
    link.click();
  };

  const copyQRData = async () => {
    if (!qrCode?.dataURL) return;

    try {
      await navigator.clipboard.writeText(qrCode.dataURL);
      setCopied(true);
      showSuccessToast('QR code data copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      showErrorToast('Failed to copy to clipboard');
    }
  };

  const isExpired = qrCode ? new Date(qrCode.expiresAt) < new Date() : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 lg:px-8 py-4 lg:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Generate QR Code</h1>
          <p className="text-gray-600 mt-2">Create and manage QR codes for session attendance</p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Session Info */}
          {session && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-black">{session.title || session.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(session.sessionDate).toLocaleDateString()} | {session.startTime} - {session.endTime}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Location: {session.location || 'Not specified'}
              </p>
            </div>
          )}

          {/* QR Code Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {!qrCode || isExpired ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center" 
                  style={{ borderColor: theme.colors.primary + '50' }}>
                  <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    {isExpired ? 'QR code has expired' : 'No QR code generated yet'}
                  </p>
                  <button
                    onClick={generateQRCode}
                    disabled={isGenerating}
                    className="px-6 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2 mx-auto"
                    style={{ 
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.secondary
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = theme.colors.primary + 'dd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.primary;
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        Generate QR Code
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <img 
                      src={qrCode.dataURL} 
                      alt="Session QR Code" 
                      className="w-full max-w-[300px] mx-auto"
                    />
                  </div>
                  
                  {/* QR Code Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">
                        Valid until: {new Date(qrCode.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={downloadQRCode}
                      className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={copyQRData}
                      className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={generateQRCode}
                    disabled={isGenerating}
                    className="w-full px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ borderColor: theme.colors.primary + '50' }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate QR Code
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to use this QR code:</h4>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Display this QR code during your session</li>
                  <li>Attendees scan the code with their mobile devices</li>
                  <li>Their attendance is automatically marked</li>
                  <li>You can track attendance in real-time</li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Important Notes:</h4>
                    <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                      <li>QR codes expire after 2 hours for security</li>
                      <li>Attendees can only mark attendance during the session window</li>
                      <li>Each QR code is unique to this session</li>
                      <li>Generate a new code if the current one expires</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Session Attendance Link */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">View Attendance</h4>
                <button
                  onClick={() => navigate(`/attendance/session/${sessionId}`)}
                  className="text-sm hover:underline"
                  style={{ color: theme.colors.primary }}
                >
                  View real-time attendance for this session →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
