# Data Model: Simracing Championship Series

**Feature**: 004-simracing-series
**Phase**: Phase 1 - Database Design
**Date**: 2026-01-09

## Overview

This data model implements a comprehensive simracing championship management system supporting full-season championships with multiple events, race sessions, results tracking, and automated standings calculation. The design prioritizes data integrity, efficient querying for standings calculation, and support for complex racing scenarios (multi-session events, penalties, cancellations, rescheduling).

**Key Design Principles**:
- **Referential Integrity**: All relationships enforced via foreign keys with appropriate cascade behaviors
- **Soft Deletes**: Championships and events use status fields rather than hard deletes to preserve history
- **Audit Trail**: Results and events track modification history for stewardship transparency
- **Query Optimization**: Indexes designed around core query patterns (standings calculation, event listing, result lookup)
- **Flexibility**: JSONB fields for penalty details and rules while maintaining structured data for critical fields

## Prisma Schema

```prisma
// This extends the existing User model from specs 001-002
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum ChampionshipStatus {
  DRAFT       // Imported or created but not yet active
  UPCOMING    // Scheduled to start in the future
  ACTIVE      // Currently in progress
  COMPLETED   // Season has ended
  CANCELLED   // Championship cancelled
}

enum EventStatus {
  SCHEDULED      // Event scheduled to occur
  IN_PROGRESS    // Event currently happening
  COMPLETED      // Event finished, results entered
  CANCELLED      // Event cancelled, doesn't count toward standings
}

enum SessionType {
  PRACTICE       // Practice session (typically no points)
  QUALIFYING     // Qualifying session (may award points for pole)
  SPRINT_RACE    // Sprint race (typically partial points)
  FEATURE_RACE   // Main/feature race (full points)
  RACE           // Generic race session
}

enum ResultStatus {
  CLASSIFIED     // Finished, classified (eligible for points)
  DNF            // Did not finish
  DNS            // Did not start
  DSQ            // Disqualified
}

enum RaceLengthUnit {
  LAPS           // Race length measured in laps
  MINUTES        // Race length measured in minutes
  HOURS          // Race length measured in hours
}

enum PenaltyType {
  TIME_PENALTY      // Time added to finish time (e.g., +5 seconds)
  POSITION_PENALTY  // Positions dropped (e.g., -3 positions)
  POINTS_DEDUCTION  // Points deducted from total
}

enum RegistrationStatus {
  ACTIVE         // Driver actively registered
  WITHDRAWN      // Driver withdrew from championship
}

// Championship entity - Core championship configuration
model Championship {
  id                  Int                         @id @default(autoincrement())
  name                String                      @db.VarChar(255)
  description         String?                     @db.Text
  simulator           String                      @db.VarChar(100) // e.g., "iRacing", "ACC", "rFactor 2"
  seasonStart         DateTime                    @db.Date
  seasonEnd           DateTime                    @db.Date
  status              ChampionshipStatus          @default(DRAFT)

  // Rules and configuration
  rulesText           String?                     @db.Text
  rulesDocumentUrl    String?                     @db.VarChar(500)
  maxParticipants     Int?                        // Optional participant limit

  // Points scheme relationship
  pointsSchemeId      Int
  pointsScheme        PointsScheme                @relation(fields: [pointsSchemeId], references: [id])

  // Relationships
  events              Event[]
  registrations       ChampionshipRegistration[]
  allowedCars         AllowedCar[]
  standings           ChampionshipStanding[]
  calendarSubscriptions CalendarSubscription[]

  // Metadata
  createdBy           Int                         // User ID of organizer
  createdAt           DateTime                    @default(now())
  updatedAt           DateTime                    @updatedAt

  @@index([status])
  @@index([simulator])
  @@index([createdBy])
  @@index([seasonStart, seasonEnd])
}

// Championship registration - Driver enrollment for full championship
model ChampionshipRegistration {
  id              Int                  @id @default(autoincrement())
  championshipId  Int
  championship    Championship         @relation(fields: [championshipId], references: [id], onDelete: Cascade)
  driverId        Int                  // User ID
  status          RegistrationStatus   @default(ACTIVE)
  registeredAt    DateTime             @default(now())
  withdrawnAt     DateTime?
  withdrawalReason String?             @db.Text

  @@unique([championshipId, driverId]) // Prevent duplicate registrations
  @@index([driverId])
  @@index([championshipId, status])
}

// Event - A racing event within a championship
model Event {
  id                   Int             @id @default(autoincrement())
  championshipId       Int
  championship         Championship    @relation(fields: [championshipId], references: [id], onDelete: Cascade)

  name                 String          @db.VarChar(255)
  track                String          @db.VarChar(255)
  eventDate            DateTime
  status               EventStatus     @default(SCHEDULED)

  // Race length configuration
  raceLengthValue      Int             // Number (laps or time value)
  raceLengthUnit       RaceLengthUnit  // LAPS, MINUTES, or HOURS

  // Cancellation/rescheduling tracking
  originalEventDate    DateTime?       // Set when event is rescheduled
  cancellationReason   String?         @db.Text
  cancelledAt          DateTime?
  cancelledBy          Int?            // User ID of admin/organizer who cancelled
  rescheduleDateHistory Json?          // Array of previous dates if rescheduled multiple times

  // Relationships
  raceSessions         RaceSession[]
  results              EventResult[]

  // Metadata
  createdBy            Int             // User ID of organizer
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  @@index([championshipId])
  @@index([eventDate])
  @@index([championshipId, status])
  @@index([championshipId, eventDate])
}

// Race Session - Individual racing session within an event
model RaceSession {
  id                Int          @id @default(autoincrement())
  eventId           Int
  event             Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)

  sessionName       String       @db.VarChar(255)
  sessionType       SessionType
  sessionOrder      Int          // 1st session, 2nd session, etc.

  // Duration configuration
  durationValue     Int          // Number (laps or time value)
  durationUnit      RaceLengthUnit

  // Points allocation for this session
  pointsMultiplier  Float        @default(1.0) // 1.0 = full points, 0.5 = half points, 0 = no points

  scheduledStartTime DateTime?

  // Relationships
  results           SessionResult[]

  @@index([eventId])
  @@index([eventId, sessionOrder])
}

// Event Results - Results for an entire event (simplified single-race events)
model EventResult {
  id                  Int            @id @default(autoincrement())
  eventId             Int
  event               Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  driverId            Int            // User ID

  // Finishing position
  finishingPosition   Int?           // Final position after penalties (null for DNF/DNS)
  originalPosition    Int?           // Position before penalties applied

  // Race status
  resultStatus        ResultStatus   @default(CLASSIFIED)

  // Penalties
  penalties           Json?          // Array of penalty objects: [{ type, value, reason }]

  // Points
  pointsAwarded       Int            @default(0)

  // Result publishing
  isDraft             Boolean        @default(true)
  publishedAt         DateTime?

  // Audit trail
  enteredBy           Int            // User ID of organizer who entered results
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  modificationHistory Json?          // Array of change records: [{ timestamp, userId, changes }]

  @@unique([eventId, driverId]) // One result per driver per event
  @@index([driverId])
  @@index([eventId, resultStatus])
  @@index([eventId, driverId, resultStatus, pointsAwarded]) // Covering index for standings
}

// Session Results - Results for individual race sessions (multi-session events)
model SessionResult {
  id                  Int            @id @default(autoincrement())
  sessionId           Int
  session             RaceSession    @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  driverId            Int            // User ID

  // Finishing position
  finishingPosition   Int?
  originalPosition    Int?

  // Race status
  resultStatus        ResultStatus   @default(CLASSIFIED)

  // Penalties
  penalties           Json?

  // Points
  pointsAwarded       Int            @default(0)

  // Result publishing
  isDraft             Boolean        @default(true)
  publishedAt         DateTime?

  // Audit trail
  enteredBy           Int
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  modificationHistory Json?

  @@unique([sessionId, driverId])
  @@index([driverId])
  @@index([sessionId, resultStatus])
}

// Points Scheme - Defines championship points structure
model PointsScheme {
  id                Int              @id @default(autoincrement())
  name              String           @db.VarChar(255)
  description       String?          @db.Text

  // Position-to-points mapping
  pointsMapping     Json             // Object: { "1": 25, "2": 18, "3": 15, ... }

  // Optional bonus points
  bonusPoints       Json?            // Object: { "fastestLap": 1, "polePosition": 1 }

  // Drop scores rule
  dropScores        Int              @default(0) // Number of worst results to drop

  // Relationships
  championships     Championship[]

  // Metadata
  createdBy         Int              // User ID
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([name])
}

// Championship Standings - Calculated driver rankings
model ChampionshipStanding {
  id                Int              @id @default(autoincrement())
  championshipId    Int
  championship      Championship     @relation(fields: [championshipId], references: [id], onDelete: Cascade)
  driverId          Int              // User ID

  // Points and statistics
  totalPoints       Int              @default(0)
  eventsParticipated Int             @default(0)
  wins              Int              @default(0)
  podiums           Int              @default(0)
  bestFinish        Int?             // Best finishing position

  // Standings position
  position          Int              // Current position in standings (1st, 2nd, 3rd, etc.)

  // Event-by-event breakdown
  pointsBreakdown   Json             // Array: [{ eventId, points, position }]

  // Last updated timestamp
  lastCalculated    DateTime         @default(now())

  @@unique([championshipId, driverId])
  @@index([championshipId, position])
  @@index([championshipId, totalPoints])
}

// Allowed Cars - Cars permitted in a championship
model AllowedCar {
  id              Int            @id @default(autoincrement())
  championshipId  Int
  championship    Championship   @relation(fields: [championshipId], references: [id], onDelete: Cascade)

  carName         String         @db.VarChar(255)
  carClass        String?        @db.VarChar(100) // e.g., "GT3", "GTE", "LMP2"

  @@unique([championshipId, carName]) // Prevent duplicate cars per championship
  @@index([championshipId])
}

// Championship Import - Temporary entity for URL parsing workflow
model ChampionshipImport {
  id                  Int              @id @default(autoincrement())
  sourceUrl           String           @db.VarChar(1000)

  // Parsed data
  parsedChampionshipName String?       @db.VarChar(255)
  parsedSeasonStart   DateTime?        @db.Date
  parsedSeasonEnd     DateTime?        @db.Date
  parsedEvents        Json?            // Array: [{ name, date, track }]

  // Import status
  status              String           @db.VarChar(50) // "parsing", "ready_for_review", "imported", "failed"
  errorMessage        String?          @db.Text

  // Metadata
  createdBy           Int              // User ID of organizer
  createdAt           DateTime         @default(now())
  importedAs          Int?             // Championship ID if successfully imported

  @@index([createdBy])
  @@index([status])
}

// Calendar Subscription - Tracks calendar feed subscriptions
model CalendarSubscription {
  id              Int            @id @default(autoincrement())
  championshipId  Int
  championship    Championship   @relation(fields: [championshipId], references: [id], onDelete: Cascade)

  // Subscription details
  token           String         @unique @db.VarChar(64) // Unique access token for security
  userId          Int?           // Optional: track which user created subscription

  // Usage tracking
  createdAt       DateTime       @default(now())
  lastAccessedAt  DateTime?
  accessCount     Int            @default(0)

  @@index([championshipId])
  @@index([token])
}
```

