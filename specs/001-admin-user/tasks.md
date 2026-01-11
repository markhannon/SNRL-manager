# Tasks: Admin User Management

**Input**: Design documents from `/specs/001-admin-user/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Not explicitly requested in specification - focusing on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This feature uses the web application structure established by feature 004-simracing-series:
- Backend: `backend/src/`, `backend/tests/`, `backend/prisma/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for admin user management feature

- [ ] T001 Create backend directory structure with models/, services/, middleware/, api/, utils/ folders per plan.md
- [ ] T002 Create frontend directory structure with components/admin/, components/auth/, pages/admin/, pages/auth/, services/, hooks/ folders per plan.md
- [ ] T003 [P] Install backend dependencies in backend/package.json: @fastify/jwt, bcrypt, @fastify/rate-limit per research.md
- [ ] T004 [P] Install frontend dependencies in frontend/package.json: React 18+, routing library, HTTP client per plan.md
- [ ] T005 [P] Configure TypeScript for backend in backend/tsconfig.json with strict mode and Prisma paths
- [ ] T006 [P] Configure TypeScript for frontend in frontend/tsconfig.json with React JSX support

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define Prisma schema in backend/prisma/schema.prisma with User, SeriesPermission, ActivityLog entities from data-model.md
- [ ] T008 Create initial database migration in backend/prisma/migrations/ for User, SeriesPermission, ActivityLog tables with all indexes
- [ ] T009 Create database seed script in backend/prisma/seed.ts to create initial admin user with email admin@snrl.example per data-model.md
- [ ] T010 [P] Implement password hashing utilities in backend/src/utils/password.ts with bcrypt (12 rounds) per research.md
- [ ] T011 [P] Create shared TypeScript types in backend/src/types/user.ts for UserRole, UserStatus, ActivityAction enums
- [ ] T012 Create JWT authentication middleware in backend/src/middleware/auth.middleware.ts with httpOnly cookie validation per research.md
- [ ] T013 Create role-based authorization middleware in backend/src/middleware/authorization.middleware.ts for Admin/Editor/Member checks per research.md
- [ ] T014 [P] Setup Fastify server configuration in backend/src/server.ts with Pino logging, CORS, cookie support, rate limiting per research.md
- [ ] T015 [P] Create base error handling middleware in backend/src/middleware/error.middleware.ts with structured error responses
- [ ] T016 [P] Setup environment configuration in backend/src/config/env.ts for DATABASE_URL, JWT_SECRET, NODE_ENV

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Account Creation and Login (Priority: P1) 🎯 MVP

**Goal**: Enable system administrators to securely create admin accounts, log in with credentials, and access admin-only areas

**Independent Test**: Create an admin account, log in with credentials, verify JWT token is issued, access admin area successfully

### Implementation for User Story 1

- [ ] T017 [P] [US1] Create User model type definitions in backend/src/models/user.ts based on Prisma schema
- [ ] T018 [US1] Implement AuthService in backend/src/services/auth.service.ts with login() method: validate credentials, verify bcrypt password, generate JWT token
- [ ] T019 [US1] Implement logout() method in backend/src/services/auth.service.ts with token blacklist support per research.md
- [ ] T020 [US1] Create auth routes in backend/src/api/auth.routes.ts: POST /api/auth/login, POST /api/auth/logout per contracts/openapi.yaml
- [ ] T021 [US1] Add rate limiting to login endpoint in backend/src/api/auth.routes.ts (5 attempts per 15 minutes) per research.md
- [ ] T022 [US1] Implement LoginForm component in frontend/src/components/auth/LoginForm.tsx with email/password fields and validation
- [ ] T023 [US1] Create LoginPage component in frontend/src/pages/auth/LoginPage.tsx integrating LoginForm per plan.md
- [ ] T024 [US1] Implement frontend auth service in frontend/src/services/auth.service.ts with login() and logout() API calls
- [ ] T025 [US1] Create useAuth hook in frontend/src/hooks/useAuth.ts for managing authentication state (logged in user, token status)
- [ ] T026 [US1] Add authorization check to admin routes to prevent regular users from accessing admin areas per spec.md acceptance scenario 3

