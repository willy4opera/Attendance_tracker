#!/usr/bin/env node

/**
 * Simple test for comment creation
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function testSimpleComment() {
  try {
    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.data?.accessToken || loginResponse.data.token;
    console.log('Token obtained:', token ? '✓' : '✗');

    // Create simple comment without attachments first
    console.log('\nCreating simple comment...');
    const commentResponse = await axios.post(`${API_URL}/comments`, {
      taskId: 1, // Assuming task ID 1 exists
      content: 'Test comment without attachments'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Comment created!');
    console.log('Response:', JSON.stringify(commentResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSimpleComment();
