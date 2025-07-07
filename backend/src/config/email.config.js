// Email configuration for when nodemailer issue is resolved
module.exports = {
  smtp: {
    host: process.env.EMAIL_HOST || 'webmail.biwillzcomputers.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || true,
    auth: {
      user: process.env.EMAIL_USER || 'info@biwillzcomputers.com',
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // For self-signed certificates
    }
  },
  defaults: {
    from: process.env.EMAIL_FROM || '"Attendance Tracker" <info@biwillzcomputers.com>'
  }
};
