const nodemailer = require('nodemailer');
const mjml = require('mjml');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

/**
 * Enhanced email sender with Gmail-optimized settings
 */
class EmailSender {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
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
  }

  /**
   * Send email with proper Gmail headers
   */
  async sendEmail(options) {
    try {
      // Ensure proper headers for Gmail
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Change Ambassadors',
          address: process.env.EMAIL_USER
        },
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: {
          'MIME-Version': '1.0',
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Mailer': 'Change Ambassadors Mailer',
          'List-Unsubscribe': `<mailto:unsubscribe@${process.env.EMAIL_USER.split('@')[1]}>`
        },
        // Force HTML content type
        alternatives: [{
          contentType: 'text/html; charset=utf-8',
          content: options.html
        }]
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  /**
   * Compile MJML template with inline styles for Gmail
   */
  async compileMJMLTemplate(templatePath, data) {
    const mjmlContent = await fs.readFile(templatePath, 'utf8');
    const template = handlebars.compile(mjmlContent);
    const compiledMJML = template(data);
    
    // MJML options optimized for Gmail
    const { html, errors } = mjml(compiledMJML, {
      validationLevel: 'soft',
      minify: false,
      keepComments: false,
      beautify: true,
      juiceOptions: {
        preserveImportant: true,
        preserveMediaQueries: false,
        preserveFontFaces: false,
        preserveKeyFrames: false,
        preservePseudos: false,
        insertPreservedExtraCss: false,
        removeStyleTags: false,
        extraCss: '',
        inlinePseudoElements: false,
        applyStyleTags: true,
        removeStyleTags: false,
        preserveMediaQueries: false,
        applyWidthAttributes: true,
        applyHeightAttributes: true,
        applyAttributesTableElements: true
      }
    });

    if (errors.length > 0) {
      console.warn('MJML warnings:', errors);
    }

    return html;
  }
}

module.exports = new EmailSender();
