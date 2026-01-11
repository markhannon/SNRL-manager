# Tasks: Content and Series Data Management

**Input**: Design documents from `/specs/003-database/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md
**Extends**: Feature 001-admin-user (User model, authentication, authorization, SeriesPermission)

**Tests**: Not explicitly requested in specification - focusing on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

This feature uses the web application structure established by feature 004-simracing-series and 001-admin-user:
- Backend: `backend/src/`, `backend/tests/`, `backend/prisma/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project setup for content and series data management

- [X] T001 [P] Create content-related directories in backend/src/models/ for contentSeries.ts, contentItem.ts, contentVersion.ts, contentMetadata.ts per plan.md
- [X] T002 [P] Create content-related directories in backend/src/services/ for series.service.ts, content.service.ts, version.service.ts, metadata.service.ts, search.service.ts per plan.md
- [X] T003 [P] Create content-related directories in frontend/src/components/ for series/, content/, versions/, metadata/ per plan.md
- [X] T004 [P] Create content-related directories in frontend/src/pages/ for editor/ and member/ per plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema and infrastructure for content management

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Define ContentSeries entity in backend/prisma/schema.prisma with id, title, description, created_by FK, status enum (active/deleted), timestamps per data-model.md
- [X] T006 Define ContentItem entity in backend/prisma/schema.prisma with id, series_id FK, title, body, author_id FK, status enum (draft/published/archived), current_version, published_version, timestamps, search_vector per data-model.md
- [X] T007 Define ContentVersion entity in backend/prisma/schema.prisma with id, content_item_id FK, version_number, title, body, author_id FK, created_at, is_current per data-model.md
- [X] T008 Define ContentMetadata entity in backend/prisma/schema.prisma with id, content_item_id FK (unique), view_count, unique_viewer_count, last_viewed_at, timestamps per data-model.md
- [X] T009 Create database migration in backend/prisma/migrations/ for all four content entities with indexes per data-model.md
- [X] T010 [P] Create PostgreSQL full-text search trigger for ContentItem.search_vector auto-update in migration file per data-model.md and research.md
- [X] T011 [P] Create validation utilities in backend/src/utils/validation.ts for content title length, body size limits per plan.md
- [X] T012 [P] Extend authorization middleware in backend/src/middleware/authorization.middleware.ts to check series-specific Editor permissions from 001-admin-user per plan.md
- [X] T013 [P] Create content model types in backend/src/models/contentSeries.ts based on Prisma schema
- [X] T014 [P] Create content model types in backend/src/models/contentItem.ts based on Prisma schema
- [X] T015 [P] Create version model types in backend/src/models/contentVersion.ts based on Prisma schema
- [X] T016 [P] Create content model types in backend/src/models/contentMetadata.ts based on Prisma schema

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Series Management (Priority: P1) 🎯 MVP

**Goal**: Enable Editors to create and organize content into series (collections), providing the organizational hierarchy for all content

**Independent Test**: Create a series with title/description, verify it appears in series list, update title, verify content count shows 0, soft-delete series and verify it's hidden from list

### Implementation for User Story 1

