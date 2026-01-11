# Quickstart Guide: Normal User Account Management

**Feature**: 002-normal-users
**Date**: 2026-01-10
**Extends**: 001-admin-user (authentication infrastructure)

## Overview

This guide walks you through setting up, developing, and testing the Normal User Account Management feature. It covers email configuration, registration flow testing, password reset testing, and profile management.

**Note**: This feature extends 001-admin-user. Complete the setup for 001-admin-user first.

## Prerequisites

Same as 001-admin-user, plus:

- **Email Testing Tool** (one of):
  - [Mailpit](https://github.com/axllent/mailpit) (recommended for development)
  - [MailHog](https://github.com/mailhog/MailHog)
  - Gmail SMTP (for production-like testing)

## Initial Setup

### 1. Complete 001-admin-user Setup

Ensure you have completed all setup steps from `specs/001-admin-user/quickstart.md`:

- Repository cloned and on correct branch
- Dependencies installed (backend and frontend)
- PostgreSQL database created
- Base migrations run (User, SeriesPermission, ActivityLog tables)

### 2. Checkout Feature Branch

```bash
git checkout 002-normal-users
```

### 3. Run New Migrations

```bash
cd backend

# Run migrations for EmailVerification and PasswordReset tables
npx prisma migrate dev --name add_email_verification_and_password_reset

# Regenerate Prisma client
npx prisma generate
```

This adds:
- `email_verified` field to User table
- `email_verifications` table
- `password_resets` table

### 4. Email Service Configuration

#### Option A: Mailpit (Recommended for Development)

**Install Mailpit**:

```bash
# macOS
brew install mailpit

# Linux
wget https://github.com/axllent/mailpit/releases/download/v1.8.0/mailpit-linux-amd64.tar.gz
tar -xzf mailpit-linux-amd64.tar.gz
sudo mv mailpit /usr/local/bin/

# Start Mailpit
mailpit
```

Mailpit runs on:
- SMTP server: `localhost:1025`
- Web interface: `http://localhost:8025`

**Configure Backend**:

Edit `backend/.env`:

```env
# Email Configuration (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME="SNRL Manager"
SMTP_FROM_EMAIL=noreply@snrl.example

# Application URL (for email links)
APP_URL=http://localhost:5173
```

#### Option B: Gmail SMTP (Production-like Testing)

**Configure Backend**:

Edit `backend/.env`:

```env
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-specific-password  # Generate at: https://myaccount.google.com/apppasswords
SMTP_FROM_NAME="SNRL Manager"
SMTP_FROM_EMAIL=your-gmail@gmail.com

# Application URL
APP_URL=http://localhost:5173
```

**Note**: Use Gmail App Password, not regular password. Enable 2FA first.

### 5. Update Seed Script (Optional)

Edit `backend/prisma/seed.ts` to add test users with email verification:

```typescript
// Add after admin user creation

// Create verified member user
const memberPasswordHash = await bcrypt.hash('member123', 12);
const verifiedMember = await prisma.user.create({
  data: {
    email: 'member@snrl.example',
    password_hash: memberPasswordHash,
    name: 'Verified Member',
    role: 'member',
    status: 'active',
    email_verified: true  // Already verified for testing
  }
});

// Create unverified user
const unverifiedPasswordHash = await bcrypt.hash('unverified123', 12);
const unverifiedUser = await prisma.user.create({
  data: {
    email: 'unverified@snrl.example',
    password_hash: unverifiedPasswordHash,
    name: 'Unverified User',
    role: 'member',
    status: 'active',
    email_verified: false
  }
});

// Create verification token for unverified user
const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 24);

await prisma.emailVerification.create({
  data: {
    user_id: unverifiedUser.id,
    token,
    expires_at: expiresAt
  }
});

console.log('Verification token for testing:', token);
console.log('Verification URL:', `http://localhost:5173/verify-email?token=${token}`);
```

### 6. Seed Database

```bash
cd backend
npx prisma db seed
```

### 7. Start Development Servers

**Terminal 1 - Mailpit** (if using):

```bash
mailpit
```

**Terminal 2 - Backend**:

```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend**:

```bash
cd frontend
npm run dev
```

### 8. Verify Email Setup

Open Mailpit web interface at `http://localhost:8025` and keep it open to see verification emails.

## Testing User Registration Flow

### 1. Register New User via API

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'

# Response:
# {
#   "message": "Registration successful. Please check your email to verify your account.",
#   "user": {
#     "id": 4,
#     "email": "testuser@example.com",
#     "email_verified": false
#   }
# }
```

### 2. Check Verification Email

Open Mailpit (`http://localhost:8025`) and click the most recent email.

Email should contain:
- Subject: "Verify your email address for SNRL Manager"
- Verification link with token: `http://localhost:5173/verify-email?token=...`

### 3. Extract Token from Email

Copy the 64-character hex token from the email URL.

### 4. Verify Email via API

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
  }'

# Response:
# {
#   "message": "Email verified successfully. You can now log in."
# }
```

### 5. Attempt Login Before Verification (Should Fail)

```bash
# Register another user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified2@example.com",
    "password": "TestPass123",
    "name": "Unverified User 2"
  }'

