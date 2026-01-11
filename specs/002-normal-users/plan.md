# Implementation Plan: Normal User Account Management

**Branch**: `002-normal-users` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification for Normal User Account Management

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Normal User Account Management feature provides self-service authentication and profile management capabilities for regular (non-admin) users of the SNRL Manager system. It enables users to create their own accounts through email verification, securely log in and out with session management, reset forgotten passwords, and manage their profile information. This feature complements the Admin User Management (001-admin-user) by handling the end-user authentication flow while admins retain control over role assignments and permissions.

**Technical Approach**: Builds on the established SNRL Manager stack (Node.js 20 LTS, TypeScript, Fastify, Prisma, PostgreSQL, React) and extends the User model from feature 001-admin-user. Implements email-based registration with verification tokens, JWT-based authentication with 24-hour session timeout matching admin authentication, bcrypt password hashing (consistent with admin user security), and time-limited password reset tokens. The architecture uses the existing User table with additional fields for email verification status, plus separate tables for verification tokens and password reset tokens with automatic expiry.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.x
**Primary Dependencies**: Fastify 4.x (backend), React 18+ (frontend), Prisma 5.x (ORM), bcrypt (password hashing), @fastify/jwt (authentication), nodemailer or similar (email delivery)
**Storage**: PostgreSQL 15+ with indexed queries on email, verification status, token lookups, and session data
**Testing**: Vitest (unit tests), Supertest (API integration tests), Playwright (E2E tests)
**Target Platform**: Web application (Linux/Docker server for backend, modern browsers for frontend)
**Project Type**: Web application (backend + frontend separation)
**Performance Goals**: <2 min registration flow, <1s login, <10s password reset email delivery, <500ms profile load
**Constraints**: <200ms p95 API response time, 24-hour session timeout, email verification required before access, password reset tokens expire after 1 hour
**Scale/Scope**: Expected 100-1000 users initially, 50-200 registrations/month, email verification and password reset workflows must be reliable and user-friendly

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Modularity** ✅ PASS
- Clear separation between frontend (React), backend (Fastify), and database (Prisma)
- User authentication logic isolated in authentication service/middleware (extends 001-admin-user)
- Email service isolated for verification and password reset sending
- Frontend interacts only through documented REST API contracts
- No cross-layer violations: frontend uses API only, no direct database access
- Shared types between frontend/backend defined via TypeScript interfaces

**II. Observability** ✅ PASS
- All authentication attempts logged (registration, login, verification, password reset)
- Structured logging via Pino (Fastify built-in) for request/response metadata
- Email delivery tracked with success/failure status
- Verification and password reset token generation/validation logged
- Error conditions logged with sufficient context (user email, attempted action, failure reason)
- Security events (failed logins, expired tokens, invalid verification attempts) logged for monitoring

**III. Simplicity First** ✅ PASS
- Email verification using simple time-limited tokens stored in database (no complex verification infrastructure)
- JWT authentication with 24-hour expiry matching admin pattern (consistent approach)
- Password reset via time-limited tokens (1-hour expiry, single-use) using same proven pattern as email verification
- Extends existing User table from 001-admin-user rather than creating separate user types
- Standard nodemailer for email delivery (proven, widely-used library)
- Database-backed token storage (no premature distributed token service)
- Direct bcrypt password hashing (same as admin users, no unnecessary abstraction)

## Project Structure

### Documentation (this feature)

