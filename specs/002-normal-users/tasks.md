# Tasks: Normal User Account Management

**Input**: Design documents from `/specs/002-normal-users/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md
**Extends**: Feature 001-admin-user (User model and authentication infrastructure)

**Tests**: Not explicitly requested in specification - focusing on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This feature uses the web application structure established by feature 004-simracing-series and extended by feature 001-admin-user:
- Backend: `backend/src/`, `backend/tests/`, `backend/prisma/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project setup for normal user self-service authentication

- [ ] T001 Install nodemailer dependency in backend/package.json for email delivery per research.md
- [ ] T002 [P] Install Mailpit for local email testing per quickstart.md (development environment)
- [ ] T003 [P] Configure email service environment variables in backend/src/config/env.ts: SMTP_HOST, SMTP_PORT, FROM_EMAIL per research.md
- [ ] T004 [P] Create email template utilities directory in backend/src/utils/ for verification and password reset templates

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that extends 001-admin-user for normal user self-service

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Extend User model in backend/prisma/schema.prisma to add email_verified boolean field (default: false) per data-model.md
- [ ] T006 Create EmailVerification entity in backend/prisma/schema.prisma with user_id, token, expires_at, created_at per data-model.md
- [ ] T007 Create PasswordReset entity in backend/prisma/schema.prisma with user_id, token, expires_at, used, created_at, used_at per data-model.md
- [ ] T008 Create database migration in backend/prisma/migrations/ for User.email_verified field, EmailVerification and PasswordReset tables with indexes
- [ ] T009 [P] Implement token generation utilities in backend/src/utils/token.ts using crypto.randomBytes(32) for verification and reset tokens per research.md
- [ ] T010 [P] Create email template renderer in backend/src/utils/email-templates.ts for verification and password reset HTML emails
- [ ] T011 Create EmailService in backend/src/services/email.service.ts with sendVerificationEmail() and sendPasswordResetEmail() methods using nodemailer per plan.md
- [ ] T012 [P] Configure Mailpit in development environment for email testing per quickstart.md
- [ ] T013 [P] Add rate limiting configuration for registration and password reset endpoints in backend/src/server.ts per research.md

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration with Email Verification (Priority: P1) 🎯 MVP

**Goal**: Enable users to create their own accounts through email-based registration with verification required before login

**Independent Test**: Submit registration form with email/password/name, receive verification email within 10 seconds, click verification link, verify email is marked as verified, attempt login and succeed

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create RegistrationService in backend/src/services/registration.service.ts with register() method: validate email uniqueness, hash password, create User with email_verified=false per data-model.md
- [ ] T015 [P] [US1] Add createVerificationToken() method to RegistrationService in backend/src/services/registration.service.ts: generate token, store in EmailVerification with 24h expiry per data-model.md
- [ ] T016 [US1] Implement register() to use transaction: create User + create EmailVerification + send verification email atomically per data-model.md query examples
- [ ] T017 [US1] Add verifyEmail() method to RegistrationService in backend/src/services/registration.service.ts: validate token, check expiry, mark User.email_verified=true, delete EmailVerification per data-model.md
- [ ] T018 [US1] Add resendVerification() method to RegistrationService in backend/src/services/registration.service.ts: regenerate token, send new email per contracts/openapi.yaml
- [ ] T019 [US1] Create registration routes in backend/src/api/auth.routes.ts: POST /api/auth/register, POST /api/auth/verify-email, POST /api/auth/resend-verification per contracts/openapi.yaml
- [ ] T020 [US1] Add password validation to register endpoint in backend/src/api/auth.routes.ts: min 8 chars, uppercase, lowercase, number per contracts/openapi.yaml
- [ ] T021 [US1] Add rate limiting to registration endpoint in backend/src/api/auth.routes.ts (5 attempts per hour per IP) per research.md
- [ ] T022 [US1] Modify AuthService.login() in backend/src/services/auth.service.ts to check email_verified before allowing login per contracts/openapi.yaml
- [ ] T023 [US1] Create RegisterForm component in frontend/src/components/auth/RegisterForm.tsx with email, password, confirm password, name fields
- [ ] T024 [US1] Create RegisterPage component in frontend/src/pages/auth/RegisterPage.tsx integrating RegisterForm per plan.md
- [ ] T025 [US1] Create VerifyEmailPage component in frontend/src/pages/auth/VerifyEmailPage.tsx to handle token from URL query parameter and call verify API per plan.md
- [ ] T026 [US1] Implement frontend registration service in frontend/src/services/registration.service.ts with register(), verifyEmail(), resendVerification() methods
- [ ] T027 [US1] Add email verification status message to LoginForm in frontend/src/components/auth/LoginForm.tsx to show "Email not verified" error per contracts/openapi.yaml
- [ ] T028 [US1] Add resend verification link to LoginForm in frontend/src/components/auth/LoginForm.tsx for unverified users

