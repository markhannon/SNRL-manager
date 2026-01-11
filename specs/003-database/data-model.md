# Data Model: Content and Series Data Management

**Feature**: 003-database
**Date**: 2026-01-10
**Database**: PostgreSQL 15+ with Prisma ORM

## Overview

This data model defines four core entities for content and series management:

1. **ContentSeries**: Collection of related content items (organizational hierarchy)
2. **ContentItem**: Individual content with lifecycle management (draft/published/archived)
3. **ContentVersion**: Immutable version snapshots for complete audit trail
4. **ContentMetadata**: View tracking and analytics for content performance

This schema extends the User and SeriesPermission tables from feature 001-admin-user.

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │ (from 001-admin-user)
├─────────────────┤
│ id (PK)         │◄──────────────┐
│ email           │               │
│ role            │               │
│ ...             │               │
└─────────────────┘               │
         │                        │
         │ 1:*                    │
         ▼                        │
┌─────────────────────┐           │
│   ContentSeries     │           │
├─────────────────────┤           │
│ id (PK)             │           │
│ title               │           │
│ description         │           │
│ created_by (FK)     │───────────┘
│ created_at          │
│ updated_at          │
│ status              │
└─────────────────────┘
         │
         │ 1:*
         ▼
┌─────────────────────┐
│   ContentItem       │◄─────┐
├─────────────────────┤      │
│ id (PK)             │      │
│ series_id (FK)      │──────┘
│ title               │
│ body                │
│ author_id (FK)      │───────┐
│ status              │       │
│ current_version     │       │
│ published_version   │       │
│ created_at          │       │
│ published_at        │       │
│ updated_at          │       │
└─────────────────────┘       │
         │                    │
         │ 1:*                │
         ▼                    │
┌─────────────────────┐       │
│  ContentVersion     │       │
├─────────────────────┤       │
│ id (PK)             │       │
│ content_item_id (FK)│───────┤
│ version_number      │       │
│ title               │       │
│ body                │       │
│ author_id (FK)      │───────┘
│ created_at          │
│ is_current          │
└─────────────────────┘

┌─────────────────────┐
│  ContentMetadata    │
├─────────────────────┤
│ id (PK)             │
│ content_item_id (FK)│───────┐
│ view_count          │       │
│ unique_viewer_count │       │
│ last_viewed_at      │       │
│ created_at          │       │
│ updated_at          │       │
└─────────────────────┘       │
                              │
         ┌────────────────────┘
         ▼
    (ContentItem)
```

## Prisma Schema

```prisma
// backend/prisma/schema.prisma

// NOTE: This extends the schema from 001-admin-user
// User, SeriesPermission, and ActivityLog models are already defined

// ============================================================================
// ContentSeries Entity
// ============================================================================

enum SeriesStatus {
  active   // Series is active and visible
  deleted  // Series soft-deleted (hidden from lists)
}

model ContentSeries {
  id          Int           @id @default(autoincrement())
  title       String        @db.VarChar(200)
  description String?       @db.Text
  created_by  Int           // User ID of creator
  created_at  DateTime      @default(now())
  updated_at  DateTime      @updatedAt
  status      SeriesStatus  @default(active)

  // Relationships
  creator User          @relation("SeriesCreator", fields: [created_by], references: [id], onDelete: Restrict)
  content ContentItem[] @relation("SeriesContent")

  // Indexes
  @@index([title])
  @@index([created_by])
  @@index([status])
  @@index([created_at(sort: Desc)])
  @@map("content_series")
}

// ============================================================================
// ContentItem Entity
// ============================================================================

enum ContentStatus {
  draft      // Editable, not visible to members
  published  // Visible to all users, frozen
  archived   // Hidden from members, visible to editors
}

