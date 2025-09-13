const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
if (process.env.EMAIL_API_KEY) {
  sgMail.setApiKey(process.env.EMAIL_API_KEY);
}

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@pint-app.com';
    this.isConfigured = !!process.env.EMAIL_API_KEY;
  }

  async sendWelcomeEmail(userEmail, displayName) {
    if (!this.isConfigured) {
      console.log('Email service not configured. Skipping welcome email.');
      return { success: false, reason: 'Email service not configured' };
    }

    const msg = {
      to: userEmail,
      from: this.fromEmail,
      subject: 'Welcome to Pint? - Your pub adventure starts here! 🍻',
      html: this.generateWelcomeEmailHtml(displayName),
      text: this.generateWelcomeEmailText(displayName)
    };

    try {
      await sgMail.send(msg);
      console.log(`Welcome email sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(userEmail, resetToken) {
    if (!this.isConfigured) {
      console.log('Email service not configured. Skipping password reset email.');
      return { success: false, reason: 'Email service not configured' };
    }

    // In production, this should be your actual app domain
    const resetUrl = `https://your-app-domain.com/reset-password?token=${resetToken}`;

    const msg = {
      to: userEmail,
      from: this.fromEmail,
      subject: 'Reset your Pint? password',
      html: this.generatePasswordResetEmailHtml(resetUrl),
      text: this.generatePasswordResetEmailText(resetUrl)
    };

    try {
      await sgMail.send(msg);
      console.log(`Password reset email sent to ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  generateWelcomeEmailHtml(displayName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Pint?</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #eaa221 0%, #f4f1de 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .cta-button { display: inline-block; background: #eaa221; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #4a2c2a; margin: 0; font-size: 2em;">🍻 Welcome to Pint?!</h1>
          </div>
          <div class="content">
            <h2>Hey ${displayName || 'there'}!</h2>
            <p>Welcome to Pint? - the social app that connects you with new people at pubs! We're excited to have you join our community.</p>
            
            <h3>Here's how to get started:</h3>
            <ul>
              <li><strong>Create your first session:</strong> Pick a pub and set a time you'll be there</li>
              <li><strong>Join other sessions:</strong> Browse what's happening near you</li>
              <li><strong>Chat and connect:</strong> Message other attendees before you meet</li>
              <li><strong>Earn achievements:</strong> Unlock badges as you socialize</li>
            </ul>
            
            <p>Your next friendship is just a pint away! 🍺</p>
            
            <a href="https://your-app-domain.com/app" class="cta-button">Open the App</a>
            
            <h3>Safety First 🛡️</h3>
            <p>Remember to always meet in public places, trust your instincts, and drink responsibly. If you ever feel uncomfortable, don't hesitate to leave.</p>
            
            <p>Cheers,<br>The Pint? Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@pint-app.com">support@pint-app.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeEmailText(displayName) {
    return `
      Welcome to Pint?, ${displayName || 'there'}!

      We're excited to have you join our community of pub-goers and social adventurers.

      Here's how to get started:
      - Create your first session: Pick a pub and set a time you'll be there
      - Join other sessions: Browse what's happening near you  
      - Chat and connect: Message other attendees before you meet
      - Earn achievements: Unlock badges as you socialize

      Your next friendship is just a pint away! 🍺

      Open the app: https://your-app-domain.com/app

      Safety First:
      Remember to always meet in public places, trust your instincts, and drink responsibly. If you ever feel uncomfortable, don't hesitate to leave.

      Cheers,
      The Pint? Team

      Need help? Contact us at support@pint-app.com
    `;
  }

  generatePasswordResetEmailHtml(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your Pint? password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #eaa221 0%, #f4f1de 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .cta-button { display: inline-block; background: #eaa221; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #4a2c2a; margin: 0; font-size: 2em;">🔐 Reset your password</h1>
          </div>
          <div class="content">
            <h2>Password reset requested</h2>
            <p>Someone requested a password reset for your Pint? account. If this was you, click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="cta-button">Reset Password</a>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, if you continue to receive these emails, please contact our support team.</p>
            
            <p>Cheers,<br>The Pint? Team</p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at <a href="mailto:support@pint-app.com">support@pint-app.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetEmailText(resetUrl) {
    return `
      Password reset requested for your Pint? account

      Someone requested a password reset for your account. If this was you, visit the link below to reset your password:

      ${resetUrl}

      This link will expire in 1 hour for security reasons.

      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

      For security reasons, if you continue to receive these emails, please contact our support team at support@pint-app.com.

      Cheers,
      The Pint? Team
    `;
  }
}

module.exports = new EmailService();