**Checkpoint**: At this point, User Story 1 should be fully functional - users can register, receive verification email, verify, and log in

---

## Phase 4: User Story 2 - User Login with Session Management (Priority: P1)

**Goal**: Enable verified users to securely log in with email/password and receive 24-hour session with automatic timeout

**Independent Test**: Register and verify a user, log in with correct credentials, verify JWT token is issued in httpOnly cookie with 24-hour expiry, access protected resource successfully, wait 24 hours (or manipulate token expiry), verify session expires

### Implementation for User Story 2

- [ ] T029 [US2] Create SessionService in backend/src/services/session.service.ts with validateSession() method checking JWT expiry per plan.md
- [ ] T030 [US2] Add session timeout middleware in backend/src/middleware/session.middleware.ts to validate JWT expiry on protected routes per plan.md
- [ ] T031 [US2] Update AuthService.login() in backend/src/services/auth.service.ts to set last_login timestamp on successful login per data-model.md
- [ ] T032 [US2] Verify logout endpoint from 001-admin-user works for normal users: POST /api/auth/logout invalidates JWT per contracts/openapi.yaml
- [ ] T033 [US2] Create useSession hook in frontend/src/hooks/useSession.ts to track session expiry and auto-logout on timeout per plan.md
- [ ] T034 [US2] Add session expiry warning to frontend (5 minutes before timeout) in useSession hook in frontend/src/hooks/useSession.ts
- [ ] T035 [US2] Implement auto-logout on session expiry in useSession hook in frontend/src/hooks/useSession.ts with redirect to login page

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can register, verify, log in with 24-hour session timeout

---

## Phase 5: User Story 3 - Password Reset Workflow (Priority: P2)

**Goal**: Enable users to securely reset forgotten passwords using time-limited email tokens

**Independent Test**: Click "Forgot Password", enter email, receive reset email within 10 seconds, click link with token, enter new password, verify old password no longer works and new password allows login

### Implementation for User Story 3

- [ ] T036 [P] [US3] Create PasswordResetService in backend/src/services/passwordReset.service.ts with requestReset() method: create PasswordReset token with 1-hour expiry per data-model.md
- [ ] T037 [P] [US3] Add resetPassword() method to PasswordResetService in backend/src/services/passwordReset.service.ts: validate token, check expiry, update User.password_hash, mark token as used per data-model.md
- [ ] T038 [US3] Implement email enumeration prevention in requestReset(): always return success message regardless of email existence per research.md
- [ ] T039 [US3] Implement single-use token enforcement in resetPassword(): check PasswordReset.used=false before allowing reset per data-model.md
- [ ] T040 [US3] Create password reset routes in backend/src/api/password.routes.ts: POST /api/auth/forgot-password, POST /api/auth/reset-password per contracts/openapi.yaml
- [ ] T041 [US3] Add rate limiting to forgot-password endpoint in backend/src/api/password.routes.ts (3 attempts per hour per IP) per research.md
- [ ] T042 [US3] Invalidate active sessions on password reset in backend/src/services/passwordReset.service.ts using token blacklist from 001-admin-user per research.md
- [ ] T043 [US3] Create ForgotPasswordForm component in frontend/src/components/auth/ForgotPasswordForm.tsx with email input
- [ ] T044 [US3] Create ForgotPasswordPage component in frontend/src/pages/auth/ForgotPasswordPage.tsx integrating ForgotPasswordForm per plan.md
- [ ] T045 [US3] Create ResetPasswordForm component in frontend/src/components/auth/ResetPasswordForm.tsx with new password and confirm password fields
- [ ] T046 [US3] Create ResetPasswordPage component in frontend/src/pages/auth/ResetPasswordPage.tsx to handle token from URL query parameter and call reset API per plan.md
- [ ] T047 [US3] Implement frontend password service in frontend/src/services/password.service.ts with forgotPassword() and resetPassword() methods
- [ ] T048 [US3] Add "Forgot Password?" link to LoginForm in frontend/src/components/auth/LoginForm.tsx

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work - users can register, login, and reset forgotten passwords

