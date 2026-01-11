# Implementation Plan: Content and Series Data Management

**Branch**: `003-database` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-database/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Content and Series Data Management feature establishes the core content organization and versioning system for the SNRL Manager platform. It provides a comprehensive content management workflow where Editors create and organize content items into series (collections), manage publication status (draft/published/archived), maintain full version history with restore capabilities, and track content performance metrics. Members can browse and consume published content organized by series.

**Technical Approach**: Leverages the established SNRL Manager stack (Node.js 20 LTS, TypeScript, Fastify, Prisma, PostgreSQL, React) to implement a four-entity data model: ContentSeries (collections), ContentItem (individual content with lifecycle management), ContentVersion (immutable version snapshots), and ContentMetadata (view tracking and analytics). The versioning system creates immutable snapshots on every save, enabling complete audit trail and point-in-time restoration. Publication workflow ensures published content remains stable while editors work on draft versions.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.x
**Primary Dependencies**: Fastify 4.x (backend), React 18+ (frontend), Prisma 5.x (ORM), PostgreSQL 15+ (database)
**Storage**: PostgreSQL 15+ with indexed queries on series title, content status, version timestamps, and metadata view counts
**Testing**: Vitest (unit tests), Supertest (API integration tests), Playwright (E2E tests)
**Target Platform**: Web application (Linux/Docker server for backend, modern browsers for frontend)
**Project Type**: Web application (backend + frontend separation)
**Performance Goals**: <1 min series creation (SC-001), <3 min content creation/save (SC-002), <5 sec publication (SC-003), <2 sec search with 10k items (SC-004), <3 clicks to find content (SC-005)
**Constraints**: <200ms p95 API response time, 100 concurrent editors supported (SC-006), 99.9% accurate view tracking (SC-007), zero draft content visible to members (SC-009), no data loss during concurrent editing (SC-010)
**Scale/Scope**: Expected 100-1000 content items initially, full version history for all content, series-specific permissions integration with 001-admin-user, search and filtering across all content

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Modularity** ✅ PASS
- Clear separation between frontend (React), backend (Fastify), and database (Prisma)
- Content management logic isolated in services (series, content, version, metadata)
- Content operations interface only through documented REST API contracts
- No cross-layer violations: frontend interacts via API only, no direct database access
- Shared types between frontend/backend defined via TypeScript interfaces and Prisma schema

**II. Observability** ✅ PASS
- All content operations logged with structured metadata (series/content ID, action, user, timestamp)
- Version history provides complete audit trail for all content changes
- Structured logging via Pino (Fastify built-in) for request/response metadata
- Publication status changes logged with before/after states
- Error conditions logged with sufficient context (content ID, attempted action, reason for failure)
- Performance metrics tracked for content views and editor operations

**III. Simplicity First** ✅ PASS
- Four-table data model (ContentSeries, ContentItem, ContentVersion, ContentMetadata) - no over-engineering
- Version history via immutable append-only table (no complex delta storage or compression)
- Publication workflow via simple status enum (draft/published/archived)
- Direct PostgreSQL queries via Prisma (no premature caching layer)
- View counting via simple increment (no complex analytics infrastructure for MVP)
- Content search via PostgreSQL full-text search (no external search engine for MVP)
- Series permissions leverage existing SeriesPermission table from 001-admin-user (no duplication)

## Project Structure

### Documentation (this feature)