**Checkpoint**: At this point, User Story 1 should be fully functional - admins can log in and regular users are blocked from admin areas

---

## Phase 4: User Story 2 - View and Search Users (Priority: P2)

**Goal**: Enable administrators to view all user accounts with pagination, search by name/email, and filter by role/status

**Independent Test**: Create multiple test users with different roles/statuses, verify admin can view full list with pagination, search returns matching users only, filters work correctly

### Implementation for User Story 2

- [ ] T027 [US2] Implement UserService in backend/src/services/user.service.ts with listUsers() method: pagination, search, filters per data-model.md query examples
- [ ] T028 [US2] Create user management routes in backend/src/api/users.routes.ts: GET /api/users with query params (page, limit, role, status, search) per contracts/openapi.yaml
- [ ] T029 [US2] Apply admin-only authorization middleware to GET /api/users endpoint in backend/src/api/users.routes.ts
- [ ] T030 [US2] Implement UserList component in frontend/src/components/admin/UserList.tsx displaying table with user info (name, email, role, status, join date)
- [ ] T031 [US2] Add search input to UserList component in frontend/src/components/admin/UserList.tsx for name/email search
- [ ] T032 [US2] Add filter dropdowns to UserList component in frontend/src/components/admin/UserList.tsx for role and status filters
- [ ] T033 [US2] Add pagination controls to UserList component in frontend/src/components/admin/UserList.tsx (25 users per page) per spec.md assumption 4
- [ ] T034 [US2] Create UsersPage component in frontend/src/pages/admin/UsersPage.tsx integrating UserList per plan.md
- [ ] T035 [US2] Implement frontend user service in frontend/src/services/user.service.ts with getUsers() method calling GET /api/users

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - admins can log in and view/search/filter users

---

## Phase 5: User Story 3 - Manage User Roles and Permissions (Priority: P2)

**Goal**: Enable administrators to create new users with specified roles and change existing user roles with immediate permission updates

**Independent Test**: Create test users with different roles, change a user's role, log in as that user, verify they have appropriate permissions, verify role change takes effect immediately

### Implementation for User Story 3

- [ ] T036 [US3] Add createUser() method to UserService in backend/src/services/user.service.ts: validate email uniqueness, hash password, create user with role per data-model.md query examples
- [ ] T037 [US3] Add updateUser() method to UserService in backend/src/services/user.service.ts: update name, role with last-admin check per research.md
- [ ] T038 [US3] Add getUserById() method to UserService in backend/src/services/user.service.ts: fetch user with series permissions per data-model.md query example 4
- [ ] T039 [US3] Implement last-admin-lockout check function in backend/src/services/user.service.ts: count active admins excluding current user per research.md and data-model.md query example 9
- [ ] T040 [US3] Create user routes in backend/src/api/users.routes.ts: POST /api/users, GET /api/users/:id, PUT /api/users/:id per contracts/openapi.yaml
- [ ] T041 [US3] Add password validation to createUser in backend/src/api/users.routes.ts: min 8 chars, uppercase, lowercase, number per research.md
- [ ] T042 [US3] Implement token blacklist on role change in backend/src/services/user.service.ts to invalidate active sessions per research.md
- [ ] T043 [US3] Create UserForm component in frontend/src/components/admin/UserForm.tsx for create/edit with email, password, name, role fields
- [ ] T044 [US3] Create RoleSelector component in frontend/src/components/admin/RoleSelector.tsx dropdown for Admin/Editor/Member roles per spec.md FR-016
- [ ] T045 [US3] Add createUser() and updateUser() methods to frontend user service in frontend/src/services/user.service.ts
- [ ] T046 [US3] Create UserDetailPage component in frontend/src/pages/admin/UserDetailPage.tsx for viewing and editing individual users per plan.md
- [ ] T047 [US3] Add "Create User" button and modal to UsersPage in frontend/src/pages/admin/UsersPage.tsx

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - admins can create users, assign roles, and role changes take effect immediately