## Entity Relationships

### Core Relationships

1. **Championship → Events** (1:many)
   - Each championship contains multiple events
   - Cascade delete: Deleting championship removes all events

2. **Championship → ChampionshipRegistrations** (1:many)
   - Drivers register for entire championship
   - Cascade delete: Deleting championship removes registrations

3. **Championship → PointsScheme** (many:1)
   - Multiple championships can use same points scheme
   - Restrict delete: Cannot delete points scheme in use

4. **Championship → AllowedCars** (1:many)
   - Championship defines permitted cars
   - Cascade delete: Deleting championship removes car restrictions

5. **Championship → ChampionshipStandings** (1:many)
   - Championship has standings for each registered driver
   - Cascade delete: Deleting championship removes standings

6. **Event → RaceSessions** (1:many)
   - Events can have multiple race sessions (qualifying, sprint, feature)
   - Cascade delete: Deleting event removes sessions

7. **Event → EventResults** (1:many)
   - Each event has results for participating drivers
   - Cascade delete: Deleting event removes results

8. **RaceSession → SessionResults** (1:many)
   - Each session has results for participating drivers
   - Cascade delete: Deleting session removes results

### User Relationships (from specs 001-002)

- **User → Championships** (1:many) via `createdBy` - Organizer relationship
- **User → ChampionshipRegistrations** (1:many) via `driverId` - Driver participation
- **User → EventResults** (1:many) via `driverId` - Driver results
- **User → EventResults** (1:many) via `enteredBy` - Results entered by organizer