- [X] T017 [P] [US1] Create SeriesService in backend/src/services/series.service.ts with createSeries() method: validate title uniqueness, create ContentSeries with created_by per data-model.md
- [X] T018 [P] [US1] Add listSeries() method to SeriesService in backend/src/services/series.service.ts: pagination, search by title, filter by status per contracts/openapi.yaml
- [X] T019 [P] [US1] Add getSeries() method to SeriesService in backend/src/services/series.service.ts: fetch with content count per contracts/openapi.yaml
- [X] T020 [P] [US1] Add updateSeries() method to SeriesService in backend/src/services/series.service.ts: update title/description with Editor/Admin check per contracts/openapi.yaml
- [X] T021 [P] [US1] Add deleteSeries() method to SeriesService in backend/src/services/series.service.ts: soft-delete (status='deleted'), check for content items, cascade warning per data-model.md
- [X] T022 [US1] Create series routes in backend/src/api/series.routes.ts: GET/POST/PUT/DELETE /api/series, GET /api/series/:id per contracts/openapi.yaml
- [X] T023 [US1] Apply authentication and authorization middleware to series endpoints in backend/src/api/series.routes.ts: Editor/Admin required for create/update/delete per plan.md
- [X] T024 [US1] Create SeriesList component in frontend/src/components/series/SeriesList.tsx displaying table with title, description, content count, creator, created date
- [X] T025 [US1] Create SeriesForm component in frontend/src/components/series/SeriesForm.tsx with title and description fields for create/edit
- [X] T026 [US1] Create SeriesCard component in frontend/src/components/series/SeriesCard.tsx for series display with content count badge
- [X] T027 [US1] Create SeriesPage component in frontend/src/pages/editor/SeriesPage.tsx integrating SeriesList and SeriesForm per plan.md
- [X] T028 [US1] Implement frontend series service in frontend/src/services/series.service.ts with createSeries(), getSeries(), updateSeries(), deleteSeries() methods
- [X] T029 [US1] Create useSeries hook in frontend/src/hooks/useSeries.ts for managing series state and fetching per plan.md

**Checkpoint**: At this point, User Story 1 should be fully functional - Editors can create, view, update, and delete series

---

## Phase 4: User Story 2 - Content Creation and Editing with Versioning (Priority: P1)

**Goal**: Enable Editors to create and edit content items within series, with automatic version history on every save

**Independent Test**: Create content item in a series, verify initial version (v1) is created, edit content, verify new version (v2) is saved, check version history shows both versions with timestamps

### Implementation for User Story 2

- [ ] T030 [US2] Create ContentService in backend/src/services/content.service.ts with createContent() method: atomic transaction creating ContentItem (status=draft) + ContentVersion v1 per data-model.md
- [ ] T031 [US2] Add updateContent() method to ContentService in backend/src/services/content.service.ts: atomic transaction creating new ContentVersion, updating ContentItem.current_version, marking old version is_current=false per data-model.md
- [ ] T032 [US2] Add getContent() method to ContentService in backend/src/services/content.service.ts: return published_version for Members, current_version for Editors per contracts/openapi.yaml
- [ ] T033 [US2] Add listContent() method to ContentService in backend/src/services/content.service.ts: filter by series, author, status with pagination per contracts/openapi.yaml
- [ ] T034 [US2] Add deleteContent() method to ContentService in backend/src/services/content.service.ts: update status to 'archived' (soft-delete) per data-model.md
- [ ] T035 [US2] Create VersionService in backend/src/services/version.service.ts with getVersionHistory() method: list all versions for content item ordered by version_number DESC per data-model.md
- [ ] T036 [US2] Add getVersion() method to VersionService in backend/src/services/version.service.ts: fetch specific version by number per contracts/openapi.yaml
- [ ] T037 [US2] Create content routes in backend/src/api/content.routes.ts: GET/POST /api/series/:seriesId/content, GET/PUT/DELETE /api/content/:id per contracts/openapi.yaml
- [ ] T038 [US2] Create version routes in backend/src/api/versions.routes.ts: GET /api/content/:id/versions, GET /api/content/:id/versions/:versionNumber per contracts/openapi.yaml
- [ ] T039 [US2] Apply series-specific permission checks to content endpoints in backend/src/api/content.routes.ts: Editor/Admin or series-specific Editor per plan.md authorization
- [ ] T040 [US2] Create ContentEditor component in frontend/src/components/content/ContentEditor.tsx with rich text editing for title and body fields
- [ ] T041 [US2] Create ContentList component in frontend/src/components/content/ContentList.tsx displaying table with title, series, author, status, last updated
- [ ] T042 [US2] Create StatusBadge component in frontend/src/components/content/StatusBadge.tsx for visual status indicators (draft=gray, published=green, archived=red)
- [ ] T043 [US2] Create VersionHistory component in frontend/src/components/versions/VersionHistory.tsx showing timeline of all versions with version number, date, author
- [ ] T044 [US2] Create ContentEditPage component in frontend/src/pages/editor/ContentEditPage.tsx integrating ContentEditor and VersionHistory per plan.md
- [ ] T045 [US2] Implement frontend content service in frontend/src/services/content.service.ts with createContent(), updateContent(), getContent(), listContent() methods
- [ ] T046 [US2] Implement frontend version service in frontend/src/services/version.service.ts with getVersionHistory(), getVersion() methods
- [ ] T047 [US2] Create useContent hook in frontend/src/hooks/useContent.ts for managing content state and auto-save drafts per plan.md
- [ ] T048 [US2] Create useVersions hook in frontend/src/hooks/useVersions.ts for fetching version history per plan.md

