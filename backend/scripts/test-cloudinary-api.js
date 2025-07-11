#!/usr/bin/env node

/**
 * Test Cloudinary API according to documentation
 */

require('dotenv').config();
const https = require('https');
const crypto = require('crypto');

// Cloudinary credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Testing Cloudinary API...');
console.log('Cloud Name:', cloudName);
console.log('API Key:', apiKey ? '✓ Set' : '✗ Missing');
console.log('API Secret:', apiSecret ? '✓ Set' : '✗ Missing');

// Test using unsigned upload (if configured)
async function testUnsignedUpload() {
  console.log('\nTesting unsigned upload...');
  
  const formData = {
    file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    upload_preset: 'ml_default' // Common default preset
  };
  
  const options = {
    hostname: 'api.cloudinary.com',
    path: `/v1_1/${cloudName}/image/upload`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Upload successful!');
            console.log('URL:', result.secure_url);
          } else {
            console.log('❌ Upload failed:', result);
          }
        } catch (e) {
          console.log('Response:', data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
    });
    
    req.write(JSON.stringify(formData));
    req.end();
  });
}

// Test using signed upload
async function testSignedUpload() {
  console.log('\nTesting signed upload...');
  
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp: timestamp,
    folder: 'attendance-tracker/test'
  };
  
  // Create signature
  const toSign = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&') + apiSecret;
  
  const signature = crypto
    .createHash('sha1')
    .update(toSign)
    .digest('hex');
  
  const formData = {
    file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    api_key: apiKey,
    timestamp: timestamp,
    signature: signature,
    folder: 'attendance-tracker/test'
  };
  
  const options = {
    hostname: 'api.cloudinary.com',
    path: `/v1_1/${cloudName}/image/upload`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Upload successful!');
            console.log('URL:', result.secure_url);
            console.log('Public ID:', result.public_id);
          } else {
            console.log('❌ Upload failed:', result);
          }
        } catch (e) {
          console.log('Response:', data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
    });
    
    req.write(JSON.stringify(formData));
    req.end();
  });
}

// Test API connectivity
async function testConnectivity() {
  console.log('\nTesting API connectivity...');
  
  const options = {
    hostname: 'api.cloudinary.com',
    path: `/v1_1/${cloudName}/resources/image`,
    method: 'GET',
    auth: `${apiKey}:${apiSecret}`
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log('API connectivity status:', res.statusCode);
      res.on('data', () => {}); // Consume response
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          console.log('✅ API is reachable');
        } else {
          console.log('⚠️  Unexpected status code');
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Connection error:', e.message);
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  await testConnectivity();
  await testSignedUpload();
  // await testUnsignedUpload(); // Uncomment if you have unsigned uploads configured
}

runTests();