## Indexes

### Primary Indexes (Auto-created)
- All `@id` fields automatically indexed

### Foreign Key Indexes (Auto-created by Prisma)
- All `@relation` fields automatically indexed

### Custom Indexes

#### Championship Queries
```sql
CREATE INDEX idx_championships_status ON championships(status);
CREATE INDEX idx_championships_simulator ON championships(simulator);
CREATE INDEX idx_championships_created_by ON championships(created_by);
CREATE INDEX idx_championships_season ON championships(season_start, season_end);
```

**Rationale**:
- Filter championships by status (upcoming, active, completed) - User Story 8
- Filter by simulator - User Story 8
- Find organizer's championships - User Story 1
- Find active championships by date range

#### Event Queries
```sql
CREATE INDEX idx_events_championship_id ON events(championship_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_championship_status ON events(championship_id, status);
CREATE INDEX idx_events_championship_date ON events(championship_id, event_date);
```

**Rationale**:
- List events for championship (most common query) - User Story 2
- Calendar generation in chronological order - User Story 11
- Filter championship events by status (exclude cancelled from standings)
- Composite index for chronological event listing per championship

#### Result Queries (Most Critical for Performance)
```sql
CREATE INDEX idx_event_results_event_id ON event_results(event_id);
CREATE INDEX idx_event_results_driver_id ON event_results(driver_id);
CREATE UNIQUE INDEX idx_event_results_event_driver ON event_results(event_id, driver_id);
CREATE INDEX idx_event_results_standings_calc ON event_results(event_id, driver_id, result_status, points_awarded);
```

