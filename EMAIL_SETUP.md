# Email Notification Setup Guide

## Prerequisites

1. **Node.js Package**: `nodemailer` must be installed
2. **Email Service**: Gmail account or alternative SMTP provider
3. **Environment Variables**: Add to backend `.env` file

## Setup Steps

### 1. Install nodemailer

Run in the `backend/` directory:

```bash
npm install nodemailer
```

### 2. Configure Environment Variables

Add the following to your `backend/.env` file:

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:5173
```

### 3. Gmail Setup (Recommended Method)

If using Gmail as your email provider:

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication (if not already enabled)

#### Step 2: Generate App-Specific Password
1. Go to [App passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Windows Computer" as the device (or your device type)
4. Google will generate a 16-character password
5. Copy this password and use it as `EMAIL_PASSWORD` in your `.env` file

#### Example Configuration:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5173
```

### 4. Alternative Email Providers

If you prefer not to use Gmail, you can use other providers:

#### SendGrid
```env
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
# Also need to modify EmailService to use SendGrid
```

#### AWS SES
```env
EMAIL_USER=your-aws-access-key-id
EMAIL_PASSWORD=your-aws-secret-access-key
# Also need to modify EmailService to use AWS SES
```

#### Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
# Configure SMTP in EmailService
```

## Email Features

The system sends two types of emails:

### 1. Schedule Confirmation Email
- **When**: User schedules an interview
- **To**: The user scheduling the interview
- **Content**: Interview details, scheduled time, link to dashboard

### 2. Match Notification Email
- **When**: An interviewer match is found for a scheduled interview
- **To**: Both the candidate and interviewer
- **Content**: Partner name, interview type, scheduled time, link to interview room
- **For Peer Matches**: Sent during 30-second instant fallback or scheduled fallback

## Troubleshooting

### "nodemailer is not defined"
- Run `npm install nodemailer` in the backend directory
- Restart the backend server

### "Authentication failed" Error
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- For Gmail: Ensure app-specific password is used, not your main password
- Check that 2-Factor Authentication is enabled in Gmail account

### Emails Not Sending
1. Check backend console logs for error messages
2. Verify environment variables are loaded (restart backend after adding to .env)
3. Ensure internet connection is available
4. For Gmail: Check if "Less secure app access" needs to be enabled (if not using app password)

### Testing Email Service
You can test the email service by:
1. Scheduling an interview
2. Checking the backend console for email sending confirmation
3. Checking the email inbox for confirmation email
4. For match notifications: Schedule an interview and have another user join as interviewer

## Security Notes

- Never commit `.env` file with real credentials to version control
- Use app-specific passwords instead of main account password
- Consider using environment secrets manager in production
- Rotate credentials periodically for security

## Frontend FRONTEND_URL

The `FRONTEND_URL` environment variable is used in email links. Set it to:
- **Development**: `http://localhost:5173`
- **Production**: Your deployed frontend URL (e.g., `https://peerprep.example.com`)

## Email Template Customization

To customize email templates, edit `backend/services/EmailService.js`:
- Modify `htmlContent` variable in `sendMatchNotification()`
- Modify `htmlContent` variable in `sendScheduleConfirmation()`
- Change colors, logo, branding as needed

## Production Deployment

For production:
1. Use environment variables from your hosting platform
2. Consider using a dedicated email service (SendGrid, AWS SES)
3. Implement rate limiting to prevent email spam
4. Add unsubscribe functionality for compliance
5. Store email logs for audit trail
