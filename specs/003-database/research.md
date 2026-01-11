# Technical Research: Content and Series Data Management

**Feature**: 003-database
**Phase**: Phase 0 - Technical Foundation
**Date**: 2026-01-10

## Executive Summary

The Content and Series Data Management feature will use the same technology stack established for the SNRL Manager project in feature 004-simracing-series and extended by 001-admin-user. This ensures consistency, enables code reuse, and allows seamless integration with the existing authentication and authorization system.

## Technology Stack (Inherited from Project)

**Decision**: Use established SNRL Manager stack

**Rationale**: Content management is a core feature of the same system. Using the same stack enables:

- Shared authentication and authorization logic (JWT, role checks)
- Integration with User and SeriesPermission tables from 001-admin-user
- Consistent API patterns for frontend/backend communication
- Unified database schema and migrations
- Common frontend components and patterns

**Stack Details**:

- **Runtime**: Node.js 20 LTS + TypeScript 5.x
- **Backend**: Fastify 4.x + Prisma ORM
- **Frontend**: React 18+
- **Database**: PostgreSQL 15+
- **Testing**: Vitest, Supertest, Playwright

## Feature-Specific Considerations

### 1. Content Organization Model

**Decision**: Two-level hierarchy - Series (collections) contain Content Items

**Rationale**:

- Clear organizational structure for content
- Aligns with series-specific permissions from 001-admin-user
- Simple one-to-many relationship (Series → ContentItems)
- Enables series-level operations (view all content in series, delete series with cascade)

**Key Entities**:

1. **ContentSeries**
   - Fields: id, title, description, created_by, created_at, updated_at, status (active/deleted)
   - Indexes: index(title), index(created_by), index(status), index(created_at DESC)
   - Relationships: created_by → User.id, has many ContentItem (cascade delete)

2. **ContentItem**
   - Fields: id, series_id, title, body, author_id, status (draft/published/archived), created_at, published_at, updated_at, current_version
   - Indexes: index(series_id), index(author_id), index(status), index(published_at DESC), index(title)
   - Relationships: series_id → ContentSeries.id, author_id → User.id, has many ContentVersion
   - Status workflow: draft → published → archived (bidirectional: archived ↔ published)

3. **ContentVersion**
   - Fields: id, content_item_id, version_number, title, body, author_id, created_at, is_current
   - Indexes: index(content_item_id, version_number), index(created_at DESC), index(is_current)
   - Relationships: content_item_id → ContentItem.id, author_id → User.id
   - Immutable: Once created, version snapshots are never modified

4. **ContentMetadata**
   - Fields: id, content_item_id, view_count, unique_viewer_count, last_viewed_at, created_at, updated_at
   - Indexes: unique(content_item_id), index(view_count DESC)
   - Relationships: content_item_id → ContentItem.id (one-to-one)

### 2. Content Versioning System

**Decision**: Immutable append-only version snapshots

**Rationale**:

- Complete audit trail for all content changes
- Point-in-time restoration capability
- Simple implementation (no delta storage or complex diffing)
- Storage is cheap, integrity is expensive

**Versioning Workflow**:

1. **Create new content**: ContentItem created with status='draft', ContentVersion v1 created with is_current=true
2. **Edit content**: New ContentVersion created with incremented version_number, previous version marked is_current=false
3. **Restore version**: Create new ContentVersion copying old version's content, increment version_number (preserves history)
4. **View history**: Query all ContentVersion records for content_item_id ordered by version_number DESC

**Version Metadata**:

```typescript
interface ContentVersion {
  id: number;
  content_item_id: number;
  version_number: number;  // Auto-incremented: 1, 2, 3, ...
  title: string;           // Snapshot of title at save time
  body: string;            // Snapshot of body at save time
  author_id: number;       // User who created this version
  created_at: Date;        // When this version was saved
  is_current: boolean;     // Only one version has is_current=true per content item
}
```

**Storage Implications**:

- Average content size: ~5KB (title + body)
- 10 versions per content item: 50KB
- 1000 content items with 10 versions each: 50MB
- Acceptable storage overhead for complete audit trail

### 3. Publication Workflow

**Decision**: Status-based lifecycle (draft → published → archived) with version separation

**Rationale**:

- Published content remains stable while editors work on drafts
- Clear separation between public-facing content and work-in-progress
- Simple enum-based state machine
- Zero risk of draft content leaking to members (FR-018, SC-009)

**Status Workflow**:

1. **Draft**:
   - Initial state for new content
   - Only visible to Editors/Admins and content author
   - Can be edited freely (each save creates new version)
   - Not visible to Members

2. **Published**:
   - Visible to all authenticated users (Admins, Editors, Members)
   - Content is "frozen" - edits create new draft version
   - Publication date timestamp set (published_at)
   - View counting enabled