---

## Phase 6: User Story 4 - Grant Content Series-Specific Editor Permissions (Priority: P2)

**Goal**: Enable administrators to grant series-specific editor permissions to Member users for granular content management

**Independent Test**: Create a Member user and a content series, grant the Member editor permission for that specific series, verify they can edit in that series but not others, revoke permission and verify access is removed

### Implementation for User Story 4

- [ ] T048 [P] [US4] Create PermissionService in backend/src/services/permission.service.ts with grantPermission() method per data-model.md query example 5
- [ ] T049 [P] [US4] Add revokePermission() method to PermissionService in backend/src/services/permission.service.ts per data-model.md query example 10
- [ ] T050 [P] [US4] Add listUserPermissions() method to PermissionService in backend/src/services/permission.service.ts
- [ ] T051 [US4] Add validation to grantPermission() to prevent granting to Admin/Editor base roles per data-model.md business rules
- [ ] T052 [US4] Create permission routes in backend/src/api/permissions.routes.ts: GET /api/users/:id/permissions, POST /api/users/:id/permissions, DELETE /api/users/:id/permissions/:seriesId per contracts/openapi.yaml
- [ ] T053 [US4] Apply admin-only authorization to all permission endpoints in backend/src/api/permissions.routes.ts
- [ ] T054 [US4] Create PermissionManager component in frontend/src/components/admin/PermissionManager.tsx showing list of series-specific permissions with grant/revoke buttons
- [ ] T055 [US4] Add series selection dropdown to PermissionManager in frontend/src/components/admin/PermissionManager.tsx
- [ ] T056 [US4] Integrate PermissionManager into UserDetailPage in frontend/src/pages/admin/UserDetailPage.tsx per spec.md acceptance scenario 3
- [ ] T057 [US4] Create useAuthorization hook in frontend/src/hooks/useAuthorization.ts for checking series-specific permissions

**Checkpoint**: At this point, all P2 user stories should work - admins can grant/revoke series-specific permissions and Members can edit specific series only

---

## Phase 7: User Story 5 - Activate, Deactivate, and Delete Users (Priority: P3)

**Goal**: Enable administrators to manage user account lifecycle by activating, deactivating, or soft-deleting user accounts

**Independent Test**: Create test user, deactivate account and verify login fails, reactivate and verify login succeeds, soft-delete and verify user hidden from lists but accessible in audit logs

### Implementation for User Story 5

- [ ] T058 [US5] Add activateUser() method to UserService in backend/src/services/user.service.ts: update status to 'active'
- [ ] T059 [US5] Add deactivateUser() method to UserService in backend/src/services/user.service.ts: update status to 'inactive', invalidate sessions per research.md
- [ ] T060 [US5] Add deleteUser() method to UserService in backend/src/services/user.service.ts: soft-delete (status='deleted'), last-admin check per data-model.md query example 7
- [ ] T061 [US5] Add DELETE /api/users/:id route in backend/src/api/users.routes.ts for soft-delete per contracts/openapi.yaml
- [ ] T062 [US5] Prevent login for inactive/deleted users in AuthService login() method in backend/src/services/auth.service.ts
- [ ] T063 [US5] Implement last-admin protection for deactivation in backend/src/services/user.service.ts per spec.md FR-010
- [ ] T064 [US5] Add activate/deactivate/delete action buttons to UserDetailPage in frontend/src/pages/admin/UserDetailPage.tsx
- [ ] T065 [US5] Add confirmation dialog for delete action in frontend/src/pages/admin/UserDetailPage.tsx per spec.md edge case
- [ ] T066 [US5] Exclude deleted users from default user list in backend/src/services/user.service.ts listUsers() per contracts/openapi.yaml
- [ ] T067 [US5] Show appropriate error message to deactivated users on login attempt in frontend/src/components/auth/LoginForm.tsx per spec.md acceptance scenario 1

