#!/usr/bin/env node
require('dotenv').config();

/**
 * One-time setup script to authenticate with YouTube
 * Run this script to get the initial refresh token
 */

const readline = require('readline');
const youtubeService = require('../src/services/youtubeService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('YouTube API Setup for Attendance Tracker');
console.log('========================================\n');

console.log('This script will help you set up YouTube API authentication.');
console.log('You will need to:');
console.log('1. Visit the authorization URL');
console.log('2. Login with the Google account that owns the YouTube channel');
console.log('3. Grant permissions to upload videos');
console.log('4. Copy the authorization code back here\n');

// Check if already authenticated
if (youtubeService.isAuthenticated()) {
  rl.question('YouTube is already authenticated. Re-authenticate? (y/N): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      process.exit(0);
    }
    startAuth();
  });
} else {
  startAuth();
}

function startAuth() {
  const authUrl = youtubeService.getAuthUrl();
  
  console.log('\nPlease visit this URL to authorize the application:');
  console.log('\n' + authUrl + '\n');
  
  rl.question('Enter the authorization code: ', async (code) => {
    try {
      console.log('\nExchanging code for tokens...');
      const tokens = await youtubeService.getTokensFromCode(code);
      
      console.log('\n✅ Success! YouTube authentication completed.');
      console.log('Tokens have been saved and will be used for all video uploads.');
      console.log('\nToken details:');
      console.log('- Access Token: ' + (tokens.access_token ? '✓' : '✗'));
      console.log('- Refresh Token: ' + (tokens.refresh_token ? '✓' : '✗'));
      console.log('- Expiry: ' + new Date(tokens.expiry_date).toLocaleString());
      
    } catch (error) {
      console.error('\n❌ Error during authentication:', error.message);
      console.error('Please check the authorization code and try again.');
    }
    
    rl.close();
  });
}
