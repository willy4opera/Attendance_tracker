#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function testUpload() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const tokenData = loginResponse.data.data;
    const token = loginResponse.data.token || tokenData.accessToken || tokenData.token;
    
    if (!token) {
      console.log('Login response:', loginResponse.data);
      throw new Error('No token found');
    }
    
    console.log('✓ Logged in successfully\n');

    // Test regular comment endpoint with multipart
    console.log('2. Testing comment upload...');
    
    const testImagePath = path.join(__dirname, 'test-upload.png');
    fs.writeFileSync(testImagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));

    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Test comment with image - ' + new Date().toLocaleString());
    form.append('images', fs.createReadStream(testImagePath), 'test-image.png');

    console.log('Sending request to /api/v1/comments...');
    
    const response = await axios.post(`${API_URL}/comments`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('\n✅ Upload successful!');
    console.log('Comment ID:', response.data.data.id);
    console.log('Content:', response.data.data.content);
    console.log('Attachments:', JSON.stringify(response.data.data.attachments, null, 2));

    // Clean up
    fs.unlinkSync(testImagePath);

  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
      if (error.code) console.error('Code:', error.code);
    }
  }
}

testUpload();