```text
specs/003-database/
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
│   │   ├── contentSeries.ts      # ContentSeries entity with metadata
│   │   ├── contentItem.ts        # ContentItem entity with status lifecycle
│   │   ├── contentVersion.ts     # ContentVersion immutable snapshot
│   │   └── contentMetadata.ts    # View tracking and analytics
│   ├── services/
│   │   ├── series.service.ts     # Series CRUD, content count, soft-delete
│   │   ├── content.service.ts    # Content CRUD, version management, status workflow
│   │   ├── version.service.ts    # Version history, restore, comparison
│   │   ├── metadata.service.ts   # View tracking, analytics queries
│   │   └── search.service.ts     # Content search and filtering
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT verification (from 001-admin-user)
│   │   └── authorization.middleware.ts  # Role + series permission checks
│   ├── api/
│   │   ├── series.routes.ts      # GET/POST/PUT/DELETE /api/series
│   │   ├── content.routes.ts     # Content CRUD, publish/archive endpoints
│   │   ├── versions.routes.ts    # Version history, restore endpoints
│   │   └── metadata.routes.ts    # Analytics and view tracking endpoints
│   └── utils/
│       └── validation.ts         # Content validation (title length, body size limits)
├── tests/
│   ├── unit/
│   │   ├── services/             # Service layer unit tests
│   │   └── utils/                # Utility function tests
│   └── integration/
│       └── api/                  # API endpoint integration tests
└── prisma/
    ├── schema.prisma             # Database schema (ContentSeries, ContentItem, ContentVersion, ContentMetadata)
    └── migrations/               # Database migration files

frontend/
├── src/
│   ├── components/
│   │   ├── series/
│   │   │   ├── SeriesList.tsx        # Series browsing table
│   │   │   ├── SeriesForm.tsx        # Create/edit series form
│   │   │   └── SeriesCard.tsx        # Series display with content count
│   │   ├── content/
│   │   │   ├── ContentList.tsx       # Content browsing with filters
│   │   │   ├── ContentEditor.tsx     # Rich text content editor
│   │   │   ├── ContentViewer.tsx     # Read-only content display
│   │   │   ├── StatusBadge.tsx       # Visual status indicators
│   │   │   └── PublishControls.tsx   # Publish/archive buttons
│   │   ├── versions/
│   │   │   ├── VersionHistory.tsx    # Version timeline view
│   │   │   ├── VersionCompare.tsx    # Side-by-side diff view (optional)
│   │   │   └── RestoreButton.tsx     # Version restoration UI
│   │   └── metadata/
│   │       └── AnalyticsDashboard.tsx  # Content performance metrics
│   ├── pages/
│   │   ├── editor/
│   │   │   ├── SeriesPage.tsx        # Series management page
│   │   │   ├── ContentEditPage.tsx   # Content creation/editing page
│   │   │   └── AnalyticsPage.tsx     # Content analytics page
│   │   └── member/
│   │       ├── BrowsePage.tsx        # Series browsing page
│   │       └── ContentViewPage.tsx   # Content reading page
│   ├── services/
│   │   ├── series.service.ts     # Frontend series API calls
│   │   ├── content.service.ts    # Frontend content API calls
│   │   └── version.service.ts    # Frontend version API calls
│   └── hooks/
│       ├── useSeries.ts          # Series data fetching hook
│       ├── useContent.ts         # Content data fetching hook
│       └── useVersions.ts        # Version history hook
└── tests/
    ├── unit/
    │   └── components/           # Component unit tests
    └── e2e/
        ├── editor/               # Editor workflow E2E tests
        └── member/               # Member browsing E2E tests
```

**Structure Decision**: This feature uses the web application structure (Option 2) established by feature 004-simracing-series and 001-admin-user. The backend follows Fastify's modular plugin architecture with clear separation between models (Prisma entities), services (business logic), middleware (auth/authz), and API routes (HTTP layer). The frontend uses React with a page-based routing structure organized by user role (editor/member) and component-level organization by feature (series/content/versions/metadata). Both backend and frontend maintain their own test directories following the testing hierarchy. The Prisma schema is defined in `backend/prisma/schema.prisma` for type-safe database access across the backend, extending the User and SeriesPermission tables from 001-admin-user.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**NO VIOLATIONS** - All design decisions align with constitutional principles. No complexity justifications required.

---

## Phase 0: Technical Research (Complete)

**Date**: 2026-01-10
**Artifact**: [research.md](./research.md)

**Summary**:

Completed technical research establishing that Content and Series Data Management will leverage the existing SNRL Manager technology stack defined in feature 004-simracing-series and extended by 001-admin-user (Node.js 20 LTS, TypeScript, Fastify, Prisma, PostgreSQL, React). Key technical decisions:

- **Data Model**: Four-entity design - ContentSeries (collections), ContentItem (lifecycle management), ContentVersion (immutable snapshots), ContentMetadata (view tracking)
- **Versioning**: Immutable append-only version snapshots with full audit trail (no delta storage)
- **Publication Workflow**: Status-based lifecycle (draft → published → archived) with separate published_version tracking
- **Search**: PostgreSQL full-text search with GIN index (no external search engine for MVP)
- **View Tracking**: Simple counter increment with frontend session deduplication
- **Authorization**: Leverage User and SeriesPermission tables from 001-admin-user for series-level permissions
- **Cascade Deletion**: Soft-delete for series with cascade to content items (preserves data for audit)

All success criteria validated as achievable:
- SC-001 (series creation <1 min): Simple form + API <200ms ✓
- SC-002 (content creation <3 min): Form + versioning + API <500ms ✓
- SC-003 (publication <5 sec): Status update <100ms ✓
- SC-004 (search <2 sec for 10k items): PostgreSQL FTS with GIN index <200ms ✓
- SC-005 (find content <3 clicks): Browse → Series → Content ✓
- SC-006 (100 concurrent editors): Fastify + PostgreSQL connection pooling ✓

**Outcome**: No open questions. All technical decisions align with project stack and constitutional principles. Ready for Phase 1 design.

---

## Phase 1: Design Artifacts (Complete)

