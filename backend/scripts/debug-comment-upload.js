#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function debugCommentUpload() {
  try {
    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.data?.accessToken || loginResponse.data.token;
    console.log('Token:', token ? '✓' : '✗');

    // Test with JSON first (no files)
    console.log('\nTesting JSON comment creation...');
    const jsonResponse = await axios.post(`${API_URL}/comments`, {
      taskId: 1,
      content: 'Test comment via JSON - ' + new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ JSON comment created!');
    console.log('Comment ID:', jsonResponse.data.data.id);
    console.log('Attachments:', jsonResponse.data.data.attachments);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugCommentUpload();