**Rationale**:
- Get results for specific event - User Story 4
- Get driver's result history - User Story 5
- Ensure one result per driver per event (data integrity)
- **Covering index for standings calculation** - This is the most important index. Query pattern:
  ```sql
  SELECT driver_id, SUM(points_awarded), COUNT(*), MAX(CASE WHEN finishing_position = 1 THEN 1 ELSE 0 END) as wins
  FROM event_results
  WHERE event_id IN (SELECT id FROM events WHERE championship_id = ?)
    AND result_status = 'CLASSIFIED'
  GROUP BY driver_id
  ```
  This index covers all columns in WHERE and SELECT, enabling index-only scan (fastest query type).

#### Registration Queries
```sql
CREATE UNIQUE INDEX idx_registrations_champ_driver ON championship_registrations(championship_id, driver_id);
CREATE INDEX idx_registrations_driver_id ON championship_registrations(driver_id);
CREATE INDEX idx_registrations_championship_status ON championship_registrations(championship_id, status);
```

**Rationale**:
- Prevent duplicate registrations (data integrity) - User Story 7
- Find driver's registered championships
- List active participants for championship

#### Calendar Subscription Queries
```sql
CREATE UNIQUE INDEX idx_calendar_subscriptions_token ON calendar_subscriptions(token);
CREATE INDEX idx_calendar_subscriptions_championship ON calendar_subscriptions(championship_id);
```

**Rationale**:
- Token lookup for calendar feed access (most common query) - User Story 11
- Find all subscriptions for championship

### Full-Text Search (Future Enhancement)
```sql
-- Requires pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_championships_name_trgm ON championships USING gin(name gin_trgm_ops);
```

**Rationale**: Fuzzy search for championship names in User Story 8 (browse/search)

## Constraints and Validation

### Database-Level Constraints

#### NOT NULL Constraints
- **Championships**: `name`, `simulator`, `seasonStart`, `seasonEnd`, `status`, `pointsSchemeId`, `createdBy`
- **Events**: `name`, `track`, `eventDate`, `status`, `raceLengthValue`, `raceLengthUnit`, `championshipId`, `createdBy`
- **Results**: `eventId`, `driverId`, `resultStatus`, `pointsAwarded`, `enteredBy`
- **PointsSchemes**: `name`, `pointsMapping`, `createdBy`

#### UNIQUE Constraints
- `championship_registrations(championship_id, driver_id)` - One registration per driver per championship
- `event_results(event_id, driver_id)` - One result per driver per event
- `session_results(session_id, driver_id)` - One result per driver per session
- `allowed_cars(championship_id, car_name)` - No duplicate cars per championship
- `calendar_subscriptions(token)` - Unique subscription tokens

