# Quickstart Guide: Admin User Management

**Feature**: 001-admin-user
**Date**: 2026-01-10

## Overview

This guide walks you through setting up, developing, and testing the Admin User Management feature. It covers local development environment setup, database initialization, API testing, and troubleshooting.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20 LTS** (check: `node --version`)
- **npm 10+** (check: `npm --version`)
- **PostgreSQL 15+** (check: `psql --version`)
- **Git** (check: `git --version`)

## Initial Setup

### 1. Clone Repository and Checkout Branch

```bash
# Clone the repository (if not already cloned)
git clone <repository-url> snrl-manager
cd snrl-manager

# Checkout the admin user management feature branch
git checkout 001-admin-user
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb snrl_manager_dev

# Set up environment variables
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/snrl_manager_dev"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-here"

# Server
PORT=3000
NODE_ENV=development

# CORS (for frontend)
CORS_ORIGIN="http://localhost:5173"
```

### 4. Run Database Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables, indexes, constraints)
npx prisma migrate dev --name init_admin_user_management

# Seed database with initial admin user
npx prisma db seed
```

**Default Admin Credentials** (development only):
- Email: `admin@snrl.example`
- Password: `admin123`

### 5. Start Development Servers

**Terminal 1 - Backend**:

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend**:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### 6. Verify Setup

Open browser to `http://localhost:5173` and login with admin credentials.

## API Testing

### Using cURL

#### 1. Login

```bash
# Login and save cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@snrl.example","password":"admin123"}' \
  -c cookies.txt

# Response:
# {
#   "user": {
#     "id": 1,
#     "email": "admin@snrl.example",
#     "name": "System Administrator",
#     "role": "admin",
#     "status": "active",
#     ...
#   },
#   "message": "Login successful"
# }
```

#### 2. List Users

```bash
# Use saved cookie for authentication
curl http://localhost:3000/api/users \
  -b cookies.txt

# With pagination and filtering
curl "http://localhost:3000/api/users?page=1&limit=10&role=member" \
  -b cookies.txt
```

#### 3. Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "newuser@snrl.example",
    "password": "SecurePass123",
    "name": "New User",
    "role": "member"
  }'

# Response: 201 Created with user object
```

#### 4. Update User Role

```bash
curl -X PUT http://localhost:3000/api/users/2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "role": "editor"
  }'
```

#### 5. Grant Series Permission

```bash
curl -X POST http://localhost:3000/api/users/2/permissions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "series_id": 123
  }'
```

#### 6. View Activity Log

```bash
curl "http://localhost:3000/api/admin/activity-log?limit=20" \
  -b cookies.txt
```

#### 7. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Using Postman/Insomnia

1. Import `specs/001-admin-user/contracts/openapi.yaml` as OpenAPI 3.0 spec
2. Set base URL: `http://localhost:3000/api`
3. Login endpoint automatically sets cookie for subsequent requests
4. All endpoints are documented with examples

### Using VS Code REST Client

Create `test.http`:

```http
### Variables
@baseUrl = http://localhost:3000/api
@email = admin@snrl.example
@password = admin123

### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "{{email}}",
  "password": "{{password}}"
}

### List Users
GET {{baseUrl}}/users?page=1&limit=10

### Create User
POST {{baseUrl}}/users
Content-Type: application/json

{
  "email": "testuser@snrl.example",
  "password": "TestPass123",
  "name": "Test User",
  "role": "member"
}
```

## Running Tests

### Unit Tests

```bash
cd backend

# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage

# Watch mode
npm run test:unit -- --watch
```

### Integration Tests

```bash
cd backend

# Run API integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- api/users.test.ts
```

### E2E Tests

```bash
cd frontend

# Run Playwright E2E tests
npm run test:e2e

# Run in headed mode (visible browser)
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- admin/user-management.spec.ts
```

### Full Test Suite

```bash
# From repository root
npm run test

# This runs:
# - Backend unit tests
# - Backend integration tests
# - Frontend component tests
# - E2E tests
```

## Database Management

### View Data with Prisma Studio

```bash
cd backend
npx prisma studio
```

Opens browser GUI at `http://localhost:5555` to view/edit database records.

### Reset Database

```bash
cd backend

# Reset database to clean state
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Re-run all migrations
# 3. Re-seed database with initial admin user
```

### Create New Migration

```bash
cd backend

# After modifying schema.prisma
npx prisma migrate dev --name descriptive_migration_name
```

### Generate Prisma Client

```bash
cd backend

# After pulling schema changes
npx prisma generate
```

## Common Development Tasks

### Add New API Endpoint

1. Define route in `backend/src/api/*.routes.ts`
2. Implement handler logic in `backend/src/services/*.service.ts`
3. Add validation schema (Fastify JSON Schema)
4. Update `specs/001-admin-user/contracts/openapi.yaml`
5. Write integration test in `backend/tests/integration/api/*.test.ts`

### Add New User Field

1. Update `backend/prisma/schema.prisma` (User model)
2. Run `npx prisma migrate dev --name add_user_field`
3. Update TypeScript types (auto-generated by Prisma)
4. Update API request/response schemas in OpenAPI spec
5. Update frontend types and components

### Add Activity Log Entry

```typescript
// In service layer
await prisma.activityLog.create({
  data: {
    admin_id: currentUserId,
    action: 'update_user',
    target_entity_type: 'user',
    target_entity_id: userId,
    changes: {
      field_name: {
        before: oldValue,
        after: newValue
      }
    }
  }
});
```

