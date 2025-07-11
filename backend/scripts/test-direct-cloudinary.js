#!/usr/bin/env node

require('dotenv').config();
const { uploadDirect } = require('../src/config/cloudinary.config');
const fs = require('fs');
const path = require('path');

async function testDirectCloudinary() {
  try {
    console.log('Testing direct Cloudinary upload...\n');
    
    // Create test image
    const testPath = path.join(__dirname, 'direct-test.png');
    const imageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testPath, imageData);
    console.log('Test file created');

    // Upload directly
    console.log('Uploading to Cloudinary...');
    const result = await uploadDirect(testPath);
    
    console.log('\n✅ Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Format:', result.format);
    console.log('Size:', result.bytes, 'bytes');
    
    // Clean up local file
    fs.unlinkSync(testPath);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.http_code) {
      console.error('HTTP Code:', error.http_code);
    }
  }
}

testDirectCloudinary();