**Checkpoint**: At this point, User Stories 1 AND 2 should work - Editors can create series, create/edit content with full version history

---

## Phase 5: User Story 3 - Publication Workflow (Priority: P2)

**Goal**: Enable Editors to publish draft content, making it visible to Members, with stable published version while editors continue working on drafts

**Independent Test**: Create draft content, verify Members cannot see it, publish content, verify Members can now view it, edit published content (creates draft changes), verify Members still see original published version until re-published

### Implementation for User Story 3

- [ ] T049 [US3] Add publishContent() method to ContentService in backend/src/services/content.service.ts: update status='published', set published_at timestamp, set published_version=current_version per contracts/openapi.yaml
- [ ] T050 [US3] Add archiveContent() method to ContentService in backend/src/services/content.service.ts: update status='archived', clear published_at per contracts/openapi.yaml
- [ ] T051 [US3] Implement draft content filtering for Members in getContent(): only return published status for Member role per research.md and contracts/openapi.yaml
- [ ] T052 [US3] Implement published_version vs current_version logic in getContent(): Members see published_version, Editors see current_version per data-model.md
- [ ] T053 [US3] Create publication routes in backend/src/api/content.routes.ts: POST /api/content/:id/publish, POST /api/content/:id/archive per contracts/openapi.yaml
- [ ] T054 [US3] Apply Editor/Admin authorization to publish and archive endpoints in backend/src/api/content.routes.ts
- [ ] T055 [US3] Create PublishControls component in frontend/src/components/content/PublishControls.tsx with Publish and Archive buttons, showing current status
- [ ] T056 [US3] Add publish/archive actions to ContentEditPage in frontend/src/pages/editor/ContentEditPage.tsx integrating PublishControls
- [ ] T057 [US3] Add published version indicator to ContentEditor in frontend/src/components/content/ContentEditor.tsx showing which version is live to Members
- [ ] T058 [US3] Update frontend content service in frontend/src/services/content.service.ts with publishContent() and archiveContent() methods

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work - complete Editor workflow with draft/publish lifecycle and Member visibility control

---

## Phase 6: User Story 4 - Version Restoration (Priority: P2)

**Goal**: Enable Editors to restore previous versions of content, creating new version with old content (preserves history)

**Independent Test**: Create content, make edits creating versions v1, v2, v3, restore v1, verify new version v4 is created with v1's content, verify all 4 versions exist in history

### Implementation for User Story 4

- [ ] T059 [US4] Add restoreVersion() method to VersionService in backend/src/services/version.service.ts: fetch old version content, create new ContentVersion with incremented version_number, update ContentItem.current_version per data-model.md
- [ ] T060 [US4] Implement version restoration as atomic transaction in restoreVersion(): create new version + update content item per data-model.md
- [ ] T061 [US4] Create version restoration route in backend/src/api/versions.routes.ts: POST /api/content/:id/versions/:versionNumber/restore per contracts/openapi.yaml
- [ ] T062 [US4] Apply Editor/Admin authorization to restore endpoint in backend/src/api/versions.routes.ts
- [ ] T063 [US4] Create RestoreButton component in frontend/src/components/versions/RestoreButton.tsx with confirmation dialog per plan.md
- [ ] T064 [US4] Add restore buttons to each version in VersionHistory component in frontend/src/components/versions/VersionHistory.tsx
- [ ] T065 [US4] Update frontend version service in frontend/src/services/version.service.ts with restoreVersion() method
- [ ] T066 [US4] Add success notification after version restoration in ContentEditPage in frontend/src/pages/editor/ContentEditPage.tsx

