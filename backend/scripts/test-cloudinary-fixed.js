#!/usr/bin/env node

require('dotenv').config();
const { cloudinary, testConnection, uploadDirect } = require('../src/config/cloudinary.config.fixed');
const fs = require('fs');
const path = require('path');

async function testFixed() {
  console.log('Testing fixed Cloudinary configuration...\n');

  // Test connection
  console.log('1. Testing connection...');
  const connected = await testConnection();
  console.log(connected ? '✅ Connected' : '❌ Not connected');

  if (!connected) {
    // Try direct HTTPS upload
    console.log('\n2. Testing direct HTTPS upload...');
    
    try {
      // Create a test image file
      const testPath = path.join(__dirname, 'test-cloudinary.png');
      const imageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(testPath, imageData);

      // Upload using direct method
      console.log('Uploading test image...');
      const result = await uploadDirect(testPath);
      
      console.log('✅ Upload successful!');
      console.log('URL:', result.secure_url);
      console.log('Public ID:', result.public_id);
      
      // Clean up
      fs.unlinkSync(testPath);
      
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(result.public_id);
      console.log('✅ Cleanup successful');
      
    } catch (error) {
      console.error('❌ Upload error:', error.message);
    }
  }
}

testFixed();
