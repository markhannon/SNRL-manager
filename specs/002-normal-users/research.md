# Technical Research: Normal User Account Management

**Feature**: 002-normal-users
**Phase**: Phase 0 - Technical Foundation
**Date**: 2026-01-10

## Executive Summary

The Normal User Account Management feature will use the same technology stack established for the SNRL Manager project in feature 004-simracing-series and extended by feature 001-admin-user. This ensures consistency, allows code reuse (authentication infrastructure, User model), and maintains architectural alignment across the system.

## Technology Stack (Inherited from Project)

**Decision**: Use established SNRL Manager stack and extend 001-admin-user authentication infrastructure

**Rationale**: Normal user management is an extension of the user authentication system. Using the same stack and extending existing infrastructure enables:

- Shared User model and authentication logic
- Consistent JWT-based authentication pattern for both admin and normal users
- Unified database schema with email verification and password reset extensions
- Common frontend components and patterns
- Reduced complexity by avoiding separate authentication systems

**Stack Details**:

- **Runtime**: Node.js 20 LTS + TypeScript 5.x
- **Backend**: Fastify 4.x + Prisma ORM
- **Frontend**: React 18+
- **Database**: PostgreSQL 15+
- **Testing**: Vitest, Supertest, Playwright
- **Email**: nodemailer (new dependency for this feature)

## Feature-Specific Considerations

### 1. User Registration with Email Verification

**Decision**: Email-based registration with time-limited verification tokens

**Rationale**:

- Prevents spam and fake accounts
- Validates user owns the email address
- Industry-standard approach for user registration
- Simple token-based verification (no complex verification infrastructure)

**Implementation Approach**:

1. User submits registration form (email, password, name)
2. System validates inputs and creates User record with `email_verified: false`
3. System generates random verification token (32-byte cryptographically random string)
4. System stores token in EmailVerification table with 24-hour expiry
5. System sends verification email with link containing token
6. User clicks link, system validates token and marks email as verified
7. User can now log in

**Token Generation**:

```typescript
import crypto from 'crypto';

async function generateVerificationToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex'); // 64-character hex string
}
```

**Email Verification Table**:

```typescript
model EmailVerification {
  id         Int      @id @default(autoincrement())
  user_id    Int      @unique
  token      String   @unique
  expires_at DateTime
  created_at DateTime @default(now())

  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expires_at])
}
```

**User Model Extension**:

Add `email_verified` boolean field to existing User model from 001-admin-user:

```typescript
model User {
  // ... existing fields from 001-admin-user
  email_verified      Boolean              @default(false)
  email_verification  EmailVerification?
  password_resets     PasswordReset[]
}
```

**Security Considerations**:

- Tokens expire after 24 hours (balance between user convenience and security)
- Tokens are single-use (deleted after successful verification)
- Rate limit verification requests to prevent token enumeration attacks
- Unverified users cannot access protected resources (login blocked until verified)

### 2. Password Reset Functionality

**Decision**: Time-limited password reset tokens sent via email (1-hour expiry)

**Rationale**:

- Standard industry practice for password recovery
- Short expiry (1 hour) provides security while allowing user time to complete reset
- Single-use tokens prevent replay attacks
- Email delivery confirms user owns the account

**Implementation Flow**:

1. User submits "Forgot Password" form with email
2. System validates email exists (do NOT reveal if email is registered - security)
3. System generates random reset token (32-byte cryptographically random)
4. System stores token in PasswordReset table with 1-hour expiry
5. System sends password reset email with link containing token
6. User clicks link, enters new password
7. System validates token (not expired, not used), updates password, deletes token

**PasswordReset Table**:

```typescript
model PasswordReset {
  id         Int      @id @default(autoincrement())
  user_id    Int
  token      String   @unique
  expires_at DateTime
  used       Boolean  @default(false)
  created_at DateTime @default(now())
  used_at    DateTime?

  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([user_id, expires_at])
}
```

**Security Considerations**:

- Tokens expire after 1 hour (shorter than email verification for higher security)
- Tokens are single-use (marked as used after password reset)
- Multiple reset requests allowed (only most recent token is valid)
- Old password is NOT required (user may have forgotten it)
- Rate limit reset requests to prevent email spam and DoS attacks
- Do not reveal whether email exists in system (prevents user enumeration)

### 3. Session Management

**Decision**: JWT with 24-hour expiry (matching 001-admin-user pattern)

**Rationale**:

- Consistency with admin user authentication
- Stateless authentication suitable for API-based architecture
- 24-hour timeout balances security and user experience
- Same JWT structure and middleware as admin users

**JWT Structure** (extends 001-admin-user):

```typescript
interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'editor' | 'member';
  emailVerified: boolean;  // New field for normal users
  iat: number;  // Issued at
  exp: number;  // Expiration (24 hours from iat)
}
```

**Token Storage** (same as admin):

