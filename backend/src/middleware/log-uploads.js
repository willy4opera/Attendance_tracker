module.exports = (req, res, next) => {
  if (req.path === '/comments' && req.method === 'POST') {
    console.log('\n=== COMMENT UPLOAD MIDDLEWARE ===');
    console.log('Content-Type:', req.get('content-type'));
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Files:', req.files);
    console.log('File:', req.file);
    console.log('================================\n');
  }
  next();
};