model ContentItem {
  id                Int           @id @default(autoincrement())
  series_id         Int
  title             String        @db.VarChar(500)
  body              String        @db.Text
  author_id         Int           // User ID of original author
  status            ContentStatus @default(draft)
  current_version   Int           @default(1)
  published_version Int?          // Version number of published version
  created_at        DateTime      @default(now())
  published_at      DateTime?     // When first published (or re-published)
  updated_at        DateTime      @updatedAt

  // Full-text search support
  search_vector     Unsupported("tsvector")?  // PostgreSQL tsvector for full-text search

  // Relationships
  series   ContentSeries     @relation("SeriesContent", fields: [series_id], references: [id], onDelete: Cascade)
  author   User              @relation("ContentAuthor", fields: [author_id], references: [id], onDelete: Restrict)
  versions ContentVersion[]  @relation("ContentVersions")
  metadata ContentMetadata?  @relation("ContentMetadata")

  // Indexes
  @@index([series_id])
  @@index([author_id])
  @@index([status])
  @@index([published_at(sort: Desc)])
  @@index([title])
  @@index([search_vector], type: Gin)
  @@map("content_items")
}

// ============================================================================
// ContentVersion Entity
// ============================================================================

model ContentVersion {
  id              Int      @id @default(autoincrement())
  content_item_id Int
  version_number  Int      // Sequential: 1, 2, 3, ...
  title           String   @db.VarChar(500)
  body            String   @db.Text
  author_id       Int      // User who created this version
  created_at      DateTime @default(now())
  is_current      Boolean  @default(false)

  // Relationships
  content_item ContentItem @relation("ContentVersions", fields: [content_item_id], references: [id], onDelete: Cascade)
  author       User        @relation("VersionAuthor", fields: [author_id], references: [id], onDelete: Restrict)

  // Indexes
  @@unique([content_item_id, version_number], name: "unique_content_version")
  @@index([content_item_id, version_number(sort: Desc)])
  @@index([created_at(sort: Desc)])
  @@index([is_current])
  @@map("content_versions")
}

// ============================================================================
// ContentMetadata Entity
// ============================================================================

model ContentMetadata {
  id                  Int      @id @default(autoincrement())
  content_item_id     Int      @unique
  view_count          Int      @default(0)
  unique_viewer_count Int      @default(0)
  last_viewed_at      DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  // Relationships
  content_item ContentItem @relation("ContentMetadata", fields: [content_item_id], references: [id], onDelete: Cascade)

  // Indexes
  @@index([view_count(sort: Desc)])
  @@index([last_viewed_at(sort: Desc)])
  @@map("content_metadata")
}

// ============================================================================
// Extend User model from 001-admin-user
// ============================================================================

