# Email Alert Configuration Guide

## Overview

The Whistle application now includes a priority-based email alert system that sends notifications to **ritisulo@gmail.com** based on the severity and category of submitted reports.

## Email Alert Priority Rules

### 🚨 CRITICAL ALERT (Immediate)
- **Severity**: `urgent`
- **Category**: `emergency`
- **Action**: Email sent immediately

### ⚠️ HIGH PRIORITY (Within 30 minutes)
- **Severity**: `high`
- **Category**: `harassment`
- **Action**: High priority email alert

### 📋 STANDARD PRIORITY (Within 4 hours)
- **Severity**: `medium`
- **Categories**: All categories
- **Action**: Standard email notification

### 📝 LOW PRIORITY (Within 24 hours)
- **Severity**: `low`
- **Categories**: `medical`, `safety` (feedback reports are skipped for low priority)
- **Action**: Low priority email notification

## Setting Up Email Service

### Option 1: Gmail (Recommended)

1. **Create App Password** (if using 2FA):
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate app password for "Mail"

2. **Set Environment Variables**:
   ```bash
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password-or-password
   ```

### Option 2: Other Email Providers

#### Outlook/Hotmail
```bash
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo
```bash
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

#### Custom SMTP
```bash
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
```

## Environment Variables for Render

In your Render dashboard, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `EMAIL_USER` | `your-email@gmail.com` | Email account for sending alerts |
| `EMAIL_PASS` | `your-app-password` | Email password or app password |
| `EMAIL_HOST` | `smtp.gmail.com` (optional) | SMTP host (auto-detected for common providers) |
| `EMAIL_PORT` | `587` (optional) | SMTP port (defaults to 587) |

## Testing Email Configuration

### 1. Check Configuration Status
Visit: `/api/debug`
- Shows if email is configured
- Displays masked email user

### 2. Test Email Connection (Admin Only)
**POST** `/api/test-email`
- Headers: `Authorization: Bearer ritika:satoru 2624`
- Sends test email to verify configuration
- Returns connection status

### 3. Test with Curl
```bash
curl -X POST http://your-app-url/api/test-email \
  -H "Authorization: Bearer ritika:satoru 2624" \
  -H "Content-Type: application/json"
```

## Email Templates

The system sends HTML emails with:
- **Priority color coding** (Red for critical, Orange for high, etc.)
- **Report details** (ID, category, severity, timestamp)
- **Message preview** (for non-encrypted reports)
- **Action required** based on priority level
- **Direct link** to admin dashboard

## Troubleshooting

### Issue: "Email service not configured"
**Solution**: Set `EMAIL_USER` and `EMAIL_PASS` environment variables

### Issue: "Authentication failed"
**Solution**: 
- For Gmail: Use app password instead of regular password
- For 2FA accounts: Generate app-specific password

### Issue: "Connection refused"
**Solution**: Check if your email provider allows SMTP access

### Issue: Emails going to spam
**Solution**: 
- Add the sender email to your contacts
- Check spam folder initially
- Consider using a dedicated email service like SendGrid for production

## Current Configuration

- **Admin Email**: `ritisulo@gmail.com`
- **Email Service**: Nodemailer with auto-provider detection
- **Fallback**: Logs email content if service not configured
- **Priority System**: 4-tier priority-based alert system

## Security Notes

- Email credentials are stored as environment variables
- No sensitive report data is logged
- Email content includes sanitized report information
- Admin authentication required for test endpoints

## Production Recommendations

For production use, consider:
1. **Dedicated email service** (SendGrid, AWS SES, Mailgun)
2. **Email templates** stored separately
3. **Rate limiting** for email alerts
4. **Backup notification methods** (SMS, Slack, etc.)
5. **Email delivery monitoring**

## Monitoring

- Check server logs for email delivery status
- Use `/api/test-email` to verify configuration
- Monitor email delivery in your email provider's dashboard
- Set up alerts for email service failures
