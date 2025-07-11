#!/usr/bin/env node

/**
 * Simple test to verify YouTube upload functionality
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const youtubeService = require('../src/services/youtubeService');

async function quickTest() {
  console.log('🎥 YouTube Upload Quick Test\n');

  // Check authentication
  if (!youtubeService.isAuthenticated()) {
    console.error('❌ YouTube service is not authenticated!');
    console.log('Please run: node scripts/setup-youtube-auth.js');
    process.exit(1);
  }

  console.log('✅ YouTube service is authenticated\n');

  // Create a minimal test file
  const testFile = path.join(__dirname, 'minimal-test.mp4');
  
  // Create a very small dummy file (this won't be a valid video, but tests the upload flow)
  const minimalContent = Buffer.from('Test video content for YouTube API testing');
  fs.writeFileSync(testFile, minimalContent);
  
  console.log(`📄 Created test file: ${testFile}`);
  console.log(`📏 File size: ${minimalContent.length} bytes\n`);

  try {
    console.log('⬆️  Uploading to YouTube...');
    
    const result = await youtubeService.uploadVideo(testFile, {
      title: 'API Test - ' + new Date().toLocaleString(),
      description: 'Testing YouTube API integration',
      tags: ['test']
    });

    console.log('\n✅ Upload completed!');
    console.log('📺 Video URL:', result.videoUrl);
    console.log('🆔 Video ID:', result.videoId);
    
    // Note about the video
    console.log('\n⚠️  Note: The uploaded file was a dummy test file.');
    console.log('YouTube will process it but it won\'t be playable.');
    console.log('This test confirms the API integration is working.\n');

  } catch (error) {
    console.error('\n❌ Upload failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOENT') {
      console.error('\n🔍 File not found. Make sure the file path is correct.');
    } else if (error.response) {
      console.error('\n🌐 API Response Error:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    // Clean up
    try {
      fs.unlinkSync(testFile);
      console.log('🧹 Test file cleaned up');
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run the test
quickTest();
