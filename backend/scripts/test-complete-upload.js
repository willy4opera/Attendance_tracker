#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function testCompleteUpload() {
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // 2. Create test image
    console.log('2. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-complete.png');
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC',
      'base64'
    );
    fs.writeFileSync(testImagePath, imageBuffer);
    console.log('✅ Test image created\n');

    // 3. Upload comment with image
    console.log('3. Uploading comment with image...');
    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Test comment with Cloudinary image - ' + new Date().toLocaleString());
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const startTime = Date.now();
    const response = await axios.post(`${API_URL}/comments`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 60000 // 60 second timeout
    });

    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Upload successful! (took ${uploadTime}s)\n`);
    
    // 4. Display results
    console.log('Comment Details:');
    console.log('- ID:', response.data.data.id);
    console.log('- Content:', response.data.data.content);
    console.log('- Created:', new Date(response.data.data.createdAt).toLocaleString());
    
    if (response.data.data.attachments && response.data.data.attachments.length > 0) {
      console.log('\nAttachments:');
      response.data.data.attachments.forEach((att, index) => {
        console.log(`\n${index + 1}. ${att.type.toUpperCase()}:`);
        console.log('   - URL:', att.url);
        if (att.publicId) console.log('   - Public ID:', att.publicId);
        if (att.format) console.log('   - Format:', att.format);
        if (att.width) console.log('   - Dimensions:', `${att.width}x${att.height}`);
        if (att.size) console.log('   - Size:', `${(att.size / 1024).toFixed(2)} KB`);
      });
      
      console.log('\n🎉 Media upload is working correctly!');
    } else {
      console.log('\n⚠️  No attachments found in response');
      console.log('Full response:', JSON.stringify(response.data.data, null, 2));
    }

    // 5. Test fetching comments with attachments
    console.log('\n4. Fetching comments to verify attachments...');
    const fetchResponse = await axios.get(`${API_URL}/comments/task/1?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const latestComment = fetchResponse.data.data.find(c => c.id === response.data.data.id);
    if (latestComment && latestComment.attachments && latestComment.attachments.length > 0) {
      console.log('✅ Attachments verified in fetched comment');
    } else {
      console.log('⚠️  Attachments not found in fetched comment');
    }

    // Clean up
    fs.unlinkSync(testImagePath);

  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - upload took too long');
    } else {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

console.log('🧪 Complete Media Upload Test\n');
console.log('This test will:');
console.log('- Login to the system');
console.log('- Create a test image');
console.log('- Upload it with a comment');
console.log('- Verify the upload worked\n');

testCompleteUpload();
