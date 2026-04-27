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
      loginUrl: 'https://www.rostermechanic.com.au',
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
    const resetUrl = `https://www.rostermechanic.com.au/reset-password?token=${resetToken}`;

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
   * Send shift assignment email
   * @param {Object} data - Email data
   * @param {String} data.to - Recipient email
   * @param {String} data.employeeName - Employee's name
   * @param {String} data.siteName - Site name
   * @param {String} data.shiftDate - Shift date (formatted)
   * @param {String} data.startTime - Shift start time (formatted)
   * @param {String} data.endTime - Shift end time (formatted)
   * @param {String} data.shiftType - Shift type
   * @param {String} data.notes - Additional notes (optional)
   * @param {Boolean} data.isAdhoc - Whether this is an adhoc shift (optional)
   * @returns {Promise<Object>} - Email send result
   */
  async sendShiftAssignmentEmail({ to, employeeName, siteName, shiftDate, startTime, endTime, shiftType, notes, isAdhoc = false }) {
    const subject = isAdhoc ? `Adhoc Shift Assignment - ${shiftDate}` : `New Shift Assignment - ${shiftDate}`;

    const html = this.getShiftAssignmentTemplate({
      employeeName,
      siteName,
      shiftDate,
      startTime,
      endTime,
      shiftType,
      notes,
      isAdhoc,
      loginUrl: 'https://www.rostermechanic.com.au',
      appName: config.app?.name || 'RosterMechanic',
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send time record rejection email
   * @param {Object} data - Email data
   * @param {String} data.to - Recipient email
   * @param {String} data.employeeName - Employee's name
   * @param {String} data.siteName - Site name
   * @param {String} data.clockInDate - Clock in date (formatted)
   * @param {String} data.clockInTime - Clock in time (formatted)
   * @param {String} data.clockOutTime - Clock out time (formatted)
   * @param {String} data.rejectionReason - Reason for rejection
   * @param {String} data.rejectedBy - Name of person who rejected
   * @returns {Promise<Object>} - Email send result
   */
  async sendTimeRecordRejectionEmail({ to, employeeName, siteName, clockInDate, clockInTime, clockOutTime, rejectionReason, rejectedBy }) {
    const subject = `Time Record Rejected - ${clockInDate}`;

    const html = this.getTimeRecordRejectionTemplate({
      employeeName,
      siteName,
      clockInDate,
      clockInTime,
      clockOutTime,
      rejectionReason,
      rejectedBy,
      loginUrl: 'https://www.rostermechanic.com.au',
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
   * Get shift assignment email HTML template
   */
  getShiftAssignmentTemplate({ employeeName, siteName, shiftDate, startTime, endTime, shiftType, notes, isAdhoc = false, loginUrl, appName }) {
    const headerColor = isAdhoc ? '#f97316' : '#10b981'; // Orange for adhoc, green for regular
    const headerTitle = isAdhoc ? 'Adhoc Shift Assignment' : 'New Shift Assignment';
    const backgroundColor = isAdhoc ? '#fff7ed' : '#f0fdf4'; // Light orange for adhoc, light green for regular
    const borderColor = isAdhoc ? '#f97316' : '#10b981';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background-color: ${headerColor}; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${headerTitle}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">Hello ${employeeName},</h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                You have been assigned a new shift. Please review the details below:
              </p>

              <!-- Shift Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px; background-color: ${backgroundColor}; border-left: 4px solid ${borderColor}; border-radius: 4px;">
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Site:</strong> ${siteName}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Date:</strong> ${shiftDate}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Time:</strong> ${startTime} - ${endTime}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Shift Type:</strong> <span style="padding: 2px 8px; background-color: #dbeafe; color: #1e40af; border-radius: 3px; font-size: 13px; font-weight: 500;">${shiftType}</span>
                    </p>
                    ${notes ? `<p style="margin: 12px 0 0 0; padding-top: 12px; border-top: 1px solid #d1fae5; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Notes:</strong> ${notes}
                    </p>` : ''}
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                Please make sure you arrive on time and are prepared for your shift. If you have any questions or concerns, please contact your manager.
              </p>

              <!-- View Roster Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 4px; background-color: #10b981;">
                    <a href="${loginUrl}/user/roster" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      View My Roster
                    </a>
                  </td>
                </tr>
              </table>
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
   * Get time record rejection email HTML template
   */
  getTimeRecordRejectionTemplate({ employeeName, siteName, clockInDate, clockInTime, clockOutTime, rejectionReason, rejectedBy, loginUrl, appName }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time Record Rejected</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ef4444; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Time Record Rejected</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">Hello ${employeeName},</h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Your time record has been rejected by ${rejectedBy}. Please review the details below:
              </p>

              <!-- Time Record Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Site:</strong> ${siteName}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Date:</strong> ${clockInDate}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Clock In:</strong> ${clockInTime}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #666666; font-size: 15px;">
                      <strong style="color: #333333;">Clock Out:</strong> ${clockOutTime || 'Not clocked out'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Rejection Reason Box -->
              <div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: bold;">
                  Rejection Reason:
                </p>
                <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                  ${rejectionReason}
                </p>
              </div>

              <p style="margin: 30px 0 20px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                If you believe this rejection was made in error, please contact your manager or supervisor for further clarification.
              </p>

              <!-- View Records Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 4px; background-color: #2563eb;">
                    <a href="${loginUrl}/user/attendance" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      View My Time Records
                    </a>
                  </td>
                </tr>
              </table>
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
   * Strip HTML tags from string
   * @param {String} html - HTML string
   * @returns {String} - Plain text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Notify all managers/admins when an employee starts an adhoc shift
   * @param {Object} params - { employee, site, shift, reason, companyId }
   */
  async notifyAdhocShiftCreated({ employee, site, shift, reason, companyId }) {
    const User = require('../models/User');

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const siteName = site.siteLocationName || 'Unknown Site';
    const startedAt = new Date(shift.startTime).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const position = shift.position || 'N/A';

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#f59e0b;padding:24px 32px;">
            <h2 style="margin:0;color:#ffffff;font-size:20px;">⚠️ Adhoc Shift Started</h2>
            <p style="margin:6px 0 0;color:#fef3c7;font-size:14px;">An employee has started an unscheduled shift</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Employee</span><br>
                  <span style="color:#111827;font-size:15px;font-weight:600;">${employeeName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Site</span><br>
                  <span style="color:#111827;font-size:15px;">${siteName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Started At</span><br>
                  <span style="color:#111827;font-size:15px;">${startedAt}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Position</span><br>
                  <span style="color:#111827;font-size:15px;">${position}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0 8px;">
                  <span style="color:#6b7280;font-size:13px;">Reason</span><br>
                  <div style="margin-top:8px;padding:14px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">
                    <span style="color:#92400e;font-size:15px;">${reason}</span>
                  </div>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:13px;margin:20px 0 24px;">
              This adhoc shift has been automatically recorded. No approval action is required.
            </p>

            <a href="https://www.rostermechanic.com.au/admin/time-attendance"
               style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
              View in Time Attendance →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              This is an automated notification from your Roster system.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    // Find all active managers and admins in the company
    const managers = await User.find({
      companyId,
      role: { $in: ['ADMIN', 'MANAGER'] },
      isActive: true,
    }).select('email firstName lastName').lean();

    const emailPromises = managers.map((manager) =>
      this.sendEmail({
        to: manager.email,
        subject: `⚠️ Adhoc Shift Started — ${employeeName} at ${siteName}`,
        html,
      }).catch((err) => {
        console.error(`Failed to send adhoc notification to ${manager.email}:`, err.message);
      })
    );

    await Promise.all(emailPromises);
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
