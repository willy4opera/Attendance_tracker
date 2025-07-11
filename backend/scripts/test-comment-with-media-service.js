#!/usr/bin/env node

/**
 * Test comment creation with image upload using media service
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCommentWithMediaService() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in\n');

    // Create a test image (same as in test-media-upload.js)
    console.log('2. Creating test image...');
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
    console.log('✅ Test image created');

    // Create form data with image
    const form = new FormData();
    form.append('taskId', '13'); // Using task 13 as it has existing comments
    form.append('content', 'Test comment with Cloudinary image via media service - ' + new Date().toISOString());
    
    // Add the image file
    form.append('images', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    console.log('\n3. Sending comment with image...');
    console.log('   Image size:', pngBuffer.length, 'bytes');
    console.log('   Target task: 13');
    
    const response = await axios.post('http://localhost:5000/api/v1/comments', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('\n✅ Request successful!\n');
    console.log('Response:');
    console.log('- Comment ID:', response.data.data.id);
    console.log('- Content:', response.data.data.content);
    console.log('- Task ID:', response.data.data.taskId);
    console.log('- Attachments:', JSON.stringify(response.data.data.attachments, null, 2));
    
    if (response.data.data.attachments && response.data.data.attachments.length > 0) {
      const imageAttachments = response.data.data.attachments.filter(att => att.type === 'image');
      if (imageAttachments.length > 0) {
        console.log('\n🎉 SUCCESS! Image was uploaded to Cloudinary:');
        imageAttachments.forEach((att, i) => {
          console.log(`\n${i+1}. Image Details:`);
          console.log(`   - URL: ${att.url}`);
          console.log(`   - Public ID: ${att.publicId || 'N/A'}`);
          console.log(`   - Format: ${att.format || 'N/A'}`);
          console.log(`   - Size: ${att.width}x${att.height} pixels`);
          console.log(`   - File size: ${att.size} bytes`);
        });
      }
    }

    // Clean up
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n✅ Cleaned up test file');
    }

  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Server might be down.');
      console.error('Request details:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

console.log('📷 Comment with Image Upload Test (Using Media Service Pattern)\n');
console.log('========================================\n');
testCommentWithMediaService();