# Try to login immediately (should fail)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified2@example.com",
    "password": "TestPass123"
  }'

# Expected Response: 403 Forbidden
# {
#   "statusCode": 403,
#   "error": "Forbidden",
#   "message": "Email verification required. Please check your inbox."
# }
```

### 6. Login After Verification (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }' \
  -c cookies.txt

# Response:
# {
#   "user": {
#     "id": 4,
#     "email": "testuser@example.com",
#     "email_verified": true,
#     "name": "Test User",
#     "role": "member",
#     "status": "active"
#   },
#   "message": "Login successful"
# }
```

## Testing Password Reset Flow

### 1. Request Password Reset

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'

# Response (always same, even if email doesn't exist):
# {
#   "message": "If an account exists with that email, you will receive a password reset link."
# }
```

### 2. Check Password Reset Email

Open Mailpit (`http://localhost:8025`) and click the password reset email.

Email should contain:
- Subject: "Reset your SNRL Manager password"
- Reset link with token: `http://localhost:5173/reset-password?token=...`
- Expiry notice: "This link expires in 1 hour"

### 3. Extract Reset Token

Copy the 64-character hex token from the email URL.

### 4. Reset Password via API

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2",
    "new_password": "NewSecurePass123"
  }'

# Response:
# {
#   "message": "Password reset successfully. Please log in with your new password."
# }
```

### 5. Login with New Password

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "NewSecurePass123"
  }' \
  -c cookies.txt

# Should succeed
```

### 6. Test Expired Token (Wait 1 Hour or Manually Expire)

```bash
# To manually test expiry, update database:
psql $DATABASE_URL -c "UPDATE password_resets SET expires_at = NOW() - INTERVAL '1 hour' WHERE token = 'your-token';"

# Then try reset (should fail)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "expired-token",
    "new_password": "AnotherPass123"
  }'

# Expected: 400 Bad Request - "Invalid or expired password reset token"
```

## Testing Profile Management

### 1. View Profile

```bash
curl http://localhost:3000/api/profile \
  -b cookies.txt

# Response:
# {
#   "id": 4,
#   "email": "testuser@example.com",
#   "email_verified": true,
#   "name": "Test User",
#   "role": "member",
#   "status": "active",
#   "created_at": "2026-01-10T10:00:00Z",
#   "last_login": "2026-01-10T14:30:00Z"
# }
```

### 2. Update Profile Name

```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Updated Name"
  }'

# Response:
# {
#   "message": "Profile updated successfully",
#   "user": {
#     "id": 4,
#     "email": "testuser@example.com",
#     "name": "Updated Name",
#     ...
#   },
#   "requiresReauth": false
# }
```

### 3. Change Email (Requires Re-verification)

```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "newemail@example.com",
    "current_password": "NewSecurePass123"
  }'

# Response:
# {
#   "message": "Email updated. Please verify your new email address.",
#   "user": {
#     "id": 4,
#     "email": "newemail@example.com",
#     "email_verified": false,  // Now false, needs re-verification
#     ...
#   },
#   "requiresReauth": false
# }
```

Check Mailpit for verification email sent to `newemail@example.com`.

### 4. Change Password

```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "current_password": "NewSecurePass123",
    "new_password": "AnotherNewPass123"
  }'

# Response:
# {
#   "message": "Password changed successfully. Please log in again.",
#   "requiresReauth": true  // All sessions invalidated
# }
```

Re-login required with new password.

### 5. Test Incorrect Current Password

```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "current_password": "WrongPassword123",
    "new_password": "SomeNewPass123"
  }'

# Expected: 400 Bad Request
# {
#   "statusCode": 400,
#   "error": "Bad Request",
#   "message": "Current password is incorrect"
# }
```

## API Testing with Postman/Insomnia

1. Import `specs/002-normal-users/contracts/openapi.yaml` as OpenAPI 3.0 spec
2. Set base URL: `http://localhost:3000/api`
3. Test registration → verification → login → profile flow
4. Test password reset flow
5. All endpoints documented with request/response examples

## Running Tests

### Unit Tests

```bash
cd backend

# Run all unit tests
npm run test:unit

# Run email service tests
npm run test:unit -- services/email.service.test.ts

# Run registration service tests
npm run test:unit -- services/registration.service.test.ts

# Run with coverage
npm run test:unit -- --coverage
```

