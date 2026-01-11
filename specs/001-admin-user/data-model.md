# Data Model: Admin User Management

**Feature**: 001-admin-user
**Date**: 2026-01-10
**Database**: PostgreSQL 15+ with Prisma ORM

## Overview

This data model defines three core entities for admin user management:

1. **User**: Core user account with authentication credentials and role
2. **SeriesPermission**: Series-specific editor permissions for Members
3. **ActivityLog**: Audit trail of all administrative actions

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ email (unique)  │
│ password_hash   │
│ name            │
│ role            │◄────┐
│ status          │     │
│ created_at      │     │
│ updated_at      │     │
│ last_login      │     │
└─────────────────┘     │
         │              │
         │ 1            │
         │              │
         │              │
         ├──────────────┤
         │              │
         │ *            │
         ▼              │
┌─────────────────────┐ │
│ SeriesPermission    │ │
├─────────────────────┤ │
│ id (PK)             │ │
│ user_id (FK)        │─┘
│ series_id (FK)      │
│ permission_level    │
│ granted_by (FK)     │───┐
│ granted_at          │   │
└─────────────────────┘   │
                          │
                          │
         ┌────────────────┘
         │
         │
         ▼
┌─────────────────────────┐
│     ActivityLog         │
├─────────────────────────┤
│ id (PK)                 │
│ timestamp               │
│ admin_id (FK)           │──────┐
│ action                  │      │
│ target_entity_type      │      │
│ target_entity_id        │      │
│ changes                 │      │
└─────────────────────────┘      │
                                 │
         ┌───────────────────────┘
         │
         ▼
      (User)
```

## Prisma Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// User Entity
// ============================================================================

enum UserRole {
  admin   // Full system access, can manage all users and content
  editor  // Can create/edit content, create championships
  member  // Basic access, can register for championships
}

enum UserStatus {
  active    // User can log in and access the system
  inactive  // User temporarily deactivated, cannot log in
  deleted   // User soft-deleted, cannot log in, hidden from standard lists
}

model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique @db.VarChar(255)
  password_hash String    @db.VarChar(255)
  name          String?   @db.VarChar(255)
  role          UserRole  @default(member)
  status        UserStatus @default(active)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  last_login    DateTime?

  // Relationships
  series_permissions SeriesPermission[] @relation("UserSeriesPermissions")
  granted_permissions SeriesPermission[] @relation("PermissionGranter")
  activity_logs      ActivityLog[]      @relation("AdminActivityLogs")

  // Indexes
  @@index([email])
  @@index([role])
  @@index([status])
  @@index([created_at(sort: Desc)])
  @@map("users")
}

// ============================================================================
// SeriesPermission Entity
// ============================================================================

enum PermissionLevel {
  editor  // Elevated to editor permissions for specific series
}

model SeriesPermission {
  id               Int             @id @default(autoincrement())
  user_id          Int
  series_id        Int
  permission_level PermissionLevel @default(editor)
  granted_by       Int             // Admin user ID who granted this permission
  granted_at       DateTime        @default(now())

  // Relationships
  user         User @relation("UserSeriesPermissions", fields: [user_id], references: [id], onDelete: Cascade)
  granter      User @relation("PermissionGranter", fields: [granted_by], references: [id], onDelete: Restrict)

  // Note: series relationship to Series model (defined in 004-simracing-series)
  // series       Series @relation(fields: [series_id], references: [id], onDelete: Cascade)

  // Constraints
  @@unique([user_id, series_id], name: "unique_user_series_permission")
  @@index([user_id])
  @@index([series_id])
  @@index([granted_by])
  @@map("series_permissions")
}

// ============================================================================
// ActivityLog Entity
// ============================================================================

enum ActivityAction {
  create_user         // New user account created
  update_user         // User details updated (name, email)
  delete_user         // User soft-deleted
  change_role         // User role changed (admin/editor/member)
  grant_permission    // Series-specific permission granted
  revoke_permission   // Series-specific permission revoked
  activate_user       // User account activated
  deactivate_user     // User account deactivated
}

enum TargetEntityType {
  user
  series_permission
}

model ActivityLog {
  id                 Int               @id @default(autoincrement())
  timestamp          DateTime          @default(now())
  admin_id           Int               // User ID of admin who performed the action
  action             ActivityAction
  target_entity_type TargetEntityType
  target_entity_id   Int               // ID of the affected entity (user ID, permission ID, etc.)
  changes            Json?             // JSON object containing before/after values

  // Relationships
  admin User @relation("AdminActivityLogs", fields: [admin_id], references: [id], onDelete: Restrict)

  // Indexes
  @@index([admin_id, timestamp(sort: Desc)])
  @@index([target_entity_type, target_entity_id])
  @@index([timestamp(sort: Desc)])
  @@index([action])
  @@map("activity_logs")
}
```

