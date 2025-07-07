import api from './api';
import { AxiosError } from 'axios';

// QR Code data structure
export interface QRCodeData {
  url?: string;
  dataURL: string;
  expiresAt: string;
}

// Session QR Code response
export interface SessionQRCode {
  qrCode: QRCodeData;
}

// Attendance result from QR scan
export interface AttendanceResult {
  status: string;
  message: string;
  data: {
    attendance: any;
    session?: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
    };
  };
}

class QRCodeService {
  // Generate QR code for a session (admin/moderator/facilitator)
  async generateSessionQR(sessionId: string): Promise<QRCodeData> {
    try {
      const response = await api.post(`/qrcode/session/${sessionId}/generate`);
      return response.data.data.qrCode;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to generate session QR code');
    }
  }

  // Get existing QR code for a session
  async getSessionQR(sessionId: string): Promise<QRCodeData> {
    try {
      const response = await api.get(`/qrcode/session/${sessionId}`);
      return response.data.data.qrCode;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to get session QR code');
    }
  }

  // Generate personal attendance QR
  async generateAttendanceQR(sessionId: string): Promise<QRCodeData> {
    try {
      const response = await api.post(`/qrcode/attendance/${sessionId}`);
      return response.data.data.qrCode;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to generate attendance QR code');
    }
  }

  // Scan QR code to mark attendance
  async scanQRCode(qrData: string): Promise<AttendanceResult> {
    try {
      const response = await api.post('/qrcode/scan', { qrData });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to scan QR code');
    }
  }

  // Validate attendance token
  async validateAttendanceToken(token: string, sessionId: string): Promise<AttendanceResult> {
    try {
      const response = await api.post('/qrcode/validate', { token, sessionId });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to validate attendance token');
    }
  }

  // Cleanup old QR codes (admin only)
  async cleanupQRCodes(): Promise<void> {
    try {
      await api.post('/qrcode/cleanup');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to cleanup QR codes');
    }
  }
}

const qrcodeService = new QRCodeService();
export default qrcodeService;

// Also export the service instance as a named export
export { qrcodeService };
