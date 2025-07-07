import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { showErrorToast, showSuccessToast } from '../../utils/toastHelpers';
import theme from '../../config/theme';

const QRCodeScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
        setScanning(true);
        
        // Start scanning for QR codes
        scanQRCode();
      }
    } catch (error) {
      showErrorToast(new Error('Failed to access camera. Please check permissions.').message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setScanning(false);
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

      // Here you would integrate with a QR code scanning library like qr-scanner or jsQR
      // For now, we'll simulate the scanning process
      // In production, you would use: const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // Simulated QR code detection
      // You would replace this with actual QR code scanning logic
    }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    try {
      const result = await attendanceService.markAttendanceViaQR(manualCode);
      
      // Add to recent scans
      const scan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sessionTitle: result.session?.title || 'Unknown Session',
        status: 'success'
      };
      
      const updatedScans = [scan, ...recentScans].slice(0, 5);
      setRecentScans(updatedScans);
      localStorage.setItem('recentAttendanceScans', JSON.stringify(updatedScans));
      
      showSuccessToast('Attendance marked successfully!');
      setManualCode('');
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    try {
      stopCamera();
      const result = await attendanceService.markAttendanceViaQR(qrData);
      
      // Add to recent scans
      const scan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sessionTitle: result.session?.title || 'Unknown Session',
        status: 'success'
      };
      
      const updatedScans = [scan, ...recentScans].slice(0, 5);
      setRecentScans(updatedScans);
      localStorage.setItem('recentAttendanceScans', JSON.stringify(updatedScans));
      
      showSuccessToast('Attendance marked successfully!');
    } catch (error) {
      showErrorToast((error as Error).message || "An error occurred");
      
      // Add failed scan to history
      const scan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        sessionTitle: 'Failed to mark attendance',
        status: 'error'
      };
      
      const updatedScans = [scan, ...recentScans].slice(0, 5);
      setRecentScans(updatedScans);
      localStorage.setItem('recentAttendanceScans', JSON.stringify(updatedScans));
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Scanner Options */}
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-black mb-4">QR Code Attendance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera Scanner */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-black">Scan with Camera</h4>
              
              {!showCamera ? (
                <button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{ 
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primary + '10'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                  }}
                >
                  <Camera className="w-8 h-8" style={{ color: theme.colors.primary }} />
                  <span className="text-black font-medium">Click to start camera</span>
                </button>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
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
                    placeholder="Enter attendance code"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
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
                    Enter the code displayed with the QR code
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full px-4 py-2 text-black font-medium rounded-md transition-all duration-200 disabled:opacity-50"
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
                  Submit Code
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