#### CHECK Constraints (via Prisma validation or database triggers)
```sql
-- Race length must be positive
ALTER TABLE events ADD CONSTRAINT check_race_length_positive
  CHECK (race_length_value > 0);

-- Season dates must be logical
ALTER TABLE championships ADD CONSTRAINT check_season_dates
  CHECK (season_end >= season_start);

-- Finishing position must be positive if set
ALTER TABLE event_results ADD CONSTRAINT check_finishing_position
  CHECK (finishing_position IS NULL OR finishing_position > 0);

-- Points cannot be negative
ALTER TABLE event_results ADD CONSTRAINT check_points_non_negative
  CHECK (points_awarded >= 0);

-- Session order must be positive
ALTER TABLE race_sessions ADD CONSTRAINT check_session_order
  CHECK (session_order > 0);

-- Points multiplier must be between 0 and 1
ALTER TABLE race_sessions ADD CONSTRAINT check_points_multiplier
  CHECK (points_multiplier >= 0 AND points_multiplier <= 1);
```

### Foreign Key Constraints and Cascade Behaviors

#### Cascade Delete
- **Championship deletion → Events, Registrations, AllowedCars, Standings, CalendarSubscriptions**
- **Event deletion → RaceSessions, EventResults**
- **RaceSession deletion → SessionResults**

Rationale: When a championship or event is deleted, all related data should be removed to maintain referential integrity.

#### Restrict Delete
- **PointsScheme deletion → Championships** (Restrict if in use)

Rationale: Cannot delete points scheme if championships are using it. Must reassign championships first.

#### Set NULL (for metadata fields)
- **User deletion → `createdBy`, `enteredBy`, `cancelledBy` fields**

Rationale: If a user account is deleted, preserve championship/event/result data but remove user reference.

### Application-Level Validation (Prisma/Fastify)

1. **Championship Creation**:
   - Season start must be before season end
   - Simulator must be from valid enum
   - Max participants must be positive if set

2. **Event Creation**:
   - Event date must be within championship season dates
   - Track and cars must be valid for selected simulator
   - Race length must be positive

3. **Result Entry**:
   - Driver must be registered for championship
   - Finishing position must be unique within event (no ties without handling)
   - Points awarded must match points scheme for position
   - DNF/DNS results must have 0 points and null position

4. **Registration**:
   - Championship must not be completed or cancelled
   - Must not exceed max participants limit
   - Driver cannot register twice for same championship

5. **Event Cancellation**:
   - Cannot cancel event with published results
   - Cannot cancel completed events
   - Must provide cancellation reason

6. **Event Rescheduling**:
   - Cannot reschedule to past date
   - New date must be within championship season

## Migration Strategy

### Initial Migration

Create initial schema with all tables in a single migration:

```bash
npx prisma migrate dev --name init_simracing_series
```

This generates SQL migration file with all CREATE TABLE statements, indexes, and constraints.

### Development Workflow

1. **Schema Changes**: Edit `schema.prisma`
2. **Generate Migration**: `npx prisma migrate dev --name descriptive_name`
3. **Review SQL**: Check generated SQL in `prisma/migrations/`
4. **Test Migration**: Apply to development database automatically
5. **Commit**: Commit both `schema.prisma` and migration files

### Production Deployment

```bash
# Apply pending migrations to production
npx prisma migrate deploy

# Generate Prisma Client with new schema
npx prisma generate
```

### Migration Rollback Strategy

Prisma doesn't support automatic rollbacks. For critical changes:

1. **Create Backup**: `pg_dump` before migration
2. **Test on Staging**: Apply migration to staging environment first
3. **Manual Rollback**: Write manual DOWN migration SQL if needed
4. **Data Migration**: For data transformations, write separate data migration scripts

### Common Migration Scenarios

#### Adding Optional Field
```prisma
// Add new optional field
model Championship {
  // ... existing fields
  sponsorName String? @db.VarChar(255)
}
```
Migration: `ALTER TABLE championships ADD COLUMN sponsor_name VARCHAR(255);`
Safe: No data migration needed.