### Integration Tests

```bash
cd backend

# Run all integration tests
npm run test:integration

# Run registration flow tests
npm run test:integration -- api/auth/register.test.ts

# Run password reset flow tests
npm run test:integration -- api/auth/password-reset.test.ts

# Run profile management tests
npm run test:integration -- api/profile.test.ts
```

### E2E Tests

```bash
cd frontend

# Run Playwright E2E tests
npm run test:e2e

# Run registration flow E2E
npm run test:e2e -- auth/registration.spec.ts

# Run password reset E2E
npm run test:e2e -- auth/password-reset.spec.ts

# Run in headed mode (visible browser)
npm run test:e2e -- --headed
```

## Database Management

### View Verification and Reset Tokens

```bash
cd backend
npx prisma studio
```

Navigate to:
- `email_verifications` table - see active verification tokens
- `password_resets` table - see reset tokens and their used status

### Manually Verify User Email

```bash
psql $DATABASE_URL

-- Update user's email_verified status
UPDATE users SET email_verified = true WHERE email = 'user@example.com';

-- Delete verification token
DELETE FROM email_verifications WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

### Check Expired Tokens

```bash
psql $DATABASE_URL

-- List expired email verifications
SELECT * FROM email_verifications WHERE expires_at < NOW();

-- List expired password resets
SELECT * FROM password_resets WHERE expires_at < NOW() AND used = false;
```

### Cleanup Expired Tokens (Manual)

```bash
psql $DATABASE_URL

-- Delete expired email verifications
DELETE FROM email_verifications WHERE expires_at < NOW();

-- Delete old password resets (keep for 30 days)
DELETE FROM password_resets WHERE created_at < NOW() - INTERVAL '30 days';
```

**Production**: Run cleanup as cron job or background task.

## Common Development Tasks

### Add New Email Template

1. Create template in `backend/src/utils/email-templates.ts`
2. Add email sending function in `backend/src/services/email.service.ts`
3. Call from service layer (registration, password reset, etc.)
4. Test in Mailpit

Example:

```typescript
// email-templates.ts
export function renderWelcomeEmail(name: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Welcome to SNRL Manager',
    html: `<h1>Welcome, ${name}!</h1><p>Thanks for joining SNRL Manager.</p>`,
    text: `Welcome, ${name}!\n\nThanks for joining SNRL Manager.`
  };
}

// email.service.ts
async sendWelcomeEmail(email: string, name: string) {
  const { subject, html, text } = renderWelcomeEmail(name);
  await this.sendEmail(email, subject, html, text);
}
```

### Customize Token Expiry Times

Edit constants in service files:

```typescript
// registration.service.ts
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;  // Change to desired hours

// passwordReset.service.ts
const PASSWORD_RESET_EXPIRY_HOURS = 1;  // Change to desired hours
```

### Add Email Rate Limiting

```typescript
// In registration or password reset service
import rateLimit from '@fastify/rate-limit';

// Registration: 3 attempts per hour per IP
await fastify.register(rateLimit, {
  max: 3,
  timeWindow: '1 hour',
  keyGenerator: (request) => request.ip
});
```

## Debugging

### Email Delivery Issues

#### Check Mailpit Web Interface

Open `http://localhost:8025` and verify:
- Email appears in inbox
- Subject and content are correct
- Token link is valid

#### Check Backend Logs

```bash
cd backend
npm run dev

# Look for email-related logs:
# - "Sending verification email to..."
# - "Email sent successfully"
# - "Email send failed: ..."
```

#### Test SMTP Connection

```typescript
// In backend code or Node REPL
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false
});

await transporter.verify();
console.log('SMTP connection successful');
```

### Token Validation Issues

#### Invalid Token Error

Check:
1. Token copied correctly (64 hex characters, no spaces)
2. Token not expired (check `expires_at` in database)
3. Token not already used (password reset: `used = false`)

```bash
psql $DATABASE_URL

-- Check email verification token
SELECT * FROM email_verifications WHERE token = 'your-token-here';

-- Check password reset token
SELECT * FROM password_resets WHERE token = 'your-token-here';
```

#### Token Expired

```bash
# Manually extend expiry for testing
psql $DATABASE_URL -c "UPDATE email_verifications SET expires_at = NOW() + INTERVAL '24 hours' WHERE token = 'your-token';"
```

### Email Verification Required Error

User cannot login because `email_verified = false`.

Solutions:
1. Complete verification flow (click link in email)
2. Manually verify for testing: `UPDATE users SET email_verified = true WHERE email = '...'`
3. Resend verification email: `POST /api/auth/resend-verification`

## Troubleshooting

### Issue: "Emails not appearing in Mailpit"

**Symptoms**: Registration or password reset completes, but no email in Mailpit

