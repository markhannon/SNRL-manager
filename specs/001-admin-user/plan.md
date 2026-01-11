# Implementation Plan: Admin User Management

**Branch**: `001-admin-user` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-admin-user/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Admin User Management feature establishes the authentication and authorization foundation for the SNRL Manager system. It provides a secure way for administrators to create, manage, and control user accounts with role-based access control (RBAC). The system supports three primary roles (Admin, Editor, Member) with an additional layer of series-specific permissions that allow Members to be elevated to Editor privileges for specific content series.

**Technical Approach**: Leverages the established SNRL Manager stack (Node.js 20 LTS, TypeScript, Fastify, Prisma, PostgreSQL, React) to implement JWT-based authentication with bcrypt password hashing. The architecture uses a single User table with role enumeration plus a separate SeriesPermission join table for granular series-level access control. All administrative actions are tracked in an ActivityLog entity for audit compliance and observability.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.x
**Primary Dependencies**: Fastify 4.x (backend), React 18+ (frontend), Prisma 5.x (ORM), bcrypt (password hashing), @fastify/jwt (authentication)
**Storage**: PostgreSQL 15+ with indexed queries on email, role, status, and activity log fields
**Testing**: Vitest (unit tests), Supertest (API integration tests), Playwright (E2E tests)
**Target Platform**: Web application (Linux/Docker server for backend, modern browsers for frontend)
**Project Type**: Web application (backend + frontend separation)
**Performance Goals**: <1 min user creation (SC-001), <10 sec user search (SC-002), <1s role changes (SC-003), <3s list loads (SC-006)
**Constraints**: <200ms p95 API response time, immediate session invalidation on deactivation, 100% prevention of unauthorized admin access (SC-004)
**Scale/Scope**: Expected 100-1000 users initially, 20-50 admin actions/day, complete audit trail for all administrative operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Modularity** ✅ PASS
- Clear separation between frontend (React), backend (Fastify), and database (Prisma)
- User authentication logic isolated in authentication service/middleware
- Admin actions interface only through documented REST API contracts
- No cross-layer violations: frontend interacts via API only, no direct database access
- Shared types between frontend/backend defined via TypeScript interfaces

**II. Observability** ✅ PASS
- All admin actions logged to ActivityLog entity (timestamp, admin_id, action, target_entity, changes)
- Structured logging via Pino (Fastify built-in) for request/response metadata
- Authentication attempts logged with success/failure status
- Error conditions logged with sufficient context (user ID, attempted action, reason for failure)
- Critical operations (role changes, account deletion) include correlation IDs for tracing

**III. Simplicity First** ✅ PASS
- JWT authentication with bcrypt password hashing (industry standard, proven approach)
- Single User table + SeriesPermission join table (no over-engineered role hierarchy)
- Database-backed activity log (no premature distributed logging infrastructure)
- Direct authorization checks via Fastify middleware (no complex policy engine)
- 24-hour JWT expiry without refresh tokens for MVP (add refresh tokens only if needed)
- Standard PostgreSQL indexes for query performance (no premature caching layer)

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-user/
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
│   │   └── user.ts           # User entity with role, status, timestamps
│   ├── services/
│   │   ├── auth.service.ts   # Login, logout, JWT token management
│   │   ├── user.service.ts   # User CRUD operations, role management
│   │   ├── permission.service.ts  # Series-specific permission grants/revokes
│   │   └── activity.service.ts    # Audit log creation and queries
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT verification
│   │   └── authorization.middleware.ts  # Role-based access control
│   ├── api/
│   │   ├── auth.routes.ts    # POST /api/auth/login, /api/auth/logout
│   │   ├── users.routes.ts   # User management endpoints
│   │   ├── permissions.routes.ts  # Series permission endpoints
│   │   └── admin.routes.ts   # Activity log endpoints
│   └── utils/
│       └── password.ts       # bcrypt hashing utilities
├── tests/
│   ├── unit/
│   │   ├── services/         # Service layer unit tests
│   │   └── utils/            # Utility function tests
│   └── integration/
│       └── api/              # API endpoint integration tests
└── prisma/
    ├── schema.prisma         # Database schema (User, SeriesPermission, ActivityLog)
    └── migrations/           # Database migration files