```text
specs/002-normal-users/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml     # REST API contract definitions
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── user.ts                    # User entity (extends 001-admin-user)
│   │   ├── emailVerification.ts       # Email verification token entity
│   │   └── passwordReset.ts           # Password reset token entity
│   ├── services/
│   │   ├── auth.service.ts            # Login, logout, JWT token management (extends 001-admin-user)
│   │   ├── registration.service.ts    # User registration and email verification
│   │   ├── passwordReset.service.ts   # Password reset token generation and validation
│   │   ├── email.service.ts           # Email delivery for verification and password reset
│   │   ├── profile.service.ts         # User profile view and update operations
│   │   └── session.service.ts         # Session timeout enforcement and management
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT verification (from 001-admin-user)
│   │   └── session.middleware.ts      # Session timeout validation
│   ├── api/
│   │   ├── auth.routes.ts             # POST /api/auth/register, /api/auth/verify-email, /api/auth/login, /api/auth/logout (extends 001-admin-user)
│   │   ├── password.routes.ts         # POST /api/auth/forgot-password, /api/auth/reset-password
│   │   └── profile.routes.ts          # GET/PUT /api/profile - User profile endpoints
│   └── utils/
│       ├── password.ts                # bcrypt hashing utilities (from 001-admin-user)
│       ├── token.ts                   # Verification and reset token generation
│       └── email-templates.ts         # Email template rendering
├── tests/
│   ├── unit/
│   │   ├── services/                  # Service layer unit tests
│   │   └── utils/                     # Utility function tests
│   └── integration/
│       └── api/                       # API endpoint integration tests
└── prisma/
    ├── schema.prisma                  # Database schema (User, EmailVerification, PasswordReset)
    └── migrations/                    # Database migration files

frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── RegisterForm.tsx       # User registration form
│   │   │   ├── LoginForm.tsx          # User login form (extends 001-admin-user)
│   │   │   ├── VerifyEmailPage.tsx    # Email verification handler
│   │   │   ├── ForgotPasswordForm.tsx # Password reset request form
│   │   │   └── ResetPasswordForm.tsx  # Password reset form with token
│   │   └── profile/
│   │       ├── ProfileView.tsx        # User profile display
│   │       └── ProfileEdit.tsx        # Profile editing form
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── RegisterPage.tsx       # Registration page
│   │   │   ├── LoginPage.tsx          # Login page
│   │   │   ├── VerifyEmailPage.tsx    # Email verification page
│   │   │   ├── ForgotPasswordPage.tsx # Password reset request page
│   │   │   └── ResetPasswordPage.tsx  # Password reset page
│   │   └── profile/
│   │       └── ProfilePage.tsx        # User profile page
│   ├── services/
│   │   ├── auth.service.ts            # Frontend auth API calls (extends 001-admin-user)
│   │   ├── registration.service.ts    # Frontend registration API calls
│   │   ├── password.service.ts        # Frontend password reset API calls
│   │   └── profile.service.ts         # Frontend profile API calls
│   └── hooks/
│       ├── useAuth.ts                 # Authentication state hook (from 001-admin-user)
│       ├── useSession.ts              # Session timeout tracking hook
│       └── useProfile.ts              # Profile data hook
└── tests/
    ├── unit/
    │   └── components/                # Component unit tests
    └── e2e/
        └── auth/                      # Playwright E2E tests
```

**Structure Decision**: This feature uses the web application structure (Option 2) established by feature 004-simracing-series and extended by feature 001-admin-user. The backend follows Fastify's modular plugin architecture with clear separation between models, services, middleware, and API routes. The frontend uses React with a page-based routing structure and component-level organization. This feature extends the existing User model and authentication infrastructure from 001-admin-user, adding email verification, password reset, and profile management capabilities. Both backend and frontend maintain their own test directories following the testing hierarchy (unit, integration, contract for backend; unit, E2E for frontend). The Prisma schema is defined in `backend/prisma/schema.prisma` for type-safe database access across the backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**NO VIOLATIONS** - All design decisions align with constitutional principles. No complexity justifications required.

---

## Phase 0: Technical Research (Complete)

**Date**: 2026-01-10
**Artifact**: [research.md](./research.md)

**Summary**:

Completed technical research establishing that Normal User Account Management extends the authentication infrastructure from 001-admin-user while adding self-service capabilities. Key technical decisions:

- **User Model Extension**: Adds `email_verified` boolean field to existing User model
- **Email Verification**: Time-limited tokens (24-hour expiry) stored in EmailVerification table, sent via nodemailer
- **Password Reset**: Time-limited tokens (1-hour expiry) stored in PasswordReset table, single-use with used flag
- **Email Service**: nodemailer for SMTP delivery (Mailpit for development, configurable for production)
- **Session Management**: Same JWT-based authentication as 001-admin-user (24-hour expiry, consistent pattern)
- **Email Enumeration Prevention**: Password reset always returns success message regardless of email existence
- **Security**: Rate limiting on registration, login, password reset; email verification required before login

All design decisions validated as achievable:
- Registration flow: <2 min (form + validation + email send ~5s) ✓
- Login: <1s (bcrypt verify ~300ms + JWT generation <10ms) ✓
- Password reset email: <10s (token generation + async email send <5s) ✓
- Profile load: <500ms (indexed user query <50ms) ✓

**Outcome**: No open questions. All technical decisions align with established stack (Node.js 20, TypeScript, Fastify, Prisma, React, PostgreSQL) and constitutional principles. Ready for Phase 1 design.

---

## Phase 1: Design Artifacts (Complete)

