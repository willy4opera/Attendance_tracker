#!/usr/bin/env node

/**
 * Test comment creation with media uploads
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function getAuthToken() {
  try {
    // Login to get token
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    // Check different possible token locations
    const token = response.data.data?.accessToken || 
                  response.data.data?.token || 
                  response.data.accessToken ||
                  response.data.token;
    
    if (!token) {
      console.log('Login response:', JSON.stringify(response.data, null, 2));
      throw new Error('No token found in response');
    }
    
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error.response?.data || error.message);
    throw error;
  }
}

async function testCommentUpload() {
  console.log('🧪 Testing Comment Upload with Media\n');

  try {
    // Get auth token
    console.log('Getting authentication token...');
    const token = await getAuthToken();
    console.log('✅ Authenticated\n');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // First, let's get a valid task ID
    console.log('Getting task list...');
    const tasksResponse = await axios.get(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!tasksResponse.data.data || tasksResponse.data.data.length === 0) {
      throw new Error('No tasks found. Please create a task first.');
    }
    
    const taskId = tasksResponse.data.data[0].id;
    console.log(`✓ Using task ID: ${taskId}\n`);

    // Create test image
    console.log('Creating test image...');
    const testImagePath = path.join(__dirname, 'test-comment-image.png');
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('✓ Test image created\n');

    // Create form data
    const form = new FormData();
    form.append('taskId', taskId.toString());
    form.append('content', 'Test comment with image upload - ' + new Date().toLocaleString());
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    // Send request
    console.log('Uploading comment with image...');
    const response = await axios.post(`${API_URL}/comments`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Comment created successfully!');
    console.log('\nComment details:');
    console.log(`- ID: ${response.data.data.id}`);
    console.log(`- Content: ${response.data.data.content}`);
    
    if (response.data.data.attachments && response.data.data.attachments.length > 0) {
      console.log('\nAttachments:');
      response.data.data.attachments.forEach((att, index) => {
        console.log(`\n${index + 1}. ${att.type}:`);
        console.log(`   - URL: ${att.url}`);
        if (att.publicId) console.log(`   - Public ID: ${att.publicId}`);
        if (att.format) console.log(`   - Format: ${att.format}`);
      });
    } else {
      console.log('\n⚠️  No attachments found in response');
    }

    // Clean up
    fs.unlinkSync(testImagePath);

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Check if server is running
axios.get(`${API_URL}/health`)
  .then(() => {
    console.log('Server is running at', API_URL);
    testCommentUpload();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server first.');
    console.log('Run: npm start');
  });
