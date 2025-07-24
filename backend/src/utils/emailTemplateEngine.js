const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const mjml2html = require('mjml');

// Register Handlebars helpers
handlebars.registerHelper('if', function(conditional, options) {
  if (conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// Render welcome email
async function renderWelcomeEmail(user) {
  try {
    const templatePath = path.join(__dirname, '../templates/email/welcome-modern.mjml');
    
    // Read the MJML template
    const mjmlTemplate = await fs.readFile(templatePath, 'utf-8');
    
    // Prepare data
    const templateData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role || 'User',
      department: user.department,
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@changeambassadors.com',
      currentYear: new Date().getFullYear(),
      companyName: process.env.COMPANY_NAME || 'Change Ambassadors',
      companyAddress: process.env.COMPANY_ADDRESS || 'Your Company Address',
      recipientEmail: user.email
    };
    
    // Compile with Handlebars
    const template = handlebars.compile(mjmlTemplate);
    const mjmlOutput = template(templateData);
    
    // Convert MJML to HTML
    const { html, errors } = mjml2html(mjmlOutput, {
      validationLevel: 'soft',
      keepComments: false,
      
    });
    
    if (errors.length > 0) {
      console.warn('MJML conversion warnings:', errors);
    }
    
    return html;
  } catch (error) {
    console.error('Error rendering template:', error);
    throw error;
  }
}

module.exports = {
  renderWelcomeEmail
};
