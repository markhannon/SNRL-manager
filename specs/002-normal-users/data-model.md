# Data Model: Normal User Account Management

**Feature**: 002-normal-users
**Date**: 2026-01-10
**Database**: PostgreSQL 15+ with Prisma ORM

## Overview

This data model extends the User entity from feature 001-admin-user and adds two new entities for normal user self-service authentication:

1. **User** (extended): Adds email verification status to existing model
2. **EmailVerification** (new): Email verification tokens for user registration
3. **PasswordReset** (new): Password reset tokens for forgotten password recovery

## Entity Relationship Diagram

```
┌─────────────────────────┐
│         User            │
│  (from 001-admin-user)  │
├─────────────────────────┤
│ id (PK)                 │
│ email (unique)          │
│ password_hash           │
│ name                    │
│ role                    │
│ status                  │
│ email_verified (NEW)    │◄────┐
│ created_at              │     │
│ updated_at              │     │
│ last_login              │     │
└─────────────────────────┘     │
         │                      │
         │ 1                    │
         │                      │
         ├──────────────────────┤
         │                      │
         │ 1                    │
         │                      │
         ▼                      │
┌──────────────────────┐        │
│ EmailVerification    │        │
├──────────────────────┤        │
│ id (PK)              │        │
│ user_id (FK, unique) │────────┘
│ token (unique)       │
│ expires_at           │
│ created_at           │
└──────────────────────┘

         │
         │ 1
         │
         │
         ▼
┌──────────────────────┐
│   PasswordReset      │
├──────────────────────┤
│ id (PK)              │
│ user_id (FK)         │────────┐
│ token (unique)       │        │
│ expires_at           │        │
│ used                 │        │
│ created_at           │        │
│ used_at              │        │
└──────────────────────┘        │
                               │
         ┌─────────────────────┘
         │
         ▼
      (User)
```

## Prisma Schema Extensions

```prisma
// backend/prisma/schema.prisma
// This schema EXTENDS the existing schema from 001-admin-user

// ============================================================================
// User Entity Extensions (from 001-admin-user)
// ============================================================================

model User {
  // ... All existing fields from 001-admin-user ...
  id            Int       @id @default(autoincrement())
  email         String    @unique @db.VarChar(255)
  password_hash String    @db.VarChar(255)
  name          String?   @db.VarChar(255)
  role          UserRole  @default(member)
  status        UserStatus @default(active)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  last_login    DateTime?

  // NEW FIELD for 002-normal-users
  email_verified Boolean   @default(false)

  // Existing relationships from 001-admin-user
  series_permissions SeriesPermission[] @relation("UserSeriesPermissions")
  granted_permissions SeriesPermission[] @relation("PermissionGranter")
  activity_logs      ActivityLog[]      @relation("AdminActivityLogs")

  // NEW RELATIONSHIPS for 002-normal-users
  email_verification EmailVerification?
  password_resets    PasswordReset[]

  // Existing indexes from 001-admin-user
  @@index([email])
  @@index([role])
  @@index([status])
  @@index([created_at(sort: Desc)])

  // NEW INDEX for 002-normal-users
  @@index([email_verified])

  @@map("users")
}

// ============================================================================
// EmailVerification Entity (NEW)
// ============================================================================

model EmailVerification {
  id         Int      @id @default(autoincrement())
  user_id    Int      @unique  // One verification per user (1:1 relationship)
  token      String   @unique @db.VarChar(64)  // 32-byte hex = 64 chars
  expires_at DateTime
  created_at DateTime @default(now())

  // Relationships
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Indexes
  @@index([token])
  @@index([expires_at])
  @@map("email_verifications")
}

// ============================================================================
// PasswordReset Entity (NEW)
// ============================================================================

model PasswordReset {
  id         Int      @id @default(autoincrement())
  user_id    Int
  token      String   @unique @db.VarChar(64)  // 32-byte hex = 64 chars
  expires_at DateTime
  used       Boolean  @default(false)
  created_at DateTime @default(now())
  used_at    DateTime?

  // Relationships
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // Indexes
  @@index([token])
  @@index([user_id, expires_at])
  @@index([used])
  @@map("password_resets")
}
```

## Entity Details