**Solutions**:
1. Check Mailpit is running: `ps aux | grep mailpit`
2. Verify SMTP settings in `.env`: `SMTP_HOST=localhost`, `SMTP_PORT=1025`
3. Check backend logs for email send errors
4. Test SMTP connection (see Debugging section)

### Issue: "Verification link returns 404"

**Symptoms**: Clicking email link shows "Page not found"

**Solutions**:
1. Ensure frontend is running: `http://localhost:5173`
2. Check `APP_URL` in backend `.env` matches frontend URL
3. Verify frontend has `/verify-email` route
4. Check token is in URL query params: `?token=...`

### Issue: "Email already exists" on registration

**Symptoms**: Cannot register with email

**Solutions**:
1. Email is already used (including deleted users)
2. Check database: `SELECT email, status, email_verified FROM users WHERE email = '...'`
3. Use different email or delete existing user

### Issue: "Gmail SMTP authentication failed"

**Symptoms**: Email send fails with "Invalid login" error

**Solutions**:
1. Use App Password, not regular password
2. Enable 2FA on Gmail account first
3. Generate App Password: https://myaccount.google.com/apppasswords
4. Check `SMTP_USER` and `SMTP_PASS` in `.env`
5. Verify Gmail allows "Less secure app access" (if not using App Password)

### Issue: "Password reset token already used"

**Symptoms**: Cannot reset password with token

**Solutions**:
1. Token is single-use (marked as `used = true` after first reset)
2. Request new password reset: `POST /api/auth/forgot-password`
3. Check database: `SELECT used, used_at FROM password_resets WHERE token = '...'`

### Issue: "Session invalidated after password change"

**Symptoms**: 401 Unauthorized after successful password change

**Solutions**:
1. This is expected behavior (security feature)
2. All existing sessions invalidated when password changes
3. Re-login with new password

## Performance Monitoring

### Check Email Send Times

```bash
# Backend logs show email delivery time
[14:30:15.123] INFO: Sending verification email to user@example.com
[14:30:16.456] INFO: Email sent successfully (1.3s)
```

Look for slow sends (>3s).

### Monitor Token Cleanup

```bash
# Check number of expired tokens
psql $DATABASE_URL

SELECT
  (SELECT COUNT(*) FROM email_verifications WHERE expires_at < NOW()) as expired_verifications,
  (SELECT COUNT(*) FROM password_resets WHERE expires_at < NOW()) as expired_resets;
```

Set up cleanup job if counts grow large.

## Security Checklist

Before deploying to production:

- [ ] Configure real SMTP server (not Mailpit)
- [ ] Use strong SMTP credentials
- [ ] Enable HTTPS for email links (`APP_URL` should use `https://`)
- [ ] Set appropriate token expiry times (24h verification, 1h reset)
- [ ] Enable rate limiting on registration and password reset endpoints
- [ ] Test email enumeration prevention (forgot password always returns success)
- [ ] Verify password strength requirements enforced
- [ ] Test expired token rejection
- [ ] Ensure email templates are professional and branded
- [ ] Configure email "From" address and name appropriately

## Useful Commands Reference

```bash
# Email
mailpit                            # Start Mailpit (dev email server)
open http://localhost:8025         # Open Mailpit web interface

# Database - Email Verification
psql $DATABASE_URL -c "SELECT * FROM email_verifications;"
psql $DATABASE_URL -c "UPDATE users SET email_verified = true WHERE email = '...';"
psql $DATABASE_URL -c "DELETE FROM email_verifications WHERE expires_at < NOW();"

# Database - Password Reset
psql $DATABASE_URL -c "SELECT * FROM password_resets WHERE used = false;"
psql $DATABASE_URL -c "DELETE FROM password_resets WHERE created_at < NOW() - INTERVAL '30 days';"

# Testing
npm run test:unit -- services/email.service.test.ts
npm run test:integration -- api/auth/register.test.ts
npm run test:e2e -- auth/registration.spec.ts
```

## Next Steps

After completing setup:

1. Read the [Data Model documentation](./data-model.md) for schema details
2. Review [API Contracts](./contracts/openapi.yaml) for endpoint specifications
3. Check [Research document](./research.md) for technical decisions
4. Test complete user registration flow in browser
5. Test password reset flow in browser
6. Implement frontend components per [Implementation Plan](./plan.md)

## Getting Help

- **API Documentation**: OpenAPI spec at `specs/002-normal-users/contracts/openapi.yaml`
- **Database Schema**: See `data-model.md` and `backend/prisma/schema.prisma`
- **Email Templates**: Check `backend/src/utils/email-templates.ts`
- **Troubleshooting**: Review common issues above
- **Logs**: Check backend console and Mailpit interface

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Mailpit Documentation](https://mailpit.axllent.org/)
- [Email Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