**Checkpoint**: At this point, User Stories 1-5 should all work - admins can fully manage user lifecycle including activation/deactivation/deletion

---

## Phase 8: User Story 6 - View Admin Activity Logs (Priority: P3)

**Goal**: Enable administrators to view chronological history of all administrative actions for auditing and troubleshooting

**Independent Test**: Perform various admin actions (user creation, role changes, permission grants), view activity log, verify all actions appear with correct details (who, what, when)

### Implementation for User Story 6

- [ ] T068 [P] [US6] Create ActivityService in backend/src/services/activity.service.ts with logAction() method creating ActivityLog entries per data-model.md
- [ ] T069 [P] [US6] Add getActivityLog() method to ActivityService in backend/src/services/activity.service.ts with pagination and filters per data-model.md query example 8
- [ ] T070 [US6] Integrate ActivityService.logAction() into UserService methods: create, update, delete, activate, deactivate per data-model.md transaction examples
- [ ] T071 [US6] Integrate ActivityService.logAction() into PermissionService methods: grant, revoke per data-model.md query examples 5 and 10
- [ ] T072 [US6] Use Prisma transactions to ensure atomic update + log creation in all UserService methods per data-model.md query example 6
- [ ] T073 [US6] Create admin routes in backend/src/api/admin.routes.ts: GET /api/admin/activity-log with pagination and filters per contracts/openapi.yaml
- [ ] T074 [US6] Apply admin-only authorization to activity log endpoint in backend/src/api/admin.routes.ts
- [ ] T075 [US6] Create ActivityLog component in frontend/src/components/admin/ActivityLog.tsx displaying table with timestamp, admin, action, entity per spec.md
- [ ] T076 [US6] Add date range filter to ActivityLog component in frontend/src/components/admin/ActivityLog.tsx per spec.md acceptance scenario 2
- [ ] T077 [US6] Add action type filter dropdown to ActivityLog component in frontend/src/components/admin/ActivityLog.tsx
- [ ] T078 [US6] Create ActivityLogPage component in frontend/src/pages/admin/ActivityLogPage.tsx integrating ActivityLog per plan.md
- [ ] T079 [US6] Add user-specific activity history to UserDetailPage in frontend/src/pages/admin/UserDetailPage.tsx per spec.md acceptance scenario 3

