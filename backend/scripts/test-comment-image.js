#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCommentWithImage() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in\n');

    // Create a test image
    console.log('2. Creating test image...');
    const imagePath = path.join(__dirname, 'test-comment-image.png');
    
    // Create a small valid PNG image
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x0A,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58,
      0xEA, 0x00, 0x00, 0x00, 0x15, 0x49, 0x44, 0x41,
      0x54, 0x78, 0xDA, 0x62, 0x62, 0x00, 0x04, 0x00,
      0x00, 0xFF, 0xFF, 0x00, 0x0F, 0x00, 0x03, 0x03,
      0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x79, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(imagePath, pngBuffer);
    console.log('✅ Test image created');

    // Create form data with image
    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Test comment with Cloudinary image upload - ' + new Date().toISOString());
    
    // Add the image file
    form.append('images', fs.createReadStream(imagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    console.log('\n3. Sending comment with image...');
    console.log('   Image size:', pngBuffer.length, 'bytes');
    
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
    console.log('- Attachments:', JSON.stringify(response.data.data.attachments, null, 2));
    
    if (response.data.data.attachments && response.data.data.attachments.length > 0) {
      const imageAttachments = response.data.data.attachments.filter(att => att.type === 'image');
      if (imageAttachments.length > 0) {
        console.log('\n🎉 SUCCESS! Image was uploaded to Cloudinary:');
        imageAttachments.forEach((att, i) => {
          console.log(`${i+1}. Image URL: ${att.url}`);
          console.log(`   Public ID: ${att.publicId || 'N/A'}`);
          console.log(`   Size: ${att.width}x${att.height}`);
        });
      }
    }

    // Clean up
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
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

console.log('📷 Comment with Image Upload Test\n');
testCommentWithImage();
