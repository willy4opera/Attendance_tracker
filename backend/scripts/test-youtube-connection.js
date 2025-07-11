#!/usr/bin/env node

require('dotenv').config();
const youtubeService = require('../src/services/youtubeService');

console.log('Testing YouTube API Configuration...\n');

console.log('Environment Variables:');
console.log('- CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('- CLIENT_SECRET:', process.env.YOUTUBE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
console.log('- API_KEY:', process.env.YOUTUBE_API_KEY ? '✓ Set' : '✗ Missing');
console.log('- REDIRECT_URI:', process.env.YOUTUBE_REDIRECT_URI || 'Not set');

console.log('\nAuthentication Status:');
console.log('- Authenticated:', youtubeService.isAuthenticated() ? '✓ Yes' : '✗ No');

if (!youtubeService.isAuthenticated()) {
  console.log('\nTo authenticate, run: node scripts/setup-youtube-auth.js');
  const authUrl = youtubeService.getAuthUrl();
  console.log('\nOr visit this URL manually:');
  console.log(authUrl);
}

process.exit(0);