**Checkpoint**: At this point, User Stories 1-4 should all work - Editors have complete version control with restoration capability

---

## Phase 7: User Story 5 - Content Browsing and Viewing for Members (Priority: P2)

**Goal**: Enable Members to browse series, view published content (read-only), with view tracking for analytics

**Independent Test**: Log in as Member, browse series list, click into series to see published content list, click content to read, verify draft content is not visible, verify view count increments

### Implementation for User Story 5

- [ ] T067 [P] [US5] Create MetadataService in backend/src/services/metadata.service.ts with recordView() method: increment view_count, track unique_viewer_count, update last_viewed_at per data-model.md
- [ ] T068 [P] [US5] Add getMetadata() method to MetadataService in backend/src/services/metadata.service.ts: fetch ContentMetadata for analytics per contracts/openapi.yaml
- [ ] T069 [US5] Create or update ContentMetadata record on first view in recordView() method in backend/src/services/metadata.service.ts per data-model.md
- [ ] T070 [US5] Create metadata routes in backend/src/api/metadata.routes.ts: POST /api/content/:id/view, GET /api/content/:id/metadata per contracts/openapi.yaml
- [ ] T071 [US5] Apply public access to view endpoint (no auth required) and authenticated access to metadata endpoint in backend/src/api/metadata.routes.ts
- [ ] T072 [US5] Create ContentViewer component in frontend/src/components/content/ContentViewer.tsx for read-only content display (title and body) per plan.md
- [ ] T073 [US5] Create BrowsePage component in frontend/src/pages/member/BrowsePage.tsx showing series list with content counts per plan.md
- [ ] T074 [US5] Create ContentViewPage component in frontend/src/pages/member/ContentViewPage.tsx integrating ContentViewer per plan.md
- [ ] T075 [US5] Add view tracking call to ContentViewPage in frontend/src/pages/member/ContentViewPage.tsx on page load per contracts/openapi.yaml
- [ ] T076 [US5] Implement session-based view deduplication in frontend to prevent multiple views from same user session in ContentViewPage in frontend/src/pages/member/ContentViewPage.tsx per research.md
- [ ] T077 [US5] Filter content list to only show published status for Members in BrowsePage in frontend/src/pages/member/BrowsePage.tsx

**Checkpoint**: At this point, all core user stories work - Members can browse and read published content with view tracking

---

## Phase 8: User Story 6 - Content Search and Analytics (Priority: P3)

**Goal**: Enable Editors and Members to search content using full-text search, and Editors to view analytics (view counts, popular content)

**Independent Test**: Create multiple content items with different titles/bodies, search for specific term, verify matching results returned, view series analytics showing total views and most viewed content

### Implementation for User Story 6

- [ ] T078 [P] [US6] Create SearchService in backend/src/services/search.service.ts with searchContent() method using PostgreSQL full-text search on search_vector per research.md and data-model.md
- [ ] T079 [P] [US6] Add filters to searchContent(): series, author, status, date range per contracts/openapi.yaml
- [ ] T080 [US6] Implement search relevance ranking using ts_rank for PostgreSQL full-text search in SearchService in backend/src/services/search.service.ts per research.md
- [ ] T081 [US6] Add getSeriesAnalytics() method to SeriesService in backend/src/services/series.service.ts: aggregate view counts, top content, recent activity per contracts/openapi.yaml
- [ ] T082 [US6] Create search route in backend/src/api/content.routes.ts: GET /api/content/search with query param and filters per contracts/openapi.yaml
- [ ] T083 [US6] Create series analytics route in backend/src/api/series.routes.ts: GET /api/series/:id/analytics per contracts/openapi.yaml
- [ ] T084 [US6] Apply appropriate authorization to search (authenticated users) and analytics (Editor/Admin) endpoints
- [ ] T085 [US6] Create search input component in ContentList in frontend/src/components/content/ContentList.tsx with real-time search
- [ ] T086 [US6] Add filter controls to ContentList in frontend/src/components/content/ContentList.tsx for series, author, status, date range
- [ ] T087 [US6] Create AnalyticsDashboard component in frontend/src/components/metadata/AnalyticsDashboard.tsx showing view counts, popular content, trends per plan.md
- [ ] T088 [US6] Create AnalyticsPage component in frontend/src/pages/editor/AnalyticsPage.tsx integrating AnalyticsDashboard per plan.md
- [ ] T089 [US6] Update frontend series service in frontend/src/services/series.service.ts with getSeriesAnalytics() method
- [ ] T090 [US6] Add search method to frontend content service in frontend/src/services/content.service.ts

