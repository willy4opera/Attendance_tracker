// Compact HTML email to avoid Gmail trimming
'use strict';

require('dotenv').config();

// Get nodemailer with cache clearing
function getNodemailer() {
  delete require.cache[require.resolve('nodemailer')];
  return require('nodemailer');
}

// Send email function
const sendEmail = async (options) => {
  try {
    const nodemailer = getNodemailer();
    
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Change Ambassadors'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.to);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

// Compact welcome email that won't trigger Gmail's trimming
const sendWelcomeEmailCompact = async (user) => {
  // Add a unique timestamp to prevent Gmail from grouping emails
  const timestamp = new Date().getTime();
  
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#1a1a2e;padding:30px;text-align:center">
<h1 style="color:#fff;margin:0;font-size:24px">Change Ambassadors</h1>
<p style="color:#fff;margin:10px 0 0">Attendance Tracking System</p>
</td></tr>
<tr><td style="padding:30px">
<h2 style="color:#333;margin:0 0 20px">Welcome, ${user.firstName}!</h2>
<p style="color:#555;line-height:1.6;margin:0 0 20px">We're excited to have you join Change Ambassadors. Your account has been successfully created.</p>
<table width="100%" style="background:#f8f9fa;padding:20px;margin:20px 0" cellpadding="10">
<tr><td><strong>Email:</strong> ${user.email}</td></tr>
<tr><td><strong>Name:</strong> ${user.firstName} ${user.lastName}</td></tr>
<tr><td><strong>Role:</strong> ${user.role || 'User'}</td></tr>
</table>
<p style="text-align:center;margin:30px 0">
<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display:inline-block;padding:12px 30px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold">Log In to Your Account</a>
</p>
<p style="color:#666;text-align:center;margin:20px 0 0">Need help? Email us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}" style="color:#007bff">${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}</a></p>
</td></tr>
<tr><td style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #dee2e6">
<p style="color:#666;margin:0;font-size:14px">© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.</p>
<p style="color:#999;margin:5px 0 0;font-size:12px">REF-${timestamp}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Welcome to Change Ambassadors!

Hi ${user.firstName},

We're excited to have you join Change Ambassadors. Your account has been successfully created.

Your Account Details:
- Email: ${user.email}
- Name: ${user.firstName} ${user.lastName}
- Role: ${user.role || 'User'}

Log in at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Need help? Contact us at ${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}

© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.`;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Change Ambassadors',
    html: html,
    text: text
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmailCompact
};
