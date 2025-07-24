const fs = require('fs');
const path = require('path');

const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  // Log to console
  console.log(`🔍 DEBUG: ${message}`, data || '');
  
  // Also log to file
  const logFile = path.join(__dirname, '../../debug-notification.log');
  fs.appendFileSync(logFile, logMessage);
};

module.exports = { debugLog };
