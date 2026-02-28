require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // explicitly define the host
    port: 465,               // use the secure port
    secure: true,            // true for 465, false for other ports
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    }
});;

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});



// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


async function sendRegisterationEmail(userEmail, name){
    const subject = 'Welcome to Backend Ledger!';
    const text = `Hi ${name},\n\nThank you for registering at Backend Ledger! We're excited to have you on board.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>Thank you for registering at Backend Ledger! We're excited to have you on board.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name , amount, Account){
    const subject = 'Transaction Notification from Backend Ledger';
    const text = `Hi ${name},\n\nYou have received a transaction of $${amount} from ${Account}.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>You have received a transaction of <strong>$${amount}</strong> from <strong>${Account}</strong>.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name , amount, Account){
    const subject = 'Transaction Failure Notification from Backend Ledger';
    const text = `Hi ${name},\n\nWe regret to inform you that a transaction of $${amount} from ${Account} has failed. Please check your account and try again.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hi ${name},</p><p>We regret to inform you that a transaction of <strong>$${amount}</strong> from <strong>${Account}</strong> has failed. Please check your account and try again.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegisterationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};
