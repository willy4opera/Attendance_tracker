const mjml2html = require('mjml');
const fs = require('fs');
const path = require('path');

// Generate context-specific messages based on dependency type and status
function generateContextMessage(data) {
  const { dependency, predecessorTask, successorTask, actionType } = data;
  
  const messages = {
    created: {
      FS: [
        `${predecessorTask?.title} must be completed before ${successorTask?.title} can begin.`,
        `Once ${predecessorTask?.title} is finished, work on ${successorTask?.title} can start.`,
        `${successorTask?.title} is waiting for ${predecessorTask?.title} to be completed.`
      ],
      SS: [
        `${predecessorTask?.title} and ${successorTask?.title} should start together.`,
        `Both tasks need to begin simultaneously for optimal workflow.`,
        `Coordinate the start of both tasks for best results.`
      ],
      FF: [
        `${predecessorTask?.title} and ${successorTask?.title} must finish at the same time.`,
        `Ensure both tasks complete together for project success.`,
        `Plan to wrap up both tasks simultaneously.`
      ],
      SF: [
        `${successorTask?.title} must finish when ${predecessorTask?.title} starts.`,
        `Complete ${successorTask?.title} before beginning ${predecessorTask?.title}.`,
        `${predecessorTask?.title} can only start after ${successorTask?.title} is done.`
      ]
    },
    updated: {
      FS: [
        `The dependency between ${predecessorTask?.title} and ${successorTask?.title} has been modified.`,
        `Updated: ${predecessorTask?.title} → ${successorTask?.title} workflow.`,
        `Dependency adjustment: Check the new timeline for your tasks.`
      ]
    },
    completed: {
      FS: [
        `Great news! ${predecessorTask?.title} is complete. You can now start ${successorTask?.title}.`,
        `${predecessorTask?.title} has finished. ${successorTask?.title} is ready to begin!`,
        `All clear! With ${predecessorTask?.title} done, proceed with ${successorTask?.title}.`
      ]
    }
  };
  
  const typeMessages = messages[actionType] || messages.created;
  const depMessages = typeMessages[dependency?.type] || typeMessages.FS;
  return depMessages[Date.now() % depMessages.length];
}

// Generate status-specific details
function generateStatusDetails(task, role) {
  const now = new Date();
  const statusInfo = {
    'In Progress': `Started ${Math.floor(Math.random() * 5) + 1} days ago`,
    'Pending': `Scheduled to start soon`,
    'Completed': `Finished on ${now.toLocaleDateString()}`,
    'Not Started': `Awaiting dependencies`,
    'todo': `Ready to begin`,
    'done': `Completed successfully`
  };
  
  return statusInfo[task?.status] || `Current status: ${task?.status}`;
}

// Render compact dependency notification email using MJML
function renderCompactDependencyNotification(data) {
  try {
    const mjmlPath = path.join(__dirname, '../templates/email/dependency-notification-compact.mjml');
    let mjmlTemplate = fs.readFileSync(mjmlPath, 'utf-8');
    
    // Generate unique content
    const timestamp = new Date();
    const timeString = timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const dateString = timestamp.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const contextMessage = generateContextMessage(data);
    const predStatus = generateStatusDetails(data.predecessorTask, 'predecessor');
    const succStatus = generateStatusDetails(data.successorTask, 'successor');
    
    // Create action-specific subject/title
    const titles = {
      created: 'New Dependency Created',
      updated: 'Dependency Updated', 
      completed: 'Ready to Start Next Task',
      deleted: 'Dependency Removed'
    };
    
    const title = titles[data.actionType] || 'Task Dependency Update';
    
    // Add more dynamic content to template
    mjmlTemplate = mjmlTemplate.replace(
      'Task Dependency Update - {{timestamp}}',
      `${title} - ${dateString} at ${timeString}`
    );
    
    mjmlTemplate = mjmlTemplate.replace(
      'A dependency has been {{actionType}} between your tasks.',
      contextMessage
    );
    
    // Add status details to template
    mjmlTemplate = mjmlTemplate.replace(
      'Status: {{predecessorTask.status}}',
      `Status: {{predecessorTask.status}}<br/><span style="font-size: 11px; color: #888;">${predStatus}</span>`
    );
    
    mjmlTemplate = mjmlTemplate.replace(
      'Status: {{successorTask.status}}',
      `Status: {{successorTask.status}}<br/><span style="font-size: 11px; color: #888;">${succStatus}</span>`
    );
    
    // Add priority/urgency indicator
    const urgency = data.actionType === 'completed' ? 
      '<div style="background-color: #4CAF50; color: white; padding: 8px; border-radius: 4px; margin-bottom: 15px; text-align: center; font-weight: bold;">✓ Ready to Start</div>' : 
      '';
    
    mjmlTemplate = mjmlTemplate.replace(
      '<mj-text font-size="14px" color="#333333" padding-bottom="20px">',
      `<mj-text font-size="14px" color="#333333" padding-bottom="20px">${urgency}`
    );
    
    // Variables for template
    const variables = {
      user: data.user || 'there',
      'dependency.type': data.dependency?.type || 'FS',
      'dependency.lagTime': data.dependency?.lagTime || 0,
      'predecessorTask.title': data.predecessorTask?.title || 'Previous Task',
      'predecessorTask.status': data.predecessorTask?.status || 'In Progress',
      'successorTask.title': data.successorTask?.title || 'Next Task',
      'successorTask.status': data.successorTask?.status || 'Pending',
      dashboardUrl: data.dashboardUrl || process.env.FRONTEND_URL || 'http://localhost:5173',
      year: timestamp.getFullYear(),
      timestamp: `${dateString} ${timeString}`,
      uniqueId: uniqueId,
      actionType: data.actionType || 'Updated'
    };
    
    // Replace variables in template
    let processedTemplate = mjmlTemplate;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, value);
    });
    
    // Convert MJML to HTML
    const { html, errors } = mjml2html(processedTemplate, {
      validationLevel: 'soft',
      minify: false
    });
    
    if (errors.length > 0) {
      console.warn('MJML conversion warnings:', errors);
    }
    
    return html;
  } catch (error) {
    console.error('Error rendering compact dependency notification:', error);
    throw error;
  }
}

module.exports = {
  renderCompactDependencyNotification
};