// Add these relationships to the existing User model:
// series_created   ContentSeries[]  @relation("SeriesCreator")
// content_authored ContentItem[]    @relation("ContentAuthor")
// versions_created ContentVersion[] @relation("VersionAuthor")
```

## Entity Details

### ContentSeries Entity

**Purpose**: Organizational container for related content items (collections).

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `title` (String): Series name (e.g., "iRacing Setups", "League Announcements")
- `description` (String, nullable): Series description for members
- `created_by` (Int, FK): User ID of creator (editor or admin)
- `created_at` (DateTime): Timestamp when series was created
- `updated_at` (DateTime): Timestamp of last update (auto-updated by Prisma)
- `status` (SeriesStatus): active or deleted (soft-delete)

**Relationships**:

- `creator`: Many-to-one relationship with User (who created the series)
- `content`: One-to-many relationship with ContentItem (all content in this series)

**Indexes**:

- Index on `title` for search and autocomplete
- Index on `created_by` for filtering series by creator
- Index on `status` for filtering active vs deleted series
- Index on `created_at DESC` for sorting by creation date

**Business Rules**:

1. Series title is required (1-200 characters)
2. Series can be empty (no content items)
3. Deleting series soft-deletes the series and cascades to content items (status='archived')
4. Only Admins and Editors can create series
5. Series permissions from 001-admin-user control who can edit content in the series

### ContentItem Entity

**Purpose**: Individual content with lifecycle management (draft/published/archived).

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `series_id` (Int, FK): Parent series
- `title` (String): Content title (1-500 characters)
- `body` (String): Content body text (Markdown or plain text, 1-100,000 characters)
- `author_id` (Int, FK): Original author (user who created the content)
- `status` (ContentStatus): draft, published, or archived
- `current_version` (Int): Version number of latest version (1, 2, 3, ...)
- `published_version` (Int, nullable): Version number of currently published version
- `created_at` (DateTime): Timestamp when content was created
- `published_at` (DateTime, nullable): Timestamp when content was first/last published
- `updated_at` (DateTime): Timestamp of last update
- `search_vector` (tsvector): PostgreSQL full-text search index (auto-updated via trigger)

**Relationships**:

- `series`: Many-to-one relationship with ContentSeries
- `author`: Many-to-one relationship with User (original author)
- `versions`: One-to-many relationship with ContentVersion (all historical versions)
- `metadata`: One-to-one relationship with ContentMetadata (view tracking)

**Indexes**:

- Index on `series_id` for querying content in a series
- Index on `author_id` for querying content by author
- Index on `status` for filtering by publication status
- Index on `published_at DESC` for sorting by publication date
- Index on `title` for searching by title
- GIN index on `search_vector` for full-text search

**Business Rules**:

1. Content must belong to exactly one series
2. Status workflow: draft → published → archived (bidirectional: archived ↔ published)
3. Editing published content creates new version but doesn't change published_version until explicitly re-published
4. Members only see content with status='published'
5. Editors see all statuses with visual indicators
6. Deleting series cascades to content items (status='archived')
7. Content body limited to 100,000 characters (prevents abuse)

**Status Lifecycle**:

```
  draft ────────► published ────────► archived
                      ▲                   │
                      │                   │
                      └───────────────────┘
```

### ContentVersion Entity

**Purpose**: Immutable version snapshots for complete audit trail and point-in-time restoration.

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `content_item_id` (Int, FK): Parent content item
- `version_number` (Int): Sequential version number (1, 2, 3, ...)
- `title` (String): Snapshot of title at this version
- `body` (String): Snapshot of body at this version
- `author_id` (Int, FK): User who created this version
- `created_at` (DateTime): When this version was saved
- `is_current` (Boolean): True for the current version (only one per content item)

**Relationships**:

- `content_item`: Many-to-one relationship with ContentItem
- `author`: Many-to-one relationship with User (version author)

**Indexes**:

- Unique composite index on `(content_item_id, version_number)` to prevent duplicate versions
- Index on `(content_item_id, version_number DESC)` for version history queries
- Index on `created_at DESC` for chronological ordering
- Index on `is_current` for finding current versions

**Business Rules**:

1. Versions are immutable (once created, never modified)
2. Each content item has exactly one version with is_current=true
3. Version numbers are sequential (1, 2, 3, ...) per content item
4. Restoring old version creates NEW version (doesn't modify old one)
5. Versions are cascade-deleted if content item is permanently deleted

**Versioning Workflow**:

```typescript
// Create new version
async function saveContentVersion(contentId: number, title: string, body: string, authorId: number) {
  return prisma.$transaction(async (tx) => {
    // Get current version number
    const content = await tx.contentItem.findUnique({ where: { id: contentId } });
    const newVersionNumber = content.current_version + 1;

    // Mark all versions as not current
    await tx.contentVersion.updateMany({
      where: { content_item_id: contentId, is_current: true },
      data: { is_current: false }
    });

    // Create new version
    const version = await tx.contentVersion.create({
      data: {
        content_item_id: contentId,
        version_number: newVersionNumber,
        title,
        body,
        author_id: authorId,
        is_current: true
      }
    });

    // Update content item
    await tx.contentItem.update({
      where: { id: contentId },
      data: {
        title,
        body,
        current_version: newVersionNumber,
        updated_at: new Date()
      }
    });

    return version;
  });
}
```

### ContentMetadata Entity

**Purpose**: Track content performance metrics (views, engagement).

**Fields**:

- `id` (Int, PK): Auto-incrementing primary key
- `content_item_id` (Int, FK, unique): Parent content item (one-to-one)
- `view_count` (Int): Total number of views
- `unique_viewer_count` (Int): Number of unique users who viewed (future enhancement)
- `last_viewed_at` (DateTime, nullable): Timestamp of most recent view
- `created_at` (DateTime): When metadata record was created
- `updated_at` (DateTime): Timestamp of last update

**Relationships**:

- `content_item`: One-to-one relationship with ContentItem

**Indexes**:

- Unique index on `content_item_id` (one-to-one constraint)
- Index on `view_count DESC` for sorting by popularity
- Index on `last_viewed_at DESC` for sorting by recency

**Business Rules**:

1. One metadata record per content item (created on first view or content creation)
2. View count increments on each view (deduplicated per session in frontend)
3. Metadata preserved even when content is archived
4. Metadata cascade-deleted if content item is permanently deleted

## Sample Queries

### 1. List all active series with content counts

```typescript
const series = await prisma.contentSeries.findMany({
  where: { status: 'active' },
  include: {
    _count: {
      select: { content: true }
    },
    creator: {
      select: { id: true, email: true, name: true }
    }
  },
  orderBy: { created_at: 'desc' }
});
```

### 2. Get series with all published content

```typescript
const series = await prisma.contentSeries.findUnique({
  where: { id: seriesId },
  include: {
    content: {
      where: { status: 'published' },
      orderBy: { published_at: 'desc' },
      include: {
        author: {
          select: { id: true, name: true }
        },
        metadata: {
          select: { view_count: true }
        }
      }
    }
  }
});
```

### 3. Create content with initial version

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create content item
  const content = await tx.contentItem.create({
    data: {
      series_id: seriesId,
      title: 'My First Article',
      body: 'Article content here...',
      author_id: userId,
      status: 'draft',
      current_version: 1
    }
  });

  // Create initial version
  await tx.contentVersion.create({
    data: {
      content_item_id: content.id,
      version_number: 1,
      title: content.title,
      body: content.body,
      author_id: userId,
      is_current: true
    }
  });

  // Create metadata record
  await tx.contentMetadata.create({
    data: {
      content_item_id: content.id,
      view_count: 0,
      unique_viewer_count: 0
    }
  });

  return content;
});
```

