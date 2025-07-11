#!/usr/bin/env node

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadDirect() {
  try {
    console.log('Uploading directly to Cloudinary...');
    
    // Use a base64 image
    const result = await cloudinary.uploader.upload(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      {
        folder: 'attendance-tracker/comments',
        public_id: `direct_test_${Date.now()}`
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    // Delete it
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Cleanup done');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

uploadDirect();
