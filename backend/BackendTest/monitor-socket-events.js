#!/usr/bin/env node

const io = require('socket.io-client');
const chalk = require('chalk');
const fs = require('fs');

// Configuration
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';
const SESSION_ID = process.env.SESSION_ID || '37525856-6ff4-44bb-ab6f-1374649970bc';

// Read token
let TOKEN;
try {
  TOKEN = fs.readFileSync('/tmp/auth_token', 'utf8').trim();
  console.log(chalk.green('✓ Token loaded successfully'));
} catch (error) {
  console.error(chalk.red('✗ Failed to read token from /tmp/auth_token'));
  process.exit(1);
}

console.log(chalk.bold.cyan('\n🔍 Socket Event Monitor'));
console.log(chalk.gray('======================'));
console.log(chalk.gray(`Socket URL: ${SOCKET_URL}`));
console.log(chalk.gray(`Session ID: ${SESSION_ID}`));
console.log(chalk.gray(`Monitoring started at: ${new Date().toISOString()}\n`));

// Connect to socket
const socket = io(SOCKET_URL, {
  auth: {
    token: TOKEN
  },
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log(chalk.green(`✓ Connected to socket server (ID: ${socket.id})`));
  
  // Join session room
  socket.emit('join-session', SESSION_ID);
  console.log(chalk.blue(`→ Joined session room: ${SESSION_ID}`));
  console.log(chalk.yellow('\n📡 Listening for events...\n'));
});

socket.on('connect_error', (error) => {
  console.error(chalk.red(`✗ Connection error: ${error.message}`));
});

socket.on('disconnect', (reason) => {
  console.log(chalk.yellow(`⚠ Disconnected: ${reason}`));
});

// Attendance events
socket.on('attendance-update', (data) => {
  console.log(chalk.bold.magenta(`\n[${new Date().toISOString()}] 📍 ATTENDANCE UPDATE`));
  console.log(chalk.gray('Type:'), chalk.cyan(data.type));
  
  if (data.attendance) {
    console.log(chalk.gray('Attendance:'));
    console.log(chalk.gray('  - ID:'), data.attendance.id);
    console.log(chalk.gray('  - User ID:'), data.attendance.userId);
    console.log(chalk.gray('  - Status:'), chalk.yellow(data.attendance.status));
    console.log(chalk.gray('  - Notes:'), data.attendance.notes || 'N/A');
    
    if (data.attendance.updatedBy) {
      console.log(chalk.gray('  - Updated by:'), `${data.attendance.updatedByName} (ID: ${data.attendance.updatedBy})`);
    }
  }
  
  if (data.user) {
    console.log(chalk.gray('Updated by:'), `${data.user.name} (ID: ${data.user.id})`);
  }
  
  console.log(chalk.gray('Full data:'), JSON.stringify(data, null, 2));
  console.log(chalk.gray('─'.repeat(50)));
});

// Notification events
socket.on('notification', (data) => {
  console.log(chalk.bold.cyan(`\n[${new Date().toISOString()}] 🔔 NOTIFICATION`));
  console.log(chalk.gray('Type:'), chalk.yellow(data.type));
  console.log(chalk.gray('Title:'), data.title);
  console.log(chalk.gray('Message:'), data.message);
  
  if (data.sessionId) {
    console.log(chalk.gray('Session ID:'), data.sessionId);
  }
  
  console.log(chalk.gray('─'.repeat(50)));
});

// Session stats events
socket.on('session-stats-update', (data) => {
  console.log(chalk.bold.yellow(`\n[${new Date().toISOString()}] 📊 SESSION STATS UPDATE`));
  console.log(chalk.gray('Session ID:'), data.sessionId);
  console.log(chalk.gray('Total Attendees:'), data.totalAttendees);
  console.log(chalk.gray('Capacity:'), data.capacity);
  console.log(chalk.gray('Percentage Filled:'), `${data.percentageFilled}%`);
  console.log(chalk.gray('─'.repeat(50)));
});

// User joined/left events
socket.on('user-joined-session', (data) => {
  console.log(chalk.bold.green(`\n[${new Date().toISOString()}] 👤 USER JOINED SESSION`));
  console.log(chalk.gray('User:'), `${data.user.firstName} ${data.user.lastName} (ID: ${data.userId})`);
  console.log(chalk.gray('─'.repeat(50)));
});

socket.on('user-left-session', (data) => {
  console.log(chalk.bold.red(`\n[${new Date().toISOString()}] 👤 USER LEFT SESSION`));
  console.log(chalk.gray('User:'), `${data.user.firstName} ${data.user.lastName} (ID: ${data.userId})`);
  console.log(chalk.gray('─'.repeat(50)));
});

// Generic event listener for debugging
socket.onAny((eventName, ...args) => {
  if (!['attendance-update', 'notification', 'session-stats-update', 'user-joined-session', 'user-left-session'].includes(eventName)) {
    console.log(chalk.bold.gray(`\n[${new Date().toISOString()}] 📦 ${eventName.toUpperCase()}`));
    console.log(chalk.gray('Data:'), JSON.stringify(args, null, 2));
    console.log(chalk.gray('─'.repeat(50)));
  }
});

// Keep the script running
process.stdin.resume();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down monitor...'));
  socket.emit('leave-session', SESSION_ID);
  socket.disconnect();
  process.exit(0);
});

console.log(chalk.gray('\nPress Ctrl+C to stop monitoring\n'));