- Backend issues JWT after successful login
- Frontend stores in httpOnly cookie (prevents XSS attacks)
- Cookie set with Secure flag (HTTPS only) and SameSite=Strict
- No localStorage/sessionStorage to prevent XSS token theft

**Session Timeout Enforcement**:

- Access token expiry: 24 hours (specified in user requirements)
- No automatic refresh (user must re-login after 24 hours)
- Frontend should detect approaching expiry and warn user
- Backend rejects expired tokens with 401 Unauthorized

**Session Invalidation Scenarios**:

- User logs out (token added to blacklist)
- Admin changes user role (token added to blacklist)
- Admin deactivates user account (token added to blacklist)
- Password reset (all existing tokens invalidated)

### 4. Profile Management

**Decision**: Simple profile view/edit with email, name, and password change

**Rationale**:

- Meets functional requirement for profile view/edit
- Keeps MVP simple (defer additional profile fields to future iterations)
- Password change requires current password verification (security best practice)

**Editable Profile Fields**:

- Name (display name)
- Email (requires re-verification if changed)
- Password (requires current password confirmation)

**Implementation Approach**:

```typescript
// Profile view endpoint
GET /api/profile
Response: {
  id: number,
  email: string,
  email_verified: boolean,
  name: string,
  role: string,
  created_at: string,
  last_login: string
}

// Profile update endpoint
PUT /api/profile
Request: {
  name?: string,
  email?: string,
  current_password?: string,  // Required for email or password change
  new_password?: string
}
```

**Email Change Flow**:

1. User submits new email address with current password
2. System verifies current password
3. System creates new EmailVerification record with new email
4. System sends verification email to NEW email address
5. User clicks verification link
6. System updates email and sets email_verified to true
7. Old email is replaced, user logs in with new email

**Password Change Flow**:

1. User submits current password + new password
2. System verifies current password via bcrypt
3. System validates new password meets requirements
4. System hashes new password via bcrypt (12 rounds)
5. System updates password_hash
6. System invalidates all existing sessions (force re-login with new password)

### 5. Email Service

**Decision**: nodemailer for SMTP email delivery

**Rationale**:

- Industry-standard email library for Node.js
- Supports multiple transport methods (SMTP, SendGrid, AWS SES, etc.)
- Easy to configure for development (console logging) and production (SMTP server)
- Well-documented and actively maintained

**Library**: nodemailer npm package

**Configuration**:

```typescript
import nodemailer from 'nodemailer';

// Development: Log emails to console
const devTransport = nodemailer.createTransport({
  streamTransport: true,
  newline: 'unix',
  buffer: true
});

// Production: SMTP server (from environment variables)
const prodTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

**Email Templates**:

1. **Email Verification**:
   - Subject: "Verify your email address for SNRL Manager"
   - Body: Link to verification endpoint with token
   - Plain text + HTML versions

2. **Password Reset**:
   - Subject: "Reset your SNRL Manager password"
   - Body: Link to password reset page with token
   - Expiry notice (1 hour)
   - Plain text + HTML versions

3. **Email Change Confirmation**:
   - Subject: "Confirm your new email address"
   - Body: Link to verify new email
   - Plain text + HTML versions

**Error Handling**:

- Email send failures should be logged but NOT block user registration
- Provide fallback mechanism for admins to manually verify users if email delivery fails
- Retry logic for transient email delivery failures (3 attempts with exponential backoff)

### 6. Content Access Based on Role/Permissions

**Decision**: Leverage existing RBAC from 001-admin-user

**Rationale**:

- User roles (Admin, Editor, Member) already defined in 001-admin-user
- Series-specific permissions already implemented for Members elevated to Editor on specific series
- Normal users will have Member role by default upon registration
- Admins control role assignments via 001-admin-user functionality

**Default Role Assignment**:

- All self-registered users receive `role: 'member'` by default
- Only admins can elevate users to Editor or Admin roles (via 001-admin-user)
- Series-specific Editor permissions granted by admins (via 001-admin-user)

**Permission Checks**:

Same middleware and service-level checks as 001-admin-user:

```typescript
// Middleware for protected routes
async function requireAuth(request, reply) {
  const token = request.cookies.token;
  if (!token) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const payload = await verifyJWT(token);
  if (!payload.emailVerified) {
    return reply.status(403).send({ error: 'Email verification required' });
  }

  request.user = payload;
}

