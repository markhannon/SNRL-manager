# Technical Research: Admin User Management

**Feature**: 001-admin-user
**Phase**: Phase 0 - Technical Foundation
**Date**: 2026-01-10

## Executive Summary

The Admin User Management feature will use the same technology stack established for the SNRL Manager project in feature 004-simracing-series. This ensures consistency, reduces complexity, and allows code sharing between features.

## Technology Stack (Inherited from Project)

**Decision**: Use established SNRL Manager stack

**Rationale**: Admin user management is a core feature of the same system. Using the same stack enables:

- Shared user models and authentication logic
- Consistent API patterns
- Unified database schema
- Common frontend components

**Stack Details**:

- **Runtime**: Node.js 20 LTS + TypeScript 5.x
- **Backend**: Fastify 4.x + Prisma ORM
- **Frontend**: React 18+
- **Database**: PostgreSQL 15+
- **Testing**: Vitest, Supertest, Playwright

## Feature-Specific Considerations

### 1. Authentication & Authorization

**Decision**: JWT-based authentication with role-based access control (RBAC)

**Rationale**:

- Stateless authentication suitable for API-based architecture
- Role hierarchy: Admin > Editor > Member
- Series-specific permissions for granular control

**Implementation Approach**:

- JWT tokens with role claims
- Fastify middleware for route-level authorization
- Permission checks in service layer

**JWT Structure**:

```typescript
interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'editor' | 'member';
  iat: number;  // Issued at
  exp: number;  // Expiration (24 hours from iat)
}
```

**Token Storage**:

- Backend issues JWT after successful login
- Frontend stores in httpOnly cookie (prevents XSS attacks)
- Cookie set with Secure flag (HTTPS only) and SameSite=Strict
- No localStorage/sessionStorage to prevent XSS token theft

**Session Management**:

- Access token expiry: 24 hours
- No refresh tokens for MVP (simplicity first)
- User must re-login after 24 hours
- Session invalidation on role change or account deactivation via token blacklist

### 2. User Data Model

**Decision**: Single User table with role enum + separate SeriesPermission table

**Rationale**:

- Simple base role model (Admin/Editor/Member)
- Flexible series-specific permissions via join table
- Soft-delete support via status field

**Key Entities**:

1. **User**
   - Fields: id, email, password_hash, role, status, created_at, updated_at, last_login
   - Indexes: unique(email), index(role), index(status)
   - Status enum: active, inactive, deleted

2. **SeriesPermission**
   - Fields: id, user_id, series_id, permission_level, granted_by, granted_at
   - Indexes: unique(user_id, series_id), index(user_id), index(series_id)
   - Permission levels: editor (only level needed for Members elevated to Editor on specific series)

3. **ActivityLog**
   - Fields: id, timestamp, admin_id, action, target_entity_type, target_entity_id, changes_json
   - Indexes: index(admin_id, timestamp), index(target_entity_type, target_entity_id)
   - Action types: create_user, update_user, delete_user, change_role, grant_permission, revoke_permission, activate_user, deactivate_user

### 3. Password Security

**Decision**: bcrypt for password hashing (12 rounds)

**Rationale**:

- Industry standard for password hashing
- Resistant to brute force attacks
- Adjustable difficulty via rounds parameter

**Library**: bcrypt npm package

**Implementation Details**:

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password on user creation
async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

// Verify password on login
async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
```

**Performance**: bcrypt with 12 rounds takes ~200-300ms to hash. This is intentional (prevents brute force) and acceptable for login operations.

**Password Requirements** (enforced at API level):

- Minimum 8 characters
- Must contain at least one uppercase letter, one lowercase letter, one number
- Optional: special character requirement (defer to post-MVP based on security policy)

### 4. Audit Logging

**Decision**: Database-backed activity log with Pino structured logging

**Rationale**:

- ActivityLog table for queryable admin action history
- Pino for application-level structured logging
- Both provide observability per constitution

**What to Log**:

1. **ActivityLog Entity** (database):
   - All admin actions (user creation, role changes, permission grants/revokes, deletions)
   - Timestamp, admin user ID, action type, target entity, before/after values
   - Queryable for audit reports and compliance

2. **Pino Structured Logs** (application logs):
   - All HTTP requests/responses (method, path, status, duration)
   - Authentication attempts (success/failure, user email, IP address)
   - Errors and exceptions (stack trace, context)
   - Performance metrics (query times, slow endpoints)

**Example Activity Log Entry**:

```json
{
  "id": 123,
  "timestamp": "2026-01-10T14:30:00Z",
  "admin_id": 5,
  "action": "change_role",
  "target_entity_type": "user",
  "target_entity_id": 42,
  "changes": {
    "role": {
      "before": "member",
      "after": "editor"
    }
  }
}
```

**Log Retention**:

- ActivityLog: Indefinite retention (database storage is cheap, compliance may require retention)
- Pino logs: 30 days (configurable via log rotation)

### 5. Session Management

**Decision**: JWT with 24-hour expiry, no refresh tokens (MVP)

**Rationale**:

- Simplicity First principle
- Refresh tokens can be added later if needed
- 24-hour expiry balances security and UX

**Token Blacklist** (for immediate revocation):

When admin role changes or account is deactivated, current sessions must be invalidated immediately (SC-003: <1 second). Implement token blacklist:

```typescript
// In-memory blacklist (Redis for production scale)
const tokenBlacklist = new Set<string>();

