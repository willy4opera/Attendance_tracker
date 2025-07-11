#!/usr/bin/env node

/**
 * Test YouTube upload with privacy settings
 */

require('dotenv').config();
const fs = require('fs');
const youtubeService = require('../src/services/youtubeService');

async function testPrivateUpload() {
  console.log('🎥 YouTube Private Upload Test\n');

  if (!youtubeService.isAuthenticated()) {
    console.error('❌ YouTube service is not authenticated!');
    process.exit(1);
  }

  console.log('✅ YouTube service is authenticated\n');

  // Use the same video file
  const videoPath = '/usr/share/help/hi/gnome-help/figures/display-dual-monitors.webm';
  
  if (!fs.existsSync(videoPath)) {
    console.error('❌ Video file not found:', videoPath);
    process.exit(1);
  }

  const stats = fs.statSync(videoPath);
  console.log(`📹 Using video: ${videoPath}`);
  console.log(`📏 File size: ${(stats.size / 1024).toFixed(2)} KB\n`);

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Ask for privacy preference
  console.log('🔒 Privacy Options:');
  console.log('1. private - Only you can view');
  console.log('2. unlisted - Anyone with link can view (default)');
  console.log('3. public - Everyone can view and search\n');

  rl.question('Choose privacy level (1-3, default: 2): ', async (choice) => {
    let privacyStatus = 'unlisted';
    
    switch(choice) {
      case '1':
        privacyStatus = 'private';
        break;
      case '3':
        privacyStatus = 'public';
        break;
      default:
        privacyStatus = 'unlisted';
    }

    console.log(`\n⬆️  Uploading as ${privacyStatus.toUpperCase()}...\n`);

    try {
      const startTime = Date.now();
      const result = await youtubeService.uploadVideo(videoPath, {
        title: `Attendance Tracker ${privacyStatus.toUpperCase()} Test - ${new Date().toLocaleString()}`,
        description: `Test video upload with ${privacyStatus} privacy setting from Attendance Tracker application.`,
        tags: ['test', 'attendance-tracker', privacyStatus],
        privacyStatus: privacyStatus
      });
      
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('\n✅ Upload successful!');
      console.log(`⏱️  Upload time: ${uploadTime} seconds\n`);
      console.log('📺 Video Details:');
      console.log(`   - Video ID: ${result.videoId}`);
      console.log(`   - Privacy: ${result.privacyStatus}`);
      console.log(`   - Channel ID: ${result.channelId}`);
      console.log(`   - Video URL: ${result.videoUrl}`);
      console.log(`   - Embed URL: ${result.embedUrl}`);
      console.log(`   - Thumbnail: ${result.thumbnail}`);
      
      if (privacyStatus === 'private') {
        console.log('\n🔒 Note: This video is PRIVATE - only you can view it');
      } else if (privacyStatus === 'unlisted') {
        console.log('\n🔗 Note: This video is UNLISTED - only people with the link can view it');
      } else {
        console.log('\n🌍 Note: This video is PUBLIC - everyone can view and search for it');
      }

    } catch (error) {
      console.error('\n❌ Upload failed!');
      console.error('Error:', error.message);
      
      if (error.response && error.response.data) {
        console.error('\n🌐 API Response:');
        console.error(JSON.stringify(error.response.data, null, 2));
      }
    }

    rl.close();
  });
}

// Run the test
testPrivateUpload();
