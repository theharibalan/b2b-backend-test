const nodemailer = require('nodemailer');
const { decodedEmail, decodedPassword } = require('../encryption/decryptingEmailAndPassword');

const transporter = async () => {
    const senderEmail = await decodedEmail();
    const senderPassword = await decodedPassword();
    
    const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465, // SSL port
        secure: true, // true for port 465, false for port 587

        auth: {
            user: senderEmail,
            pass: senderPassword
        },

        tls: {
            rejectUnauthorized: false // allows the connection even with self-signed certificates
        }
    });

    return transporter;
};

module.exports = transporter;