**Date**: 2026-01-10
**Artifacts**: [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [quickstart.md](./quickstart.md)

### Data Model

**Artifact**: [data-model.md](./data-model.md)

Complete Prisma schema extending User model and adding two new entities:

1. **User** (extended from 001-admin-user):
   - New field: `email_verified` (boolean, default false)
   - New relationships: email_verification (1:1), password_resets (1:many)
   - New index: email_verified

2. **EmailVerification** (new table):
   - Fields: user_id (FK, unique), token (unique, 64-char hex), expires_at (24h), created_at
   - Indexes: token (unique), expires_at, user_id (unique)
   - Relationship: user (1:1)
   - Single-use: deleted after successful verification

3. **PasswordReset** (new table):
   - Fields: user_id (FK), token (unique, 64-char hex), expires_at (1h), used (boolean), created_at, used_at
   - Indexes: token (unique), (user_id, expires_at), used
   - Relationship: user (many:1)
   - Single-use: marked as used after password reset

**Key Features**:
- Cryptographically random tokens (crypto.randomBytes)
- Automatic expiry enforcement (24h verification, 1h reset)
- Transaction support for atomic operations (user creation + token, verification + update + delete)
- Sample queries for registration, verification, login, password reset, profile management
- Cleanup strategy for expired tokens (background job)

### API Contracts

**Artifact**: [contracts/openapi.yaml](./contracts/openapi.yaml)

Complete OpenAPI 3.0 specification with 8 endpoints covering all normal user self-service requirements:

**Registration** (3 endpoints):
- POST /api/auth/register - Create account with email verification
- POST /api/auth/verify-email - Verify email with token
- POST /api/auth/resend-verification - Resend verification email

**Authentication** (2 endpoints, extends 001-admin-user):
- POST /api/auth/login - JWT issuance with email verification check
- POST /api/auth/logout - Session invalidation

**Password Reset** (2 endpoints):
- POST /api/auth/forgot-password - Request password reset (email enumeration prevention)
- POST /api/auth/reset-password - Reset password with token

**Profile** (2 endpoints):
- GET /api/profile - View own profile
- PUT /api/profile - Update name, email, or password (email change requires re-verification)

**Features**:
- Request/response schemas for all endpoints
- Error responses with examples (invalid token, expired token, email not verified)
- Security definitions (cookieAuth extends 001-admin-user)
- Rate limiting documentation
- Email enumeration prevention (password reset)
- Business rule documentation (email verification required, session invalidation on password change)

### Quickstart Guide

**Artifact**: [quickstart.md](./quickstart.md)

Comprehensive development guide covering:

- **Setup**: Email service configuration (Mailpit for dev, Gmail SMTP for production-like testing)
- **Email Testing**: Mailpit web interface, verification email flow, password reset email flow
- **API Testing**: Registration → verification → login flow, password reset flow, profile management
- **Database Management**: View/cleanup tokens, manually verify emails for testing
- **Debugging**: Email delivery issues, token validation, SMTP connection testing
- **Troubleshooting**: Common issues (emails not appearing, verification link 404, Gmail SMTP auth, expired tokens)
- **Performance**: Email send time monitoring, token cleanup monitoring
- **Security**: Pre-deployment checklist for production email configuration

**Outcome**: Development team can set up local environment with email testing, test complete registration and password reset flows, and debug email-related issues.

---

## Next Steps

### Phase 2: Task Generation (Not Done - Use /speckit.tasks)

Run `/speckit.tasks` command to generate actionable, dependency-ordered tasks in `tasks.md`.

Expected task phases:

1. **Phase 0**: Database schema extensions (EmailVerification, PasswordReset tables)
2. **Phase 1**: Registration service and email verification
3. **Phase 2**: Password reset service and email delivery
4. **Phase 3**: Profile management endpoints
5. **Phase 4**: Session timeout enforcement
6. **Phase 5**: Frontend registration and verification flow
7. **Phase 6**: Frontend password reset flow
8. **Phase 7**: Frontend profile management
9. **Phase 8**: Integration and E2E tests

### Phase 3: Implementation (Use /speckit.implement)

After task generation, run `/speckit.implement` command to execute tasks incrementally with testing at each phase.

### Phase 4: GitHub Issues (Optional - Use /speckit.taskstoissues)

Convert tasks to GitHub issues for team collaboration and tracking.

---

## Constitutional Re-Check (Post-Design)

**I. Modularity** ✅ PASS

- User model extension cleanly adds email verification without breaking existing 001-admin-user functionality
- EmailVerification and PasswordReset entities are separate, focused tables (single responsibility)
- Email service isolated in dedicated service layer (email.service.ts)
- Registration, password reset, and profile services each handle one concern
- API endpoints follow RESTful conventions with clear separation (auth vs profile)
- Frontend interacts only through documented API contracts (no direct database access)
- No cross-layer violations in design

**II. Observability** ✅ PASS

- All authentication attempts logged (registration, verification, login, password reset)
- Email delivery tracked with success/failure status in structured logs
- Token generation/validation logged for debugging
- Verification and password reset token lifecycle tracked (creation, use, expiry)
- Security events logged (failed verification, expired tokens, invalid reset attempts)
- Quickstart guide includes debugging section for email delivery and token validation
- Structured error responses with actionable messages for all endpoints

**III. Simplicity First** ✅ PASS

- Email verification using simple database-backed tokens (no complex verification infrastructure)
- Password reset using same proven token pattern (consistent approach)
- Single EmailVerification record per user (no token accumulation)
- nodemailer for email delivery (industry standard, widely used)
- Extends existing User model rather than creating separate user types
- Same JWT authentication pattern as 001-admin-user (no new auth mechanism)
- Mailpit for development testing (simple, zero-config email viewer)
- No premature optimization (no distributed token service, no complex email queue)

**Final Verdict**: All design artifacts align with constitutional principles. Ready for implementation.

The design extends 001-admin-user cleanly without introducing unnecessary complexity. Email verification and password reset use proven, simple patterns (time-limited tokens in database). The email service is modular and configurable. All components are observable through logging and debugging tools. No violations of Simplicity First principle detected.