**Date**: 2026-01-10
**Artifacts**: [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [quickstart.md](./quickstart.md)

### Data Model

**Artifact**: [data-model.md](./data-model.md)

Complete Prisma schema defining four core entities:

1. **ContentSeries**: Collection container with title, description, creator, status (active/deleted)
   - Indexes: title, created_by, status, created_at
   - Relationships: created_by → User, has many ContentItem (cascade delete)

2. **ContentItem**: Individual content with lifecycle management
   - Fields: series_id, title, body, author_id, status (draft/published/archived), current_version, published_version, timestamps, search_vector
   - Indexes: series_id, author_id, status, published_at, title, search_vector (GIN)
   - Relationships: series_id → ContentSeries, author_id → User, has many ContentVersion, has one ContentMetadata

3. **ContentVersion**: Immutable version snapshots
   - Fields: content_item_id, version_number (sequential), title, body, author_id, created_at, is_current
   - Indexes: unique (content_item_id, version_number), created_at, is_current
   - Relationships: content_item_id → ContentItem, author_id → User
   - Business Rule: Versions are immutable (only INSERT, never UPDATE)

4. **ContentMetadata**: View tracking and analytics
   - Fields: content_item_id (unique), view_count, unique_viewer_count, last_viewed_at
   - Indexes: unique (content_item_id), view_count (DESC)
   - Relationships: content_item_id → ContentItem (one-to-one)

**Key Features**:
- Transaction support for atomic version creation + content update
- Immutable version history (append-only)
- Separate published_version tracking for stable published content while editors work on drafts
- Full-text search via PostgreSQL tsvector with auto-update trigger
- Strategic indexes for <200ms query performance
- Sample queries for all CRUD and versioning operations

### API Contracts

**Artifact**: [contracts/openapi.yaml](./contracts/openapi.yaml)

Complete OpenAPI 3.0 specification with 19 endpoints covering all functional requirements:

**Series Management** (5 endpoints):
- GET /api/series - List with pagination, search
- POST /api/series - Create series
- GET /api/series/:id - Detail view with content list
- PUT /api/series/:id - Update title/description
- DELETE /api/series/:id - Soft-delete with cascade warning
- GET /api/series/:id/analytics - Series-level analytics

**Content Management** (7 endpoints):
- GET /api/series/:seriesId/content - List content in series
- POST /api/series/:seriesId/content - Create with initial version
- GET /api/content/:id - Detail view (published version for Members, current version for Editors)
- PUT /api/content/:id - Update (creates new version)
- DELETE /api/content/:id - Soft-delete (archive)
- POST /api/content/:id/publish - Publish draft content
- POST /api/content/:id/archive - Archive published content

**Version Management** (3 endpoints):
- GET /api/content/:id/versions - List all versions
- GET /api/content/:id/versions/:versionNumber - Get specific version
- POST /api/content/:id/versions/:versionNumber/restore - Restore old version (creates new version)

**Metadata & Analytics** (2 endpoints):
- POST /api/content/:id/view - Record view (increment counter)
- GET /api/content/:id/metadata - Get view count and analytics

**Search** (1 endpoint):
- GET /api/content/search - Full-text search with filters (series, author, status, date range)

**Features**:
- Request/response schemas for all endpoints
- Error responses with examples
- Security definitions (cookieAuth from 001-admin-user)
- Pagination metadata
- Business rule documentation (draft content invisible to Members, version immutability, cascade deletion)

### Quickstart Guide

**Artifact**: [quickstart.md](./quickstart.md)

Comprehensive development guide covering:

- **Setup**: Prerequisites, database creation, migrations, seeding
- **API Testing**: cURL examples for all 19 endpoints demonstrating complete content workflow:
  - Series creation and management
  - Content creation with versioning
  - Publication workflow (draft → publish → edit → re-publish)
  - Version history viewing and restoration
  - View tracking and analytics
  - Search and filtering
  - Cascade deletion
- **Running Tests**: Unit, integration, E2E test commands
- **Database Management**: Prisma Studio, migrations, resets, full-text search trigger setup
- **Debugging**: Backend/frontend debugging, query inspection, version history inspection, logs
- **Troubleshooting**: Common issues (connection errors, migration failures, FTS setup, version conflicts, draft leakage)
- **Performance**: Query monitoring, response time tracking
- **Security**: Pre-deployment checklist

**Outcome**: Development team can set up local environment, understand complete content lifecycle, and begin implementation immediately.

---

## Next Steps

### Phase 2: Task Generation (Not Done - Use /speckit.tasks)

Run `/speckit.tasks` command to generate actionable, dependency-ordered tasks in `tasks.md`.

Expected task phases:
1. **Phase 0**: Database schema and migrations (ContentSeries, ContentItem, ContentVersion, ContentMetadata tables + indexes + FTS trigger)
2. **Phase 1**: Series service and API endpoints (CRUD + analytics)
3. **Phase 2**: Content service and API endpoints (CRUD + lifecycle)
4. **Phase 3**: Version management service and API (history, restore)
5. **Phase 4**: Metadata service and API (view tracking, analytics)
6. **Phase 5**: Search service and API (full-text search + filtering)
7. **Phase 6**: Frontend components and pages (series management, content editor, version history, member browsing)
8. **Phase 7**: Integration and E2E tests

### Phase 3: Implementation (Use /speckit.implement)

After task generation, run `/speckit.implement` command to execute tasks incrementally with testing at each phase.

### Phase 4: GitHub Issues (Optional - Use /speckit.taskstoissues)

Convert tasks to GitHub issues for team collaboration and tracking.

---

## Constitutional Re-Check (Post-Design)

**I. Modularity** ✅ PASS
- Data model clearly separates ContentSeries, ContentItem, ContentVersion, ContentMetadata concerns
- API contracts define explicit boundaries between series, content, versioning, metadata, and search operations
- Prisma ORM provides type-safe database layer isolation
- No cross-layer violations in design (frontend → API → services → database)
- Version management isolated in separate service (version.service.ts)

**II. Observability** ✅ PASS
- ContentVersion entity provides complete audit trail for all content changes (who, when, what)
- OpenAPI spec documents all 19 endpoints with request/response schemas
- Quickstart includes debugging, logging, version inspection, and performance monitoring sections
- Structured error responses with actionable messages
- View tracking provides content performance visibility
- Series analytics provide content discovery insights

**III. Simplicity First** ✅ PASS
- Four-table data model (no over-engineered content hierarchy or complex relationships)
- Immutable versioning via append-only table (no delta compression or complex diffing)
- Publication workflow via simple status enum (no state machine or workflow engine)
- PostgreSQL full-text search (no Elasticsearch or external search service)
- View counting via simple increment (no complex analytics infrastructure)
- Direct Prisma queries (no caching layer, no ORM abstraction layer)
- Leverages existing User and SeriesPermission tables (no duplication)

**Final Verdict**: All design artifacts align with constitutional principles. Ready for implementation.