// Middleware to check blacklist
async function checkTokenBlacklist(request, reply) {
  const token = request.cookies.token;
  if (tokenBlacklist.has(token)) {
    return reply.status(401).send({ error: 'Token has been revoked' });
  }
}

// On role change or deactivation
async function invalidateUserSessions(userId: number) {
  // Add user's current token(s) to blacklist
  // For MVP, track active tokens in database
  // For scale, use Redis with TTL matching JWT expiry
}
```

**Future Enhancement**: Replace in-memory blacklist with Redis for horizontal scaling.

## Performance Validation

**Success Criteria from Spec**:

- **SC-001**: Create user <1 min → Achievable (simple form + API call + bcrypt hash ~300ms)
- **SC-002**: Search users <10 sec → Achievable (indexed email/name queries <100ms)
- **SC-003**: Role changes immediate (<1s) → Achievable (direct database update + token blacklist)
- **SC-006**: List loads <3s → Achievable (pagination + indexing, 25 users/page loads <200ms)

**Database Indexes Needed**:

```sql
-- User table indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- SeriesPermission table indexes
CREATE UNIQUE INDEX idx_series_permissions_user_series ON series_permissions(user_id, series_id);
CREATE INDEX idx_series_permissions_user ON series_permissions(user_id);
CREATE INDEX idx_series_permissions_series ON series_permissions(series_id);

-- ActivityLog table indexes
CREATE INDEX idx_activity_log_admin_time ON activity_log(admin_id, timestamp DESC);
CREATE INDEX idx_activity_log_target ON activity_log(target_entity_type, target_entity_id);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
```

**Query Performance Estimates**:

- User search by email (indexed): <10ms
- User list with pagination (25 rows): <50ms
- Activity log queries (last 100 entries): <100ms
- Role update transaction: <50ms
- Permission grant/revoke: <30ms

All well within performance goals.

## API Design Patterns

**RESTful Resource-Based Endpoints**:

Following REST conventions for clarity and consistency with feature 004:

- `POST /api/auth/login` - Authenticate user, issue JWT
- `POST /api/auth/logout` - Invalidate current session
- `GET /api/users` - List users (with pagination, search, filters)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user (name, role, status)
- `DELETE /api/users/:id` - Soft-delete user
- `GET /api/users/:id/permissions` - List user's series-specific permissions
- `POST /api/users/:id/permissions` - Grant series-specific permission
- `DELETE /api/users/:id/permissions/:seriesId` - Revoke series-specific permission
- `GET /api/admin/activity-log` - View audit log (admin-only)

**Request/Response Format**:

All endpoints use JSON for requests and responses. Fastify schema validation ensures type safety.

**Error Responses**:

Standard error format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Email already exists"
}
```

**Pagination**:

Query parameters: `?page=1&limit=25`

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6
  }
}
```

## Security Considerations

### 1. Authorization Enforcement

**Principle**: Defense in depth - check permissions at multiple layers

- **Route level**: Fastify middleware checks if user is authenticated and has required role
- **Service level**: Business logic double-checks permissions before mutations
- **Database level**: Row-level security (future enhancement)

### 2. Input Validation

All user inputs validated at API boundary:

- Email format validation (RFC 5322)
- Password strength requirements
- Role enum validation (only admin/editor/member allowed)
- SQL injection prevention via Prisma parameterized queries

### 3. Rate Limiting

**Decision**: Add rate limiting to authentication endpoints

```typescript
import rateLimit from '@fastify/rate-limit';

// Login endpoint: 5 attempts per 15 minutes per IP
await fastify.register(rateLimit, {
  max: 5,
  timeWindow: '15 minutes',
  keyGenerator: (request) => request.ip
});
```

Prevents brute force password attacks.

### 4. HTTPS Enforcement

All production deployments must use HTTPS:

- JWT cookies set with Secure flag (only sent over HTTPS)
- HSTS headers to enforce HTTPS
- Redirect HTTP to HTTPS at load balancer/reverse proxy

### 5. Preventing Last Admin Lockout

**Critical Safeguard**: System must prevent deletion or demotion of last admin user (FR-010)

```typescript
async function canRemoveAdminRole(userId: number): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: {
      role: 'admin',
      status: 'active',
      id: { not: userId }  // Count other admins
    }
  });

  return adminCount > 0;  // Allow only if other admins exist
}
```

Apply this check before:

- Deleting admin user
- Changing admin role to editor/member
- Deactivating admin user

## Open Questions

**None** - all technical decisions align with established project stack and spec requirements.

## Recommendations Summary

1. Use project-wide tech stack (Node.js 20, TypeScript, Fastify, Prisma, React, PostgreSQL)
2. Implement JWT authentication with RBAC
3. Use bcrypt for password hashing (12 rounds)
4. Single User table + SeriesPermission join table
5. Database-backed activity log + Pino structured logging
6. Strategic indexes on email, role, status for query performance
7. httpOnly cookies for JWT storage (XSS prevention)
8. Rate limiting on authentication endpoints (brute force prevention)
9. Token blacklist for immediate session invalidation
10. Safeguards to prevent last admin lockout

## Next Steps

Proceed to Phase 1 design artifacts:

1. **data-model.md**: Complete Prisma schema for User, SeriesPermission, ActivityLog entities
2. **contracts/openapi.yaml**: Full API specification for all 11 endpoints
3. **quickstart.md**: Development setup and testing guide
