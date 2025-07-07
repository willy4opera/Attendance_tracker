// Temporary file showing Session model updates
const { DataTypes } = require('sequelize');

// Add these fields to the existing Session model:
const sessionAdditions = {
  // Meeting link fields
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    },
  },
  
  meetingType: {
    type: DataTypes.ENUM('zoom', 'google_meet', 'teams', 'webex', 'other'),
    allowNull: true,
    defaultValue: 'other',
  },
  
  trackingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  
  attendanceWindow: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  
  requiresRegistration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  
  maxAttendees: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  
  // Tracking URL will be generated dynamically, not stored
  // Example: /api/v1/sessions/abc123/join?user=userId&token=xyz
};

// Helper methods to add to Session model:
const sessionMethods = {
  // Generate tracking URL for a user
  generateTrackingUrl(userId) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const token = jwt.sign(
      { sessionId: this.id, userId, timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return `${baseUrl}/api/v1/sessions/${this.id}/join?token=${token}`;
  },
  
  // Check if session is within attendance window
  isWithinAttendanceWindow() {
    const now = new Date();
    const sessionStart = new Date(`${this.sessionDate}T${this.startTime}`);
    const sessionEnd = new Date(`${this.sessionDate}T${this.endTime}`);
    
    const windowStart = new Date(sessionStart.getTime() - this.attendanceWindow * 60000);
    const windowEnd = new Date(sessionEnd.getTime() + this.attendanceWindow * 60000);
    
    return now >= windowStart && now <= windowEnd;
  },
  
  // Check if meeting link is valid
  isValidMeetingLink() {
    if (!this.meetingLink) return false;
    
    const validPatterns = {
      zoom: /zoom\.us\/j\/\d+/,
      google_meet: /meet\.google\.com\/[a-z]+-[a-z]+-[a-z]+/,
      teams: /teams\.microsoft\.com/,
      webex: /webex\.com/
    };
    
    if (this.meetingType && validPatterns[this.meetingType]) {
      return validPatterns[this.meetingType].test(this.meetingLink);
    }
    
    return true; // For 'other' type
  }
};

module.exports = { sessionAdditions, sessionMethods };