## Entity Details

### User Entity

**Purpose**: Core user account with authentication and authorization information.

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `email` (String, unique): User's email address, used for login and identification
- `password_hash` (String): bcrypt-hashed password (never store plaintext)
- `name` (String, nullable): User's display name (optional for MVP)
- `role` (UserRole): Base role defining system-wide permissions (admin/editor/member)
- `status` (UserStatus): Account status (active/inactive/deleted)
- `created_at` (DateTime): Timestamp when account was created
- `updated_at` (DateTime): Timestamp of last update (auto-updated by Prisma)
- `last_login` (DateTime, nullable): Timestamp of most recent successful login

**Relationships**:

- `series_permissions`: One-to-many relationship with SeriesPermission (permissions granted TO this user)
- `granted_permissions`: One-to-many relationship with SeriesPermission (permissions granted BY this user as admin)
- `activity_logs`: One-to-many relationship with ActivityLog (actions performed BY this admin)

**Indexes**:

- Unique index on `email` for login lookups and duplicate prevention
- Index on `role` for filtering users by role
- Index on `status` for filtering active/inactive/deleted users
- Index on `created_at DESC` for sorting by join date

**Constraints**:

- Email must be unique across all users (including deleted users to prevent re-registration)
- Password hash must not be null
- Role defaults to 'member' for new users

**Business Rules**:

1. Email cannot be changed after account creation (prevents identity confusion)
2. Password must be hashed with bcrypt (12 rounds) before storing
3. Last admin user cannot be deleted or demoted (enforced in application logic)
4. Deleted users have status='deleted' (soft delete, preserves audit trail)

### SeriesPermission Entity

**Purpose**: Grants series-specific editor permissions to Member users, enabling granular access control.

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `user_id` (Int, FK): User receiving the permission
- `series_id` (Int, FK): Series for which permission is granted
- `permission_level` (PermissionLevel): Level of permission granted (currently only 'editor')
- `granted_by` (Int, FK): Admin user who granted this permission
- `granted_at` (DateTime): Timestamp when permission was granted

**Relationships**:

- `user`: Many-to-one relationship with User (the user receiving permission)
- `granter`: Many-to-one relationship with User (the admin who granted permission)
- `series`: Many-to-one relationship with Series model (defined in feature 004)

**Indexes**:

- Unique composite index on `(user_id, series_id)` to prevent duplicate permissions
- Index on `user_id` for querying all permissions for a user
- Index on `series_id` for querying all users with permissions on a series
- Index on `granted_by` for audit queries (who granted what)

**Constraints**:

- User can have at most ONE permission entry per series (enforced by unique constraint)
- Cannot grant permission to user with Admin or Editor base role (enforced in application logic)
- Permission automatically deleted if user is deleted (CASCADE)
- Permission cannot be deleted if granting admin is deleted (RESTRICT, maintain audit trail)

**Business Rules**:

1. Only admins can grant series-specific permissions
2. Permissions only apply to users with Member base role
3. When user's base role changes from Member to Editor/Admin, series permissions become redundant but remain in database for audit trail
4. When series is deleted, all associated permissions are deleted (CASCADE)

### ActivityLog Entity