---

## Phase 6: User Story 4 - Profile View and Management (Priority: P2)

**Goal**: Enable logged-in users to view and update their profile information (name, email, password)

**Independent Test**: Log in as user, navigate to profile page, verify current information is displayed, update name and verify it saves, update email and verify new verification email is sent, update password and verify new password works for login

### Implementation for User Story 4

- [ ] T049 [P] [US4] Create ProfileService in backend/src/services/profile.service.ts with getProfile() method returning user info excluding password_hash per data-model.md
- [ ] T050 [P] [US4] Add updateProfile() method to ProfileService in backend/src/services/profile.service.ts for name, email, and password updates per contracts/openapi.yaml
- [ ] T051 [US4] Implement email change with re-verification: if email changes, set email_verified=false and trigger new verification flow in backend/src/services/profile.service.ts per contracts/openapi.yaml
- [ ] T052 [US4] Implement password change with session invalidation: hash new password, update User.password_hash, invalidate active sessions in backend/src/services/profile.service.ts per research.md
- [ ] T053 [US4] Create profile routes in backend/src/api/profile.routes.ts: GET /api/profile, PUT /api/profile with authentication required per contracts/openapi.yaml
- [ ] T054 [US4] Apply authentication middleware to all profile endpoints in backend/src/api/profile.routes.ts to ensure only logged-in users can access
- [ ] T055 [US4] Create ProfileView component in frontend/src/components/profile/ProfileView.tsx displaying user name, email, role, email verification status, join date
- [ ] T056 [US4] Create ProfileEdit component in frontend/src/components/profile/ProfileEdit.tsx with editable fields for name, email, current password, new password
- [ ] T057 [US4] Create ProfilePage component in frontend/src/pages/profile/ProfilePage.tsx integrating ProfileView and ProfileEdit per plan.md
- [ ] T058 [US4] Implement frontend profile service in frontend/src/services/profile.service.ts with getProfile() and updateProfile() methods
- [ ] T059 [US4] Create useProfile hook in frontend/src/hooks/useProfile.ts for managing profile state and updates per plan.md
- [ ] T060 [US4] Add confirmation dialog for email and password changes in ProfileEdit component in frontend/src/components/profile/ProfileEdit.tsx
- [ ] T061 [US4] Show email re-verification notice after email change in ProfileEdit component in frontend/src/components/profile/ProfileEdit.tsx

**Checkpoint**: All user stories should now be independently functional - complete normal user self-service system

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T062 [P] Implement background job to clean up expired EmailVerification tokens (>24 hours old) in backend/src/jobs/cleanup-tokens.job.ts per data-model.md
- [ ] T063 [P] Implement background job to clean up expired PasswordReset tokens (>1 hour old and used=true) in backend/src/jobs/cleanup-tokens.job.ts
- [ ] T064 [P] Add structured logging for all authentication events in backend/src/services/: registration, verification, login, password reset per plan.md observability requirements
- [ ] T065 [P] Add email delivery success/failure tracking in EmailService in backend/src/services/email.service.ts per plan.md observability requirements
- [ ] T066 [P] Add security event logging for failed verification attempts, expired tokens, invalid reset tokens in backend/src/services/ per research.md
- [ ] T067 [P] Verify all user inputs are sanitized in frontend forms to prevent XSS attacks
- [ ] T068 [P] Add loading states to all frontend auth pages during API calls
- [ ] T069 [P] Implement proper error handling with user-friendly messages across all frontend auth pages per contracts/openapi.yaml error responses
- [ ] T070 Add email template styling in backend/src/utils/email-templates.ts for professional appearance matching SNRL brand
- [ ] T071 [P] Test email delivery in development using Mailpit per quickstart.md
- [ ] T072 [P] Verify all passwords are hashed before storage across RegistrationService, ProfileService in backend/src/services/
- [ ] T073 Validate all success criteria from plan.md: registration <2min, login <1s, password reset email <10s, profile load <500ms
- [ ] T074 Run database migrations and verify schema updates from 001-admin-user per quickstart.md
- [ ] T075 Validate quickstart.md instructions by following setup guide end-to-end
- [ ] T076 [P] Update CLAUDE.md with nodemailer dependency if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories (extends 001-admin-user)
- **User Story 2 (P1)**: Depends on User Story 1 (requires email verification before login) - Can start after US1 login check is implemented
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2, can run in parallel
- **User Story 4 (P2)**: Can start after Foundational - Independent of US3, requires auth from US1/US2

