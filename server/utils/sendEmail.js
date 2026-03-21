const nodemailer = require('nodemailer');

/**
 * Send an email using SMTP configuration from environment variables
 * @param {Object} options - Email options (email, subject, message, html)
 */
const sendEmail = async (options) => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // 2) Define the email options
    const mailOptions = {
        from: `Gradex Security <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // 3) Actually send the email
    console.log(`Attempting to send email to ${options.email}...`);
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Nodemailer Error:', error);
        throw error;
    }
};

module.exports = sendEmail;
