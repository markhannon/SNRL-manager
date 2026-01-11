# Tasks: Simracing Championship Series

**Input**: Design documents from `/specs/004-simracing-series/`
**Prerequisites**: plan.md, spec.md (10 user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and NOT included - the spec does not request TDD approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md: Web application structure with `backend/` and `frontend/` directories

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend/frontend project structure per plan.md
- [ ] T002 Initialize Node.js 20 LTS project with TypeScript 5.x in backend/
- [ ] T003 [P] Initialize React 18+ project with TypeScript in frontend/
- [ ] T004 [P] Configure Fastify 4.x with Pino logging in backend/src/server.ts
- [ ] T005 [P] Configure linting (ESLint) and formatting (Prettier) tools for both backend and frontend
- [ ] T006 [P] Setup Vitest test configuration for backend/tests/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create Prisma schema in backend/prisma/schema.prisma with all entities: Championship, Event, RaceSession, EventResult, SessionResult, PointsScheme, ChampionshipStanding, AllowedCar, ChampionshipRegistration, ChampionshipImport, CalendarSubscription
- [ ] T008 Define all enums in schema: ChampionshipStatus, EventStatus, SessionType, ResultStatus, RaceLengthUnit, PenaltyType, RegistrationStatus
- [ ] T009 Add database indexes per data-model.md: championship status/simulator, event championship_id/date, result covering index for standings
- [ ] T010 Generate initial Prisma migration and apply to development database
- [ ] T011 Configure Prisma Client generation in backend/package.json
- [ ] T012 [P] Setup authentication middleware in backend/src/middleware/auth.middleware.ts extending specs 001-002 JWT auth
- [ ] T013 [P] Setup authorization middleware in backend/src/middleware/authorization.middleware.ts with championship ownership checks
- [ ] T014 [P] Create base API error handling in backend/src/utils/errors.ts
- [ ] T015 [P] Setup structured logging configuration in backend/src/utils/logger.ts using Pino
- [ ] T016 [P] Configure environment variables in backend/.env with DATABASE_URL, JWT_SECRET
- [ ] T017 [P] Create shared TypeScript types in backend/src/types/ for DTOs and responses
- [ ] T018 Setup React Router in frontend/src/App.tsx with navigation structure

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Configure Championship (Priority: P1) 🎯 MVP

**Goal**: Championship organizers can create and configure a new championship with simulator, points scheme, rules, and allowed cars.

**Independent Test**: Log in as organizer (editor/admin role), create new championship, specify simulator (iRacing/ACC), select points scheme, define rules, add allowed cars, verify championship appears in list.

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create Championship model type definitions in backend/src/models/championship.ts based on Prisma schema
- [ ] T020 [P] [US1] Create PointsScheme model type definitions in backend/src/models/pointsScheme.ts based on Prisma schema
- [ ] T021 [P] [US1] Create AllowedCar model type definitions in backend/src/models/allowedCar.ts based on Prisma schema
- [ ] T022 [US1] Implement ChampionshipService in backend/src/services/championship.service.ts with create(), update(), delete(), findById(), findAll() methods
- [ ] T023 [US1] Implement PointsSchemeService in backend/src/services/pointsScheme.service.ts with create(), findAll(), findById() methods
- [ ] T024 [US1] Implement POST /api/championships endpoint in backend/src/api/championships.routes.ts with JSON schema validation
- [ ] T025 [US1] Implement GET /api/championships endpoint with filtering by status, simulator in backend/src/api/championships.routes.ts
- [ ] T026 [US1] Implement GET /api/championships/:id endpoint in backend/src/api/championships.routes.ts
- [ ] T027 [US1] Implement PUT /api/championships/:id endpoint with ownership authorization in backend/src/api/championships.routes.ts
- [ ] T028 [US1] Implement DELETE /api/championships/:id endpoint with safeguards (prevent deletion if events exist) in backend/src/api/championships.routes.ts
- [ ] T029 [US1] Implement POST /api/points-schemes endpoint in backend/src/api/pointsSchemes.routes.ts
- [ ] T030 [US1] Implement GET /api/points-schemes endpoint in backend/src/api/pointsSchemes.routes.ts
- [ ] T031 [P] [US1] Create ChampionshipForm React component in frontend/src/components/championships/ChampionshipForm.tsx for create/edit
- [ ] T032 [P] [US1] Create ChampionshipList React component in frontend/src/components/championships/ChampionshipList.tsx with filters
- [ ] T033 [P] [US1] Create ChampionshipDetail React component in frontend/src/components/championships/ChampionshipDetail.tsx
- [ ] T034 [P] [US1] Create PointsSchemeSelector component in frontend/src/components/championships/PointsSchemeSelector.tsx
- [ ] T035 [US1] Create CreateChampionshipPage in frontend/src/pages/championships/CreateChampionshipPage.tsx integrating form components
- [ ] T036 [US1] Create ChampionshipDetailPage in frontend/src/pages/championships/ChampionshipDetailPage.tsx
- [ ] T037 [US1] Create frontend service for championship API calls in frontend/src/services/championship.service.ts
- [ ] T038 [US1] Add validation and error handling for championship creation (season dates, simulator validation)
- [ ] T039 [US1] Add logging for championship CRUD operations using Pino

**Checkpoint**: At this point, User Story 1 should be fully functional - organizers can create, view, edit, and delete championships with full configuration

---

## Phase 4: User Story 2 - Create and Manage Championship Events (Priority: P1) 🎯 MVP

**Goal**: Organizers can create events within a championship, specifying track, race length, and scheduling.

**Independent Test**: Select existing championship, create new event, choose track, set race length (laps or time), specify date/time, verify event appears in championship calendar.

### Implementation for User Story 2

- [ ] T040 [P] [US2] Create Event model type definitions in backend/src/models/event.ts based on Prisma schema
- [ ] T041 [US2] Implement EventService in backend/src/services/event.service.ts with create(), update(), delete(), findByChampionship() methods
- [ ] T042 [US2] Implement POST /api/championships/:id/events endpoint in backend/src/api/events.routes.ts
- [ ] T043 [US2] Implement GET /api/championships/:id/events endpoint with chronological ordering in backend/src/api/events.routes.ts
- [ ] T044 [US2] Implement GET /api/events/:id endpoint in backend/src/api/events.routes.ts
- [ ] T045 [US2] Implement PUT /api/events/:id endpoint with ownership authorization in backend/src/api/events.routes.ts
- [ ] T046 [US2] Implement DELETE /api/events/:id endpoint in backend/src/api/events.routes.ts
- [ ] T047 [P] [US2] Create EventForm React component in frontend/src/components/events/EventForm.tsx
- [ ] T048 [P] [US2] Create EventList React component in frontend/src/components/events/EventList.tsx showing chronological calendar
- [ ] T049 [P] [US2] Create EventDetail React component in frontend/src/components/events/EventDetail.tsx
- [ ] T050 [US2] Create CreateEventPage in frontend/src/pages/events/CreateEventPage.tsx
- [ ] T051 [US2] Create frontend service for event API calls in frontend/src/services/event.service.ts
- [ ] T052 [US2] Add validation for event creation (date within championship season, race length > 0)
- [ ] T053 [US2] Add logging for event CRUD operations

**Checkpoint**: At this point, User Stories 1 AND 2 should work independently - organizers can create championships and populate them with events

---

## Phase 5: User Story 4 - Enter and Manage Race Results (Priority: P1) 🎯 MVP

**Goal**: Organizers can manually enter race results after events, including positions, penalties, DNFs, and publish results to update standings.

**Independent Test**: Complete an event, enter finishing positions for participants, apply penalties/time additions, mark DNFs, save and publish results, verify standings update.

### Implementation for User Story 4

- [ ] T054 [P] [US4] Create EventResult model type definitions in backend/src/models/eventResult.ts based on Prisma schema
- [ ] T055 [US4] Implement ResultService in backend/src/services/result.service.ts with enterResults(), updateResults(), publishResults() methods
- [ ] T056 [US4] Implement points calculation logic in backend/src/services/result.service.ts using championship points scheme
- [ ] T057 [US4] Implement POST /api/events/:id/results endpoint for batch result entry in backend/src/api/results.routes.ts
- [ ] T058 [US4] Implement GET /api/events/:id/results endpoint in backend/src/api/results.routes.ts
- [ ] T059 [US4] Implement PUT /api/events/:id/results endpoint for result corrections with audit trail in backend/src/api/results.routes.ts
- [ ] T060 [US4] Implement POST /api/events/:id/results/publish endpoint to finalize results in backend/src/api/results.routes.ts
- [ ] T061 [P] [US4] Create ResultEntryForm React component in frontend/src/components/results/ResultEntryForm.tsx for entering positions and penalties
- [ ] T062 [P] [US4] Create ResultsList React component in frontend/src/components/results/ResultsList.tsx
- [ ] T063 [US4] Create EnterResultsPage in frontend/src/pages/results/EnterResultsPage.tsx
- [ ] T064 [US4] Create frontend service for result API calls in frontend/src/services/result.service.ts
- [ ] T065 [US4] Add validation for result entry (unique positions, DNF/DNS have 0 points and null position)
- [ ] T066 [US4] Add logging for result entry and modifications with audit trail
- [ ] T067 [US4] Implement automatic standings recalculation trigger when results are published

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should work - full championship lifecycle from creation to results entry (core MVP)

---

## Phase 6: User Story 3 - Define Multiple Races within an Event (Priority: P2)

**Goal**: Organizers can define multiple race sessions within a single event (qualifying, sprint, feature) with distinct configurations.

**Independent Test**: Create event, add multiple race sessions with different names, durations, and purposes (qualifying, race 1, race 2), verify each session tracked separately.

### Implementation for User Story 3

- [ ] T068 [P] [US3] Create RaceSession model type definitions in backend/src/models/raceSession.ts based on Prisma schema
- [ ] T069 [P] [US3] Create SessionResult model type definitions in backend/src/models/sessionResult.ts based on Prisma schema
- [ ] T070 [US3] Extend EventService in backend/src/services/event.service.ts to support multi-session event creation
- [ ] T071 [US3] Implement SessionService in backend/src/services/session.service.ts for session management
- [ ] T072 [US3] Implement POST /api/events/:id/sessions endpoint in backend/src/api/sessions.routes.ts
- [ ] T073 [US3] Implement GET /api/events/:id/sessions endpoint in backend/src/api/sessions.routes.ts
- [ ] T074 [US3] Implement PUT /api/sessions/:id endpoint in backend/src/api/sessions.routes.ts
- [ ] T075 [US3] Extend POST /api/sessions/:id/results endpoint for session results in backend/src/api/results.routes.ts
- [ ] T076 [P] [US3] Create RaceSessionForm React component in frontend/src/components/sessions/RaceSessionForm.tsx
- [ ] T077 [P] [US3] Create RaceSessionList React component in frontend/src/components/sessions/RaceSessionList.tsx
- [ ] T078 [US3] Update EventForm to support adding multiple sessions in frontend/src/components/events/EventForm.tsx
- [ ] T079 [US3] Create frontend service for session API calls in frontend/src/services/session.service.ts
- [ ] T080 [US3] Add validation for session configuration (session order, points multiplier 0-1)

**Checkpoint**: Multi-session events now work independently - organizers can create complex event formats

---

## Phase 7: User Story 5 - View Championship Standings and Results (Priority: P2)

**Goal**: Participants and spectators can view championship standings calculated from event results using the points scheme.

**Independent Test**: Complete one or more events with results, view championship standings page, verify drivers ranked by points according to points scheme.

### Implementation for User Story 5

- [ ] T081 [P] [US5] Create ChampionshipStanding model type definitions in backend/src/models/championshipStanding.ts based on Prisma schema
- [ ] T082 [US5] Implement StandingsService in backend/src/services/standings.service.ts with calculateStandings(), getTieBreaker() methods
- [ ] T083 [US5] Implement standings calculation with SQL aggregation using Prisma groupBy in backend/src/services/standings.service.ts
- [ ] T084 [US5] Implement tie-breaking logic using countback to best finishes in backend/src/services/standings.service.ts
- [ ] T085 [US5] Implement GET /api/championships/:id/standings endpoint in backend/src/api/standings.routes.ts
- [ ] T086 [US5] Implement GET /api/championships/:id/standings/:driverId endpoint for driver breakdown in backend/src/api/standings.routes.ts
- [ ] T087 [P] [US5] Create StandingsTable React component in frontend/src/components/standings/StandingsTable.tsx
- [ ] T088 [P] [US5] Create DriverStandingDetail React component in frontend/src/components/standings/DriverStandingDetail.tsx showing event-by-event points
- [ ] T089 [US5] Create StandingsPage in frontend/src/pages/standings/StandingsPage.tsx
- [ ] T090 [US5] Create frontend service for standings API calls in frontend/src/services/standings.service.ts
- [ ] T091 [US5] Add caching headers (Cache-Control) for standings endpoint

**Checkpoint**: Standings now work independently - users can view competitive rankings

---

## Phase 8: User Story 7 - Register for Championship (Priority: P2)

**Goal**: Drivers can register for a championship to become participants in all events automatically.

**Independent Test**: View championship as driver, register for championship, verify automatic entry in all championship events, confirm participant status visible to organizers.

### Implementation for User Story 7

- [ ] T092 [P] [US7] Create ChampionshipRegistration model type definitions in backend/src/models/championshipRegistration.ts based on Prisma schema
- [ ] T093 [US7] Implement RegistrationService in backend/src/services/registration.service.ts with register(), withdraw(), findByChampionship() methods
- [ ] T094 [US7] Implement POST /api/championships/:id/registrations endpoint in backend/src/api/registrations.routes.ts
- [ ] T095 [US7] Implement GET /api/championships/:id/registrations endpoint in backend/src/api/registrations.routes.ts
- [ ] T096 [US7] Implement DELETE /api/championships/:id/registrations/:userId endpoint for withdrawals in backend/src/api/registrations.routes.ts
- [ ] T097 [US7] Add validation for registration (championship not completed/cancelled, max participants limit check)
- [ ] T098 [P] [US7] Create RegistrationButton React component in frontend/src/components/registrations/RegistrationButton.tsx
- [ ] T099 [P] [US7] Create ParticipantsList React component in frontend/src/components/registrations/ParticipantsList.tsx
- [ ] T100 [US7] Update ChampionshipDetailPage to show registration button and participant list in frontend/src/pages/championships/ChampionshipDetailPage.tsx
- [ ] T101 [US7] Create frontend service for registration API calls in frontend/src/services/registration.service.ts

**Checkpoint**: Championship registration now works independently - drivers can commit to full championship

---

## Phase 9: User Story 10 - Cancel or Reschedule Championship Events (Priority: P2)

**Goal**: Admins and organizers can cancel or reschedule events due to unforeseen circumstances with participant notifications.

**Independent Test**: Select event, cancel with reason (verify participants notified), OR reschedule to new date (check conflicts), verify changes reflected in calendar.

### Implementation for User Story 10

- [ ] T102 [US10] Extend EventService in backend/src/services/event.service.ts with cancelEvent(), rescheduleEvent(), reinstateEvent() methods
- [ ] T103 [US10] Implement PATCH /api/events/:id/cancel endpoint in backend/src/api/events.routes.ts
- [ ] T104 [US10] Implement PATCH /api/events/:id/reschedule endpoint with conflict checking in backend/src/api/events.routes.ts
- [ ] T105 [US10] Implement PATCH /api/events/:id/reinstate endpoint in backend/src/api/events.routes.ts
- [ ] T106 [US10] Add validation for cancellation (cannot cancel events with published results, must provide reason)
- [ ] T107 [US10] Add validation for rescheduling (cannot reschedule to past date, must be within championship season)
- [ ] T108 [US10] Update StandingsService to exclude cancelled events from calculations in backend/src/services/standings.service.ts
- [ ] T109 [P] [US10] Create CancelEventDialog React component in frontend/src/components/events/CancelEventDialog.tsx
- [ ] T110 [P] [US10] Create RescheduleEventDialog React component in frontend/src/components/events/RescheduleEventDialog.tsx
- [ ] T111 [US10] Update EventDetail component to show cancel/reschedule actions for admins/organizers in frontend/src/components/events/EventDetail.tsx
- [ ] T112 [US10] Update EventList to show cancelled status and rescheduled dates in frontend/src/components/events/EventList.tsx

**Checkpoint**: Event management flexibility now works - championships can adapt to changing circumstances

---

## Phase 10: User Story 6 - Manage Points Schemes (Priority: P3)

**Goal**: Organizers can create and manage custom points schemes defining points by finishing position.

**Independent Test**: Create new points scheme, define points for positions (1st: 25, 2nd: 18...), assign to championship, verify results use this scheme.

### Implementation for User Story 6

- [ ] T113 [US6] Extend PointsSchemeService with update(), delete() methods in backend/src/services/pointsScheme.service.ts
- [ ] T114 [US6] Implement PUT /api/points-schemes/:id endpoint in backend/src/api/pointsSchemes.routes.ts
- [ ] T115 [US6] Implement DELETE /api/points-schemes/:id endpoint with dependency check in backend/src/api/pointsSchemes.routes.ts
- [ ] T116 [US6] Add validation preventing deletion of points schemes in use by active championships
- [ ] T117 [P] [US6] Create PointsSchemeForm React component in frontend/src/components/pointsSchemes/PointsSchemeForm.tsx
- [ ] T118 [P] [US6] Create PointsSchemeList React component in frontend/src/components/pointsSchemes/PointsSchemeList.tsx
- [ ] T119 [US6] Create ManagePointsSchemesPage in frontend/src/pages/pointsSchemes/ManagePointsSchemesPage.tsx
- [ ] T120 [US6] Add warning when editing points scheme that affects historical results

**Checkpoint**: Points scheme customization works independently

---

## Phase 11: User Story 8 - Browse and Search Championships (Priority: P3)

**Goal**: Users can browse championships, search by simulator/name, filter by status to discover championships.

**Independent Test**: View championship list, apply filters (simulator, status), search by name, verify only matching championships appear.

### Implementation for User Story 8

- [ ] T121 [US8] Extend GET /api/championships endpoint with search query parameter in backend/src/api/championships.routes.ts
- [ ] T122 [US8] Implement full-text search using PostgreSQL pg_trgm for championship name in backend/src/services/championship.service.ts
- [ ] T123 [US8] Add database index for full-text search on championship name (CREATE INDEX USING gin)
- [ ] T124 [P] [US8] Create ChampionshipSearchBar React component in frontend/src/components/championships/ChampionshipSearchBar.tsx
- [ ] T125 [P] [US8] Create ChampionshipFilters React component in frontend/src/components/championships/ChampionshipFilters.tsx
- [ ] T126 [US8] Update ChampionshipList to integrate search and filters in frontend/src/components/championships/ChampionshipList.tsx
- [ ] T127 [US8] Create BrowseChampionshipsPage in frontend/src/pages/championships/BrowseChampionshipsPage.tsx

**Checkpoint**: Championship discovery works independently - users can easily find relevant championships

---

## Phase 12: User Story 9 - Import Championship from External URL (Priority: P3)

**Goal**: Organizers can quickly create championships by importing schedule data from external sources rather than manual entry.

**Independent Test**: Provide URL to racing schedule (F1 calendar), verify system extracts championship name, season dates, events (dates, locations), create championship with pre-populated events.

### Implementation for User Story 9

- [ ] T128 [P] [US9] Create ChampionshipImport model type definitions in backend/src/models/championshipImport.ts based on Prisma schema
- [ ] T129 [US9] Install Cheerio library for HTML parsing in backend/package.json
- [ ] T130 [US9] Implement generic ScheduleParser interface in backend/src/services/parsers/scheduleParser.interface.ts
- [ ] T131 [US9] Implement Formula1Parser class using Cheerio in backend/src/services/parsers/formula1Parser.ts
- [ ] T132 [US9] Implement GenericRacingParser fallback class in backend/src/services/parsers/genericRacingParser.ts
- [ ] T133 [US9] Implement ImportService in backend/src/services/import.service.ts with parseUrl(), createFromImport() methods
- [ ] T134 [US9] Implement POST /api/championships/import endpoint to initiate URL parsing in backend/src/api/import.routes.ts
- [ ] T135 [US9] Implement GET /api/championships/import/:id endpoint to get parsed preview in backend/src/api/import.routes.ts
- [ ] T136 [US9] Implement POST /api/championships/import/:id/approve endpoint to create championship from import in backend/src/api/import.routes.ts
- [ ] T137 [US9] Add error handling for network failures, parsing failures, partial parsing with detailed messages
- [ ] T138 [US9] Add rate limiting for URL parsing (1-2 second delays between requests)
- [ ] T139 [P] [US9] Create ImportChampionshipForm React component in frontend/src/components/imports/ImportChampionshipForm.tsx
- [ ] T140 [P] [US9] Create ImportPreview React component in frontend/src/components/imports/ImportPreview.tsx showing parsed data
- [ ] T141 [US9] Create ImportChampionshipPage in frontend/src/pages/imports/ImportChampionshipPage.tsx
- [ ] T142 [US9] Create frontend service for import API calls in frontend/src/services/import.service.ts

**Checkpoint**: URL import works independently - championship setup time reduced dramatically

---

## Phase 13: User Story 11 - Export Championship Calendar to External Calendars (Priority: P3)

**Goal**: Drivers and spectators can export championship schedules to personal calendars (Google Calendar, Outlook, Apple Calendar).

**Independent Test**: Select championship, export calendar as ICS file, import to calendar application, verify all events appear with correct dates/times/details. For Google Calendar, verify events auto-update when schedule changes.

### Implementation for User Story 11

- [ ] T143 [P] [US11] Create CalendarSubscription model type definitions in backend/src/models/calendarSubscription.ts based on Prisma schema
- [ ] T144 [US11] Install ical.js library for ICS generation in backend/package.json
- [ ] T145 [US11] Implement CalendarService in backend/src/services/calendar.service.ts with generateICS(), createSubscription() methods
- [ ] T146 [US11] Implement ICS generation using ical.js with proper timezone handling in backend/src/services/calendar.service.ts
- [ ] T147 [US11] Implement GET /api/championships/:id/calendar.ics endpoint with token authentication in backend/src/api/calendar.routes.ts
- [ ] T148 [US11] Implement POST /api/championships/:id/calendar/subscribe endpoint to create subscription token in backend/src/api/calendar.routes.ts
- [ ] T149 [US11] Add HTTP caching headers (Cache-Control, ETag) for calendar feed endpoint
- [ ] T150 [US11] Implement calendar feed caching with in-memory cache and 1-hour TTL
- [ ] T151 [US11] Implement cache invalidation on event changes (create, update, cancel, reschedule)
- [ ] T152 [US11] Add rate limiting for calendar endpoints (60 requests/hour per token)
- [ ] T153 [US11] Handle multi-session events by exporting each session as separate calendar entry
- [ ] T154 [US11] Handle cancelled events appropriately in calendar exports (marked as cancelled)
- [ ] T155 [P] [US11] Create CalendarExportButton React component in frontend/src/components/calendar/CalendarExportButton.tsx
- [ ] T156 [P] [US11] Create GoogleCalendarButton React component for direct integration in frontend/src/components/calendar/GoogleCalendarButton.tsx
- [ ] T157 [US11] Update ChampionshipDetailPage to show calendar export options in frontend/src/pages/championships/ChampionshipDetailPage.tsx
- [ ] T158 [US11] Create frontend service for calendar API calls in frontend/src/services/calendar.service.ts

**Checkpoint**: Calendar integration works independently - users can sync championship schedules to their personal calendars

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T159 [P] Add comprehensive error handling and user-friendly error messages across all API endpoints
- [ ] T160 [P] Add request/response logging with correlation IDs for all API calls using Pino
- [ ] T161 [P] Implement input validation for all endpoints using Fastify JSON schemas
- [ ] T162 [P] Add pagination support for large lists (championships, events, results, standings)
- [ ] T163 [P] Optimize database queries with proper use of Prisma include/select to prevent N+1
- [ ] T164 [P] Add database connection pooling configuration in Prisma (20 connections for production)
- [ ] T165 [P] Implement global error boundary in React app in frontend/src/App.tsx
- [ ] T166 [P] Add loading states and skeletons for all data-fetching components
- [ ] T167 [P] Implement toast notifications for user actions (success, error, info) in frontend
- [ ] T168 [P] Add responsive design styles for mobile/tablet views across all pages
- [ ] T169 [P] Security audit: verify JWT authentication on all protected endpoints
- [ ] T170 [P] Security audit: verify authorization checks for championship ownership
- [ ] T171 [P] Security audit: validate SQL injection prevention via Prisma parameterized queries
- [ ] T172 [P] Performance testing: verify standings calculation < 30 seconds for 100+ participants
- [ ] T173 [P] Performance testing: verify calendar generation < 30 seconds for 100+ events
- [ ] T174 [P] Performance testing: verify API endpoints meet <200ms p95 latency goal
- [ ] T175 Create development seed data script in backend/prisma/seed.ts with sample championships, events, results
- [ ] T176 Update quickstart.md with validated setup instructions and API testing examples
- [ ] T177 Code cleanup and refactoring for consistency across all services
- [ ] T178 Add OpenAPI/Swagger documentation generation from Fastify schemas
- [ ] T179 Run full integration test suite across all user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-13)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 14)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Championship Config**: Can start after Foundational - No dependencies on other stories ✅ MVP
- **User Story 2 (P1) - Events**: Can start after Foundational - No dependencies on other stories ✅ MVP
- **User Story 4 (P1) - Results**: Can start after Foundational - Integrates with US1 (championships) and US2 (events) but independently testable ✅ MVP
- **User Story 3 (P2) - Multi-session**: Can start after Foundational - Extends US2 (events) but independently testable
- **User Story 5 (P2) - Standings**: Can start after Foundational - Uses US4 (results) but independently testable
- **User Story 7 (P2) - Registration**: Can start after Foundational - Uses US1 (championships) but independently testable
- **User Story 10 (P2) - Cancel/Reschedule**: Can start after Foundational - Extends US2 (events) but independently testable
- **User Story 6 (P3) - Points Schemes**: Can start after Foundational - Used by US1 (championships) but independently testable
- **User Story 8 (P3) - Browse/Search**: Can start after Foundational - Extends US1 (championships) but independently testable
- **User Story 9 (P3) - URL Import**: Can start after Foundational - Creates US1 (championships) but independently testable
- **User Story 11 (P3) - Calendar Export**: Can start after Foundational - Uses US2 (events) but independently testable

