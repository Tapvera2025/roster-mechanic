/**
 * Email Service
 *
 * Flexible email service for sending various types of emails
 * Supports multiple templates and can be extended for different use cases
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEnabled = config.email?.enabled || false;
    this.from = config.email?.from || 'noreply@rostermechanic.com';

    if (this.isEnabled) {
      this.initializeTransporter();
    }
  }

  /**
   * Initialize email transporter based on configuration
   */
  initializeTransporter() {
    try {
      // Check if using Gmail
      if (config.email.service === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
        });
      }
      // Check if using AWS SES
      else if (config.email.service === 'ses') {
        this.transporter = nodemailer.createTransport({
          host: config.email.host || `email.${config.email.region || 'ap-southeast-2'}.amazonaws.com`,
          port: config.email.port || 587,
          secure: false,
          auth: {
            user: config.email.accessKey,
            pass: config.email.secretKey,
          },
        });
      }
      // Generic SMTP configuration
      else {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port || 587,
          secure: config.email.secure || false,
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
        });
      }

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {String} options.to - Recipient email
   * @param {String} options.subject - Email subject
   * @param {String} options.html - HTML content
   * @param {String} options.text - Plain text content (optional)
   * @param {Array} options.attachments - Attachments (optional)
   * @returns {Promise<Object>} - Email send result
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.isEnabled) {
      logger.warn('Email service is disabled. Email not sent:', { to, subject });
      return { success: false, message: 'Email service is disabled' };
    }

    try {
      const mailOptions = {
        from: this.from,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully:', {
        to,
        subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      logger.error('Failed to send email:', {
        to,
        subject,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Send welcome email with login credentials
   * @param {Object} data - Email data
   * @param {String} data.to - Recipient email
   * @param {String} data.name - User's name
   * @param {String} data.email - User's email (login username)
   * @param {String} data.password - Temporary password
   * @param {String} data.role - User's role
   * @param {String} data.companyName - Company name (optional)
   * @returns {Promise<Object>} - Email send result
   */
  async sendWelcomeEmail({ to, name, email, password, role, companyName }) {
    const subject = `Welcome to ${config.app?.name || 'RosterMechanic'}`;

    const html = this.getWelcomeEmailTemplate({
      name,
      email,
      password,
      role,
      companyName,
      loginUrl: config.app?.clientUrl || 'http://localhost:5173',
      appName: config.app?.name || 'RosterMechanic',
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send password reset email
   * @param {Object} data - Email data
   * @param {String} data.to - Recipient email
   * @param {String} data.name - User's name
   * @param {String} data.resetToken - Password reset token
   * @param {Number} data.expiresIn - Token expiry in minutes
   * @returns {Promise<Object>} - Email send result
   */
  async sendPasswordResetEmail({ to, name, resetToken, expiresIn = 60 }) {
    const subject = 'Password Reset Request';
    const resetUrl = `${config.app?.clientUrl || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const html = this.getPasswordResetTemplate({
      name,
      resetUrl,
      expiresIn,
      appName: config.app?.name || 'RosterMechanic',
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send notification email
   * @param {Object} data - Email data
   * @param {String} data.to - Recipient email
   * @param {String} data.subject - Email subject
   * @param {String} data.message - Notification message
   * @param {String} data.actionUrl - Optional action URL
   * @param {String} data.actionText - Optional action button text
   * @returns {Promise<Object>} - Email send result
   */
  async sendNotificationEmail({ to, subject, message, actionUrl, actionText }) {
    const html = this.getNotificationTemplate({
      message,
      actionUrl,
      actionText,
      appName: config.app?.name || 'RosterMechanic',
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Get welcome email HTML template
   */
  getWelcomeEmailTemplate({ name, email, password, role, companyName, loginUrl, appName }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background-color: #2563eb; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Welcome to ${appName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">Hello ${name},</h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Your account has been created successfully${companyName ? ` for <strong>${companyName}</strong>` : ''}.
                You can now access the system using the credentials below:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Email:</strong> ${email}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Temporary Password:</strong> <code style="padding: 2px 6px; background-color: #e5e7eb; border-radius: 3px; font-family: monospace;">${password}</code>
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Role:</strong> ${role}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; color: #ef4444; font-size: 14px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <strong>Important:</strong> Please change your password after your first login for security purposes.
              </p>

              <!-- Login Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 4px; background-color: #2563eb;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Login to Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please don't hesitate to contact your administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated message from ${appName}. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Get password reset email HTML template
   */
  getPasswordResetTemplate({ name, resetUrl, expiresIn, appName }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 30px; background-color: #2563eb; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Password Reset</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">Hello ${name},</h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>

              <table role="presentation" style="margin: 30px auto;">
                <tr>
                  <td style="border-radius: 4px; background-color: #2563eb;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #ef4444; font-size: 14px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                This link will expire in ${expiresIn} minutes. If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated message from ${appName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Get notification email HTML template
   */
  getNotificationTemplate({ message, actionUrl, actionText, appName }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 30px; background-color: #2563eb; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${appName}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <div style="color: #666666; font-size: 16px; line-height: 1.6;">
                ${message}
              </div>

              ${actionUrl && actionText ? `
              <table role="presentation" style="margin: 30px auto;">
                <tr>
                  <td style="border-radius: 4px; background-color: #2563eb;">
                    <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      ${actionText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated message from ${appName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Strip HTML tags from string
   * @param {String} html - HTML string
   * @returns {String} - Plain text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Verify email service connection
   * @returns {Promise<Boolean>} - Connection status
   */
  async verifyConnection() {
    if (!this.isEnabled || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
