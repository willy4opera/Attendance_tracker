#!/usr/bin/env node

/**
 * Test YouTube upload with a real video file
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const youtubeService = require('../src/services/youtubeService');

async function testWithRealVideo() {
  console.log('🎥 YouTube Upload Test with Real Video\n');

  // Check authentication
  if (!youtubeService.isAuthenticated()) {
    console.error('❌ YouTube service is not authenticated!');
    process.exit(1);
  }

  console.log('✅ YouTube service is authenticated\n');

  // Use the webm video we found
  const videoPath = '/usr/share/help/hi/gnome-help/figures/display-dual-monitors.webm';
  
  if (!fs.existsSync(videoPath)) {
    console.error('❌ Video file not found:', videoPath);
    process.exit(1);
  }

  const stats = fs.statSync(videoPath);
  console.log(`📹 Using video: ${videoPath}`);
  console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB\n`);

  try {
    console.log('⬆️  Uploading to YouTube...\n');
    
    const startTime = Date.now();
    const result = await youtubeService.uploadVideo(videoPath, {
      title: 'Attendance Tracker Test - ' + new Date().toLocaleString(),
      description: 'Test video upload from Attendance Tracker application. This is a test of the YouTube API integration.',
      tags: ['test', 'attendance-tracker', 'demo']
    });
    
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Upload successful!');
    console.log(`⏱️  Upload time: ${uploadTime} seconds\n`);
    console.log('📺 Video Details:');
    console.log(`   - Video ID: ${result.videoId}`);
    console.log(`   - Video URL: ${result.videoUrl}`);
    console.log(`   - Embed URL: ${result.embedUrl}`);
    console.log(`   - Thumbnail: ${result.thumbnail}`);
    
    console.log('\n🎉 YouTube integration is working perfectly!');
    console.log('You can view the video at:', result.videoUrl);

  } catch (error) {
    console.error('\n❌ Upload failed!');
    console.error('Error:', error.message);
    
    if (error.response && error.response.data) {
      console.error('\n🌐 API Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    // Common error troubleshooting
    if (error.message.includes('quotaExceeded')) {
      console.error('\n⚠️  YouTube API quota exceeded. Try again tomorrow.');
    } else if (error.message.includes('forbidden')) {
      console.error('\n⚠️  Check that your YouTube channel is verified and can upload videos.');
    }
  }
}

// Run the test
testWithRealVideo();