**Checkpoint**: All user stories should now be independently functional - complete admin user management system with audit trail

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T080 [P] Add request/response logging middleware to all API endpoints in backend/src/server.ts using Pino per research.md
- [ ] T081 [P] Add correlation IDs to all activity logs for tracing in backend/src/middleware/correlation.middleware.ts per plan.md
- [ ] T082 [P] Implement proper error handling with user-friendly messages across all frontend pages per spec.md FR-014
- [ ] T083 [P] Add loading states to all frontend components during API calls
- [ ] T084 Add HTTPS enforcement configuration in backend/src/server.ts with Secure cookie flag, HSTS headers per research.md
- [ ] T085 [P] Add input sanitization to all user inputs in frontend forms to prevent XSS
- [ ] T086 [P] Verify all passwords are hashed before storage across UserService in backend/src/services/user.service.ts
- [ ] T087 Run database migrations and seed script per quickstart.md setup instructions
- [ ] T088 [P] Verify all success criteria from spec.md: SC-001 through SC-008
- [ ] T089 Validate quickstart.md instructions by following setup guide end-to-end
- [ ] T090 [P] Update CLAUDE.md with admin user management tech stack additions if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P2) → US3 (P2) → US4 (P2) → US5 (P3) → US6 (P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Integrates with US1 authentication but independently testable
- **User Story 3 (P2)**: Can start after Foundational - Extends US2 with create/edit, independently testable
- **User Story 4 (P2)**: Can start after Foundational - Requires User model from US1 but independently testable
- **User Story 5 (P3)**: Can start after Foundational - Extends US3 with lifecycle management, independently testable
- **User Story 6 (P3)**: Can start after Foundational - Background logging can be implemented independently, UI integrates with other stories

### Within Each User Story

- Backend models before services
- Services before API routes
- API routes before frontend components
- Frontend components before pages
- Core implementation before integration

### Parallel Opportunities

- **Setup Phase**: Tasks T003, T004, T005, T006 can run in parallel (different configuration files)
- **Foundational Phase**: Tasks T010, T011, T014, T015, T016 can run in parallel (different concerns)
- **Once Foundational completes**: All user stories (US1-US6) can start in parallel if team capacity allows
- **Within User Story 4**: Tasks T048, T049, T050 can run in parallel (different methods in same service)
- **Within User Story 6**: Tasks T068, T069 can run in parallel (different methods in same service)
- **Polish Phase**: Tasks T080, T081, T082, T083, T085, T086, T088, T090 can run in parallel (different files/concerns)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, these US1 tasks can run in parallel:
# Terminal 1: Backend model
Task T017 - Create User model types

# Terminal 2: Backend services (can start in parallel with T017)
Task T018 - Implement AuthService.login()
Task T019 - Implement AuthService.logout()

# After T018, T019 complete:
# Terminal 3: API routes
Task T020 - Create auth routes
Task T021 - Add rate limiting

# Terminal 4: Frontend components (can start in parallel with backend routes)
Task T022 - Implement LoginForm component
Task T023 - Create LoginPage component
Task T024 - Implement frontend auth service
Task T025 - Create useAuth hook
Task T026 - Add authorization checks
```

---

## MVP Scope

**Recommended MVP**: User Story 1 only (Phase 1 + Phase 2 + Phase 3)

- Total MVP tasks: 26 tasks (T001-T026)
- Delivers: Admin login, authentication, authorization, admin-only area access
- Independent testing: Create admin, log in, verify access control
- Estimated effort: 2-3 days for single developer

**Extended MVP**: Add User Story 2 (view/search users)

- Total tasks: 35 tasks (T001-T035)
- Delivers: MVP + ability to view and search all users
- Estimated effort: 3-4 days for single developer

**Full Feature**: All 6 user stories (90 tasks)

- Estimated effort: 7-10 days for single developer
- Or 3-4 days with 3 developers working in parallel on different user stories

---

## Implementation Strategy

1. **Start with MVP** (User Story 1 only): Get authentication working first
2. **Validate independently**: Test US1 thoroughly before moving on
3. **Add User Stories incrementally**: US2 → US3 → US4 → US5 → US6 in priority order
4. **Test after each story**: Ensure each story works independently
5. **Parallelize when possible**: Different developers can work on different user stories after Foundational phase
6. **Polish at the end**: Cross-cutting concerns apply to all stories, so do them last

---

## Task Count Summary

- **Setup**: 6 tasks
- **Foundational**: 10 tasks
- **User Story 1 (P1)**: 10 tasks
- **User Story 2 (P2)**: 9 tasks
- **User Story 3 (P2)**: 12 tasks
- **User Story 4 (P2)**: 10 tasks
- **User Story 5 (P3)**: 10 tasks
- **User Story 6 (P3)**: 12 tasks
- **Polish**: 11 tasks
- **Total**: 90 tasks

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All task IDs are sequential (T001-T090)
✅ All [P] markers indicate parallelizable tasks (different files, no blocking dependencies)
✅ All [Story] labels correctly map to user stories (US1-US6)
✅ All task descriptions include exact file paths from plan.md project structure
✅ All user story phases include goal and independent test criteria
✅ Dependencies section shows clear execution order
✅ Parallel opportunities identified for optimal team execution
