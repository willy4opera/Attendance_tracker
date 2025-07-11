#!/usr/bin/env node

/**
 * Test Cloudinary configuration and upload
 */

require('dotenv').config();
const { cloudinary } = require('../src/config/cloudinary.config');
const mediaService = require('../src/services/mediaService');
const fs = require('fs');
const path = require('path');

async function testCloudinary() {
  console.log('☁️  Cloudinary Configuration Test\n');

  // Check configuration
  console.log('Configuration:');
  console.log(`- Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`- API Key: ${process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`- API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing'}\n`);

  try {
    // Test connection by getting account details
    console.log('Testing connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!\n');

    // Create a test image
    console.log('Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple 1x1 pixel PNG
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D,
      0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('✓ Test image created\n');

    // Upload test
    console.log('Uploading to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(testImagePath, {
      folder: 'attendance-tracker/test',
      public_id: `test_${Date.now()}`
    });

    console.log('✅ Upload successful!');
    console.log(`- Public ID: ${uploadResult.public_id}`);
    console.log(`- URL: ${uploadResult.secure_url}`);
    console.log(`- Format: ${uploadResult.format}`);
    console.log(`- Size: ${uploadResult.bytes} bytes\n`);

    // Test deletion
    console.log('Testing deletion...');
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ Deletion successful!\n');

    // Clean up
    fs.unlinkSync(testImagePath);
    
    console.log('🎉 All Cloudinary tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    
    if (error.http_code === 401) {
      console.error('\n⚠️  Authentication failed. Please check your Cloudinary credentials.');
    }
  }
}

// Run the test
testCloudinary();