### 4. Publish content (change status to published)

```typescript
const publishedContent = await prisma.contentItem.update({
  where: { id: contentId },
  data: {
    status: 'published',
    published_version: current_version,  // Lock current version as published
    published_at: new Date()
  }
});
```

### 5. Edit published content (creates draft version)

```typescript
const result = await prisma.$transaction(async (tx) => {
  const content = await tx.contentItem.findUnique({ where: { id: contentId } });

  if (content.status === 'published') {
    // Create new draft version (doesn't change published_version)
    const newVersionNumber = content.current_version + 1;

    // Mark current version as not current
    await tx.contentVersion.updateMany({
      where: { content_item_id: contentId, is_current: true },
      data: { is_current: false }
    });

    // Create new version
    await tx.contentVersion.create({
      data: {
        content_item_id: contentId,
        version_number: newVersionNumber,
        title: newTitle,
        body: newBody,
        author_id: editorId,
        is_current: true
      }
    });

    // Update content item (still published, but current_version is newer)
    await tx.contentItem.update({
      where: { id: contentId },
      data: {
        title: newTitle,
        body: newBody,
        current_version: newVersionNumber
      }
    });
  }
});

// Members still see published_version
// Editors see current_version with "draft changes pending" indicator
```

### 6. View version history

```typescript
const versions = await prisma.contentVersion.findMany({
  where: { content_item_id: contentId },
  include: {
    author: {
      select: { id: true, name: true, email: true }
    }
  },
  orderBy: { version_number: 'desc' }
});
```

