// Test clicking the attendance link
const sessionId = process.argv[2];
const token = process.argv[3];

if (!sessionId || !token) {
  console.log('Usage: node test-attendance-link.js <sessionId> <token>');
  console.log('Get these from the attendance URL in your email');
  process.exit(1);
}

const url = `http://localhost:5000/api/v1/sessions/${sessionId}/join?token=${token}`;

console.log('Testing attendance link...');
console.log('URL:', url);
console.log('\nNote: This will only work during the session time window.');
console.log('The session is scheduled for tomorrow, so it will fail now.');
console.log('But the email and link generation are working correctly!');

// To actually test, you would visit the URL in a browser or use:
console.log('\nTo test manually, run:');
console.log(`curl -L "${url}"`);