3. **Archived**:
   - Hidden from Members (not visible in browsing/search)
   - Visible to Editors/Admins with special "archived" indicator
   - Can be re-published if needed
   - Preserves content history and view counts

**Edit Published Content Workflow**:

When editor edits published content:

1. Check if current status is 'published'
2. If yes, create new version with is_current=true, but DO NOT change ContentItem status
3. ContentItem now has status='published' but current version is newer than published version
4. Editor explicitly calls "Publish" endpoint to promote draft version to published
5. This ensures published content remains unchanged until explicit re-publication

**Implementation**:

```typescript
// Track published version separately
interface ContentItem {
  // ...
  current_version: number;      // Latest version (may be draft)
  published_version: number;    // Last published version (shown to Members)
  status: 'draft' | 'published' | 'archived';
}

// Members see published_version
// Editors see current_version
```

### 4. Content Search and Filtering

**Decision**: PostgreSQL full-text search for MVP

**Rationale**:

- Simplicity First: no external dependencies (Elasticsearch, Algolia)
- PostgreSQL full-text search handles 10k items with <2s response (SC-004)
- Can upgrade to dedicated search engine later if needed
- Reduces operational complexity (no additional service to maintain)

**Search Implementation**:

```sql
-- Add tsvector column for full-text search
ALTER TABLE content_items ADD COLUMN search_vector tsvector;

-- Create GIN index for fast text search
CREATE INDEX idx_content_items_search ON content_items USING GIN(search_vector);

-- Auto-update search_vector on insert/update
CREATE TRIGGER content_items_search_vector_update
BEFORE INSERT OR UPDATE ON content_items
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, body);

-- Search query
SELECT * FROM content_items
WHERE search_vector @@ to_tsquery('english', 'simracing & setup')
ORDER BY ts_rank(search_vector, to_tsquery('english', 'simracing & setup')) DESC;
```

**Filtering**:

- Filter by series: `WHERE series_id = ?`
- Filter by author: `WHERE author_id = ?`
- Filter by date range: `WHERE published_at BETWEEN ? AND ?`
- Filter by status: `WHERE status = ?` (Editors only)
- Combine filters with search: `WHERE search_vector @@ ? AND series_id = ?`

**Performance**:

- Full-text search with GIN index: <100ms for 10k documents
- Combined search + filters: <200ms
- Well within SC-004 requirement (<2 sec)

### 5. View Tracking

**Decision**: Simple counter increment in ContentMetadata table

**Rationale**:

- Meets SC-007 requirement (99.9% accuracy)
- No complex analytics infrastructure needed for MVP
- Deduplicate views per session via frontend (store viewed content IDs in session)
- Can add sophisticated analytics later (time on page, scroll depth, etc.)

**View Tracking Implementation**:

```typescript
// Backend endpoint: POST /api/content/:id/view
async function trackView(contentId: number, userId: number) {
  // Simple increment for MVP
  await prisma.contentMetadata.update({
    where: { content_item_id: contentId },
    data: {
      view_count: { increment: 1 },
      last_viewed_at: new Date()
    }
  });

  // Future: Track unique viewers
  // Check if user has viewed this content before
  // If not, increment unique_viewer_count
}
```

**Frontend Deduplication**:

```typescript
// Track viewed content in session storage
const viewedContent = new Set(JSON.parse(sessionStorage.getItem('viewedContent') || '[]'));

function recordView(contentId: number) {
  if (!viewedContent.has(contentId)) {
    // Call API to increment view count
    fetch(`/api/content/${contentId}/view`, { method: 'POST' });
    viewedContent.add(contentId);
    sessionStorage.setItem('viewedContent', JSON.stringify([...viewedContent]));
  }
}
```

**Accuracy**:

- Single session/multiple views: Prevented by frontend deduplication
- Multiple devices/same user: Counted as separate views (acceptable for MVP)
- Bots/crawlers: Require authentication to view content (prevents bot inflation)

### 6. Authorization Integration

**Decision**: Leverage User and SeriesPermission tables from 001-admin-user

**Rationale**:

- No duplication of permission logic
- Consistent authorization checks across features
- Series-specific permissions already implemented in 001-admin-user

**Authorization Rules**:

1. **Create Series**:
   - Allowed: Admin, Editor
   - Check: `user.role === 'admin' || user.role === 'editor'`

2. **Edit/Delete Series**:
   - Allowed: Admin, Editor (who created the series OR has permission)
   - Check: `user.role === 'admin' || (user.role === 'editor' && (series.created_by === user.id || hasSeriesPermission(user.id, series.id)))`

3. **Create Content in Series**:
   - Allowed: Admin, Editor (with series permission), Member (with series permission)
   - Check: `user.role === 'admin' || hasSeriesPermission(user.id, series.id)`

