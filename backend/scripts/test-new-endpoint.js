#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function testNewEndpoint() {
  try {
    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.data?.accessToken;
    console.log('✓ Logged in\n');

    // Create test image
    const testImagePath = path.join(__dirname, 'test.png');
    fs.writeFileSync(testImagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));

    // Test new endpoint
    console.log('Testing new endpoint...');
    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Test from new endpoint');
    form.append('image', fs.createReadStream(testImagePath));

    const response = await axios.post(`${API_URL}/test-comment-upload/test-upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Clean up
    fs.unlinkSync(testImagePath);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testNewEndpoint();