### User Entity Extensions

**New Field**:

- `email_verified` (Boolean, default: false): Whether user has verified their email address via verification link

**New Relationships**:

- `email_verification`: One-to-one relationship with EmailVerification (current verification token for this user)
- `password_resets`: One-to-many relationship with PasswordReset (password reset requests for this user)

**New Index**:

- Index on `email_verified` for filtering verified/unverified users

**Business Rules**:

1. Self-registered users start with `email_verified: false`
2. Users cannot access protected resources until `email_verified: true`
3. Admin-created users can have `email_verified: true` by default (skip verification)
4. Login endpoint checks `email_verified` and rejects unverified users
5. Email verification required for all self-service password resets

### EmailVerification Entity

**Purpose**: Stores time-limited email verification tokens for user registration.

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `user_id` (Int, FK, unique): User account being verified (1:1 relationship)
- `token` (String, unique): Cryptographically random 64-character hex string (32 bytes)
- `expires_at` (DateTime): Token expiration time (24 hours from creation)
- `created_at` (DateTime): When token was generated

**Relationships**:

- `user`: One-to-one relationship with User (user being verified)

**Indexes**:

- Unique index on `token` for fast lookup during verification
- Index on `expires_at` for cleanup of expired tokens
- Unique index on `user_id` to ensure one active verification per user

**Constraints**:

- User can have at most ONE EmailVerification record at a time (enforced by unique user_id)
- Token must be unique across all verification records
- Cascade delete if user is deleted (cleans up orphaned verifications)

**Business Rules**:

1. Token generated with `crypto.randomBytes(32).toString('hex')`
2. Token expires 24 hours after creation
3. Token is deleted after successful verification (single-use)
4. Requesting new verification email deletes old token and creates new one
5. Expired tokens should be cleaned up periodically (background job)

**Token Expiry Calculation**:

```typescript
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
```

### PasswordReset Entity

**Purpose**: Stores time-limited password reset tokens for forgotten password recovery.

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `user_id` (Int, FK): User requesting password reset
- `token` (String, unique): Cryptographically random 64-character hex string (32 bytes)
- `expires_at` (DateTime): Token expiration time (1 hour from creation)
- `used` (Boolean, default: false): Whether token has been used
- `created_at` (DateTime): When token was generated
- `used_at` (DateTime, nullable): When token was used (null if unused)

**Relationships**:

- `user`: Many-to-one relationship with User (user requesting reset)

**Indexes**:

- Unique index on `token` for fast lookup during password reset
- Composite index on `(user_id, expires_at)` for querying user's active tokens
- Index on `used` for filtering used/unused tokens

**Constraints**:

- Token must be unique across all reset records
- Cascade delete if user is deleted (cleans up orphaned resets)

**Business Rules**:

1. Token generated with `crypto.randomBytes(32).toString('hex')`
2. Token expires 1 hour after creation (shorter than email verification for security)
3. Token is single-use: marked as `used: true` after successful password reset
4. User can have multiple PasswordReset records (new requests create new tokens)
5. Only most recent unused, unexpired token is valid
6. Used tokens are retained for audit purposes (not deleted)
7. Expired tokens should be cleaned up periodically (background job, keep for 30 days)

**Token Expiry Calculation**:

```typescript
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
```

## Sample Queries

### 1. Register new user (with email verification)

```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Transaction ensures atomic user creation + verification token
const result = await prisma.$transaction(async (tx) => {
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user (email_verified defaults to false)
  const user = await tx.user.create({
    data: {
      email,
      password_hash: passwordHash,
      name,
      role: 'member',  // Default role for self-registered users
      status: 'active',
      email_verified: false
    }
  });

  // Generate verification token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create verification record
  const verification = await tx.emailVerification.create({
    data: {
      user_id: user.id,
      token,
      expires_at: expiresAt
    }
  });

  return { user, verification };
});

// Send verification email (outside transaction)
await sendVerificationEmail(result.user.email, result.verification.token);
```

### 2. Verify email address

