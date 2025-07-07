const nodemailer = require('./node_modules/nodemailer/lib/nodemailer.js');
console.log('Direct require works:', typeof nodemailer.createTransport);

const transporter = nodemailer.createTransport({
  host: 'webmail.biwillzcomputers.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@biwillzcomputers.com',
    pass: 'Wind@wswil24d'
  }
});

transporter.verify()
  .then(() => console.log('Email server connection successful!'))
  .catch(err => console.log('Email server error:', err.message));
