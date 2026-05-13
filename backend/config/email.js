const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection configuration
if (process.env.NODE_ENV !== 'test') {
    transporter.verify((error, success) => {
        if (error) {
            console.error('Email transporter error:', error.message);
        } else {
            console.log('Email server is ready to take our messages');
        }
    });
}

module.exports = transporter;