## Debugging

### Backend Debugging

#### View Logs

```bash
cd backend
npm run dev

# Logs show:
# - Incoming HTTP requests
# - Database queries
# - Authentication attempts
# - Errors with stack traces
```

#### Debug with VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

Set breakpoints in VS Code, then F5 to start debugging.

#### Inspect Database Queries

```bash
# Enable Prisma query logging
# In backend/.env
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
DEBUG="prisma:query"
```

### Frontend Debugging

#### React DevTools

Install React DevTools browser extension to inspect component tree, props, and state.

#### Network Tab

Use browser DevTools Network tab to inspect:
- API requests/responses
- Cookie values (JWT token)
- Request/response headers
- Timing information

#### Console Logs

Frontend logs API errors to browser console. Check for:
- 401 Unauthorized (expired token, need to re-login)
- 403 Forbidden (insufficient permissions)
- 400 Bad Request (validation errors)

## Troubleshooting

### Issue: "Cannot connect to database"

**Symptoms**: Backend fails to start with connection error

**Solutions**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env` is correct
3. Check database exists: `psql -l | grep snrl_manager`
4. Test connection: `psql $DATABASE_URL`

### Issue: "JWT token invalid or expired"

**Symptoms**: API returns 401 Unauthorized

**Solutions**:
1. Token expired (24 hour lifetime) - re-login
2. JWT_SECRET changed - existing tokens invalidated, re-login
3. Cookie not sent - check CORS settings, verify cookie domain
4. Token blacklisted - role changed or logout occurred, re-login

### Issue: "Cannot change role of last admin user"

**Symptoms**: API returns 400 Bad Request when updating admin role

**Solutions**:
1. This is expected behavior (prevents lockout)
2. Create another admin user first
3. Then demote the original admin

### Issue: "Email already exists"

**Symptoms**: Cannot create user with specific email

**Solutions**:
1. Email is already registered (including deleted users)
2. Check existing users: `SELECT email, status FROM users WHERE email = '...'`
3. If user is deleted, either hard-delete or use different email

### Issue: "Prisma Client not generated"

**Symptoms**: Import errors for `@prisma/client`

**Solutions**:
```bash
cd backend
npx prisma generate
```

### Issue: "Migration failed"

**Symptoms**: `prisma migrate dev` fails with SQL error

**Solutions**:
1. Check PostgreSQL logs for detailed error
2. Ensure no other migrations are running
3. Reset database if safe: `npx prisma migrate reset`
4. Fix schema.prisma issue and retry

### Issue: Tests fail with "Port already in use"

**Symptoms**: Integration tests fail to start

**Solutions**:
1. Stop development server (port 3000)
2. Kill process: `lsof -ti:3000 | xargs kill -9`
3. Tests use separate test database (configured in test setup)

## Performance Monitoring

### Check Query Performance

```bash
cd backend
npx prisma studio

# Or use PostgreSQL directly
psql $DATABASE_URL

# Show slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

### Monitor API Response Times

Backend logs include timing information:

```
[14:30:15.123] INFO: GET /api/users - 45ms
[14:30:20.456] INFO: POST /api/users - 312ms
```

Look for responses >200ms (p95 target).

### Check Database Connection Pool

```typescript
// In backend code
const pool = await prisma.$queryRaw`
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE datname = current_database();
`;
console.log('Active connections:', pool);
```

## Security Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (32+ random bytes)
- [ ] Enable HTTPS (set Secure flag on cookies)
- [ ] Configure CORS_ORIGIN to production domain
- [ ] Enable rate limiting on auth endpoints
- [ ] Review and test authorization on all endpoints
- [ ] Ensure password requirements are enforced
- [ ] Test last-admin-lockout prevention
- [ ] Verify audit logging captures all actions

## Useful Commands Reference

```bash
# Database
createdb snrl_manager_dev          # Create database
dropdb snrl_manager_dev            # Drop database
psql snrl_manager_dev              # Connect to database
npx prisma studio                  # Open database GUI

# Migrations
npx prisma migrate dev             # Create and apply migration
npx prisma migrate reset           # Reset database
npx prisma generate                # Generate Prisma Client
npx prisma db seed                 # Run seed script

# Development
npm run dev                        # Start dev server
npm run build                      # Build for production
npm run start                      # Start production server

# Testing
npm run test:unit                  # Run unit tests
npm run test:integration           # Run API tests
npm run test:e2e                   # Run E2E tests
npm run test                       # Run all tests

# Linting
npm run lint                       # Check code style
npm run lint:fix                   # Fix code style issues
```

## Next Steps

After completing setup:

1. Read the [Data Model documentation](./data-model.md) to understand database schema
2. Review [API Contracts](./contracts/openapi.yaml) for endpoint details
3. Check [Research document](./research.md) for technical decisions
4. Implement feature following [Implementation Plan](./plan.md)

## Getting Help

- **API Documentation**: OpenAPI spec at `specs/001-admin-user/contracts/openapi.yaml`
- **Database Schema**: Prisma schema at `backend/prisma/schema.prisma`
- **Code Structure**: See [Implementation Plan](./plan.md) - Project Structure section
- **Troubleshooting**: Review common issues above
- **Logs**: Check backend console and browser DevTools console

## Additional Resources

- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