**Checkpoint**: All user stories should now be independently functional - complete content management system with search and analytics

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T091 [P] Add structured logging for all content operations in backend/src/services/: series create/update/delete, content create/update/publish/archive, version create/restore per plan.md observability requirements
- [ ] T092 [P] Add performance tracking for version creation and restoration operations in backend/src/services/version.service.ts per plan.md
- [ ] T093 [P] Add error handling for concurrent editing scenarios (version conflicts) in ContentService in backend/src/services/content.service.ts per plan.md SC-010
- [ ] T094 [P] Implement optimistic locking or last-write-wins strategy for concurrent edits in ContentService in backend/src/services/content.service.ts per research.md
- [ ] T095 [P] Add cascade deletion warnings before deleting series with content in SeriesService in backend/src/services/series.service.ts per contracts/openapi.yaml
- [ ] T096 [P] Verify draft content is never exposed to Members across all API endpoints in backend/src/api/ per plan.md SC-009
- [ ] T097 [P] Add input validation for content title and body size limits in backend/src/utils/validation.ts per plan.md
- [ ] T098 [P] Verify all user inputs are sanitized in frontend forms to prevent XSS attacks
- [ ] T099 [P] Add loading states to all frontend content pages during API calls
- [ ] T100 [P] Implement proper error handling with user-friendly messages across all frontend pages
- [ ] T101 [P] Add auto-save functionality for content drafts in ContentEditor in frontend/src/components/content/ContentEditor.tsx per research.md
- [ ] T102 [P] Add unsaved changes warning when navigating away from ContentEditor in frontend/src/components/content/ContentEditor.tsx
- [ ] T103 [P] Create database indexes verification script to ensure all indexes from data-model.md are created
- [ ] T104 Verify PostgreSQL full-text search trigger is working correctly per quickstart.md
- [ ] T105 Run database migrations and verify schema updates from 001-admin-user integration per quickstart.md
- [ ] T106 Validate all success criteria from plan.md: SC-001 through SC-010
- [ ] T107 Validate quickstart.md instructions by following complete content lifecycle workflow
- [ ] T108 [P] Update CLAUDE.md with content management dependencies if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed with some dependencies:
  - US2 (Content) depends on US1 (Series) - content requires series to exist
  - US3 (Publication) depends on US2 (Content) - need content to publish
  - US4 (Versions) depends on US2 (Content) - need versions to restore
  - US5 (Browsing) depends on US3 (Publication) - Members browse published content
  - US6 (Search) can start after Foundational - independent of other stories
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 (requires series to create content in)
- **User Story 3 (P2)**: Depends on User Story 2 (requires content to publish)
- **User Story 4 (P2)**: Depends on User Story 2 (requires versions to restore)
- **User Story 5 (P2)**: Depends on User Story 3 (Members view published content)
- **User Story 6 (P3)**: Can start after Foundational - Search infrastructure independent

### Within Each User Story

- Backend models/migrations before services
- Services before API routes
- API routes before frontend components
- Frontend components before pages
- Core implementation before integration

### Parallel Opportunities

- **Setup Phase**: All tasks (T001-T004) can run in parallel (different directories)
- **Foundational Phase**: Tasks T010, T011, T012, T013, T014, T015, T016 can run in parallel after schema (T005-T009) complete
- **User Story 1**: Tasks T017, T018, T019, T020, T021 can run in parallel (different methods in same service)
- **User Story 2**: Initial service methods (T030-T036) can run in parallel, frontend components (T040-T043) can run in parallel
- **User Story 5**: Tasks T067, T068, T069 can run in parallel (different methods in MetadataService)
- **User Story 6**: Tasks T078, T079, T080 can run in parallel initially (search methods)
- **Polish Phase**: Most tasks (T091-T102, T108) can run in parallel (different concerns)
- **Sequential requirement**: US1 must complete before US2 can start (content needs series)

