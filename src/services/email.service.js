require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

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
            from: `"BankingSystem" <${process.env.EMAIL_USER}>`, // sender address
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

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
})[character])

async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to Banking System'
    const safeName = escapeHtml(name)
    const text = `Hello ${name},

Welcome to Banking System! Your account has been created successfully.

We're glad you're here. You can now sign in and get started. For your security, never share your password or verification codes with anyone.

If you didn't create this account, please contact our support team.

Warm regards,
The Banking System Team`
    const html = `
      <div style="background-color:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
          <div style="background:#123b66;padding:24px 32px;color:#ffffff;">
            <h1 style="margin:0;font-size:22px;">Banking System</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#123b66;">Welcome, ${safeName}!</h2>
            <p style="line-height:1.6;">Your account has been created successfully. We're glad you're here.</p>
            <p style="line-height:1.6;">You can now sign in and get started. For your security, never share your password or verification codes with anyone.</p>
            <p style="line-height:1.6;">If you didn't create this account, please contact our support team.</p>
            <p style="line-height:1.6;margin:24px 0 0;">Warm regards,<br><strong>The Banking System Team</strong></p>
          </div>
        </div>
      </div>
    `

    /*

    const subject = 'Welcome to BackingSystem!'
    const text = `Hello ${name},
    Thank you for registering at Banking System.
    We're excited to have you on board!
    Best regards,
    The Banking System Team`
    const html = `<p>Hello ${name},</p><p>Thank you for registering at Banking System.</p><p>We're excited to have you on board!</p><p>Best regards,<br>The Banking System Team</p>`
    */

    await sendEmail(userEmail, subject, text, html)
}

async function sendTransactionEmail(userEmail, name, amount, toAccount, fromAccount) {
    const subject = 'Transaction completed successfully'
    const safeName = escapeHtml(name)
    const safeAmount = escapeHtml(amount)
    const safeFromAccount = escapeHtml(fromAccount)
    const safeToAccount = escapeHtml(toAccount)
    const text = `Hello ${name},

Your transaction has been completed successfully.

Amount: ${amount}
From account: ${fromAccount}
To account: ${toAccount}

If you did not make this transaction, please contact our support team immediately.

Warm regards,
The Banking System Team`
    const html = `
      <div style="background-color:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
          <div style="background:#123b66;padding:24px 32px;color:#ffffff;">
            <h1 style="margin:0;font-size:22px;">Banking System</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#123b66;">Transaction completed</h2>
            <p style="line-height:1.6;">Hello ${safeName}, your transaction has been completed successfully.</p>
            <p style="line-height:1.6;"><strong>Amount:</strong> ${safeAmount}</p>
            <p style="line-height:1.6;"><strong>From account:</strong> ${safeFromAccount}</p>
            <p style="line-height:1.6;"><strong>To account:</strong> ${safeToAccount}</p>
            <p style="line-height:1.6;">If you did not make this transaction, please contact our support team immediately.</p>
            <p style="line-height:1.6;margin:24px 0 0;">Warm regards,<br><strong>The Banking System Team</strong></p>
          </div>
        </div>
      </div>
    `

    await sendEmail(userEmail, subject, text, html)
}

async function sendTransactionFailed(userEmail, name, amount, toAccount) {
    const subject = 'Transaction could not be completed'
    const safeName = escapeHtml(name)
    const safeAmount = escapeHtml(amount)
    const safeToAccount = escapeHtml(toAccount)
    const text = `Hello ${name},

Your transaction could not be completed.

Amount: ${amount}
To account: ${toAccount}

Please check your account activity before trying again. If you need help, contact our support team.

Warm regards,
The Banking System Team`
    const html = `
      <div style="background-color:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
          <div style="background:#123b66;padding:24px 32px;color:#ffffff;">
            <h1 style="margin:0;font-size:22px;">Banking System</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#b42318;">Transaction failed</h2>
            <p style="line-height:1.6;">Hello ${safeName}, your transaction could not be completed.</p>
            <p style="line-height:1.6;"><strong>Amount:</strong> ${safeAmount}</p>
            <p style="line-height:1.6;"><strong>To account:</strong> ${safeToAccount}</p>
            <p style="line-height:1.6;">Please check your account activity before trying again. If you need help, contact our support team.</p>
            <p style="line-height:1.6;margin:24px 0 0;">Warm regards,<br><strong>The Banking System Team</strong></p>
          </div>
        </div>
      </div>
    `

    await sendEmail(userEmail, subject, text, html)
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailed
}