#### Adding Required Field
```prisma
// Add required field with default
model Championship {
  // ... existing fields
  visibility String @default("public") @db.VarChar(50)
}
```
Migration: `ALTER TABLE championships ADD COLUMN visibility VARCHAR(50) NOT NULL DEFAULT 'public';`
Safe: Default value applied to existing rows.

#### Changing Field Type
```prisma
// Change race_length_value from Int to Float
model Event {
  raceLengthValue Float
}
```
Migration: `ALTER TABLE events ALTER COLUMN race_length_value TYPE DOUBLE PRECISION;`
Caution: Test data conversion, may lose precision.

#### Adding Index
```prisma
model Championship {
  name String @db.VarChar(255)

  @@index([name])
}
```
Migration: `CREATE INDEX idx_championships_name ON championships(name);`
Safe: Can be added/removed without affecting data. May take time on large tables (use `CREATE INDEX CONCURRENTLY` in production).

## Design Decisions

### 1. Separate EventResult and SessionResult Tables

**Decision**: Maintain two result tables instead of single polymorphic table.

**Rationale**:
- Simplifies common case (single-race events) with direct `Event → EventResult` relationship
- Multi-session events use `Event → RaceSession → SessionResult` path
- Cleaner queries for standings (most use EventResult directly)
- Avoids polymorphic associations which are harder to query and maintain referential integrity

**Alternative Considered**: Single Result table with optional `session_id`. Rejected due to query complexity.

### 2. JSONB for Penalties and Modification History

**Decision**: Store penalty details and audit trail in JSONB rather than separate tables.

**Rationale**:
- Penalties vary widely (time, position, points, warnings) - structured but not uniform enough for normalized tables
- Modification history is append-only log - JSONB array perfect for this
- PostgreSQL JSONB supports indexing and querying if needed later
- Simplifies queries (no joins for penalty details)
- Reduces table count (follows Simplicity First)

**Structure**:
```json
// penalties field
[
  { "type": "TIME_PENALTY", "seconds": 5, "reason": "Track limits violation" },
  { "type": "POSITION_PENALTY", "positions": 3, "reason": "Causing collision" }
]

// modificationHistory field
[
  {
    "timestamp": "2026-01-09T14:30:00Z",
    "userId": 123,
    "userName": "John Steward",
    "changes": {
      "finishingPosition": { "from": 3, "to": 5 },
      "penalties": { "added": { "type": "POSITION_PENALTY", "positions": 2 } }
    }
  }
]
```

### 3. Soft Deletes via Status Fields

**Decision**: Use status enums (`CANCELLED`, `COMPLETED`) rather than `deleted_at` timestamps.

**Rationale**:
- Championships and events have natural lifecycle states beyond "deleted/not deleted"
- `CANCELLED` events must appear in history but not count toward standings
- Status field more semantic than `deleted_at IS NOT NULL`
- Allows restoration (cancelled → scheduled) without data recovery
- Queries more readable: `WHERE status != 'CANCELLED'` vs `WHERE deleted_at IS NULL`

### 4. Championship-Level Registration (Not Event-Level)

**Decision**: Drivers register for entire championship, auto-entered in all events.

**Rationale**:
- Matches clarification from spec (Q: "How do drivers register?" A: "Championship-level registration")
- Simpler UX (one registration vs multiple)
- Ensures commitment to full championship
- Automatically enters driver in new events added mid-season
- Standings calculation simpler (all registered drivers participate in all events)

**Implementation**: No separate EventEntry table. Registration implies entry in all championship events.

### 5. Calculated Standings (Not Materialized View)

**Decision**: `ChampionshipStanding` table recalculated via application logic, not database materialized view.

**Rationale**:
- Allows storing additional metadata (wins, podiums, points breakdown)
- Easier to test and debug in application code
- More portable across databases
- Trigger-based updates can be fragile
- Application control over when/how standings update
- Follows constitution's Simplicity First (application logic clearer than database triggers)

**Recalculation Trigger**: When results are published (draft → published), recalculate standings for that championship.

### 6. Points Scheme as Separate Entity (Not Inline)

**Decision**: `PointsScheme` table with JSONB mapping instead of inline championship fields.

**Rationale**:
- Reusability: Multiple championships can share same scheme (F1 2024, F1 2025 both use F1 points)
- Easier to manage: Edit scheme in one place, applies to all championships
- Supports library of standard schemes (F1, MotoGP, IndyCar points)
- Future enhancement: Versioning schemes (change points mid-season creates new version)

