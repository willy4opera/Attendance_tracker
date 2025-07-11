#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function finalTest() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in\n');

    // Create actual file on disk
    const imagePath = path.join(__dirname, 'final-test.png');
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8/5+hnoEIwDiqkL4KAcziC+QkO6ogAAAAAElFTkSuQmCC',
      'base64'
    );
    fs.writeFileSync(imagePath, imageBuffer);
    console.log('2. Test image created\n');

    // Create form data exactly as expected by multer
    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Final test with real file - ' + new Date().toISOString());
    
    // Use createReadStream for the file
    form.append('images', fs.createReadStream(imagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    console.log('3. Sending multipart request...');
    console.log('   Form boundaries:', form.getBoundary());
    
    const response = await axios.post('http://localhost:5000/api/v1/comments', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('\n✅ Request successful!\n');
    console.log('Response:');
    console.log('- Comment ID:', response.data.data.id);
    console.log('- Content:', response.data.data.content);
    console.log('- Attachments:', response.data.data.attachments);
    
    if (response.data.data.attachments && response.data.data.attachments.length > 0) {
      console.log('\n🎉 SUCCESS! Attachments were uploaded:');
      response.data.data.attachments.forEach((att, i) => {
        console.log(`${i+1}. ${att.type}: ${att.url}`);
      });
    }

    // Clean up
    fs.unlinkSync(imagePath);

  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

console.log('🧪 Final Media Upload Test\n');
finalTest();
