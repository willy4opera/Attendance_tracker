#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDebug() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.token;
    console.log('Logged in ✓\n');

    // Create form with image
    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Debug test');
    
    // Create small test image
    const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    form.append('images', imageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });

    // Test debug endpoint
    console.log('Testing debug endpoint...');
    const debugResponse = await axios.post('http://localhost:5000/api/v1/debug-upload/debug', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Debug response:', JSON.stringify(debugResponse.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDebug();
