// Email utility using nodemailer
'use strict';

require('dotenv').config();

// Create a function to get nodemailer
function getNodemailer() {
  delete require.cache[require.resolve('nodemailer')];
  return require('nodemailer');
}

// Send email function
const sendEmail = async (options) => {
  try {
    const nodemailer = getNodemailer();
    
    const transporter = nodemailer.createTransport({
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
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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

// Mobile-responsive welcome email
const sendWelcomeEmail = async (user) => {
  const timestamp = Date.now();
  
  // Add verification details if token exists
  let verificationSection = "";
  let verificationText = "";
  if (user.emailVerificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${user.emailVerificationToken}`;
    const verificationCode = user.emailVerificationToken.slice(-6).toUpperCase();
    
    verificationSection = `
    <!-- Email Verification Section -->
    <tr>
    <td class="mobile-padding" style="padding: 20px 40px 20px 40px;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff4e5; border-radius: 8px; border: 1px solid #ffd6a5;">
    <tr>
    <td style="padding: 25px;">
    <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #ff6b35;">⚠️ Action Required: Verify Your Email</p>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #4a5568;">To unlock all features, please verify your email address using one of these methods:</p>
    <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 0 0 20px 0;">
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #718096;">Verification Code:</p>
    <h2 style="margin: 0; font-size: 28px; letter-spacing: 4px; color: #667eea; text-align: center;">${verificationCode}</h2>
    </div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-button">
    <tr>
    <td align="center" style="background-color: #ff6b35; border-radius: 8px;">
    <a href="${verificationUrl}" target="_blank" style="display: inline-block; width: 100%; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; box-sizing: border-box;">Verify Email Now →</a>
    </td>
    </tr>
    </table>
    <p style="margin: 15px 0 0 0; font-size: 12px; color: #a0aec0; text-align: center;">This link expires in 24 hours</p>
    </td>
    </tr>
    </table>
    </td>
    </tr>`;
    
    verificationText = `

IMPORTANT: Email Verification Required
=====================================
To unlock all features, please verify your email:

Verification Code: ${verificationCode}

Or click this link:
${verificationUrl}

This link expires in 24 hours.`;
  }
  
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Welcome</title>
<!--[if mso]>
<style type="text/css">
table {border-collapse:collapse;border-spacing:0;margin:0;}
div, td {padding:0;}
div {margin:0 !important;}
</style>
<![endif]-->
<style type="text/css">
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; }

* { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
table { border-collapse: collapse !important; }

@media screen and (max-width: 600px) {
  .mobile-padding { padding: 20px !important; }
  .mobile-center { text-align: center !important; }
  .container { width: 100% !important; max-width: 100% !important; }
  .mobile-button { width: 100% !important; }
  .mobile-button a { 
    display: block !important; 
    font-size: 18px !important;
    padding: 15px !important;
  }
}
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
<div style="display: none; max-height: 0; overflow: hidden;">Welcome to Change Ambassadors! Your account is ready.</div>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
<tr>
<td align="center" style="padding: 40px 10px;">
<!--[if mso]>
<table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
<tr>
<td align="center" valign="top" width="600">
<![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
<!-- Logo/Header -->
<tr>
<td align="center" style="padding: 40px 20px 20px 20px;">
<div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px;">
<h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">CHANGE AMBASSADORS</h1>
</div>
</td>
</tr>
<!-- Welcome Section -->
<tr>
<td class="mobile-padding" style="padding: 20px 40px;">
<h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a202c; text-align: center;">
Welcome, ${user.firstName}! 🎉
</h2>
<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568; text-align: center;">
Your account has been created successfully. We're excited to have you on board!
</p>
</td>
</tr>
${verificationSection}
<!-- Account Details Card -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 30px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafc; border-radius: 8px;">
<tr>
<td style="padding: 25px;">
<p style="margin: 0 0 15px 0; font-size: 12px; font-weight: 600; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px;">Your Account Information</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
<p style="margin: 0; font-size: 14px; color: #718096;">Email Address</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${user.email}</p>
</td>
</tr>
<tr>
<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
<p style="margin: 0; font-size: 14px; color: #718096;">Full Name</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${user.firstName} ${user.lastName}</p>
</td>
</tr>
<tr>
<td style="padding: 8px 0;">
<p style="margin: 0; font-size: 14px; color: #718096;">Account Role</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${user.role || 'User'}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<!-- CTA Button -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 40px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-button">
<tr>
<td align="center" style="background-color: #667eea; border-radius: 8px;">
<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" target="_blank" style="display: inline-block; width: 100%; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; box-sizing: border-box;">Access Your Dashboard →</a>
</td>
</tr>
</table>
</td>
</tr>
<!-- Help Section -->
<tr>
<td style="padding: 0 40px 40px 40px; border-top: 1px solid #e2e8f0;">
<p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #718096; text-align: center;">
Need help getting started?<br>
Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}" style="color: #667eea; text-decoration: none; font-weight: 600;">${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}</a>
</p>
</td>
</tr>
</table>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
<!-- Footer -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
<tr>
<td align="center" style="padding: 20px;">
<p style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0;">
© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.<br>
<span style="font-size: 10px;">REF: ${timestamp}</span>
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = `Welcome to Change Ambassadors!

Hi ${user.firstName},

Your account has been created successfully. We're excited to have you on board!

Your Account Information:
- Email Address: ${user.email}
- Full Name: ${user.firstName} ${user.lastName}
- Account Role: ${user.role || 'User'}${verificationText}

Access Your Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login

Need help getting started?
Contact us at ${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}

© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.`;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Change Ambassadors 🎉',
    html: html,
    text: text
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a1a2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Password Reset Request</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0;">
        <p style="font-size: 18px;">Hi ${user.firstName},</p>
        <p>You requested a password reset for your Attendance Tracker account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Attendance Tracker. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Hi ${user.firstName}, Please use this link to reset your password: ${resetUrl}. This link will expire in 1 hour.`
  });
};

// Send attendance confirmation email
const sendAttendanceConfirmation = async (user, session, attendanceDetails) => {
  const subject = `Attendance Confirmed - ${session.title}`;
  const html = `
    <h1>Attendance Confirmation</h1>
    <p>Hi ${user.firstName},</p>
    <p>Your attendance has been successfully recorded for the following session:</p>
    <ul>
      <li><strong>Session:</strong> ${session.title}</li>
      <li><strong>Date:</strong> ${new Date(session.sessionDate).toLocaleDateString()}</li>
      <li><strong>Time:</strong> ${session.startTime} - ${session.endTime}</li>
      <li><strong>Status:</strong> ${attendanceDetails.status}</li>
      <li><strong>Check-in Time:</strong> ${new Date(attendanceDetails.checkInTime).toLocaleString()}</li>
    </ul>
    <br>
    <p>Best regards,<br>The Attendance Tracker Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Hi ${user.firstName}, Your attendance has been confirmed for ${session.title} on ${new Date(session.sessionDate).toLocaleDateString()}`
  });
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const nodemailer = getNodemailer();
    
    const transporter = nodemailer.createTransport({
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
    
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error.message);
    return false;
  }
};

// Improved login notification to avoid spam filters
const sendLoginNotification = async (user, loginDetails = {}) => {
  const timestamp = Date.now();
  const loginTime = new Date().toLocaleString('en-US', { 
    dateStyle: 'full',
    timeStyle: 'short'
  });
  
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Login Activity</title>
<!--[if mso]>
<style type="text/css">
table {border-collapse:collapse;border-spacing:0;margin:0;}
div, td {padding:0;}
div {margin:0 !important;}
</style>
<![endif]-->
<style type="text/css">
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; }

* { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
table { border-collapse: collapse !important; }

@media screen and (max-width: 600px) {
  .mobile-padding { padding: 20px !important; }
  .mobile-center { text-align: center !important; }
  .container { width: 100% !important; max-width: 100% !important; }
  .mobile-button { width: 100% !important; }
  .mobile-button a { 
    display: block !important; 
    font-size: 18px !important;
    padding: 15px !important;
  }
}
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
<div style="display: none; max-height: 0; overflow: hidden;">New login activity on your Change Ambassadors account.</div>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
<tr>
<td align="center" style="padding: 40px 10px;">
<!--[if mso]>
<table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
<tr>
<td align="center" valign="top" width="600">
<![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
<!-- Logo/Header - Using same purple gradient as welcome email -->
<tr>
<td align="center" style="padding: 40px 20px 20px 20px;">
<div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px;">
<h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">CHANGE AMBASSADORS</h1>
</div>
</td>
</tr>
<!-- Content Section -->
<tr>
<td class="mobile-padding" style="padding: 20px 40px;">
<h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a202c; text-align: center;">
Login Activity 🔐
</h2>
<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568; text-align: center;">
Hi ${user.firstName}, we noticed a successful login to your account.
</p>
</td>
</tr>
<!-- Login Details Card - Using light blue instead of yellow -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 30px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafc; border-radius: 8px;">
<tr>
<td style="padding: 25px;">
<p style="margin: 0 0 15px 0; font-size: 12px; font-weight: 600; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px;">Login Details</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
<p style="margin: 0; font-size: 14px; color: #718096;">Date & Time</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${loginTime}</p>
</td>
</tr>
<tr>
<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
<p style="margin: 0; font-size: 14px; color: #718096;">IP Address</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${loginDetails.ipAddress || 'Not available'}</p>
</td>
</tr>
<tr>
<td style="padding: 8px 0;">
<p style="margin: 0; font-size: 14px; color: #718096;">Device/Browser</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${loginDetails.userAgent || 'Not available'}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<!-- Info Message - Softer tone -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 30px 40px;">
<div style="background-color: #e6f2ff; border-left: 4px solid #667eea; padding: 15px;">
<p style="margin: 0; color: #2b6cb0; font-size: 14px; line-height: 1.5;">
<strong>Was this you?</strong><br>
If you recognize this login, no action is needed. If not, please review your account security.
</p>
</div>
</td>
</tr>
<!-- CTA Button - Matching welcome email style -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 40px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-button">
<tr>
<td align="center" style="background-color: #667eea; border-radius: 8px;">
<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/account" target="_blank" style="display: inline-block; width: 100%; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; box-sizing: border-box;">View Account Settings →</a>
</td>
</tr>
</table>
</td>
</tr>
<!-- Help Section -->
<tr>
<td style="padding: 0 40px 40px 40px; border-top: 1px solid #e2e8f0;">
<p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #718096; text-align: center;">
Questions about this login?<br>
Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}" style="color: #667eea; text-decoration: none; font-weight: 600;">${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}</a>
</p>
</td>
</tr>
</table>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
<!-- Footer -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
<tr>
<td align="center" style="padding: 20px;">
<p style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0;">
© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.<br>
<span style="font-size: 10px;">REF: ${timestamp}</span>
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = `Login Activity on Your Account

Hi ${user.firstName},

We noticed a successful login to your Change Ambassadors account.

Login Details:
- Date & Time: ${loginTime}
- IP Address: ${loginDetails.ipAddress || 'Not available'}
- Device/Browser: ${loginDetails.userAgent || 'Not available'}

Was this you?
If you recognize this login, no action is needed. If not, please review your account security.

View Account Settings: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/account

Questions about this login? Contact us at ${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}

© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.`;

  return sendEmail({
    to: user.email,
    subject: 'Login Activity on Your Change Ambassadors Account',
    html: html,
    text: text
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAttendanceConfirmation,
  testEmailConfiguration,
  sendLoginNotification
};

// Send session invite with attendance tracking link
const sendSessionInvite = async (user, session) => {
  const timestamp = Date.now();
  
  // Generate unique attendance tracking URL for this user
  const attendanceUrl = session.generateAttendanceUrl(user.id);
  
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Session Invitation</title>
<!--[if mso]>
<style type="text/css">
table {border-collapse:collapse;border-spacing:0;margin:0;}
div, td {padding:0;}
div {margin:0 !important;}
</style>
<![endif]-->
<style type="text/css">
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; }

* { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
table { border-collapse: collapse !important; }

@media screen and (max-width: 600px) {
  .mobile-padding { padding: 20px !important; }
  .mobile-center { text-align: center !important; }
  .container { width: 100% !important; max-width: 100% !important; }
  .mobile-button { width: 100% !important; }
  .mobile-button a { 
    display: block !important; 
    font-size: 18px !important;
    padding: 15px !important;
  }
}
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
<div style="display: none; max-height: 0; overflow: hidden;">You're invited to ${session.title} - Click to join and mark attendance</div>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
<tr>
<td align="center" style="padding: 40px 10px;">
<!--[if mso]>
<table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
<tr>
<td align="center" valign="top" width="600">
<![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
<!-- Logo/Header -->
<tr>
<td align="center" style="padding: 40px 20px 20px 20px;">
<div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px;">
<h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">SESSION INVITATION</h1>
</div>
</td>
</tr>
<!-- Content Section -->
<tr>
<td class="mobile-padding" style="padding: 20px 40px;">
<h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a202c; text-align: center;">
${session.title}
</h2>
<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568; text-align: center;">
Hi ${user.firstName}, you're invited to attend this session.
</p>
</td>
</tr>
<!-- Session Details Card -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 30px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafc; border-radius: 8px;">
<tr>
<td style="padding: 25px;">
<p style="margin: 0 0 15px 0; font-size: 12px; font-weight: 600; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px;">Session Details</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
<p style="margin: 0; font-size: 14px; color: #718096;">📅 Date</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
</td>
</tr>
<tr>
<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
<p style="margin: 0; font-size: 14px; color: #718096;">⏰ Time</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${session.startTime} - ${session.endTime}</p>
</td>
</tr>
${session.meetingType ? `
<tr>
<td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
<p style="margin: 0; font-size: 14px; color: #718096;">💻 Platform</p>
<p style="margin: 4px 0 0 0; font-size: 16px; color: #1a202c; font-weight: 600;">${session.meetingType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
</td>
</tr>
` : ''}
${session.description ? `
<tr>
<td style="padding: 8px 0;">
<p style="margin: 0; font-size: 14px; color: #718096;">📝 Description</p>
<p style="margin: 4px 0 0 0; font-size: 15px; color: #1a202c; line-height: 1.5;">${session.description}</p>
</td>
</tr>
` : ''}
</table>
</td>
</tr>
</table>
</td>
</tr>
<!-- Important Notice -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 30px 40px;">
<div style="background-color: #e6f2ff; border-left: 4px solid #667eea; padding: 15px;">
<p style="margin: 0; color: #2b6cb0; font-size: 14px; line-height: 1.5;">
<strong>📌 Important:</strong><br>
Clicking the button below will automatically mark your attendance and redirect you to the meeting.
</p>
</div>
</td>
</tr>
<!-- CTA Button -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 40px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-button">
<tr>
<td align="center" style="background-color: #667eea; border-radius: 8px;">
<a href="${attendanceUrl}" target="_blank" style="display: inline-block; width: 100%; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; box-sizing: border-box;">Join Session & Mark Attendance →</a>
</td>
</tr>
</table>
</td>
</tr>
<!-- Additional Info -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 40px 40px;">
<p style="margin: 0; font-size: 14px; line-height: 20px; color: #718096; text-align: center;">
⏱️ You can join ${session.attendanceWindow} minutes before the session starts.<br>
🔗 This link is unique to you and expires after the session.
</p>
</td>
</tr>
<!-- Help Section -->
<tr>
<td style="padding: 0 40px 40px 40px; border-top: 1px solid #e2e8f0;">
<p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #718096; text-align: center;">
Having trouble joining?<br>
Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}" style="color: #667eea; text-decoration: none; font-weight: 600;">${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}</a>
</p>
</td>
</tr>
</table>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
<!-- Footer -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
<tr>
<td align="center" style="padding: 20px;">
<p style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0;">
© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.<br>
<span style="font-size: 10px;">Session ID: ${session.id} | REF: ${timestamp}</span>
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = `Session Invitation: ${session.title}

Hi ${user.firstName},

You're invited to attend this session.

Session Details:
📅 Date: ${new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ Time: ${session.startTime} - ${session.endTime}
${session.meetingType ? `💻 Platform: ${session.meetingType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}` : ''}
${session.description ? `📝 Description: ${session.description}` : ''}

Important: Click the link below to join the session and automatically mark your attendance.

Join Session: ${attendanceUrl}

⏱️ You can join ${session.attendanceWindow} minutes before the session starts.
🔗 This link is unique to you and expires after the session.

Having trouble joining? Contact us at ${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}

© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.`;

  return sendEmail({
    to: user.email,
    subject: `Invitation: ${session.title} - ${new Date(session.sessionDate).toLocaleDateString()}`,
    html: html,
    text: text
  });
};

module.exports.sendSessionInvite = sendSessionInvite;

// Send email verification
const sendVerificationEmail = async (user, verificationToken) => {
  const timestamp = Date.now();
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
  const verificationCode = verificationToken.slice(-6).toUpperCase(); // Last 6 characters as code
  
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Verify Your Email</title>
<!--[if mso]>
<style type="text/css">
table {border-collapse:collapse;border-spacing:0;margin:0;}
div, td {padding:0;}
div {margin:0 !important;}
</style>
<![endif]-->
<style type="text/css">
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; }

* { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
table { border-collapse: collapse !important; }

@media screen and (max-width: 600px) {
  .mobile-padding { padding: 20px !important; }
  .mobile-center { text-align: center !important; }
  .container { width: 100% !important; max-width: 100% !important; }
  .mobile-button { width: 100% !important; }
  .mobile-button a { 
    display: block !important; 
    font-size: 18px !important;
    padding: 15px !important;
  }
}
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
<div style="display: none; max-height: 0; overflow: hidden;">Please verify your email address to activate your account.</div>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
<tr>
<td align="center" style="padding: 40px 10px;">
<!--[if mso]>
<table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
<tr>
<td align="center" valign="top" width="600">
<![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
<!-- Logo/Header -->
<tr>
<td align="center" style="padding: 40px 20px 20px 20px;">
<div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px;">
<h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">EMAIL VERIFICATION</h1>
</div>
</td>
</tr>
<!-- Content Section -->
<tr>
<td class="mobile-padding" style="padding: 20px 40px;">
<h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a202c; text-align: center;">
Verify Your Email Address
</h2>
<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568; text-align: center;">
Hi ${user.firstName}, please verify your email to activate your account.
</p>
</td>
</tr>
<!-- Verification Code Card -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 30px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7fafc; border-radius: 8px;">
<tr>
<td style="padding: 25px; text-align: center;">
<p style="margin: 0 0 15px 0; font-size: 14px; color: #718096;">Your verification code is:</p>
<div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px dashed #667eea;">
<h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #667eea; font-weight: 700;">${verificationCode}</h1>
</div>
<p style="margin: 15px 0 0 0; font-size: 12px; color: #a0aec0;">This code expires in 24 hours</p>
</td>
</tr>
</table>
</td>
</tr>
<!-- CTA Button -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 30px 40px;">
<p style="margin: 0 0 20px 0; font-size: 14px; color: #718096; text-align: center;">Or click the button below to verify instantly:</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-button">
<tr>
<td align="center" style="background-color: #667eea; border-radius: 8px;">
<a href="${verificationUrl}" target="_blank" style="display: inline-block; width: 100%; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; box-sizing: border-box;">Verify Email Address →</a>
</td>
</tr>
</table>
</td>
</tr>
<!-- Alternative Link -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 40px 40px;">
<p style="margin: 0; font-size: 12px; line-height: 18px; color: #718096; text-align: center;">
If the button doesn't work, copy and paste this link into your browser:<br>
<a href="${verificationUrl}" style="color: #667eea; text-decoration: none; word-break: break-all; font-size: 11px;">${verificationUrl}</a>
</p>
</td>
</tr>
<!-- Help Section -->
<tr>
<td style="padding: 0 40px 40px 40px; border-top: 1px solid #e2e8f0;">
<p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #718096; text-align: center;">
Didn't request this email?<br>
You can safely ignore it. No action will be taken.
</p>
</td>
</tr>
</table>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
<!-- Footer -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
<tr>
<td align="center" style="padding: 20px;">
<p style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0;">
© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.<br>
<span style="font-size: 10px;">REF: ${timestamp}</span>
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = `Email Verification Required

Hi ${user.firstName},

Please verify your email address to activate your account.

Your verification code is: ${verificationCode}

Or click this link to verify:
${verificationUrl}

This verification link expires in 24 hours.

Didn't request this email? You can safely ignore it.

© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.`;

  return sendEmail({
    to: user.email,
    subject: 'Please Verify Your Email - Change Ambassadors',
    html: html,
    text: text
  });
};

// Send verification success email
const sendVerificationSuccessEmail = async (user) => {
  const timestamp = Date.now();
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Email Verified</title>
<!--[if mso]>
<style type="text/css">
table {border-collapse:collapse;border-spacing:0;margin:0;}
div, td {padding:0;}
div {margin:0 !important;}
</style>
<![endif]-->
<style type="text/css">
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; }

* { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
table { border-collapse: collapse !important; }

@media screen and (max-width: 600px) {
  .mobile-padding { padding: 20px !important; }
  .mobile-center { text-align: center !important; }
  .container { width: 100% !important; max-width: 100% !important; }
  .mobile-button { width: 100% !important; }
  .mobile-button a { 
    display: block !important; 
    font-size: 18px !important;
    padding: 15px !important;
  }
}
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
<div style="display: none; max-height: 0; overflow: hidden;">Your email has been verified successfully!</div>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
<tr>
<td align="center" style="padding: 40px 10px;">
<!--[if mso]>
<table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
<tr>
<td align="center" valign="top" width="600">
<![endif]-->
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
<!-- Logo/Header -->
<tr>
<td align="center" style="padding: 40px 20px 20px 20px;">
<div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 50px;">
<h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">EMAIL VERIFIED ✓</h1>
</div>
</td>
</tr>
<!-- Success Message -->
<tr>
<td class="mobile-padding" style="padding: 20px 40px;">
<h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a202c; text-align: center;">
Congratulations, ${user.firstName}! 🎉
</h2>
<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568; text-align: center;">
Your email has been successfully verified. You can now enjoy full access to all features.
</p>
</td>
</tr>
<!-- Success Icon -->
<tr>
<td align="center" style="padding: 0 40px 30px 40px;">
<div style="width: 100px; height: 100px; background-color: #f0fff4; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
<svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#48bb78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</div>
</td>
</tr>
<!-- CTA Button -->
<tr>
<td class="mobile-padding" style="padding: 0 40px 40px 40px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-button">
<tr>
<td align="center" style="background-color: #667eea; border-radius: 8px;">
<a href="${loginUrl}" target="_blank" style="display: inline-block; width: 100%; padding: 16px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; box-sizing: border-box;">Login to Your Account →</a>
</td>
</tr>
</table>
</td>
</tr>
<!-- Next Steps -->
<tr>
<td style="padding: 0 40px 40px 40px; border-top: 1px solid #e2e8f0;">
<p style="margin: 20px 0 10px 0; font-size: 16px; font-weight: 600; color: #1a202c; text-align: center;">What's Next?</p>
<p style="margin: 0; font-size: 14px; line-height: 20px; color: #718096; text-align: center;">
✓ Complete your profile<br>
✓ Join upcoming sessions<br>
✓ Track your attendance
</p>
</td>
</tr>
</table>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
<!-- Footer -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
<tr>
<td align="center" style="padding: 20px;">
<p style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0;">
© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.<br>
<span style="font-size: 10px;">REF: ${timestamp}</span>
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = `Email Verified Successfully!

Congratulations, ${user.firstName}!

Your email has been successfully verified. You can now enjoy full access to all features.

Login to Your Account: ${loginUrl}

What's Next?
✓ Complete your profile
✓ Join upcoming sessions
✓ Track your attendance

© ${new Date().getFullYear()} Change Ambassadors. All rights reserved.`;

  return sendEmail({
    to: user.email,
    subject: 'Email Verified - Welcome to Change Ambassadors!',
    html: html,
    text: text
  });
};

// Export the new functions
module.exports.sendVerificationEmail = sendVerificationEmail;
module.exports.sendVerificationSuccessEmail = sendVerificationSuccessEmail;
