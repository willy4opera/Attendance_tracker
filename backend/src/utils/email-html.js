// Simple HTML email utility that works reliably
'use strict';

require('dotenv').config();

// Get nodemailer with cache clearing
function getNodemailer() {
  delete require.cache[require.resolve('nodemailer')];
  return require('nodemailer');
}

// Create simple but professional HTML template
function createWelcomeHTML(user) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Change Ambassadors</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0;">Attendance Tracking System</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #333;">Welcome, ${user.firstName}!</h2>
            
            <p style="color: #555; line-height: 1.6;">
                We're excited to have you join Change Ambassadors. Your account has been successfully created 
                and you're all set to start tracking attendance.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
                <h3 style="color: #333; margin-top: 0;">Your Account Details:</h3>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role || 'User'}</p>
                ${user.department ? `<p style="margin: 5px 0;"><strong>Department:</strong> ${user.department}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                   style="display: inline-block; padding: 12px 30px; background-color: #007bff; 
                          color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Log In to Your Account
                </a>
            </div>
            
            <p style="color: #666; text-align: center;">
                Need help? Contact us at<br>
                <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}" 
                   style="color: #007bff;">${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #666; margin: 0; font-size: 14px;">
                © ${new Date().getFullYear()} Change Ambassadors. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
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

    // Ensure proper content type
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Change Ambassadors'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || 'Please enable HTML to view this email.',
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

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const html = createWelcomeHTML(user);
  const text = `
Welcome to Change Ambassadors!

Hi ${user.firstName},

We're excited to have you join Change Ambassadors. Your account has been successfully created.

Your Account Details:
- Email: ${user.email}
- Name: ${user.firstName} ${user.lastName}
- Role: ${user.role || 'User'}
${user.department ? `- Department: ${user.department}` : ''}

Log in at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login

Need help? Contact us at ${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}

Best regards,
The Change Ambassadors Team
  `.trim();

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Change Ambassadors',
    html: html,
    text: text
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail
};