**Tradeoff**: Extra join for standings calculation. Acceptable given performance is still well within requirements.

### 7. Race Length as Value + Unit (Not Normalized)

**Decision**: Store `raceLengthValue` and `raceLengthUnit` as separate fields instead of multiple fields (laps, minutes, hours).

**Rationale**:
- Flexible: Supports future units (kilometers, percentage) without schema change
- Clear intent: Unit explicitly stored, no ambiguity
- Validation: Can enforce "value must be positive" universally
- Calendar export: Easy to calculate duration (convert to minutes for ICS DURATION field)

### 8. ImportChampionship as Temporary Entity

**Decision**: Separate `ChampionshipImport` table for URL parsing workflow.

**Rationale**:
- Separates parsing process from production data
- Allows organizer to review before creating championship
- Preserves import attempts for debugging failed parses
- Can be cleaned up after successful import or 30 days
- Avoids polluting Championship table with incomplete/failed imports

### 9. Calendar Subscription Token Security

**Decision**: 64-character random token, stored in database, required for calendar access.

**Rationale**:
- Security: Prevents unauthorized calendar access (can't guess URLs)
- Trackability: Know which subscriptions are active, when last accessed
- Revocability: Can delete subscription to revoke access
- Compatibility: Works with all calendar apps (no OAuth needed)
- Follows calendar feed best practices (CalDAV, webcal URLs)

### 10. Single Organizer per Championship (MVP)

**Decision**: Championship has single `createdBy` organizer, no co-organizer table.

**Rationale**:
- Simplifies authorization logic (owner or admin)
- Matches majority use case (one organizer per championship)
- Can add co-organizers later via ChampionshipPermission table if needed
- Follows Simplicity First - solve actual problem, not hypothetical multi-organizer need

## Performance Characteristics

### Expected Query Performance

Based on success criteria and research findings:

1. **Championship List (filtered)**: < 50ms
   - Index on `status`, `simulator`
   - Typical: 10-20ms for 1000 championships

2. **Event List for Championship**: < 30ms
   - Index on `championship_id`, `event_date`
   - Typical: 10-15ms for 100 events

3. **Standings Calculation**: < 30 seconds (SC-003)
   - Covering index on `(event_id, driver_id, result_status, points_awarded)`
   - Expected: 100-500ms for 100 participants × 50 events = 5,000 results
   - Worst case: 200 participants × 100 events = 20,000 results still < 1 second

4. **Result Entry (batch)**: < 2 seconds
   - Batch insert 50 results: ~100-200ms
   - Transaction ensures atomicity

5. **Calendar Generation**: < 200ms (SC-016: < 30 seconds)
   - Query 100 events: ~20ms
   - Generate ICS with ical.js: ~100ms

### Scaling Limits (Before Optimization Needed)

- **Championships**: 10,000+ (limited by storage, not query performance)
- **Events per Championship**: 200+ (pagination recommended above 100)
- **Participants per Championship**: 500+ (standings calculation < 1s)
- **Total Results**: 1,000,000+ (with proper indexes)

**When to Optimize**: Only if profiling shows p95 latency exceeding 500ms or specific success criteria failing.

## Future Enhancements

These are intentionally deferred to post-MVP:

1. **ChampionshipPermission Table**: Support co-organizers, stewards, commentators with specific permissions
2. **EventEntry Table**: Event-level registration if per-event signup needed (vs championship-level)
3. **Notification Table**: Track notification delivery for event cancellations/reschedules
4. **AuditLog Table**: Comprehensive audit trail for all entity changes (vs per-entity modification history)
5. **PointsSchemeVersion Table**: Version points schemes to handle mid-season changes transparently
6. **CarDatabase Table**: Maintain simulator car lists in database (vs external configuration)
7. **TrackDatabase Table**: Maintain simulator track lists with metadata (length, location, timezone)
8. **PrivateChampionship Support**: Add `visibility` field and access control for private championships
9. **TeamEntity**: Support team championships (constructors standings in addition to driver standings)
10. **LiveTiming Table**: Real-time race timing and leaderboard updates during events

Add these only when user feedback or requirements demand them. Current schema supports all P1-P3 user stories without these additions.
