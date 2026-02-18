import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.vravenz.com',
    port: 587,
    secure: false, // Use `true` for port 465 if SSL is required
    auth: {
        user: process.env.SMTP_USER, // Your SMTP user from .env
        pass: process.env.SMTP_PASS, // Your SMTP password from .env
    },
});

// Function to send job offer email
export const sendJobOfferEmail = async (to: string, offerUrl: string, offerDetails: string) => {
    try {
        const mailOptions = {
            from: '"Krypton FM Group" <info@vravenz.com>',
            to,
            subject: 'Job Offer from Your Krypton FM Group',
            html: `
                <h3>Congratulations! You have a job offer.</h3>
                <p>${offerDetails}</p>
                <p>Click the link below to review and respond to the offer:</p>
                <a href="${offerUrl}">View Job Offer</a>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Job offer email sent: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending job offer email:', error);
        throw error;
    }
};

// Function to send login credentials email
export const sendLoginCredentialsEmail = async (to: string, userPin: string, password: string) => {
    try {
        const mailOptions = {
            from: '"Krypton FM Group" <info@vravenz.com>',
            to,
            subject: 'Your Login Credentials for Krypton FM Group',
            html: `
                <h3>Welcome to Krypton FM Group!</h3>
                <p>Your job offer has been accepted. Below are your login details:</p>
                <p><strong>Email:</strong> ${to}</p>
                <p><strong>User PIN:</strong> ${userPin}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p>Please log in with these credentials.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Login credentials email sent: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending login credentials email:', error);
        throw error;
    }
};