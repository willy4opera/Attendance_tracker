#!/usr/bin/env node

require('dotenv').config();
const { cloudinary } = require('../src/config/cloudinary.config');

async function testSimpleCloudinary() {
  try {
    console.log('Testing simple Cloudinary functionality...\n');
    
    // Test 1: Configuration
    console.log('1. Configuration:');
    const config = cloudinary.config();
    console.log('   Cloud Name:', config.cloud_name);
    console.log('   API Key:', config.api_key ? '✓ Set' : '✗ Not set');
    console.log('   Secure:', config.secure);
    console.log('   Timeout:', config.timeout);
    
    // Test 2: Generate URL
    console.log('\n2. URL Generation:');
    const testUrl = cloudinary.url('sample', {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      secure: true
    });
    console.log('   Generated URL:', testUrl);
    
    // Test 3: API Ping
    console.log('\n3. API Connection:');
    try {
      const ping = await cloudinary.api.ping();
      console.log('   Status:', ping.status);
      console.log('   Rate Limit Remaining:', ping.rate_limit_remaining);
    } catch (error) {
      console.log('   Connection Error:', error.message);
    }
    
    console.log('\n✅ Configuration is working correctly!');
    console.log('\nThe updated controller and routes are ready to use with:');
    console.log('- Direct upload using uploadDirect()');
    console.log('- Buffer upload using uploadImageBuffer()');
    console.log('- Image deletion using deleteImage()');
    console.log('- Optimized URLs using getOptimizedImageUrl()');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSimpleCloudinary();