4. **Edit Content**:
   - Allowed: Admin, content author, users with series permission
   - Check: `user.role === 'admin' || content.author_id === user.id || hasSeriesPermission(user.id, content.series_id)`

5. **Publish/Archive Content**:
   - Allowed: Admin, Editor (with series permission)
   - Check: `user.role === 'admin' || (user.role === 'editor' && hasSeriesPermission(user.id, content.series_id))`

6. **View Published Content**:
   - Allowed: All authenticated users (Admin, Editor, Member)
   - Check: `isAuthenticated()`

7. **View Draft/Archived Content**:
   - Allowed: Admin, Editor (with series permission), content author
   - Check: `user.role === 'admin' || content.author_id === user.id || hasSeriesPermission(user.id, content.series_id)`

**Permission Check Helper**:

```typescript
async function hasSeriesPermission(userId: number, seriesId: number): Promise<boolean> {
  const permission = await prisma.seriesPermission.findUnique({
    where: {
      user_id_series_id: { user_id: userId, series_id: seriesId }
    }
  });
  return permission !== null;
}
```

### 7. Cascade Deletion

**Decision**: Soft-delete series with cascade to content items

**Rationale**:

- Preserve data for audit and potential recovery (FR-021)
- Soft-delete via status field: `series.status = 'deleted'`
- Cascade behavior: When series is soft-deleted, all content items marked as deleted
- Warning before deletion: Count content items and warn editor (FR-022)

**Deletion Implementation**:

```typescript
async function deleteSeries(seriesId: number): Promise<{ success: boolean; itemCount: number }> {
  // Count content items for warning
  const itemCount = await prisma.contentItem.count({
    where: { series_id: seriesId, status: { not: 'deleted' } }
  });

  // Frontend shows warning: "This series contains {itemCount} content items. Are you sure?"

  // User confirms → proceed with soft-delete in transaction
  await prisma.$transaction([
    // Soft-delete series
    prisma.contentSeries.update({
      where: { id: seriesId },
      data: { status: 'deleted', updated_at: new Date() }
    }),
    // Soft-delete all content in series
    prisma.contentItem.updateMany({
      where: { series_id: seriesId },
      data: { status: 'archived', updated_at: new Date() }
    })
  ]);

  return { success: true, itemCount };
}
```

**Hard Delete** (optional, admin-only):

For compliance/GDPR, provide admin-only endpoint to permanently delete series and all content/versions.

## Performance Validation

**Success Criteria from Spec**:

- **SC-001**: Series creation <1 min → Achievable (simple form + API call <200ms)
- **SC-002**: Content creation/save <3 min → Achievable (form + versioning + API <500ms)
- **SC-003**: Publication <5 sec → Achievable (status update <100ms)
- **SC-004**: Search <2 sec for 10k items → Achievable (PostgreSQL full-text search with GIN index <200ms)
- **SC-005**: Find content <3 clicks → Achievable (Browse series → Select series → View content)
- **SC-006**: 100 concurrent editors → Achievable (Fastify handles 10k+ req/s, database with connection pooling)

**Database Indexes Needed**:

```sql
-- ContentSeries indexes
CREATE INDEX idx_content_series_title ON content_series(title);
CREATE INDEX idx_content_series_created_by ON content_series(created_by);
CREATE INDEX idx_content_series_status ON content_series(status);
CREATE INDEX idx_content_series_created_at ON content_series(created_at DESC);

-- ContentItem indexes
CREATE INDEX idx_content_items_series ON content_items(series_id);
CREATE INDEX idx_content_items_author ON content_items(author_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_published_at ON content_items(published_at DESC);
CREATE INDEX idx_content_items_title ON content_items(title);
CREATE INDEX idx_content_items_search ON content_items USING GIN(search_vector);

-- ContentVersion indexes
CREATE INDEX idx_content_versions_item_version ON content_versions(content_item_id, version_number);
CREATE INDEX idx_content_versions_created_at ON content_versions(created_at DESC);
CREATE INDEX idx_content_versions_current ON content_versions(is_current) WHERE is_current = true;

-- ContentMetadata indexes
CREATE UNIQUE INDEX idx_content_metadata_item ON content_metadata(content_item_id);
CREATE INDEX idx_content_metadata_views ON content_metadata(view_count DESC);
```

**Query Performance Estimates**:

- Series list with pagination (25 rows): <50ms
- Content list for series (50 items): <100ms
- Full-text search (10k items): <200ms
- Version history (10 versions): <20ms
- View count increment: <10ms
- Series deletion with 100 items: <200ms (transaction)

All well within performance goals.

## API Design Patterns

**RESTful Resource-Based Endpoints**:

Following REST conventions consistent with 001-admin-user:

