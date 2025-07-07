import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, QrCode, Loader2, Shield } from 'lucide-react';
import jsQR from 'jsqr';
import qrcodeService from '../../services/qrcodeService';
import { showErrorToast, showSuccessToast } from '../../utils/toastHelpers';
import theme from '../../config/theme';

interface RecentScan {
  id: number;
  timestamp: string;
  sessionTitle: string;
  status: 'success' | 'error';
  message?: string;
}

const QRCodeScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if we're in a secure context
    setIsSecureContext(window.isSecureContext);
    
    // Load recent scans from localStorage
    const saved = localStorage.getItem('recentAttendanceScans');
    if (saved) {
      setRecentScans(JSON.parse(saved));
    }

    return () => {
      // Cleanup camera on unmount
      stopCamera();
    };
  }, []);

  const checkCameraAvailability = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (!window.isSecureContext) {
        return 'Camera access requires HTTPS. Please use manual code entry or access this site via HTTPS.';
      }
      return 'Your browser does not support camera access. Please use manual code entry.';
    }
    return null;
  };

  const startCamera = async () => {
    const error = checkCameraAvailability();
    if (error) {
      setCameraError(error);
      showErrorToast(error);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
        setScanning(true);
        setCameraError(null);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          // Start scanning for QR codes
          scanQRCode();
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      let errorMessage = 'Failed to access camera. ';
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage += 'Please allow camera permissions and try again.';
            break;
          case 'NotFoundError':
            errorMessage += 'No camera found on this device.';
            break;
          case 'NotReadableError':
            errorMessage += 'Camera is already in use by another application.';
            break;
          case 'OverconstrainedError':
            errorMessage += 'Camera does not support the requested configuration.';
            break;
          default:
            errorMessage += 'Please check camera permissions and try again.';
        }
      }
      
      setCameraError(errorMessage);
      showErrorToast(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setShowCamera(false);
    setScanning(false);
    setCameraError(null);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleQRCodeDetected(code.data);
        return;
      }
    }

    if (scanning) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Try to parse as JSON first (QR data)
      let qrData = manualCode;
      try {
        JSON.parse(manualCode);
      } catch {
        // If not JSON, treat as attendance token
        qrData = JSON.stringify({
          type: 'attendance_token',
          token: manualCode
        });
      }

      const result = await qrcodeService.scanQRCode(qrData);
      
      // Add to recent scans
      const scan: RecentScan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sessionTitle: result.data.session?.title || 'Unknown Session',
        status: 'success'
      };
      
      const updatedScans = [scan, ...recentScans].slice(0, 5);
      setRecentScans(updatedScans);
      localStorage.setItem('recentAttendanceScans', JSON.stringify(updatedScans));
      
      showSuccessToast(result.message || 'Attendance marked successfully!');
      setManualCode('');
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to mark attendance';
      showErrorToast(errorMessage);
      
      // Add failed scan to history
      const scan: RecentScan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sessionTitle: 'Failed',
        status: 'error',
        message: errorMessage
      };
      
      const updatedScans = [scan, ...recentScans].slice(0, 5);
      setRecentScans(updatedScans);
      localStorage.setItem('recentAttendanceScans', JSON.stringify(updatedScans));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    stopCamera();
    
    try {
      const result = await qrcodeService.scanQRCode(qrData);
      
      // Add to recent scans
      const scan: RecentScan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sessionTitle: result.data.session?.title || 'Unknown Session',
        status: 'success'
      };
      
      const updatedScans = [scan, ...recentScans].slice(0, 5);
      setRecentScans(updatedScans);
      localStorage.setItem('recentAttendanceScans', JSON.stringify(updatedScans));
      
      showSuccessToast(result.message || 'Attendance marked successfully!');
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to mark attendance';
      showErrorToast(errorMessage);
      
      // Add failed scan to history
      const scan: RecentScan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sessionTitle: 'Failed',
        status: 'error',
        message: errorMessage
      };
      
      const updatedScans = [scan, ...recentScans].slice(0, 5);
      setRecentScans(updatedScans);
      localStorage.setItem('recentAttendanceScans', JSON.stringify(updatedScans));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Warning */}
      {!isSecureContext && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">Secure Connection Required</h4>
              <p className="text-sm text-amber-800">
                Camera access requires HTTPS. Please use manual code entry or access this site via a secure connection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Options */}
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-black mb-4">QR Code Attendance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera Scanner */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-black">Scan with Camera</h4>
              
              {!showCamera ? (
                <div>
                  <button
                    onClick={startCamera}
                    disabled={isProcessing || !isSecureContext}
                    className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.primary + '10'
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing && isSecureContext) {
                        e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                    }}
                  >
                    <Camera className="w-8 h-8" style={{ color: theme.colors.primary }} />
                    <span className="text-black font-medium">
                      {!isSecureContext ? 'Camera Unavailable (HTTPS Required)' : 'Click to start camera'}
                    </span>
                  </button>
                  {cameraError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{cameraError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded text-sm text-center">
                    Position QR code within the frame
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Code Entry */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-black">Enter Code Manually</h4>
              
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter attendance code or QR data"
                    disabled={isProcessing}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors disabled:opacity-50"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusBorderColor: theme.colors.primary 
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the code displayed with the QR code or the full QR data
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isProcessing}
                  className="w-full px-4 py-2 text-black font-medium rounded-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
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
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Code'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="border rounded-lg p-4" style={{ 
        backgroundColor: theme.colors.primary + '10',
        borderColor: theme.colors.primary + '50'
      }}>
        <div className="flex items-start gap-3">
          <QrCode className="w-5 h-5 mt-0.5" style={{ color: theme.colors.primary }} />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-black">How to mark attendance:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>Ask your session host for the QR code or attendance code</li>
              <li>Either scan the QR code using your camera or enter the code manually</li>
              <li>Your attendance will be marked automatically</li>
              <li>You'll receive a confirmation once successful</li>
            </ol>
            {!isSecureContext && (
              <p className="text-sm text-amber-700 mt-2">
                <strong>Note:</strong> Camera scanning requires HTTPS. You can still use manual code entry.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-black mb-4">Recent Scans</h3>
            
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    scan.status === 'success' ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {scan.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-black">{scan.sessionTitle}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                      {scan.message && (
                        <p className="text-sm text-red-600 mt-1">{scan.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setRecentScans([]);
                localStorage.removeItem('recentAttendanceScans');
              }}
              className="mt-4 text-sm hover:underline transition-colors"
              style={{ color: theme.colors.primary }}
            >
              Clear history
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
