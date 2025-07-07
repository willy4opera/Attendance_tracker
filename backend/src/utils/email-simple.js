// Simple email utility with professional HTML templates
const nodemailer = require('nodemailer');

// Professional HTML email template
const getProfessionalTemplate = (content) => {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.subject}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1a1a2e; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Change Ambassadors</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Attendance Tracking System</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${content.body}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                                © ${year} Change Ambassadors. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #6c757d; font-size: 12px;">
                                ${process.env.COMPANY_ADDRESS || 'Your Company Address'}
                            </p>
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0; color: #999999; font-size: 11px;">
                                    This email was sent to ${content.recipientEmail}. 
                                    If you have any questions, please contact our support team.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
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
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
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

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const welcomeBody = `
    <h2 style="color: #1a1a2e; margin: 0 0 20px 0;">Welcome to Change Ambassadors!</h2>
    
    <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">
        Hi ${user.firstName},
    </p>
    
    <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
        We're thrilled to have you join our attendance tracking platform. Your account has been successfully created, 
        and you're all set to start tracking attendance efficiently.
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 30px 0;">
        <h3 style="color: #1a1a2e; margin: 0 0 15px 0;">Your Account Details:</h3>
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">${user.email}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Name:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">${user.firstName} ${user.lastName}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #666;">Role:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">${user.role || 'User'}</td>
            </tr>
            ${user.department ? `
            <tr>
                <td style="padding: 8px 0; color: #666;">Department:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">${user.department}</td>
            </tr>
            ` : ''}
        </table>
    </div>
    
    <div style="margin: 30px 0;">
        <h3 style="color: #1a1a2e; margin: 0 0 15px 0;">Getting Started:</h3>
        <p style="color: #555; line-height: 1.6; margin: 0 0 10px 0;">
            Here are some quick tips to help you get the most out of our platform:
        </p>
        <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
            <li><strong>Check In/Out:</strong> Mark your attendance with just one click</li>
            <li><strong>View History:</strong> Access your complete attendance records</li>
            <li><strong>Session Management:</strong> View and enroll in upcoming sessions</li>
            <li><strong>Reports:</strong> Generate detailed attendance reports</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
           style="display: inline-block; padding: 14px 30px; background-color: #007bff; color: #ffffff; 
                  text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Log In to Your Account
        </a>
    </div>
    
    <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 40px;">
        <p style="color: #666; text-align: center; margin: 0;">
            Need help? Our support team is here for you.<br>
            Email us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}" 
                          style="color: #007bff; text-decoration: none;">${process.env.SUPPORT_EMAIL || 'support@changeambassadors.com'}</a>
        </p>
    </div>
  `;
  
  const html = getProfessionalTemplate({
    subject: 'Welcome to Change Ambassadors',
    body: welcomeBody,
    recipientEmail: user.email
  });
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Change Ambassadors - Attendance Tracker',
    html,
    text: `Welcome ${user.firstName}! Your account has been successfully created. You can now log in at ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  getProfessionalTemplate
};
