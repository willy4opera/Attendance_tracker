const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const theme = require('../config/theme.config');

// Register Handlebars helpers
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('if', function(conditional, options) {
  if (conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// Render dependency notification email
function renderDependencyNotification(data) {
  try {
    const templatePath = path.join(__dirname, '../templates/dependency-notification.hbs');
    
    // Read the template synchronously
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Prepare data with defaults
    const templateData = {
      ...data,
      theme: theme,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary,
      headerBackground: theme.email.headerBackground,
      buttonBackground: theme.email.buttonBackground,
      buttonTextColor: theme.email.buttonTextColor,
      linkColor: theme.email.linkColor,
      borderColor: theme.email.borderColor,
      appUrl: data.appUrl || process.env.FRONTEND_URL || 'http://localhost:5173'
    };
    
    // Add dependency description based on type
    if (data.dependency && data.dependency.type) {
      const depType = data.dependency.type;
      let depDescription = 'The predecessor task must be completed before the successor task can begin.';
      
      if (depType === 'SS') {
        depDescription = 'Both tasks must start together.';
      } else if (depType === 'FF') {
        depDescription = 'Both tasks must finish together.';
      } else if (depType === 'SF') {
        depDescription = 'The successor task must finish before the predecessor task can begin.';
      }
      
      templateData.dependencyDescription = depDescription;
    }
    
    // Compile with Handlebars
    const template = handlebars.compile(templateContent);
    const html = template(templateData);
    
    return html;
  } catch (error) {
    console.error('Error rendering dependency notification template:', error);
    throw error;
  }
}

module.exports = {
  renderDependencyNotification
};