**Purpose**: Audit trail of all administrative actions for compliance, security, and troubleshooting.

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `timestamp` (DateTime): When the action occurred
- `admin_id` (Int, FK): User ID of admin who performed the action
- `action` (ActivityAction): Type of action performed
- `target_entity_type` (TargetEntityType): Type of entity affected (user, series_permission)
- `target_entity_id` (Int): ID of the affected entity
- `changes` (JSON, nullable): Before/after values for the action

**Relationships**:

- `admin`: Many-to-one relationship with User (admin who performed action)

**Indexes**:

- Composite index on `(admin_id, timestamp DESC)` for querying actions by specific admin, sorted by recency
- Composite index on `(target_entity_type, target_entity_id)` for querying all actions on specific entity
- Index on `timestamp DESC` for viewing recent actions across all admins
- Index on `action` for filtering by action type

**Constraints**:

- Cannot delete log entry if admin user is deleted (RESTRICT, preserve audit trail)
- Timestamp defaults to current time

**Business Rules**:

1. Log entries are immutable (never updated or deleted)
2. All admin actions that modify user accounts must create log entry
3. Changes field contains JSON with structure: `{ "field_name": { "before": value, "after": value } }`

**Example Changes JSON**:

```json
{
  "role": {
    "before": "member",
    "after": "editor"
  }
}
```

## Sample Queries

### 1. Find user by email (login)

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'admin@example.com' }
});
```

### 2. List active users with pagination

```typescript
const users = await prisma.user.findMany({
  where: { status: 'active' },
  orderBy: { created_at: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    status: true,
    created_at: true,
    last_login: true
  }
});
```

### 3. Search users by name or email

```typescript
const users = await prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { name: { contains: searchTerm, mode: 'insensitive' } }
    ],
    status: { not: 'deleted' }
  }
});
```

### 4. Get user with all series permissions

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    series_permissions: {
      include: {
        // series: true  // Include series details (defined in 004)
        granter: {
          select: { id: true, email: true, name: true }
        }
      }
    }
  }
});
```

### 5. Grant series-specific permission

```typescript
const permission = await prisma.seriesPermission.create({
  data: {
    user_id: userId,
    series_id: seriesId,
    permission_level: 'editor',
    granted_by: adminId
  }
});

// Log the action
await prisma.activityLog.create({
  data: {
    admin_id: adminId,
    action: 'grant_permission',
    target_entity_type: 'series_permission',
    target_entity_id: permission.id,
    changes: {
      series_id: seriesId,
      user_id: userId,
      permission_level: 'editor'
    }
  }
});
```

### 6. Change user role (with audit logging)

```typescript
// Transaction ensures atomic update + log creation
const result = await prisma.$transaction(async (tx) => {
  // Get current role before update
  const currentUser = await tx.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Update role
  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: { role: newRole }
  });

  // Create audit log
  await tx.activityLog.create({
    data: {
      admin_id: adminId,
      action: 'change_role',
      target_entity_type: 'user',
      target_entity_id: userId,
      changes: {
        role: {
          before: currentUser.role,
          after: newRole
        }
      }
    }
  });

  return updatedUser;
});
```

### 7. Soft-delete user

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Update status to deleted
  const deletedUser = await tx.user.update({
    where: { id: userId },
    data: { status: 'deleted' }
  });

  // Log the deletion
  await tx.activityLog.create({
    data: {
      admin_id: adminId,
      action: 'delete_user',
      target_entity_type: 'user',
      target_entity_id: userId,
      changes: {
        status: {
          before: 'active',
          after: 'deleted'
        }
      }
    }
  });

  return deletedUser;
});
```

### 8. View activity log with admin details

```typescript
const logs = await prisma.activityLog.findMany({
  where: {
    timestamp: {
      gte: startDate,
      lte: endDate
    }
  },
  include: {
    admin: {
      select: { id: true, email: true, name: true }
    }
  },
  orderBy: { timestamp: 'desc' },
  take: 100
});
```

### 9. Count active admins (for last-admin check)

```typescript
const adminCount = await prisma.user.count({
  where: {
    role: 'admin',
    status: 'active',
    id: { not: userId }  // Exclude current user
  }
});

