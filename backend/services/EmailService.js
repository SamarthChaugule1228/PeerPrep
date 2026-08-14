const nodemailer = require('nodemailer');

// Log environment check for debugging
console.log('📧 EmailService initialized');
console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Missing');
console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Missing');

const hasEmailCredentials = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

// Initialize email transporter
const transporter = hasEmailCredentials
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : null;

if (hasEmailCredentials) {
  console.log('  ✓ Transporter initialized successfully');
} else {
  console.log('  ✗ Transporter disabled (credentials missing)');
}

class EmailService {
  /**
   * Send interview match notification
   * @param {String} recipientEmail - Email address of the recipient
   * @param {String} recipientName - Name of the recipient
   * @param {String} partnerName - Name of the matched partner
   * @param {String} matchType - 'interviewer' or 'peer'
   * @param {Date} interviewTime - Scheduled interview time
   * @returns {Promise}
   */
  static async sendMatchNotification(recipientEmail, recipientName, partnerName, matchType, interviewTime) {
    try {
      if (!transporter) {
        console.log('Email notifications disabled: missing EMAIL_USER / EMAIL_PASSWORD');
        return { success: false, skipped: true, message: 'Email notifications disabled' };
      }

      const subject = matchType === 'interviewer' 
        ? 'Interview Match Found! 🎉' 
        : 'Peer Interview Matched! 👥';

      const matchTypeText = matchType === 'interviewer' 
        ? 'an interviewer' 
        : 'a peer';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Interview Match Found!</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <p style="font-size: 16px; color: #333;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px; color: #333;">
              Great news! We found ${matchTypeText} for your scheduled interview.
            </p>
            
            <div style="background-color: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 8px 0; font-size: 15px; color: #555;">
                <strong>Matched with:</strong> ${partnerName}
              </p>
              <p style="margin: 8px 0; font-size: 15px; color: #555;">
                <strong>Match Type:</strong> ${matchType === 'interviewer' ? 'Interview (Interviewer)' : 'Peer Practice'}
              </p>
              <p style="margin: 8px 0; font-size: 15px; color: #555;">
                <strong>Interview Time:</strong> ${new Date(interviewTime).toLocaleString()}
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              You can now access the interview room and begin your practice session.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Go to Interview
              </a>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

      const textContent = `
Hi ${recipientName},

Great news! We found ${matchTypeText} for your scheduled interview.

Matched with: ${partnerName}
Match Type: ${matchType === 'interviewer' ? 'Interview (Interviewer)' : 'Peer Practice'}
Interview Time: ${new Date(interviewTime).toLocaleString()}

You can now access the interview room and begin your practice session.

Visit: ${process.env.FRONTEND_URL}/dashboard

This is an automated message. Please do not reply to this email.
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✉️  Email sent to ${recipientEmail}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (err) {
      console.error('Error sending email:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send scheduled interview confirmation
   * @param {String} recipientEmail
   * @param {String} recipientName
   * @param {Date} interviewTime
   * @returns {Promise}
   */
  static async sendScheduleConfirmation(recipientEmail, recipientName, interviewTime) {
    try {
      if (!transporter) {
        console.log('Schedule confirmation email skipped: missing EMAIL_USER / EMAIL_PASSWORD');
        return { success: false, skipped: true, message: 'Email notifications disabled' };
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Interview Scheduled! 📅</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <p style="font-size: 16px; color: #333;">Hi ${recipientName},</p>
            
            <p style="font-size: 16px; color: #333;">
              Your interview has been successfully scheduled!
            </p>
            
            <div style="background-color: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 8px 0; font-size: 15px; color: #555;">
                <strong>Scheduled Time:</strong> ${new Date(interviewTime).toLocaleString()}
              </p>
              <p style="margin: 8px 0; font-size: 14px; color: #999;">
                We'll search for an interviewer and notify you when a match is found.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Your Schedule
              </a>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Interview Scheduled Confirmation ✓',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✉️  Confirmation email sent to ${recipientEmail}`);
    } catch (err) {
      console.error('Error sending confirmation email:', err);
    }
  }

  static async sendWelcomeEmail(recipientEmail, recipientName) {
    try {
      if (!transporter) {
        console.log('Welcome email skipped: missing EMAIL_USER / EMAIL_PASSWORD');
        return { success: false, skipped: true, message: 'Email notifications disabled' };
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #4f46e5 100%); color: white; padding: 32px; border-radius: 14px 14px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 30px;">Welcome to PeerPrep 🎉</h1>
          </div>
          <div style="background-color: #f8fafc; padding: 28px; border: 1px solid #e2e8f0; border-radius: 0 0 14px 14px;">
            <p style="font-size: 16px; color: #1f2937;">Hi ${recipientName},</p>
            <p style="font-size: 16px; color: #374151; line-height: 1.7;">
              Thanks for joining PeerPrep. You are now ready to practice for real interview rounds, find interview partners, and improve your performance with structured mock sessions.
            </p>
            <div style="background-color: #ffffff; border-left: 4px solid #4f46e5; padding: 18px 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-size: 15px; color: #374151;">Start exploring your dashboard, save your preferences, and jump into your next mock interview.</p>
            </div>
            <div style="text-align: center; margin-top: 28px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Open Dashboard
              </a>
            </div>
            <p style="margin-top: 26px; font-size: 12px; color: #6b7280; text-align: center;">
              This is an automated email from PeerPrep. Please do not reply.
            </p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Welcome to PeerPrep 🚀',
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✉️  Welcome email sent to ${recipientEmail}`);
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (err) {
      console.error('Error sending welcome email:', err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = EmailService;