// Middleware for role-based access
async function requireRole(role: 'admin' | 'editor' | 'member') {
  return async (request, reply) => {
    const roleHierarchy = { admin: 3, editor: 2, member: 1 };
    if (roleHierarchy[request.user.role] < roleHierarchy[role]) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}
```

## Performance Validation

**Success Criteria** (inferred from user requirements):

- **Registration Flow**: <2 min → Achievable (form submission + validation + email send <5s, user clicks link <2 min)
- **Login**: <1s → Achievable (email lookup + bcrypt verify ~300ms + JWT generation <10ms)
- **Password Reset Email**: <10s → Achievable (token generation + email send <5s)
- **Profile Load**: <500ms → Achievable (single indexed user query <50ms + JWT validation <10ms)

**Database Indexes Needed**:

```sql
-- User table indexes (extends 001-admin-user)
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- EmailVerification table indexes
CREATE UNIQUE INDEX idx_email_verification_token ON email_verification(token);
CREATE INDEX idx_email_verification_expires ON email_verification(expires_at);
CREATE UNIQUE INDEX idx_email_verification_user ON email_verification(user_id);

-- PasswordReset table indexes
CREATE UNIQUE INDEX idx_password_reset_token ON password_reset(token);
CREATE INDEX idx_password_reset_user_expires ON password_reset(user_id, expires_at);
```

**Query Performance Estimates**:

- User lookup by email (indexed): <10ms
- Token validation (indexed): <5ms
- Password hash verification (bcrypt): ~200-300ms (intentional for security)
- Email send (async): 1-3s (non-blocking)
- Profile update transaction: <50ms

All well within performance goals.

## API Design Patterns

**RESTful Resource-Based Endpoints**:

Following REST conventions and extending patterns from 001-admin-user:

- `POST /api/auth/register` - User registration (new)
- `POST /api/auth/verify-email` - Email verification (new)
- `POST /api/auth/login` - User login (extends admin login from 001)
- `POST /api/auth/logout` - User logout (extends admin logout from 001)
- `POST /api/auth/forgot-password` - Request password reset (new)
- `POST /api/auth/reset-password` - Reset password with token (new)
- `GET /api/profile` - View own profile (new)
- `PUT /api/profile` - Update own profile (new)

**Request/Response Format**:

All endpoints use JSON for requests and responses. Fastify schema validation ensures type safety.

**Error Responses**:

Standard error format (consistent with 001-admin-user):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Email already exists"
}
```

**Validation Errors**:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Security Considerations

### 1. Email Enumeration Prevention

**Problem**: Attackers can determine which emails are registered by observing different responses

**Solution**: Always return the same success message regardless of whether email exists

```typescript
// Forgot password endpoint
// Always returns success, even if email doesn't exist
POST /api/auth/forgot-password
Response: {
  "message": "If an account exists with that email, you will receive a password reset link."
}
```

### 2. Rate Limiting

**Decision**: Add rate limiting to all authentication endpoints

```typescript
// Registration: 3 attempts per hour per IP
// Login: 5 attempts per 15 minutes per IP
// Forgot password: 3 attempts per hour per IP
// Email verification resend: 5 attempts per hour per user

await fastify.register(rateLimit, {
  max: 5,
  timeWindow: '15 minutes',
  keyGenerator: (request) => request.ip
});
```

Prevents brute force attacks and email spam.

### 3. Password Requirements

**Decision**: Enforce strong password policy

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Special character (defer to post-MVP)

**Validation** (Zod or Joi):

```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
```

### 4. HTTPS Enforcement

Same as 001-admin-user:

- JWT cookies set with Secure flag (only sent over HTTPS)
- HSTS headers to enforce HTTPS
- Redirect HTTP to HTTPS at load balancer/reverse proxy

### 5. Token Security

**Email Verification and Password Reset Tokens**:

- Cryptographically random (crypto.randomBytes)
- Long enough to prevent brute force (32 bytes = 64 hex chars)
- Single-use (deleted or marked as used after consumption)
- Time-limited (24 hours for verification, 1 hour for password reset)
- Stored hashed in database (future enhancement - MVP stores plaintext for simplicity)

### 6. Email Verification Required

**Critical**: Users cannot access protected resources until email is verified

```typescript
async function requireEmailVerified(request, reply) {
  if (!request.user.emailVerified) {
    return reply.status(403).send({
      error: 'Email verification required',
      message: 'Please verify your email address to access this resource'
    });
  }
}
```

Apply this middleware to all protected routes except:
- Email verification endpoint itself
- Profile endpoint (allow viewing unverified status)
- Resend verification email endpoint

## Open Questions

**None** - all technical decisions align with established project stack and user requirements.

## Recommendations Summary

1. Extend existing User model from 001-admin-user with `email_verified` field
2. Add EmailVerification and PasswordReset tables for token management
3. Use nodemailer for SMTP email delivery (configurable for dev/prod)
4. Implement 24-hour email verification tokens and 1-hour password reset tokens
5. Enforce email verification before allowing access to protected resources
6. Use same JWT authentication pattern as 001-admin-user (consistency)
7. Default all self-registered users to Member role
8. Implement rate limiting on all authentication endpoints
9. Prevent email enumeration by returning same message regardless of email existence
10. Add strategic indexes on email, tokens, and expiry times for performance

## Next Steps

Proceed to Phase 1 design artifacts:

1. **data-model.md**: Complete Prisma schema for User extensions, EmailVerification, and PasswordReset entities
2. **contracts/openapi.yaml**: Full API specification for registration, verification, login, password reset, and profile endpoints
3. **quickstart.md**: Development setup guide including email configuration and testing workflows