const canRemoveAdmin = adminCount > 0;
```

### 10. Revoke series permission

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Get permission details before deletion
  const permission = await tx.seriesPermission.findUnique({
    where: {
      unique_user_series_permission: {
        user_id: userId,
        series_id: seriesId
      }
    }
  });

  if (!permission) {
    throw new Error('Permission not found');
  }

  // Delete permission
  await tx.seriesPermission.delete({
    where: { id: permission.id }
  });

  // Log the revocation
  await tx.activityLog.create({
    data: {
      admin_id: adminId,
      action: 'revoke_permission',
      target_entity_type: 'series_permission',
      target_entity_id: permission.id,
      changes: {
        series_id: seriesId,
        user_id: userId,
        permission_level: permission.permission_level,
        revoked: true
      }
    }
  });
});
```

## Migration Strategy

### Initial Migration

```bash
# Generate migration from Prisma schema
npx prisma migrate dev --name init_admin_user_management

# This creates:
# - users table
# - series_permissions table
# - activity_logs table
# - All indexes and constraints
```

### Seed Data (Development)

```typescript
// backend/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create initial admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@snrl.example' },
    update: {},
    create: {
      email: 'admin@snrl.example',
      password_hash: adminPasswordHash,
      name: 'System Administrator',
      role: 'admin',
      status: 'active'
    }
  });

  console.log('Created admin user:', admin.email);

  // Create test users
  const editorPasswordHash = await bcrypt.hash('editor123', 12);
  const memberPasswordHash = await bcrypt.hash('member123', 12);

  await prisma.user.createMany({
    data: [
      {
        email: 'editor@snrl.example',
        password_hash: editorPasswordHash,
        name: 'Test Editor',
        role: 'editor',
        status: 'active'
      },
      {
        email: 'member@snrl.example',
        password_hash: memberPasswordHash,
        name: 'Test Member',
        role: 'member',
        status: 'active'
      }
    ],
    skipDuplicates: true
  });

  console.log('Seed data created successfully');
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

All indexes are defined in the Prisma schema to optimize common query patterns:

- **User lookups**: email (unique), role, status
- **Permission queries**: user_id, series_id, composite (user_id, series_id)
- **Activity log queries**: admin_id + timestamp, target entity, timestamp alone

### Query Optimization

- Use `select` to fetch only needed fields (avoid selecting password_hash unnecessarily)
- Use pagination with `skip` and `take` for large result sets
- Use transactions for operations requiring multiple related updates (ensures consistency)
- Use `include` sparingly; prefer separate queries for complex nested data

### Expected Performance

With proper indexing and <1000 users:

- User lookup by email: <5ms
- User list with pagination (25 rows): <20ms
- Activity log queries (100 entries): <50ms
- Role updates with logging: <100ms

All well within <200ms p95 constraint.

## Data Integrity

### Referential Integrity

- `SeriesPermission.user_id` → `User.id` (CASCADE on delete)
- `SeriesPermission.granted_by` → `User.id` (RESTRICT on delete, preserve audit trail)
- `ActivityLog.admin_id` → `User.id` (RESTRICT on delete, preserve audit trail)

### Application-Level Constraints

1. Cannot delete or demote last active admin user
2. Cannot grant series permission to user with Admin or Editor base role
3. Password must meet complexity requirements before hashing
4. Email format validation before insertion
5. Activity logs are immutable (no updates/deletes)

## Future Enhancements

Potential schema additions for post-MVP:

1. **UserSession** table for tracking active JWT tokens (enables revocation without blacklist)
2. **PasswordResetToken** table for password reset flow
3. **LoginAttempt** table for tracking failed login attempts (security monitoring)
4. **UserPreference** table for user-specific settings
5. **Team** entity for multi-admin collaboration (if needed)

For MVP, these are deferred per Simplicity First principle.
