#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function testWithDebug() {
  try {
    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.token;
    console.log('Logged in ✓\n');

    // First, let's see what the controller receives
    console.log('Creating comment without files...');
    const response = await axios.post(`${API_URL}/comments`, {
      taskId: 1,
      content: 'Debug test - checking controller'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response:', {
      id: response.data.data.id,
      content: response.data.data.content,
      hasAttachments: response.data.data.attachments?.length > 0,
      attachmentsCount: response.data.data.attachments?.length || 0
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testWithDebug();
