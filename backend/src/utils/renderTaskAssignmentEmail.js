const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const theme = require('../config/theme.config');

// Register Handlebars helpers
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('formatDate', function(date) {
  if (!date) return 'Not set';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
});

// Render task assignment notification email
function renderTaskAssignmentNotification(data) {
  try {
    const templatePath = path.join(__dirname, '../templates/task-assignment-notification.hbs');
    
    // Read the template
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Prepare data with defaults
    const templateData = {
      theme: theme,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary,
      headerBackground: theme.email.headerBackground,
      buttonBackground: theme.email.buttonBackground,
      buttonTextColor: theme.email.buttonTextColor,
      linkColor: theme.email.linkColor,
      borderColor: theme.email.borderColor,
      recipientName: data.recipientName || 'User',
      taskTitle: data.taskTitle || 'Untitled Task',
      taskDescription: data.taskDescription || '',
      projectName: data.projectName || 'Unknown Project',
      boardName: data.boardName || 'Unknown Board',
      creatorName: data.creatorName || 'Someone',
      dueDate: data.dueDate,
      priority: data.priority || 'medium',
      type: data.type || 'task_assigned',
      title: data.title || 'New Task Assignment',
      message: data.message || `You have been assigned to a new task`,
      taskUrl: data.taskUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${data.taskId}`,
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/notifications`,
      helpUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/help`,
      year: new Date().getFullYear()
    };
    
    // Compile with Handlebars
    const template = handlebars.compile(templateContent);
    const html = template(templateData);
    
    return html;
  } catch (error) {
    console.error('Error rendering task assignment notification template:', error);
    throw error;
  }
}

module.exports = {
  renderTaskAssignmentNotification
};
