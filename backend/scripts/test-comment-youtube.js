#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCommentWithYouTube() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in\n');

    // Create a small test video file
    const videoPath = path.join(__dirname, 'test-video.mp4');
    
    // Check if we have an existing video file
    const existingVideos = [
      '/usr/share/help/hi/gnome-help/figures/display-dual-monitors.webm',
      '/usr/share/pixmaps/faces/video.mp4',
      '/var/www/html/Attendance_tracker/backend/test-video.mp4'
    ];
    
    let useVideo = null;
    for (const video of existingVideos) {
      if (fs.existsSync(video)) {
        useVideo = video;
        console.log(`2. Using existing video: ${video}`);
        break;
      }
    }
    
    if (!useVideo) {
      // Create a minimal video file for testing
      console.log('2. Creating test video file...');
      // This creates a very small valid MP4 file
      const minimalMp4 = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
        0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
        0x66, 0x72, 0x65, 0x65, 0x00, 0x00, 0x00, 0x00, 0x6D, 0x64, 0x61, 0x74
      ]);
      fs.writeFileSync(videoPath, minimalMp4);
      useVideo = videoPath;
    }

    // Create form data with video
    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Test comment with YouTube video upload - ' + new Date().toISOString());
    
    // Add the video file
    form.append('videos', fs.createReadStream(useVideo), {
      filename: 'test-video.mp4',
      contentType: 'video/mp4'
    });

    // Optional: Add YouTube metadata
    form.append('videoMetadata', JSON.stringify({
      title: 'Test Video from Comment API',
      description: 'Testing video upload through comment endpoint',
      tags: ['test', 'api'],
      privacyStatus: 'private'
    }));

    console.log('\n3. Sending comment with video...');
    console.log('   Video size:', fs.statSync(useVideo).size, 'bytes');
    
    const response = await axios.post('http://localhost:5000/api/v1/comments', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000 // 5 minutes timeout for video upload
    });

    console.log('\n✅ Request successful!\n');
    console.log('Response:');
    console.log('- Comment ID:', response.data.data.id);
    console.log('- Content:', response.data.data.content);
    console.log('- Attachments:', JSON.stringify(response.data.data.attachments, null, 2));
    
    if (response.data.data.attachments && response.data.data.attachments.length > 0) {
      const videoAttachments = response.data.data.attachments.filter(att => att.type === 'video');
      if (videoAttachments.length > 0) {
        console.log('\n🎉 SUCCESS! Video was uploaded to YouTube:');
        videoAttachments.forEach((att, i) => {
          console.log(`${i+1}. Video URL: ${att.url}`);
          console.log(`   Video ID: ${att.videoId || 'N/A'}`);
          console.log(`   Thumbnail: ${att.thumbnail || 'N/A'}`);
        });
      }
    }

    // Clean up if we created a test file
    if (useVideo === videoPath && fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

console.log('🎥 Comment with YouTube Video Upload Test\n');
testCommentWithYouTube();
