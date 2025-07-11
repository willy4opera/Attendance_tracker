#!/usr/bin/env node

/**
 * Test script to upload a video to YouTube
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const youtubeService = require('../src/services/youtubeService');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function createTestVideo() {
  console.log(`${colors.blue}Creating test video...${colors.reset}`);
  
  // For testing, we'll create a simple MP4 file using ffmpeg if available
  // Otherwise, we'll use any existing video file
  const testVideoPath = path.join(__dirname, 'test-video.mp4');
  
  // Check if ffmpeg is available
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    // Create a 5-second test video with ffmpeg
    await execPromise(`ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=30 -f lavfi -i sine=frequency=1000:duration=5 -c:v libx264 -c:a aac -y ${testVideoPath}`);
    console.log(`${colors.green}✓ Test video created${colors.reset}`);
    return testVideoPath;
  } catch (error) {
    console.log(`${colors.yellow}ffmpeg not available, looking for existing video files...${colors.reset}`);
    
    // Look for any MP4 file in the system
    try {
      const { stdout } = await execPromise('find /usr/share -name "*.mp4" -type f 2>/dev/null | head -1');
      const existingVideo = stdout.trim();
      
      if (existingVideo) {
        console.log(`${colors.green}✓ Found existing video: ${existingVideo}${colors.reset}`);
        return existingVideo;
      }
    } catch (e) {
      // Continue to create a dummy file
    }
    
    // Create a dummy file for testing (won't be a valid video)
    fs.writeFileSync(testVideoPath, 'This is a test video file for YouTube upload testing');
    console.log(`${colors.yellow}⚠ Created dummy test file (not a real video)${colors.reset}`);
    return testVideoPath;
  }
}

async function testYouTubeUpload() {
  console.log(`${colors.blue}YouTube Upload Test${colors.reset}`);
  console.log('==================\n');

  // Check if YouTube is authenticated
  if (!youtubeService.isAuthenticated()) {
    console.error(`${colors.red}✗ YouTube service is not authenticated!${colors.reset}`);
    console.log('Please run: node scripts/setup-youtube-auth.js');
    process.exit(1);
  }

  console.log(`${colors.green}✓ YouTube service is authenticated${colors.reset}\n`);

  try {
    // Create or find a test video
    const videoPath = await createTestVideo();
    
    // Check file size
    const stats = fs.statSync(videoPath);
    console.log(`Video file: ${videoPath}`);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

    // Prepare metadata
    const metadata = {
      title: `Test Video - ${new Date().toISOString()}`,
      description: 'This is a test video uploaded via Attendance Tracker API',
      tags: ['test', 'attendance-tracker', 'api-test']
    };

    console.log(`${colors.blue}Uploading video to YouTube...${colors.reset}`);
    console.log(`Title: ${metadata.title}`);
    console.log(`Description: ${metadata.description}`);
    console.log(`Tags: ${metadata.tags.join(', ')}\n`);

    // Upload the video
    const startTime = Date.now();
    const result = await youtubeService.uploadVideo(videoPath, metadata);
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n${colors.green}✓ Upload successful!${colors.reset}`);
    console.log(`Upload time: ${uploadTime} seconds\n`);
    
    console.log('Video Details:');
    console.log(`- Video ID: ${result.videoId}`);
    console.log(`- Video URL: ${result.videoUrl}`);
    console.log(`- Embed URL: ${result.embedUrl}`);
    console.log(`- Thumbnail: ${result.thumbnail}`);

    // Test deletion (optional)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\nDo you want to delete this test video? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          await youtubeService.deleteVideo(result.videoId);
          console.log(`${colors.green}✓ Video deleted successfully${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}✗ Error deleting video:${colors.reset}`, error.message);
        }
      }
      
      // Clean up test file if it was created
      if (videoPath.includes('test-video.mp4')) {
        try {
          fs.unlinkSync(videoPath);
          console.log(`${colors.green}✓ Test file cleaned up${colors.reset}`);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      rl.close();
      process.exit(0);
    });

  } catch (error) {
    console.error(`\n${colors.red}✗ Upload failed!${colors.reset}`);
    console.error('Error:', error.message);
    
    if (error.response && error.response.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Run the test
testYouTubeUpload();
