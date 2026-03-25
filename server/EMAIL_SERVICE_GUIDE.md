# Email Service Guide

## Overview

The email service is a flexible, template-based email system that automatically sends login credentials to new users and can be extended for various use cases like password resets, notifications, and more.

## Features

- **Automatic Welcome Emails**: Sends login credentials when admin/manager creates a new user
- **Multiple Email Providers**: Supports SMTP, Gmail, and AWS SES
- **HTML Email Templates**: Professional, responsive email templates
- **Template System**: Easy to add new email types
- **Error Handling**: Graceful fallback if email fails (user creation still succeeds)
- **Extensible**: Designed for future email features

## Configuration

### 1. Environment Variables

Update your `.env` file with email configuration:

```bash
# Enable email service
EMAIL_ENABLED=true
EMAIL_FROM=noreply@yourdomain.com

# Choose email service: smtp, gmail, or ses
EMAIL_SERVICE=gmail

# For Gmail (recommended for development)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# For SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# For AWS SES (production)
AWS_REGION=ap-southeast-2
AWS_SES_ACCESS_KEY=your-access-key
AWS_SES_SECRET_KEY=your-secret-key
```

### 2. Gmail Setup (Development)

1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
4. Use this password in `EMAIL_PASSWORD`

### 3. AWS SES Setup (Production)

1. Verify your domain in AWS SES
2. Create IAM user with SES permissions
3. Generate access keys
4. Update `AWS_SES_ACCESS_KEY` and `AWS_SES_SECRET_KEY`

## Usage

### Current Features

#### Welcome Email (Auto-sent on user creation)

When an admin or manager creates a new user via `POST /api/v1/users`, the system automatically:

1. Creates the user account
2. Sends a welcome email with:
   - Login credentials (email & password)
   - User's role
   - Company name
   - Login link
   - Security reminder to change password

The email is sent in `server/src/services/user.service.js:184-208`

### Available Email Methods

The email service (`server/src/services/email.service.js`) provides these methods:

```javascript
const emailService = require('./services/email.service');

// 1. Send welcome email with login credentials
await emailService.sendWelcomeEmail({
  to: 'user@example.com',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'temp123',
  role: 'USER',
  companyName: 'ACME Corp'
});

// 2. Send password reset email
await emailService.sendPasswordResetEmail({
  to: 'user@example.com',
  name: 'John Doe',
  resetToken: 'abc123xyz',
  expiresIn: 60 // minutes
});

// 3. Send generic notification email
await emailService.sendNotificationEmail({
  to: 'user@example.com',
  subject: 'Shift Update',
  message: '<p>Your shift has been updated...</p>',
  actionUrl: 'https://app.example.com/shifts',
  actionText: 'View Shift'
});

// 4. Send custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<p>Custom HTML content</p>',
  text: 'Plain text fallback'
});
```

## Adding New Email Templates

To add a new email type:

1. **Add a new method** in `email.service.js`:

```javascript
async sendShiftReminderEmail({ to, name, shiftDate, shiftTime, location }) {
  const subject = 'Shift Reminder';
  const html = this.getShiftReminderTemplate({
    name,
    shiftDate,
    shiftTime,
    location,
    appName: config.app?.name || 'RosterMechanic',
  });
  return this.sendEmail({ to, subject, html });
}
```

2. **Create the template method**:

```javascript
getShiftReminderTemplate({ name, shiftDate, shiftTime, location, appName }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h1>Hi ${name},</h1>
  <p>This is a reminder about your upcoming shift:</p>
  <ul>
    <li><strong>Date:</strong> ${shiftDate}</li>
    <li><strong>Time:</strong> ${shiftTime}</li>
    <li><strong>Location:</strong> ${location}</li>
  </ul>
</body>
</html>
  `.trim();
}
```

3. **Use it in your service**:

```javascript
const emailService = require('./email.service');
await emailService.sendShiftReminderEmail({
  to: employee.email,
  name: employee.name,
  shiftDate: '2024-03-15',
  shiftTime: '9:00 AM - 5:00 PM',
  location: 'Main Office'
});
```

## Email Templates

All email templates are responsive and include:
- Professional header with app name
- Clear content area
- Action buttons (where applicable)
- Security notices
- Footer with branding

Template styling uses inline CSS for maximum email client compatibility.

## Testing

### Test Email Configuration

```bash
# In server directory
node -e "
const emailService = require('./src/services/email.service');
emailService.verifyConnection().then(result => {
  console.log('Email service:', result ? 'Connected' : 'Failed');
  process.exit(result ? 0 : 1);
});
"
```

### Test Welcome Email

Create a test user via API or admin panel to trigger the welcome email.

## Troubleshooting

### Email not sending

1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify email credentials
3. Check server logs for errors
4. For Gmail, ensure App Password is correct
5. For AWS SES, check IAM permissions

### Email goes to spam

1. For production, use a verified domain
2. Configure SPF, DKIM, and DMARC records
3. Use AWS SES or professional SMTP service
4. Avoid spammy content/subject lines

### Template not rendering

1. Check HTML syntax
2. Use inline CSS (required for email clients)
3. Test with different email clients
4. Use tables for layout (better compatibility)

## Security Notes

1. **Never log passwords**: The plain password is only used for email and not logged
2. **App Passwords**: Always use app-specific passwords, never main account passwords
3. **Environment Variables**: Keep `.env` files out of version control
4. **Email Validation**: The service validates email formats before sending
5. **Rate Limiting**: Consider adding rate limits for email sending in production

## Future Enhancements

Possible additions:

- Email queuing system (Bull, Bee-Queue)
- Email templates with variable substitution
- Email analytics and tracking
- Bulk email sending
- Email scheduling
- Attachment support
- Multi-language support
- Email preference management

## File Structure

```
server/
├── src/
│   ├── services/
│   │   └── email.service.js       # Main email service
│   ├── config/
│   │   └── index.js                # Email config
│   └── utils/
│       └── logger.js               # Email logging
├── .env.example                     # Email env vars template
└── EMAIL_SERVICE_GUIDE.md          # This guide
```

## Support

For issues or questions:
1. Check server logs: `logs/` directory
2. Verify configuration in `.env`
3. Test email connection
4. Check email provider documentation