```typescript
// Find verification token
const verification = await prisma.emailVerification.findUnique({
  where: { token },
  include: { user: true }
});

if (!verification) {
  throw new Error('Invalid verification token');
}

if (new Date() > verification.expires_at) {
  throw new Error('Verification token has expired');
}

// Transaction: mark email as verified and delete token
const user = await prisma.$transaction(async (tx) => {
  // Update user
  const updatedUser = await tx.user.update({
    where: { id: verification.user_id },
    data: { email_verified: true }
  });

  // Delete verification token (single-use)
  await tx.emailVerification.delete({
    where: { id: verification.id }
  });

  return updatedUser;
});
```

### 3. Resend verification email

```typescript
// Transaction: delete old token and create new one
const result = await prisma.$transaction(async (tx) => {
  // Delete existing verification if any
  await tx.emailVerification.deleteMany({
    where: { user_id: userId }
  });

  // Generate new token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create new verification
  const verification = await tx.emailVerification.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt
    }
  });

  return verification;
});

// Send new verification email
await sendVerificationEmail(user.email, result.token);
```

### 4. Login (with email verification check)

```typescript
// Find user by email
const user = await prisma.user.findUnique({
  where: { email }
});

if (!user || user.status !== 'active') {
  throw new Error('Invalid credentials');
}

// Verify password
const passwordValid = await bcrypt.compare(password, user.password_hash);
if (!passwordValid) {
  throw new Error('Invalid credentials');
}

// Check email verification
if (!user.email_verified) {
  throw new Error('Email verification required. Please check your inbox.');
}

// Update last login
await prisma.user.update({
  where: { id: user.id },
  data: { last_login: new Date() }
});

// Generate JWT (same as 001-admin-user, but include email_verified)
const token = generateJWT({
  userId: user.id,
  email: user.email,
  role: user.role,
  emailVerified: user.email_verified
});

return { user, token };
```

### 5. Request password reset

```typescript
// Find user by email (do NOT reveal if user exists - security)
const user = await prisma.user.findUnique({
  where: { email }
});

if (user && user.status === 'active' && user.email_verified) {
  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  // Create password reset record
  const reset = await prisma.passwordReset.create({
    data: {
      user_id: user.id,
      token,
      expires_at: expiresAt
    }
  });

  // Send password reset email
  await sendPasswordResetEmail(user.email, token);
}

// Always return success (prevents email enumeration)
return { message: 'If an account exists with that email, you will receive a password reset link.' };
```

### 6. Reset password with token

```typescript
// Find reset token
const reset = await prisma.passwordReset.findUnique({
  where: { token },
  include: { user: true }
});

if (!reset || reset.used) {
  throw new Error('Invalid or expired password reset token');
}

if (new Date() > reset.expires_at) {
  throw new Error('Password reset token has expired');
}

// Transaction: update password, mark token as used, invalidate sessions
const result = await prisma.$transaction(async (tx) => {
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user password
  const updatedUser = await tx.user.update({
    where: { id: reset.user_id },
    data: { password_hash: passwordHash }
  });

  // Mark reset token as used
  await tx.passwordReset.update({
    where: { id: reset.id },
    data: {
      used: true,
      used_at: new Date()
    }
  });

  return updatedUser;
});

// Invalidate all existing user sessions (add tokens to blacklist)
await invalidateUserSessions(result.id);

return { message: 'Password reset successfully. Please log in with your new password.' };
```

### 7. Get user profile

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    email_verified: true,
    name: true,
    role: true,
    created_at: true,
    last_login: true
    // Do NOT include password_hash
  }
});
```

### 8. Update user profile (name)

```typescript
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { name: newName }
});
```

### 9. Update email (requires re-verification)

```typescript
// Transaction: update email, set verified to false, create verification token
const result = await prisma.$transaction(async (tx) => {
  // Update email and set verified to false
  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: {
      email: newEmail,
      email_verified: false
    }
  });

  // Delete old verification if exists
  await tx.emailVerification.deleteMany({
    where: { user_id: userId }
  });

  // Create new verification token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const verification = await tx.emailVerification.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt
    }
  });

  return { user: updatedUser, verification };
});

// Send verification email to NEW email address
await sendVerificationEmail(newEmail, result.verification.token);
```

### 10. Change password (authenticated user)

```typescript
// Verify current password first
const user = await prisma.user.findUnique({
  where: { id: userId }
});

const currentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
if (!currentPasswordValid) {
  throw new Error('Current password is incorrect');
}

// Hash new password
const newPasswordHash = await bcrypt.hash(newPassword, 12);

// Update password
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { password_hash: newPasswordHash }
});

// Invalidate all existing sessions (force re-login)
await invalidateUserSessions(userId);

return { message: 'Password changed successfully. Please log in again.' };
```

### 11. Cleanup expired tokens (background job)

```typescript
// Run daily to remove expired verification and reset tokens

// Delete expired email verifications
const deletedVerifications = await prisma.emailVerification.deleteMany({
  where: {
    expires_at: { lt: new Date() }
  }
});

// Delete old password resets (keep for 30 days for audit, then delete)
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const deletedResets = await prisma.passwordReset.deleteMany({
  where: {
    created_at: { lt: thirtyDaysAgo }
  }
});

console.log(`Cleanup: Deleted ${deletedVerifications.count} expired verifications, ${deletedResets.count} old password resets`);
```

## Migration Strategy

### Migration for 002-normal-users

```bash
# Generate migration for new fields and tables
npx prisma migrate dev --name add_email_verification_and_password_reset

# This creates:
# - Adds email_verified field to users table
# - Creates email_verifications table
# - Creates password_resets table
# - All indexes and constraints
```

### Backfilling Existing Users

```typescript
// If 001-admin-user has already created users, backfill email_verified
await prisma.user.updateMany({
  where: { email_verified: null },  // If field didn't exist before
  data: { email_verified: true }  // Assume admin-created users are verified
});
```

### Seed Data (Development)

```typescript
// backend/prisma/seed.ts
// Extends seed from 001-admin-user

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // ... Existing seed from 001-admin-user ...

  // Create unverified test user
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

  // Create verification token for testing
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
  console.log('Created unverified test user:', unverifiedUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Performance Considerations

### Index Strategy

New indexes added for 002-normal-users:

- **User.email_verified**: Filter verified/unverified users
- **EmailVerification.token**: Fast token lookup during verification (unique index)
- **EmailVerification.expires_at**: Cleanup expired tokens efficiently
- **PasswordReset.token**: Fast token lookup during password reset (unique index)
- **PasswordReset.user_id + expires_at**: Query user's active reset tokens
- **PasswordReset.used**: Filter used/unused tokens

### Query Optimization

- Use `select` to avoid fetching password_hash unnecessarily
- Email verification and password reset operations use transactions for atomicity
- Verification tokens deleted after use (no accumulation)
- Periodic cleanup of expired tokens prevents table bloat

### Expected Performance

With proper indexing and <10,000 users:

- User registration: <500ms (bcrypt hash ~300ms + db insert ~50ms)
- Email verification: <100ms (token lookup + update + delete)
- Login with verification check: <400ms (email lookup + bcrypt verify ~300ms + JWT gen <10ms)
- Password reset request: <200ms (user lookup + token creation + email send async)
- Password reset completion: <400ms (token lookup + bcrypt hash ~300ms + update)

All well within <1s user experience goals.

## Data Integrity

### Referential Integrity

- `EmailVerification.user_id` → `User.id` (CASCADE on delete)
- `PasswordReset.user_id` → `User.id` (CASCADE on delete)

### Application-Level Constraints

1. Email verification required for login (unverified users rejected)
2. Email verification token must not be expired (expires_at check)
3. Password reset token must not be expired or used
4. Password reset token is single-use (marked as used after consumption)
5. Only one active EmailVerification per user (unique constraint on user_id)
6. New verification request deletes old token (prevents accumulation)
7. Email change requires re-verification (email_verified set to false)
8. Password change invalidates all existing sessions (security best practice)

## Future Enhancements

Potential schema additions for post-MVP:

1. **EmailVerification.resent_count**: Track how many times verification email was resent (rate limiting)
2. **User.email_verified_at**: Timestamp when email was verified (audit trail)
3. **PasswordReset.ip_address**: IP address of reset request (security tracking)
4. **User.password_changed_at**: Last password change timestamp (password rotation policy)
5. **LoginAttempt** table: Track failed login attempts for security monitoring

For MVP, these are deferred per Simplicity First principle.
