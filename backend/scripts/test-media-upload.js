#!/usr/bin/env node

/**
 * Test media upload functionality for comments
 */

require('dotenv').config();
const mediaService = require('../src/services/mediaService');
const fs = require('fs');
const path = require('path');

async function testMediaUpload() {
  console.log('🎨 Media Upload Test\n');

  // Check configurations
  console.log('Checking configurations...');
  console.log(`- Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗'}`);
  console.log(`- YouTube: ${require('../src/services/youtubeService').isAuthenticated() ? '✓' : '✗'}\n`);

  try {
    // Test image upload
    console.log('📷 Testing image upload to Cloudinary...');
    
    // Create a test image
    const testImagePath = path.join(__dirname, 'test-media-image.png');
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64,
      0x08, 0x02, 0x00, 0x00, 0x00, 0xFF, 0x80, 0x02,
      0x03, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x78, 0xDA, 0x62, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0xE2,
      0x26, 0x05, 0x9B, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testImagePath, pngBuffer);

    const imageFile = {
      path: testImagePath,
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: pngBuffer.length
    };

    const imageResult = await mediaService.uploadImage(imageFile);
    console.log('✅ Image uploaded successfully!');
    console.log(`   - URL: ${imageResult.url}`);
    console.log(`   - Public ID: ${imageResult.publicId}`);
    console.log(`   - Format: ${imageResult.format}\n`);

    // Test video upload (if YouTube is authenticated)
    if (require('../src/services/youtubeService').isAuthenticated()) {
      console.log('🎥 Testing video upload to YouTube...');
      
      const videoPath = '/usr/share/help/hi/gnome-help/figures/display-dual-monitors.webm';
      if (fs.existsSync(videoPath)) {
        const videoFile = {
          path: videoPath,
          originalname: 'test-video.webm',
          mimetype: 'video/webm',
          size: fs.statSync(videoPath).size
        };

        const videoResult = await mediaService.uploadVideo(videoFile, {
          title: 'Media Service Test Video',
          privacyStatus: 'private'
        });
        
        console.log('✅ Video uploaded successfully!');
        console.log(`   - Video ID: ${videoResult.videoId}`);
        console.log(`   - URL: ${videoResult.videoUrl}`);
        console.log(`   - Privacy: ${videoResult.privacyStatus}\n`);
      } else {
        console.log('⚠️  No test video file found, skipping video test\n');
      }
    } else {
      console.log('⚠️  YouTube not authenticated, skipping video test\n');
    }

    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    console.log('🎉 Media upload tests completed!');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
  }
}

// Run the test
testMediaUpload();