frontend/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── UserList.tsx      # User management table
│   │   │   ├── UserForm.tsx      # Create/edit user form
│   │   │   ├── RoleSelector.tsx  # Role assignment component
│   │   │   ├── PermissionManager.tsx  # Series-specific permissions UI
│   │   │   └── ActivityLog.tsx   # Admin action audit log viewer
│   │   └── auth/
│   │       └── LoginForm.tsx     # Admin login form
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── UsersPage.tsx     # User list and search page
│   │   │   ├── UserDetailPage.tsx  # Individual user view/edit page
│   │   │   └── ActivityLogPage.tsx  # Audit log page
│   │   └── auth/
│   │       └── LoginPage.tsx     # Login page
│   ├── services/
│   │   ├── auth.service.ts   # Frontend auth API calls
│   │   └── user.service.ts   # Frontend user API calls
│   └── hooks/
│       ├── useAuth.ts        # Authentication state hook
│       └── useAuthorization.ts  # Authorization check hook
└── tests/
    ├── unit/
    │   └── components/       # Component unit tests
    └── e2e/
        └── admin/            # Playwright E2E tests
```

**Structure Decision**: This feature uses the web application structure (Option 2) established by feature 004-simracing-series. The backend follows Fastify's modular plugin architecture with clear separation between models, services, middleware, and API routes. The frontend uses React with a page-based routing structure and component-level organization. Both backend and frontend maintain their own test directories following the testing hierarchy (unit, integration, contract for backend; unit, E2E for frontend). The Prisma schema is defined in `backend/prisma/schema.prisma` for type-safe database access across the backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**NO VIOLATIONS** - All design decisions align with constitutional principles. No complexity justifications required.

---

## Phase 0: Technical Research (Complete)

**Date**: 2026-01-10
**Artifact**: [research.md](./research.md)

**Summary**:

Completed technical research establishing that Admin User Management will leverage the existing SNRL Manager technology stack defined in feature 004-simracing-series (Node.js 20 LTS, TypeScript, Fastify, Prisma, PostgreSQL, React). Key technical decisions:

- **Authentication**: JWT-based with 24-hour expiry, httpOnly cookies, bcrypt password hashing (12 rounds)
- **Authorization**: Role-based access control (Admin/Editor/Member) with series-specific permission grants via join table
- **Data Model**: Single User table + SeriesPermission table + ActivityLog table
- **Session Management**: Token blacklist for immediate revocation on role changes or account deactivation
- **Security**: Rate limiting on auth endpoints, input validation, last-admin-lockout prevention

All success criteria validated as achievable:
- SC-001 (user creation <1 min): Simple form + API + bcrypt ~300ms ✓
- SC-002 (search <10 sec): Indexed queries <100ms ✓
- SC-003 (role changes <1s): Direct DB update + blacklist ✓
- SC-006 (list loads <3s): Pagination + indexing <200ms ✓

**Outcome**: No open questions. All technical decisions align with project stack and constitutional principles. Ready for Phase 1 design.

---

## Phase 1: Design Artifacts (Complete)

**Date**: 2026-01-10
**Artifacts**: [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [quickstart.md](./quickstart.md)

### Data Model

**Artifact**: [data-model.md](./data-model.md)

Complete Prisma schema defining three core entities:

1. **User**: Core account with email (unique), password_hash, role (enum), status (enum), timestamps
   - Indexes: email (unique), role, status, created_at
   - Relationships: series_permissions (1:many), granted_permissions (1:many), activity_logs (1:many)

2. **SeriesPermission**: Series-specific editor permissions for Members
   - Fields: user_id, series_id, permission_level, granted_by, granted_at
   - Unique constraint: (user_id, series_id)
   - Cascade delete on user deletion, preserve audit trail on granter deletion

3. **ActivityLog**: Immutable audit trail for all admin actions
   - Fields: timestamp, admin_id, action (enum), target_entity_type, target_entity_id, changes (JSON)
   - Indexes: (admin_id, timestamp), (target_entity_type, target_entity_id), timestamp
   - Never deleted (preserve compliance records)

**Key Features**:
- Transaction support for atomic updates with logging
- Soft-delete for users (status='deleted')
- JSON changes field for before/after audit tracking
- Strategic indexes for <200ms query performance
- Sample queries for all CRUD operations

### API Contracts

**Artifact**: [contracts/openapi.yaml](./contracts/openapi.yaml)

Complete OpenAPI 3.0 specification with 11 endpoints covering all 20 functional requirements:

**Authentication** (2 endpoints):
- POST /api/auth/login - JWT issuance with httpOnly cookie
- POST /api/auth/logout - Session invalidation via blacklist

**User Management** (4 endpoints):
- GET /api/users - List with pagination, search, filters
- POST /api/users - Create with validation
- GET /api/users/:id - Detail view with permissions
- PUT /api/users/:id - Update role/status with last-admin check
- DELETE /api/users/:id - Soft-delete with safeguards

**Permissions** (3 endpoints):
- GET /api/users/:id/permissions - List series permissions
- POST /api/users/:id/permissions - Grant editor permission
- DELETE /api/users/:id/permissions/:seriesId - Revoke permission

**Admin** (1 endpoint):
- GET /api/admin/activity-log - Audit log with filters

**Features**:
- Request/response schemas for all endpoints
- Error responses with examples
- Security definitions (cookieAuth)
- Pagination metadata
- Business rule documentation

### Quickstart Guide

**Artifact**: [quickstart.md](./quickstart.md)

Comprehensive development guide covering:

- **Setup**: Prerequisites, database creation, migrations, seeding
- **API Testing**: cURL examples, Postman/Insomnia import, VS Code REST Client
- **Running Tests**: Unit, integration, E2E test commands
- **Database Management**: Prisma Studio, migrations, resets
- **Debugging**: Backend/frontend debugging, query inspection, logs
- **Troubleshooting**: Common issues (connection errors, JWT issues, migration failures)
- **Performance**: Query monitoring, response time tracking
- **Security**: Pre-deployment checklist

**Outcome**: Development team can set up local environment and begin implementation immediately.

---

## Next Steps

### Phase 2: Task Generation (Not Done - Use /speckit.tasks)

Run `/speckit.tasks` command to generate actionable, dependency-ordered tasks in `tasks.md`.

Expected task phases:
1. **Phase 0**: Database schema and migrations
2. **Phase 1**: Authentication service and middleware
3. **Phase 2**: User management API endpoints
4. **Phase 3**: Series permission management
5. **Phase 4**: Activity logging
6. **Phase 5**: Frontend components and pages
7. **Phase 6**: Integration and E2E tests

### Phase 3: Implementation (Use /speckit.implement)

After task generation, run `/speckit.implement` command to execute tasks incrementally with testing at each phase.

### Phase 4: GitHub Issues (Optional - Use /speckit.taskstoissues)

Convert tasks to GitHub issues for team collaboration and tracking.

---

## Constitutional Re-Check (Post-Design)

**I. Modularity** ✅ PASS
- Data model clearly separates User, SeriesPermission, ActivityLog concerns
- API contracts define explicit boundaries between authentication, user management, permissions, and audit logging
- Prisma ORM provides type-safe database layer isolation
- No cross-layer violations in design

**II. Observability** ✅ PASS
- ActivityLog entity captures all admin actions with complete audit trail
- OpenAPI spec documents all endpoints with request/response schemas
- Quickstart includes debugging, logging, and performance monitoring sections
- Structured error responses with actionable messages

**III. Simplicity First** ✅ PASS
- Single User table (no over-engineered user hierarchy)
- JWT with 24-hour expiry (no premature refresh token complexity)
- Direct PostgreSQL queries via Prisma (no caching layer)
- Standard bcrypt for passwords (no custom crypto)
- Activity log as database table (no distributed logging infrastructure)

**Final Verdict**: All design artifacts align with constitutional principles. Ready for implementation.