### Within Each User Story

- Models before services
- Services before endpoints
- Backend endpoints before frontend components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Frontend components marked [P] can run in parallel (different files)
- Polish tasks marked [P] can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Championship model type definitions in backend/src/models/championship.ts"
Task: "Create PointsScheme model type definitions in backend/src/models/pointsScheme.ts"
Task: "Create AllowedCar model type definitions in backend/src/models/allowedCar.ts"

# Launch all frontend components for User Story 1 together:
Task: "Create ChampionshipForm React component in frontend/src/components/championships/ChampionshipForm.tsx"
Task: "Create ChampionshipList React component in frontend/src/components/championships/ChampionshipList.tsx"
Task: "Create ChampionshipDetail React component in frontend/src/components/championships/ChampionshipDetail.tsx"
Task: "Create PointsSchemeSelector component in frontend/src/components/championships/PointsSchemeSelector.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Championship Configuration)
4. Complete Phase 4: User Story 2 (Event Management)
5. Complete Phase 5: User Story 4 (Results Entry)
6. **STOP and VALIDATE**: Test championship lifecycle end-to-end
7. Deploy/demo MVP

**MVP Scope**: 67 tasks (T001-T067) covering Setup + Foundational + US1 + US2 + US4

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T018)
2. Add User Story 1 → Test independently → Championship creation works (T019-T039)
3. Add User Story 2 → Test independently → Event scheduling works (T040-T053)
4. Add User Story 4 → Test independently → Results and standings work (T054-T067) → **MVP COMPLETE**
5. Add User Story 3 → Multi-session events (T068-T080)
6. Add User Story 5 → Enhanced standings view (T081-T091)
7. Add User Story 7 → Driver registration (T092-T101)
8. Add User Story 10 → Event flexibility (T102-T112)
9. Add User Story 6 → Points customization (T113-T120)
10. Add User Story 8 → Championship discovery (T121-T127)
11. Add User Story 9 → Import automation (T128-T142)
12. Add User Story 11 → Calendar integration (T143-T158)
13. Complete Polish → Production ready (T159-T179)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T018)
2. Once Foundational is done:
   - Developer A: User Story 1 (Championship) + User Story 6 (Points Schemes)
   - Developer B: User Story 2 (Events) + User Story 10 (Cancel/Reschedule)
   - Developer C: User Story 4 (Results) + User Story 5 (Standings)
   - Developer D: User Story 7 (Registration) + User Story 8 (Browse)
   - Developer E: User Story 3 (Multi-session) + User Story 9 (Import) + User Story 11 (Calendar)
3. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 179
**MVP Tasks**: 67 (Setup + Foundational + US1 + US2 + US4)

**Tasks by Phase**:
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 12 tasks
- Phase 3 (US1 - Championship Config): 21 tasks ✅ MVP
- Phase 4 (US2 - Events): 14 tasks ✅ MVP
- Phase 5 (US4 - Results): 14 tasks ✅ MVP
- Phase 6 (US3 - Multi-session): 13 tasks
- Phase 7 (US5 - Standings): 11 tasks
- Phase 8 (US7 - Registration): 10 tasks
- Phase 9 (US10 - Cancel/Reschedule): 11 tasks
- Phase 10 (US6 - Points Schemes): 8 tasks
- Phase 11 (US8 - Browse/Search): 7 tasks
- Phase 12 (US9 - URL Import): 15 tasks
- Phase 13 (US11 - Calendar Export): 16 tasks
- Phase 14 (Polish): 21 tasks

**Parallel Opportunities**: 87 tasks marked [P] can run in parallel within their phases

**Format Validation**: ✅ All tasks follow checklist format with:
- Checkbox: `- [ ]`
- Task ID: T001-T179 (sequential)
- [P] marker: Only if parallelizable
- [Story] label: Required for user story phases (US1-US11)
- Description: Clear action + exact file path

---

## Notes

- All tasks follow strict format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- [P] tasks target different files with no dependencies within same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP delivers core championship management: create championships → add events → enter results → view standings
- Post-MVP adds flexibility (multi-session, cancellation), discovery (browse/search, import), and integration (calendar export)