### 7. Restore old version (creates new version)

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Get old version
  const oldVersion = await tx.contentVersion.findUnique({
    where: {
      unique_content_version: {
        content_item_id: contentId,
        version_number: versionToRestore
      }
    }
  });

  const content = await tx.contentItem.findUnique({ where: { id: contentId } });
  const newVersionNumber = content.current_version + 1;

  // Mark current version as not current
  await tx.contentVersion.updateMany({
    where: { content_item_id: contentId, is_current: true },
    data: { is_current: false }
  });

  // Create new version with old content
  const restoredVersion = await tx.contentVersion.create({
    data: {
      content_item_id: contentId,
      version_number: newVersionNumber,
      title: oldVersion.title,
      body: oldVersion.body,
      author_id: currentUserId,  // Current user is author of restoration
      is_current: true
    }
  });

  // Update content item
  await tx.contentItem.update({
    where: { id: contentId },
    data: {
      title: oldVersion.title,
      body: oldVersion.body,
      current_version: newVersionNumber
    }
  });

  return restoredVersion;
});
```

### 8. Full-text search across content

```typescript
// Raw SQL for PostgreSQL full-text search
const results = await prisma.$queryRaw`
  SELECT
    id, title, series_id, author_id, status, published_at,
    ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
  FROM content_items
  WHERE
    search_vector @@ to_tsquery('english', ${searchQuery})
    AND status = 'published'
  ORDER BY rank DESC, published_at DESC
  LIMIT ${limit}
  OFFSET ${offset}
`;
```

### 9. Increment view count

```typescript
await prisma.contentMetadata.update({
  where: { content_item_id: contentId },
  data: {
    view_count: { increment: 1 },
    last_viewed_at: new Date()
  }
});
```

### 10. Soft-delete series with cascade

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Count content items for warning
  const contentCount = await tx.contentItem.count({
    where: { series_id: seriesId, status: { not: 'archived' } }
  });

  // Soft-delete series
  await tx.contentSeries.update({
    where: { id: seriesId },
    data: { status: 'deleted' }
  });

  // Archive all content in series
  await tx.contentItem.updateMany({
    where: { series_id: seriesId },
    data: { status: 'archived' }
  });

  return { success: true, archivedCount: contentCount };
});
```

### 11. Get series analytics

```typescript
const analytics = await prisma.contentSeries.findUnique({
  where: { id: seriesId },
  include: {
    content: {
      where: { status: 'published' },
      include: {
        metadata: {
          select: { view_count: true }
        }
      }
    }
  }
});

// Calculate totals
const totalContent = analytics.content.length;
const totalViews = analytics.content.reduce((sum, item) =>
  sum + (item.metadata?.view_count || 0), 0
);
const avgViewsPerContent = totalContent > 0 ? totalViews / totalContent : 0;
```

### 12. Check user permission to edit content

```typescript
async function canEditContent(userId: number, contentId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const content = await prisma.contentItem.findUnique({
    where: { id: contentId },
    include: { series: true }
  });

  // Admins can edit anything
  if (user.role === 'admin') return true;

  // Content author can edit their own content
  if (content.author_id === userId) return true;

  // Check series-specific permission
  const permission = await prisma.seriesPermission.findUnique({
    where: {
      unique_user_series_permission: {
        user_id: userId,
        series_id: content.series_id
      }
    }
  });

  return permission !== null;
}
```

## Migration Strategy

### Initial Migration

```bash
# Generate migration from Prisma schema
npx prisma migrate dev --name add_content_management

# This creates:
# - content_series table
# - content_items table with tsvector column
# - content_versions table
# - content_metadata table
# - All indexes and constraints
# - Full-text search trigger
```

### Full-Text Search Trigger (PostgreSQL)

```sql
-- Add tsvector column (included in migration)
ALTER TABLE content_items ADD COLUMN search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX idx_content_items_search_vector ON content_items USING GIN(search_vector);

-- Create trigger to auto-update search_vector
CREATE TRIGGER content_items_search_vector_update
BEFORE INSERT OR UPDATE ON content_items
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, body);
```

### Seed Data (Development)