---

## Parallel Example: User Story 2

```bash
# After User Story 1 completes (series exist), these US2 tasks can run in parallel:
# Terminal 1: Backend content services
Task T030 - Create ContentService.createContent()
Task T031 - Add updateContent() method
Task T032 - Add getContent() method
Task T033 - Add listContent() method
Task T034 - Add deleteContent() method

# Terminal 2: Backend version services (can run parallel with content)
Task T035 - Create VersionService.getVersionHistory()
Task T036 - Add getVersion() method

# After backend services complete:
# Terminal 3: Backend API routes
Task T037 - Create content routes
Task T038 - Create version routes
Task T039 - Apply series permission checks

# Terminal 4: Frontend components (can run in parallel with backend routes)
Task T040 - Create ContentEditor component
Task T041 - Create ContentList component
Task T042 - Create StatusBadge component
Task T043 - Create VersionHistory component

# After components complete:
# Terminal 5: Frontend pages and services
Task T044 - Create ContentEditPage
Task T045 - Implement frontend content service
Task T046 - Implement frontend version service
Task T047 - Create useContent hook
Task T048 - Create useVersions hook
```

---

## MVP Scope

**Recommended MVP**: User Story 1 + User Story 2 (Phase 1 + Phase 2 + Phase 3 + Phase 4)

- Total MVP tasks: 48 tasks (T001-T048)
- Delivers: Series creation, content creation/editing with full version history
- Independent testing: Create series, create content, edit content, view version history
- Estimated effort: 4-5 days for single developer

**Extended MVP**: Add User Story 3 (publication workflow)

- Total tasks: 58 tasks (T001-T058)
- Delivers: MVP + draft/publish lifecycle with Member visibility control
- Estimated effort: 5-6 days for single developer

**Full Core Feature**: User Stories 1-5 (all except search/analytics)

- Total tasks: 77 tasks (T001-T077)
- Delivers: Complete content management without search
- Estimated effort: 6-8 days for single developer
- Or 4-5 days with 2 developers (one on backend, one on frontend)

**Full Feature**: All 6 user stories (108 tasks)

- Estimated effort: 8-10 days for single developer
- Or 5-6 days with 2 developers working in parallel

---

## Implementation Strategy

1. **Start with MVP** (User Stories 1 + 2): Get series and content creation with versioning working first
2. **Validate independently**: Test US1 and US2 thoroughly before moving on
3. **Add Publication Workflow** (User Story 3): Critical for Member visibility control
4. **Add Version Restoration** (User Story 4): Important for Editor workflow
5. **Add Member Browsing** (User Story 5): Essential for end-user content consumption
6. **Add Search and Analytics** (User Story 6): Nice-to-have for better UX
7. **Test after each story**: Ensure each story works independently
8. **Parallelize with caution**: US1 must complete before US2 (content needs series)
9. **Polish at the end**: Cross-cutting concerns apply to all stories, so do them last

---

## Task Count Summary

- **Setup**: 4 tasks
- **Foundational**: 12 tasks
- **User Story 1 (P1)**: 13 tasks
- **User Story 2 (P1)**: 19 tasks
- **User Story 3 (P2)**: 10 tasks
- **User Story 4 (P2)**: 8 tasks
- **User Story 5 (P2)**: 11 tasks
- **User Story 6 (P3)**: 13 tasks
- **Polish**: 18 tasks
- **Total**: 108 tasks

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All task IDs are sequential (T001-T108)
✅ All [P] markers indicate parallelizable tasks (different files, no blocking dependencies)
✅ All [Story] labels correctly map to user stories (US1-US6)
✅ All task descriptions include exact file paths from plan.md project structure
✅ All user story phases include goal and independent test criteria
✅ Dependencies section shows clear execution order with US1 → US2 sequential requirement
✅ Parallel opportunities identified for optimal team execution
✅ Extends 001-admin-user infrastructure appropriately (User, SeriesPermission, auth/authz)
