const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('../utils/AppError');

class QRCodeService {
  constructor() {
    // Ensure QR code directory exists
    this.qrCodeDir = path.join(__dirname, '../../uploads/qrcodes');
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.qrCodeDir, { recursive: true });
    } catch (error) {
      console.error('Error creating QR code directory:', error);
    }
  }

  /**
   * Generate QR code for session attendance
   */
  async generateSessionQR(session) {
    try {
      // Create unique QR data
      const qrData = {
        type: 'session_attendance',
        sessionId: session.id,
        sessionTitle: session.title,
        timestamp: Date.now(),
        token: crypto.randomBytes(16).toString('hex')
      };

      // Convert to string
      const qrString = JSON.stringify(qrData);
      
      // Generate QR code options
      const options = {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      // Generate QR code as buffer
      const qrBuffer = await QRCode.toBuffer(qrString, options);
      
      // Save QR code to file
      const filename = `session-${session.id}-${Date.now()}.png`;
      const filepath = path.join(this.qrCodeDir, filename);
      await fs.writeFile(filepath, qrBuffer);

      // Generate data URL for immediate use
      const qrDataURL = await QRCode.toDataURL(qrString, options);

      return {
        filename,
        filepath,
        url: `/uploads/qrcodes/${filename}`,
        dataURL: qrDataURL,
        data: qrData,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
      };
    } catch (error) {
      throw new AppError('Failed to generate QR code', 500);
    }
  }

  /**
   * Generate temporary attendance link QR
   */
  async generateAttendanceQR(sessionId, userId) {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const token = crypto.randomBytes(32).toString('hex');
      
      // Create attendance URL
      const attendanceUrl = `${baseUrl}/attendance/mark/${sessionId}?token=${token}&user=${userId}`;
      
      const options = {
        errorCorrectionLevel: 'L',
        type: 'png',
        width: 250,
        margin: 1
      };

      const qrDataURL = await QRCode.toDataURL(attendanceUrl, options);
      
      return {
        url: attendanceUrl,
        dataURL: qrDataURL,
        token,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };
    } catch (error) {
      throw new AppError('Failed to generate attendance QR code', 500);
    }
  }

  /**
   * Generate check-in QR code for events
   */
  async generateCheckInQR(data) {
    try {
      const qrData = {
        type: 'check_in',
        eventId: data.eventId,
        locationId: data.locationId,
        validFrom: data.validFrom || Date.now(),
        validUntil: data.validUntil || Date.now() + 24 * 60 * 60 * 1000,
        checksum: this.generateChecksum(data)
      };

      const options = {
        errorCorrectionLevel: 'H',
        type: 'svg',
        width: 400,
        margin: 2
      };

      const qrSVG = await QRCode.toString(JSON.stringify(qrData), options);
      
      return {
        svg: qrSVG,
        data: qrData
      };
    } catch (error) {
      throw new AppError('Failed to generate check-in QR code', 500);
    }
  }

  /**
   * Validate QR code data
   */
  validateQRData(qrString) {
    try {
      const qrData = JSON.parse(qrString);
      
      // Check required fields
      if (!qrData.type || !qrData.sessionId) {
        return { valid: false, error: 'Invalid QR code format' };
      }

      // Check timestamp (if exists)
      if (qrData.timestamp) {
        const age = Date.now() - qrData.timestamp;
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours
        
        if (age > maxAge) {
          return { valid: false, error: 'QR code has expired' };
        }
      }

      return { valid: true, data: qrData };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code data' };
    }
  }

  /**
   * Generate checksum for data integrity
   */
  generateChecksum(data) {
    const string = JSON.stringify(data);
    return crypto.createHash('sha256').update(string).digest('hex').slice(0, 8);
  }

  /**
   * Delete old QR code files
   */
  async cleanupOldQRCodes() {
    try {
      const files = await fs.readdir(this.qrCodeDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filepath = path.join(this.qrCodeDir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up QR codes:', error);
    }
  }
}

module.exports = new QRCodeService();
