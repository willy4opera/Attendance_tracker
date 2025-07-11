#!/usr/bin/env node

require('dotenv').config();
const mediaService = require('../src/services/mediaService');
const fs = require('fs');
const path = require('path');

async function testMediaService() {
  try {
    console.log('Testing mediaService.uploadImage()...\n');
    
    // Create test file object similar to multer
    const testPath = path.join(__dirname, 'media-test.png');
    const imageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testPath, imageData);
    
    const fileObject = {
      path: testPath,
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: imageData.length
    };
    
    console.log('Calling mediaService.uploadImage()...');
    const result = await mediaService.uploadImage(fileObject);
    
    console.log('\n✅ Upload successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMediaService();