### Within Each User Story

- Backend models/migrations before services
- Services before API routes
- API routes before frontend components
- Frontend components before pages
- Core implementation before integration

### Parallel Opportunities

- **Setup Phase**: Tasks T002, T003, T004 can run in parallel (different configuration/tools)
- **Foundational Phase**: Tasks T009, T010, T012, T013 can run in parallel (different concerns)
- **User Story 1**: Tasks T014, T015 can run in parallel initially (different methods)
- **User Story 3**: Tasks T036, T037 can run in parallel (different methods in same service)
- **User Story 4**: Tasks T049, T050 can run in parallel (different methods in same service)
- **Polish Phase**: Tasks T062, T063, T064, T065, T066, T067, T068, T069, T071, T072, T076 can run in parallel (different files/concerns)
- **After Foundational completes**: US3 (password reset) can run in parallel with US1/US2 if team capacity allows

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, these US1 tasks can run in parallel:
# Terminal 1: Backend services (registration methods)
Task T014 - Create RegistrationService.register()
Task T015 - Add createVerificationToken() method

# After T014, T015 complete:
# Terminal 2: Complete registration flow
Task T016 - Implement atomic transaction
Task T017 - Add verifyEmail() method
Task T018 - Add resendVerification() method

# Terminal 3: API routes (can start after T017, T018)
Task T019 - Create registration routes
Task T020 - Add password validation
Task T021 - Add rate limiting
Task T022 - Modify login to check verification

# Terminal 4: Frontend components (can run in parallel with backend routes)
Task T023 - Implement RegisterForm component
Task T024 - Create RegisterPage
Task T025 - Create VerifyEmailPage
Task T026 - Implement frontend registration service
Task T027 - Update LoginForm for verification status
Task T028 - Add resend verification link
```

---

## MVP Scope

**Recommended MVP**: User Story 1 + User Story 2 (Phase 1 + Phase 2 + Phase 3 + Phase 4)

- Total MVP tasks: 35 tasks (T001-T035)
- Delivers: User registration with email verification, login with session management
- Independent testing: Register, verify email, log in, access protected resources, session timeout
- Estimated effort: 3-4 days for single developer

**Extended MVP**: Add User Story 3 (password reset)

- Total tasks: 48 tasks (T001-T048)
- Delivers: MVP + forgot password and reset functionality
- Estimated effort: 4-5 days for single developer

**Full Feature**: All 4 user stories (76 tasks)

- Estimated effort: 5-7 days for single developer
- Or 3-4 days with 2 developers working in parallel (US1+US2 on one, US3+US4 on another)

---

## Implementation Strategy

1. **Start with MVP** (User Stories 1 + 2): Get registration and login working first
2. **Validate independently**: Test US1 and US2 thoroughly before moving on
3. **Add Password Reset** (User Story 3): Critical for production readiness
4. **Add Profile Management** (User Story 4): Nice-to-have for better UX
5. **Test after each story**: Ensure each story works independently
6. **Parallelize when possible**: US3 can be developed in parallel with US1+US2 by different developers
7. **Polish at the end**: Cross-cutting concerns apply to all stories, so do them last

---

## Task Count Summary

- **Setup**: 4 tasks
- **Foundational**: 9 tasks
- **User Story 1 (P1)**: 15 tasks
- **User Story 2 (P1)**: 7 tasks
- **User Story 3 (P2)**: 13 tasks
- **User Story 4 (P2)**: 13 tasks
- **Polish**: 15 tasks
- **Total**: 76 tasks

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All task IDs are sequential (T001-T076)
✅ All [P] markers indicate parallelizable tasks (different files, no blocking dependencies)
✅ All [Story] labels correctly map to user stories (US1-US4)
✅ All task descriptions include exact file paths from plan.md project structure
✅ All user story phases include goal and independent test criteria
✅ Dependencies section shows clear execution order
✅ Parallel opportunities identified for optimal team execution
✅ Extends 001-admin-user infrastructure appropriately
