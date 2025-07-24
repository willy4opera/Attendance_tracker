const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// Serve the test HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-google-oauth.html'));
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
    console.log('Open this URL in your browser to test Google OAuth');
});