```typescript
// backend/prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Assume admin user exists from 001-admin-user seed

  const admin = await prisma.user.findUnique({ where: { email: 'admin@snrl.example' } });
  const editor = await prisma.user.findUnique({ where: { email: 'editor@snrl.example' } });

  // Create sample series
  const series1 = await prisma.contentSeries.create({
    data: {
      title: 'iRacing Setups',
      description: 'Car setup guides and telemetry analysis for iRacing',
      created_by: editor.id,
      status: 'active'
    }
  });

  const series2 = await prisma.contentSeries.create({
    data: {
      title: 'League News',
      description: 'Announcements and updates for SNRL championships',
      created_by: admin.id,
      status: 'active'
    }
  });

  // Create sample content with version
  const content1 = await prisma.$transaction(async (tx) => {
    const content = await tx.contentItem.create({
      data: {
        series_id: series1.id,
        title: 'Mazda MX-5 Setup Guide for Laguna Seca',
        body: 'This guide covers optimal setup for the Mazda MX-5 at Laguna Seca...',
        author_id: editor.id,
        status: 'published',
        current_version: 1,
        published_version: 1,
        published_at: new Date()
      }
    });

    await tx.contentVersion.create({
      data: {
        content_item_id: content.id,
        version_number: 1,
        title: content.title,
        body: content.body,
        author_id: editor.id,
        is_current: true
      }
    });

    await tx.contentMetadata.create({
      data: {
        content_item_id: content.id,
        view_count: 42,
        unique_viewer_count: 15
      }
    });

    return content;
  });

  console.log('Seed data created:', {
    series: [series1.title, series2.title],
    content: [content1.title]
  });
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

- **Series lookups**: title, created_by, status, created_at
- **Content queries**: series_id, author_id, status, published_at, title
- **Full-text search**: GIN index on search_vector
- **Version history**: composite (content_item_id, version_number), is_current
- **Analytics**: view_count (DESC), last_viewed_at (DESC)

### Query Optimization

- Use `select` to fetch only needed fields (avoid fetching large body fields unnecessarily)
- Use pagination with `skip` and `take` for large result sets
- Use transactions for operations requiring multiple related updates (ensures consistency)
- Use `include` sparingly; prefer separate queries for complex nested data
- Full-text search with GIN index handles 10k+ documents efficiently (<200ms)

### Expected Performance

With proper indexing and <10,000 content items:

- Series list with pagination (25 rows): <50ms
- Content list for series (50 items): <100ms
- Full-text search (10k items): <200ms
- Version history (10 versions): <20ms
- View count increment: <10ms
- Content creation with version: <100ms
- Series deletion with 100 items: <200ms (transaction)

All well within <200ms p95 constraint.

## Data Integrity

### Referential Integrity

- `ContentSeries.created_by` → `User.id` (RESTRICT on delete, preserve audit trail)
- `ContentItem.series_id` → `ContentSeries.id` (CASCADE on delete)
- `ContentItem.author_id` → `User.id` (RESTRICT on delete, preserve authorship)
- `ContentVersion.content_item_id` → `ContentItem.id` (CASCADE on delete)
- `ContentVersion.author_id` → `User.id` (RESTRICT on delete, preserve audit trail)
- `ContentMetadata.content_item_id` → `ContentItem.id` (CASCADE on delete)

### Application-Level Constraints

1. Content item must belong to exactly one series
2. Version numbers are sequential per content item (no gaps or duplicates)
3. Only one version per content item has is_current=true
4. Versions are immutable (no updates, only inserts)
5. Members only see published content (enforced in queries)
6. Content body limited to 100,000 characters
7. Series title 1-200 characters, content title 1-500 characters

## Future Enhancements

Potential schema additions for post-MVP:

1. **ContentTag** table for categorization and advanced filtering
2. **ContentComment** table for member feedback and discussions
3. **ContentAttachment** table for images, videos, downloadables
4. **ContentReaction** table for likes, favorites, bookmarks
5. **UniqueViewerTracking** table for accurate unique viewer counts
6. **ContentDraft** separate table for draft versions (alternative to published_version approach)

For MVP, these are deferred per Simplicity First principle.
