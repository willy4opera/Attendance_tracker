#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createInitialAdmin() {
  try {
    // Check if any admin exists
    const adminCount = await User.count({ where: { role: 'admin' } });
    
    if (adminCount > 0) {
      logger.warn('Admin user already exists. Aborting initialization.');
      process.exit(0);
    }

    console.log('\n=== Attendance Tracker Initial Setup ===\n');
    console.log('Creating initial admin user...\n');

    // Collect admin details
    const email = await question('Enter admin email: ');
    const firstName = await question('Enter first name: ');
    const lastName = await question('Enter last name: ');
    const employeeId = await question('Enter employee ID: ');
    
    let password;
    let confirmPassword;
    
    do {
      password = await question('Enter password (min 8 chars, must include uppercase, lowercase, number, special char): ');
      confirmPassword = await question('Confirm password: ');
      
      if (password !== confirmPassword) {
        console.log('\nPasswords do not match. Please try again.\n');
      }
    } while (password !== confirmPassword);

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('\nPassword does not meet security requirements.');
      console.log('Must be at least 8 characters with uppercase, lowercase, number, and special character.\n');
      process.exit(1);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await User.create({
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      employeeId,
      role: 'admin',
      department: 'IT',
      isActive: true,
      emailVerified: true
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`Email: ${admin.email}`);
    console.log('\n⚠️  IMPORTANT: Store the password securely and delete this script after use.\n');

  } catch (error) {
    logger.error('Failed to create admin user:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  createInitialAdmin();
}

module.exports = createInitialAdmin;
