#!/usr/bin/env node

/**
 * Direct test for media upload
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function testMediaUpload() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.data?.accessToken || loginResponse.data.token;
    console.log('✓ Token obtained\n');

    // Create test image
    console.log('2. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('✓ Test image created\n');

    // Create form data
    const form = new FormData();
    form.append('taskId', '1'); // Using task ID 1
    form.append('content', 'Test comment with Cloudinary image upload - ' + new Date().toLocaleString());
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    // Send request
    console.log('3. Uploading comment with image...');
    const response = await axios.post(`${API_URL}/comments`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('\n✅ Success!');
    console.log('Comment ID:', response.data.data.id);
    console.log('Content:', response.data.data.content);
    
    if (response.data.data.attachments && response.data.data.attachments.length > 0) {
      console.log('\nAttachments:');
      response.data.data.attachments.forEach((att, index) => {
        console.log(`\n${index + 1}. ${att.type}:`);
        console.log(`   - URL: ${att.url}`);
        if (att.publicId) console.log(`   - Public ID: ${att.publicId}`);
        if (att.format) console.log(`   - Format: ${att.format}`);
        if (att.width) console.log(`   - Dimensions: ${att.width}x${att.height}`);
      });
    } else {
      console.log('\n⚠️  No attachments in response');
      console.log('Full response:', JSON.stringify(response.data.data, null, 2));
    }

    // Clean up
    fs.unlinkSync(testImagePath);

  } catch (error) {
    console.error('\n❌ Error!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - Cloudinary upload may be slow');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testMediaUpload();
