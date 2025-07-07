require('dotenv').config();
const emailTemplateEngine = require('./src/utils/emailTemplateEngine');
const fs = require('fs').promises;

async function previewEmail() {
  const testUser = {
    email: 'biwillzcomp@gmail.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'Administrator',
    department: 'IT Department'
  };

  console.log('Generating email preview...');
  
  try {
    const html = await emailTemplateEngine.renderWelcomeEmail(testUser);
    await fs.writeFile('email-preview.html', html);
    console.log('Email preview saved to email-preview.html');
    console.log('Open this file in a browser to see how the email will look.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

previewEmail();