**Series Management**:
- `GET /api/series` - List series (with pagination, search)
- `POST /api/series` - Create new series
- `GET /api/series/:id` - Get series details with content count
- `PUT /api/series/:id` - Update series (title, description)
- `DELETE /api/series/:id` - Soft-delete series (with cascade warning)

**Content Management**:
- `GET /api/series/:seriesId/content` - List content in series
- `POST /api/series/:seriesId/content` - Create new content item
- `GET /api/content/:id` - Get content details (published version for Members, current version for Editors)
- `PUT /api/content/:id` - Update content (creates new version)
- `DELETE /api/content/:id` - Soft-delete content
- `POST /api/content/:id/publish` - Publish draft content
- `POST /api/content/:id/archive` - Archive published content

**Version Management**:
- `GET /api/content/:id/versions` - List all versions for content
- `GET /api/content/:id/versions/:versionNumber` - Get specific version
- `POST /api/content/:id/versions/:versionNumber/restore` - Restore old version (creates new version)

**Metadata & Analytics**:
- `POST /api/content/:id/view` - Increment view count
- `GET /api/content/:id/metadata` - Get view count and analytics
- `GET /api/series/:id/analytics` - Get series-level analytics

**Search**:
- `GET /api/content/search?q=query&series=id&author=id&dateFrom=date&dateTo=date` - Search and filter content

**Request/Response Format**:

All endpoints use JSON. Fastify schema validation ensures type safety.

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

- **Route level**: Fastify middleware checks authentication + base role
- **Service level**: Business logic checks series-specific permissions
- **Database level**: Queries filter by status (Members only see published)

### 2. Content Validation

**Input Validation**:

- Series title: 1-200 characters, required
- Series description: 0-2000 characters, optional
- Content title: 1-500 characters, required
- Content body: 1-100,000 characters, required
- Status enum: only draft/published/archived allowed
- SQL injection prevention via Prisma parameterized queries

**Size Limits**:

- Content body: 100KB max (prevents abuse)
- Total versions per content: No limit (storage is cheap)

### 3. Draft Content Leakage Prevention

**Critical**: Members must never see draft or archived content (FR-018, SC-009)

**Implementation**:

```typescript
// Service layer helper
function getContentForUser(contentId: number, user: User) {
  const content = await prisma.contentItem.findUnique({ where: { id: contentId } });

  // Members only see published content
  if (user.role === 'member' && content.status !== 'published') {
    throw new ForbiddenError('Content not available');
  }

  // Editors/Admins see all statuses (with indicator)
  return content;
}

// Query filtering for lists
function getContentListQuery(user: User, seriesId?: number) {
  const baseQuery = {
    where: {
      series_id: seriesId,
      // Members: only published content
      ...(user.role === 'member' ? { status: 'published' } : {})
    }
  };
  return baseQuery;
}
```

### 4. Version Integrity

**Critical**: Versions are immutable - once created, never modified

**Implementation**:

- No UPDATE operations on content_versions table (only INSERT)
- Database constraint: `is_current` can only be true for one version per content_item
- Restore operation creates NEW version (doesn't modify old one)

### 5. Concurrent Editing

**Challenge**: Two editors editing same content simultaneously

**Solution for MVP**: Last write wins (simple, acceptable for small teams)

**Future Enhancement**: Optimistic locking with version number

```typescript
// Update content with version check
async function updateContent(contentId: number, expectedVersion: number, newData: any) {
  const content = await prisma.contentItem.findUnique({ where: { id: contentId } });

  if (content.current_version !== expectedVersion) {
    throw new ConflictError('Content has been modified by another user. Please refresh and try again.');
  }

  // Proceed with update + new version creation
}
```

## Open Questions

**None** - all technical decisions align with established project stack and spec requirements.

## Recommendations Summary

1. Use project-wide tech stack (Node.js 20, TypeScript, Fastify, Prisma, React, PostgreSQL)
2. Four-entity data model: ContentSeries, ContentItem, ContentVersion, ContentMetadata
3. Immutable append-only versioning for complete audit trail
4. Status-based publication workflow (draft/published/archived)
5. PostgreSQL full-text search for content discovery (MVP - can upgrade later)
6. Simple view counting with frontend deduplication
7. Leverage User and SeriesPermission tables from 001-admin-user
8. Soft-delete with cascade for series deletion
9. Strategic indexes on series title, content status, published date, search vector
10. Defense-in-depth authorization checks at route and service layers

## Next Steps

Proceed to Phase 1 design artifacts:

1. **data-model.md**: Complete Prisma schema for ContentSeries, ContentItem, ContentVersion, ContentMetadata entities
2. **contracts/openapi.yaml**: Full API specification for all endpoints (series CRUD, content CRUD, versioning, search)
3. **quickstart.md**: Development setup and testing guide
