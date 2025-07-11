#!/usr/bin/env node

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinarySimple() {
  console.log('Testing Cloudinary with simple upload...\n');
  
  try {
    // Test with a simple base64 image
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('Uploading 1x1 pixel image...');
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'attendance-tracker/test',
      public_id: `test_${Date.now()}`,
      timeout: 60000 // 60 second timeout
    });
    
    console.log('✅ Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    // Delete the test image
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Cleanup successful!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCloudinarySimple();
