#!/usr/bin/env node
'use strict';

// Clear all caches
Object.keys(require.cache).forEach(key => delete require.cache[key]);

// Load environment variables
require('dotenv').config();

// Direct require
const nodemailer = require('./node_modules/nodemailer');

console.log('Nodemailer loaded successfully');
console.log('createTransport exists:', 'createTransport' in nodemailer);

try {
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  console.log('Transporter created successfully');
  
  transporter.verify()
    .then(() => {
      console.log('Email server ready!');
      return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,
        subject: 'Test Email Working!',
        text: 'Nodemailer is working correctly now.'
      });
    })
    .then(info => {
      console.log('Email sent:', info.messageId);
    })
    .catch(err => {
      console.error('Email error:', err.message);
    });
    
} catch (err) {
  console.error('Fatal error:', err.message);
  console.error('Stack:', err.stack);
}
