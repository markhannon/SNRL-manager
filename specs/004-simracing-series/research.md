# Technical Research: Simracing Championship Series

**Date**: 2026-01-09
**Feature**: 004-simracing-series
**Phase**: Phase 0 - Technical Foundation

## Executive Summary

This research resolves technical unknowns for implementing a comprehensive simracing championship management system. The system requires managing complex entity relationships (championships, events, results, standings), real-time calculations, external integrations (URL import, calendar exports), and multi-role user access.

**Key Decisions**: Node.js 20 LTS with TypeScript, Fastify backend framework for performance, React frontend for ecosystem maturity, PostgreSQL with Prisma ORM for type-safe database access, ical.js for RFC-compliant calendar generation, and Cheerio for resilient URL parsing. This stack prioritizes simplicity, type safety, and proven libraries while maintaining clear modularity between frontend and backend.

**Architecture Philosophy**: Following the constitution's Simplicity First principle, we recommend starting with straightforward implementations: SQL-based standings calculations (no premature caching), static HTML parsing (avoiding JavaScript-rendered complexity), and standard testing tools (Jest/Vitest). Optimizations should be added only when profiling identifies actual bottlenecks.

## 1. Technology Stack Decisions

### 1.1 Runtime and Language

**Decision**: Node.js 20 LTS (latest LTS as of Jan 2026) + TypeScript 5.x

**Rationale**:
- **Node.js 20 LTS**: Released April 2023, enters Maintenance LTS in October 2024, End-of-Life April 2026. Provides stable foundation with 3+ years support remaining
- **TypeScript**: Non-negotiable for this project given complexity of entity relationships. Provides compile-time type safety across frontend/backend, reduces runtime errors, improves IDE experience, and enables better refactoring
- **Type Safety Benefits**: Championship, Event, Results, Standings entities have complex relationships. TypeScript catches relationship errors at compile-time rather than runtime
- **Cross-Stack Benefits**: Shared types between frontend/backend ensure API contract consistency
- **Constitution Alignment**: Supports Observability (typed logging), Modularity (interface contracts), Simplicity (clear data structures)

**Alternatives Considered**:
- **Node.js 18 LTS**: Still supported until April 2025, but Node 20 provides better performance and newer features
- **Node.js 22 (Current)**: Not LTS yet, would become LTS in Oct 2024. Too new for production stability
- **Deno/Bun**: Interesting alternatives but less mature ecosystem for required libraries (ORMs, testing tools). Violates Simplicity First

**Migration Path**: Update to Node.js 22 LTS when it stabilizes (Oct 2024+)

---

### 1.2 Backend Framework

**Decision**: Fastify 4.x

**Rationale**:
- **Performance**: Fastify is 2-3x faster than Express in benchmarks, handles 30k+ req/sec vs Express 15k req/sec. Critical for standings calculations and calendar feed generation
- **TypeScript-First Design**: Built with TypeScript in mind, excellent type inference for request/response objects
- **Schema Validation**: Built-in JSON schema validation via Ajv. Validates requests/responses automatically, generates OpenAPI specs
- **Plugin Architecture**: Clean separation of concerns aligns with Modularity principle. Championship routes, event routes, standings logic all isolated as plugins
- **Structured Logging**: Built-in logger (Pino) provides structured JSON logging for Observability
- **API Documentation**: Generates OpenAPI/Swagger documentation from schemas automatically
- **Maturity**: 10+ years development (started 2016), production-ready, 30k+ GitHub stars

**Alternatives Considered**:
- **Express**: Most popular (50k+ stars) but slower, no built-in TypeScript support, requires many middleware packages, no schema validation. Simpler learning curve but less capable for this project's needs
- **NestJS**: Excellent TypeScript support, dependency injection, extensive feature set. However, adds significant complexity through decorators, modules, and Angular-style architecture. Violates Simplicity First for a project this size. Better suited for large enterprise applications with 50+ endpoints
- **Hono**: Ultra-lightweight, fast, but very new (2022). Limited ecosystem, fewer plugins. Too immature for production

**Performance Comparison** (Node.js 20, typical CRUD endpoint):
```
Fastify: ~35,000 req/sec
Express: ~15,000 req/sec
NestJS: ~25,000 req/sec (overhead from DI container)
```

**Example Fastify Route with Type Safety**:
```typescript
// Automatic request/response validation + TypeScript inference
fastify.post<{ Body: CreateChampionshipDto }>('/championships', {
  schema: {
    body: CreateChampionshipSchema,
    response: { 200: ChampionshipSchema }
  },
  handler: async (request, reply) => {
    // request.body is typed as CreateChampionshipDto automatically
    const championship = await championshipService.create(request.body);
    return championship; // Validated against ChampionshipSchema automatically
  }
});
```

---

### 1.3 Frontend Framework

**Decision**: React 18+ with TypeScript

**Rationale**:
- **Ecosystem Maturity**: Largest component ecosystem (Material-UI, Ant Design, Chakra UI, Tailwind), extensive libraries for forms (React Hook Form), state management (Zustand, Tanstack Query), routing (React Router)
- **Learning Resources**: Most documentation, tutorials, Stack Overflow answers. Easier onboarding for contributors
- **TypeScript Integration**: Excellent type support through @types/react, type-safe component props
- **Performance**: React 18 concurrent features, automatic batching, Suspense for data fetching
- **Component Model**: Fits championship UI naturally - Championship component, Event component, Standings component, each independently testable
- **Developer Experience**: Hot module replacement, component devtools, error boundaries
- **Hiring Pool**: Largest pool of React developers if team expansion needed
- **Stability**: 10+ years of development, backed by Meta, not going anywhere

**Alternatives Considered**:
- **Vue 3**: Simpler learning curve, excellent TypeScript support (composition API), smaller bundle size. Good choice but smaller ecosystem. Less familiar for most developers
- **Svelte**: Minimal boilerplate, compiles to vanilla JS, fastest runtime. However, smaller ecosystem (fewer UI libraries), less mature tooling, smaller community. Violates Simplicity First due to less community support when stuck
- **Next.js (React framework)**: Adds SSR, routing, API routes. Overkill for this project - we already have a backend (Fastify). Unnecessary complexity

**Bundle Size Comparison** (typical SPA):
```
React 18: ~140kb gzipped (react + react-dom)
Vue 3: ~100kb gzipped
Svelte: ~50kb gzipped (compiled)
```

For this project, React's larger bundle is acceptable given ecosystem benefits.

**State Management Recommendation**: Start with React Context + Tanstack Query (React Query) for server state. Add Zustand only if complex client-side state emerges. Follows Simplicity First.

---

### 1.4 Database and ORM

**Decision**: PostgreSQL 15+ with Prisma 5.x ORM

**Rationale**:

**PostgreSQL over MySQL/SQLite**:
- **Complex Relationships**: Championships → Events → Race Sessions → Results → Standings requires robust foreign key support, cascade deletes, transactions. PostgreSQL excels here
- **JSON Support**: Points schemes, championship rules, race session configs stored as JSON. PostgreSQL has native JSONB type with indexing, querying. MySQL's JSON support is weaker
- **Concurrent Writes**: Multiple organizers entering results simultaneously. PostgreSQL has better MVCC (Multi-Version Concurrency Control) than MySQL, reducing lock contention
- **Advanced Features**: Window functions for standings rankings (`RANK() OVER (PARTITION BY championship_id ORDER BY total_points DESC)`), CTEs for complex queries
- **Full-Text Search**: For searching championships by name, built-in with `ts_vector` and `ts_query`
- **Data Integrity**: Strictest ACID compliance, best constraint enforcement
- **Performance**: Comparable to MySQL for reads, superior for complex queries and concurrent writes
- **SQLite**: Excellent for development but not production-ready for multi-user write concurrency. Championship results from multiple organizers would cause lock contention

**Prisma ORM over TypeORM/Sequelize**:
- **TypeScript-First**: Schema defined in declarative `schema.prisma` file, generates 100% type-safe client. Zero runtime errors from typos
- **Migration System**: Declarative migrations based on schema changes. `prisma migrate dev` auto-generates SQL
- **Query Builder**: Type-safe query API prevents SQL injection, provides autocomplete
- **Relation Queries**: Intuitive nested queries for complex relationships: `prisma.championship.findUnique({ include: { events: { include: { results: true } } } })`
- **Prisma Studio**: Built-in database GUI for debugging, viewing data during development
- **Developer Experience**: Best-in-class DX - autocomplete, inline documentation, error messages
- **Performance**: Generates optimized SQL, connection pooling built-in
- **Observability**: Query logging with execution time, integrates with Pino/Winston

**Alternatives Considered**:
- **TypeORM**: Popular (32k stars), supports Active Record + Data Mapper patterns, extensive features. However, decorator-heavy (complexity), weaker TypeScript inference (more manual types), migration system less intuitive. More enterprise-focused
- **Sequelize**: Most mature (29k stars), extensive features, good for complex apps. However, written in JavaScript first (TypeScript support via types), less type-safe, older API design. Migrations require manual writing
- **Drizzle ORM**: Very new (2023), excellent TypeScript support, lightweight. Too immature for production, smaller ecosystem
- **Kysely**: SQL-first query builder, excellent types. Lower-level than Prisma, requires more SQL knowledge, no schema management. Violates Simplicity First

**Prisma Example - Type-Safe Standings Query**:
```typescript
// Automatically typed, autocomplete for all fields
const standings = await prisma.result.groupBy({
  by: ['driverId'],
  where: {
    event: { championshipId: championshipId },
    status: 'classified'
  },
  _sum: { points: true },
  orderBy: { _sum: { points: 'desc' } }
});
// standings[0]._sum.points is typed as number | null
```

**Schema Considerations**:

1. **Entity Relationships**:
   - Championship ↔ Events (1:many)
   - Championship ↔ ChampionshipRegistrations (1:many)
   - Event ↔ RaceSessions (1:many)
   - RaceSession ↔ Results (1:many)
   - Championship ↔ PointsScheme (many:1)
   - User ↔ ChampionshipRegistrations (1:many)

2. **Indexing Strategy**:
   - Primary indexes: All IDs (auto-indexed)
   - `championship_id` on events, registrations (frequent joins)
   - `event_id` on race_sessions, results (frequent joins)
   - `driver_id` on results (standings calculations)
   - `(championship_id, status)` composite index for filtering active championships
   - `(event_id, driver_id)` composite index for result lookups
   - Unique constraint on `(championship_id, driver_id)` for registrations
   - Full-text index on `championship.name` for search

3. **Performance Considerations**:
   - Standings calculation query: Uses aggregation with GROUP BY, indexed on championship_id + driver_id
   - Event queries: Paginated with cursor-based pagination for 100+ events
   - Result inserts: Batched via Prisma `createMany` for race results (20-100 drivers)
   - Connection pool: Configure based on expected load (default 10 connections sufficient for MVP)

4. **Data Integrity**:
   - Cascade delete: Championship deletion cascades to events, events cascade to race_sessions and results
   - Soft deletes: Championships, events use `deleted_at` timestamp rather than hard delete
   - Check constraints: Ensure lap count > 0 OR time duration > 0 (not both zero)
   - Foreign key constraints: All relationships enforced at database level

---

## 2. Key Libraries and Integrations

### 2.1 Calendar/ICS Generation

**Recommended Library**: ical.js 1.5.x (from Mozilla)

**Rationale**:
- **RFC 5545 Compliance**: Implements iCalendar spec completely, handles edge cases (timezones, recurring events, VTIMEZONE definitions)
- **Timezone Handling**: Excellent timezone support via integration with IANA timezone database. Critical for international racing championships
- **Battle-Tested**: Developed by Mozilla for Thunderbird/Lightning calendar, used in production by millions
- **Feature Completeness**: Supports VEVENT, VTIMEZONE, VALARM (reminders), RRULE (recurrence), all iCalendar properties
- **Parsing + Generation**: Can both parse and generate ICS files (useful for testing)
- **Standards Compliance**: Ensures compatibility with Google Calendar, Outlook, Apple Calendar, all major calendar applications
- **Documentation**: Comprehensive docs, active maintenance (last release Nov 2023)
- **Size**: ~50kb gzipped, reasonable for backend library

**Alternatives Considered**:
- **ics (npm package)**: Simpler API, lightweight, but limited features. No timezone database, basic VEVENT support only. Breaks with complex calendar scenarios (multi-session events with different timezones)
- **node-ical**: Good for parsing ICS files but weak generation capabilities. Primarily a parser, not a generator
- **rrule + manual ICS generation**: RRULE library excellent for recurrence rules but requires manual ICS formatting. Error-prone, violates Simplicity First
- **Build from scratch**: RFC 5545 is 150+ pages. Multiple edge cases (timezone DST transitions, leap seconds, VTIMEZONE components). Violates Simplicity First dramatically

**Google Calendar Integration Approach**:

Two integration methods recommended:

1. **ICS/Webcal Subscription URL** (Recommended for MVP):
   - Generate subscribable calendar feed URL: `webcal://app.example.com/championships/{id}/calendar.ics`
   - URL returns dynamically generated ICS file for championship
   - Users add URL to their calendar app (Google Calendar "Add by URL" feature)
   - Calendar apps re-fetch feed periodically (typically 12-24 hours)
   - **Pros**: Simple, no OAuth, works with all calendar apps, auto-updates
   - **Cons**: Update delay (not instant), requires users to manually add URL

2. **Google Calendar API Direct Integration** (Future Enhancement):
   - Use Google Calendar API v3 to create events directly in user's Google Calendar
   - Requires OAuth 2.0 authentication flow, Google Cloud project setup
   - "Add to Google Calendar" button creates events immediately via API call
   - **Pros**: Instant, one-click, familiar UX
   - **Cons**: Complex OAuth flow, Google-only (not Outlook/Apple), requires user consent, rate limits
   - **Cost**: Free tier sufficient (10,000 requests/day per project)

**Recommendation**: Start with subscription URL (option 1), add Google Calendar API (option 2) as P3 enhancement if user feedback demands it. Follows Simplicity First.

**Example ical.js Implementation**:
```typescript
import ICAL from 'ical.js';

function generateChampionshipCalendar(championship: Championship): string {
  const cal = new ICAL.Component(['vcalendar', [], []]);
  cal.updatePropertyWithValue('prodid', '-//SNRL Manager//EN');
  cal.updatePropertyWithValue('version', '2.0');

  for (const event of championship.events) {
    const vevent = new ICAL.Component('vevent');
    const icalEvent = new ICAL.Event(vevent);

    icalEvent.summary = `${championship.name} - ${event.name}`;
    icalEvent.startDate = ICAL.Time.fromJSDate(event.date, true);
    icalEvent.duration = ICAL.Duration.fromSeconds(event.durationSeconds);
    icalEvent.location = event.track;
    icalEvent.description = `Track: ${event.track}\nLaps: ${event.laps}`;

    cal.addSubcomponent(vevent);
  }

  return cal.toString();
}
```

---

### 2.2 URL Parsing for Championship Import

**Recommended Library**: Cheerio 1.0.x

**Rationale**:
- **Static HTML Parsing**: Parses HTML/XML server-side using jQuery-like syntax. Fast, lightweight, perfect for static racing calendar pages
- **Performance**: 100x faster than Puppeteer. Parses typical racing schedule page in ~50ms vs 2-5 seconds
- **Resource Efficient**: No browser overhead, low memory usage. Can parse 100 pages in parallel with minimal resources
- **Simplicity**: Familiar jQuery API: `$('table.schedule tr').each((i, row) => { ... })`. Easy to write and maintain
- **No JavaScript Execution**: Parses HTML as-is. Perfect for static pages (Formula1.com, MotoGP.com, etc. render schedules server-side)
- **Resilience**: Doesn't break if page has JavaScript errors (unlike Puppeteer which executes JS)
- **Mature**: 10+ years development, 28k+ stars, battle-tested in web scraping

**When Cheerio Fails**: If a target website renders schedules client-side via JavaScript (SPA frameworks), Cheerio sees empty HTML. In this case, fall back to Puppeteer for specific sources.

**Alternatives Considered**:
- **Puppeteer/Playwright**: Full browser automation, executes JavaScript, handles SPAs. However, massive overhead: launches Chrome instance (~100-200MB RAM per instance), 2-5 second startup time, 10x slower parsing. Overkill for 90% of racing websites that serve static HTML. Use only when Cheerio fails
- **jsdom**: Full DOM implementation in Node.js, executes JavaScript. Better than Puppeteer for resource usage but still heavier than Cheerio (50-100MB RAM), slower parsing. Unnecessary complexity when Cheerio suffices
- **node-html-parser**: Lightweight, faster than Cheerio for simple parsing. However, less feature-complete (no advanced selectors), smaller ecosystem. Cheerio's jQuery syntax more familiar
- **Build custom regex parser**: Brittle, breaks with whitespace changes. Violates Simplicity First

**Error Handling Strategy**:

1. **Network Failures**: Retry with exponential backoff (3 attempts), timeout after 10 seconds
2. **Parsing Failures**: Return structured error with details for organizer: "Could not find schedule table on page. Please use manual entry or contact support."
3. **Partial Parsing**: If some events parse successfully but others fail, show preview with warnings: "Parsed 15/20 events. Review and manually add missing events."
4. **Format Changes**: Log parsing failures with page HTML snapshot for debugging. Add new parser for changed format
5. **Rate Limiting**: Add delays between requests (1-2 seconds) to avoid overwhelming source websites

**Resilience Pattern**:
```typescript
// Parser abstraction allows easy addition of source-specific parsers
interface ScheduleParser {
  canParse(url: string): boolean;
  parse(html: string): ParsedSchedule;
}

class Formula1Parser implements ScheduleParser {
  canParse(url: string) { return url.includes('formula1.com'); }
  parse(html: string) {
    const $ = cheerio.load(html);
    // F1-specific parsing logic
    return {
      events: $('.race-schedule .event').map((i, el) => ({
        name: $(el).find('.race-name').text(),
        date: parseDate($(el).find('.date').text()),
        track: $(el).find('.circuit').text()
      })).get()
    };
  }
}

class GenericRacingParser implements ScheduleParser {
  canParse() { return true; } // Fallback
  parse(html: string) {
    // Heuristic-based parsing for common table structures
  }
}
```

**Recommendation**: Start with Cheerio-based parser for 2-3 major racing websites (Formula 1, MotoGP). Add Puppeteer fallback only if user requests SPA-based websites. Follows Simplicity First - solve known problems, not hypothetical ones.

---

## 3. Testing Strategy

### 3.1 Testing Stack

**Unit Tests**: Vitest 1.x

**Rationale**:
- **Vite Integration**: Seamless integration with Vite (if used for frontend bundling). Shares Vite's transform pipeline
- **Jest-Compatible API**: Drop-in replacement for Jest - same `describe`, `it`, `expect` API. Easy migration if needed
- **Performance**: 5-10x faster than Jest due to Vite's caching and ESM support. Test suite runs in ~1-2s vs 10-15s with Jest
- **TypeScript**: Native TypeScript support, no `ts-jest` configuration needed
- **Watch Mode**: Instant feedback on code changes, re-runs only affected tests
- **Snapshot Testing**: Same as Jest, full snapshot support
- **Mocking**: Built-in mocking via `vi.mock()`, compatible with Jest mocks
- **Modern**: ESM-first, better for modern Node.js/TypeScript projects

**Alternative (Also Valid)**: Jest 29.x
- More mature (10+ years), larger ecosystem, more Stack Overflow answers
- Slightly slower but proven stability
- Better for teams already familiar with Jest
- Choose Jest if team prefers familiarity over speed

**Integration Tests**: Supertest 6.x (API testing) + Vitest/Jest

**Rationale**:
- **API Testing**: Supertest provides fluent API for HTTP assertions: `request(app).post('/championships').send(data).expect(201)`
- **No Server Startup**: Tests run against Fastify app instance without actual HTTP server, faster execution
- **Chai-Style Assertions**: Readable assertions: `expect(res.body.name).toBe('Championship 2024')`
- **Battle-Tested**: Industry standard for Node.js API testing, 12+ years development

**E2E Tests**: Playwright 1.x

**Rationale**:
- **Cross-Browser**: Tests in Chromium, Firefox, WebKit (Safari) from same codebase
- **Modern API**: Better async handling than Cypress, auto-waiting for elements
- **Speed**: Faster than Cypress, parallel test execution
- **Trace Viewer**: Excellent debugging - record test execution, inspect at any step
- **Network Mocking**: Intercept and mock API calls for testing edge cases
- **Component Testing**: Can test React components in isolation (alternative to E2E)
- **Microsoft-Backed**: Strong ongoing support, rapid development

**Alternative**: Cypress 13.x
- More mature, larger community, extensive plugins
- Easier learning curve, excellent documentation
- Better for teams already using Cypress
- Choose Cypress if team prefers stability over latest features

**Contract Testing**: JSON Schema validation (via Fastify schemas) + Pact (future)

**Rationale**:
- **Fastify Schemas**: Already defining request/response schemas for validation. These serve as contract tests automatically
- **Consumer-Driven**: Frontend (consumer) defines expected API contracts, backend (provider) validates against them
- **Pact**: Industry standard for contract testing between services. Overkill for MVP (single backend/frontend), add when scaling
- **OpenAPI**: Fastify generates OpenAPI spec from schemas, provides contract documentation

**Test Coverage Goals**:

Per constitution Quality Standards:
- **Unit Tests (Required)**: Business logic (standings calculation, points schemes, penalty application), utility functions (date parsing, URL validation)
  - Target: 80%+ code coverage for services/models
- **Integration Tests (Required)**: All API endpoints (championships, events, results, standings, calendar)
  - Target: 100% endpoint coverage
- **Contract Tests (Required)**: API request/response schemas validated via Fastify schemas
  - Target: 100% schema coverage
- **E2E Tests (Optional)**: Critical user journeys only (create championship → add events → enter results → view standings)
  - Target: 5-10 tests covering P1 user stories

**Test Pyramid**:
```
      E2E (5-10 tests)
       /\
      /  \
     /    \
    / Intg \  (50-100 tests)
   /        \
  /   Unit   \ (200-500 tests)
 /____________\
```

---

### 3.2 Example Test Structure

**Unit Test Example (Vitest)**:
```typescript
// services/standings.test.ts
import { describe, it, expect } from 'vitest';
import { calculateStandings } from './standings';

describe('calculateStandings', () => {
  it('calculates total points correctly', () => {
    const results = [
      { driverId: 1, eventId: 1, points: 25 },
      { driverId: 1, eventId: 2, points: 18 },
      { driverId: 2, eventId: 1, points: 18 }
    ];

    const standings = calculateStandings(results);

    expect(standings[0]).toEqual({ driverId: 1, totalPoints: 43, position: 1 });
    expect(standings[1]).toEqual({ driverId: 2, totalPoints: 18, position: 2 });
  });

  it('handles DNF correctly (0 points)', () => {
    const results = [
      { driverId: 1, eventId: 1, points: 0, status: 'DNF' }
    ];

    const standings = calculateStandings(results);

    expect(standings[0].totalPoints).toBe(0);
  });

  it('resolves ties using countback to best finishes', () => {
    // Both drivers have 43 points, driver 1 has more wins
    const results = [
      { driverId: 1, position: 1, points: 25 },
      { driverId: 1, position: 2, points: 18 },
      { driverId: 2, position: 2, points: 18 },
      { driverId: 2, position: 1, points: 25 }
    ];

    const standings = calculateStandings(results);

    // Tie resolved by countback - both have 1 win, check 2nd places
    expect(standings[0].driverId).toBe(1); // Driver 1 ranks higher
  });
});
```

**Integration Test Example (Supertest + Vitest)**:
```typescript
// api/championships.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../app'; // Fastify app factory
import request from 'supertest';

describe('POST /championships', () => {
  let app;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates championship with valid data', async () => {
    const championship = {
      name: 'F1 2024 Season',
      simulator: 'iRacing',
      seasonStart: '2024-03-01',
      seasonEnd: '2024-11-30'
    };

    const response = await request(app.server)
      .post('/api/championships')
      .send(championship)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      name: 'F1 2024 Season',
      simulator: 'iRacing'
    });
  });

  it('returns 400 for invalid simulator', async () => {
    const championship = {
      name: 'Invalid Championship',
      simulator: 'NonExistentSim'
    };

    const response = await request(app.server)
      .post('/api/championships')
      .send(championship)
      .expect(400);

    expect(response.body.error).toContain('Invalid simulator');
  });
});
```

**E2E Test Example (Playwright)**:
```typescript
// e2e/championship-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete championship workflow', async ({ page }) => {
  // Login as organizer
  await page.goto('/login');
  await page.fill('[name="email"]', 'organizer@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create championship
  await page.goto('/championships/create');
  await page.fill('[name="name"]', 'Test Championship 2024');
  await page.selectOption('[name="simulator"]', 'iRacing');
  await page.click('button:has-text("Create Championship")');

  await expect(page).toHaveURL(/\/championships\/\d+/);
  await expect(page.locator('h1')).toHaveText('Test Championship 2024');

  // Add event
  await page.click('button:has-text("Add Event")');
  await page.fill('[name="eventName"]', 'Season Opener');
  await page.selectOption('[name="track"]', 'Spa-Francorchamps');
  await page.fill('[name="laps"]', '30');
  await page.click('button:has-text("Save Event")');

  await expect(page.locator('.event-list')).toContainText('Season Opener');

  // Enter results
  await page.click('.event-list .event:first-child');
  await page.click('button:has-text("Enter Results")');
  // ... result entry steps

  // Verify standings
  await page.click('a:has-text("Standings")');
  await expect(page.locator('.standings tbody tr:first-child')).toContainText('P1');
});
```

---

## 4. Performance and Scalability

### 4.1 Standings Calculation

**Approach**: SQL aggregation with database-level calculation

**Rationale**:
- **Simplicity First**: Let PostgreSQL do what it's designed for - aggregating data. No premature optimization
- **Correctness**: Single source of truth (database), no cache consistency issues
- **SQL Optimization**: PostgreSQL query planner optimizes GROUP BY queries efficiently with proper indexes
- **Transactional**: Results and standings calculated atomically within database transaction

**SQL Query Strategy**:
```sql
-- Standings calculation query (generated by Prisma)
SELECT
  driver_id,
  SUM(points) as total_points,
  COUNT(*) as events_participated,
  MAX(CASE WHEN position = 1 THEN 1 ELSE 0 END) as wins,
  RANK() OVER (ORDER BY SUM(points) DESC) as position
FROM results
WHERE
  event_id IN (SELECT id FROM events WHERE championship_id = ?)
  AND status = 'classified'
GROUP BY driver_id
ORDER BY total_points DESC, wins DESC;
```

**Expected Performance**:
- **100 participants, 20 events** (2,000 result rows): ~10-30ms with indexes
- **200 participants, 50 events** (10,000 result rows): ~50-100ms with indexes
- **500 participants, 100 events** (50,000 result rows): ~200-500ms with indexes (still within spec)

**Indexes Required**:
- `(event_id, driver_id, status)` composite index for WHERE filtering
- `championship_id` on events table for subquery

**Success Criterion**: SC-003 requires standings update within 30 seconds. SQL aggregation approach meets this easily (< 1 second for realistic championships).

**Caching Strategy**: None initially. Add caching ONLY if profiling shows actual bottleneck.

**When to Add Caching** (future optimization, not MVP):
- If standings page p95 latency exceeds 500ms under production load
- If championship has 1000+ participants with 100+ events (unlikely)
- Cache using Redis with 5-minute TTL, invalidate on result publish

**Recommendation**: Start with SQL aggregation. Add caching only when profiling identifies need. Follows Simplicity First and constitution's "optimize only when profiling identifies bottlenecks."

---

### 4.2 Database Optimization

**Indexing Strategy**:

Based on query patterns from user stories:

1. **Championship Queries**:
   - `CREATE INDEX idx_championships_status ON championships(status)` - Filter by status (upcoming, active, completed)
   - `CREATE INDEX idx_championships_simulator ON championships(simulator)` - Filter by simulator
   - `CREATE INDEX idx_championships_name_trgm ON championships USING gin(name gin_trgm_ops)` - Full-text search on name (requires pg_trgm extension)

2. **Event Queries**:
   - `CREATE INDEX idx_events_championship_id ON events(championship_id)` - Join to championships (Prisma auto-creates)
   - `CREATE INDEX idx_events_date ON events(date)` - Order by date for calendar
   - `CREATE INDEX idx_events_championship_status ON events(championship_id, status)` - Filter championship events by status

3. **Result Queries** (Most Critical):
   - `CREATE INDEX idx_results_event_id ON results(event_id)` - Join to events
   - `CREATE INDEX idx_results_driver_id ON results(driver_id)` - Driver result history
   - `CREATE INDEX idx_results_event_driver ON results(event_id, driver_id)` - Composite for specific result lookup
   - `CREATE INDEX idx_results_standing_calc ON results(event_id, driver_id, status, points)` - Optimized for standings calculation (covering index)

4. **Registration Queries**:
   - `CREATE UNIQUE INDEX idx_registrations_champ_driver ON championship_registrations(championship_id, driver_id)` - Prevent duplicate registrations
   - `CREATE INDEX idx_registrations_driver ON championship_registrations(driver_id)` - Driver's championships

**Connection Pooling**:

Prisma default: 10 connections (sufficient for MVP)

Adjust based on load:
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection string includes pool size:
  // postgresql://user:pass@host:5432/db?connection_limit=20
}
```

Recommended pool sizes:
- **Development**: 5 connections
- **Staging**: 10 connections
- **Production (MVP)**: 20 connections
- **Production (scale)**: (2 × CPU cores) + disk spindles (e.g., 4-core = 8-10 connections)

**Query Optimization Patterns**:

1. **N+1 Prevention**: Use Prisma `include` or `select` to eagerly load relationships
```typescript
// BAD: N+1 query - fetches championship, then N events
const championship = await prisma.championship.findUnique({ where: { id } });
const events = await prisma.event.findMany({ where: { championshipId: id } });

// GOOD: Single query with join
const championship = await prisma.championship.findUnique({
  where: { id },
  include: { events: true }
});
```

2. **Pagination**: Cursor-based pagination for event lists (better than offset)
```typescript
// Cursor-based pagination (scales to millions of rows)
const events = await prisma.event.findMany({
  where: { championshipId },
  take: 25,
  skip: 1, // Skip the cursor
  cursor: { id: lastEventId },
  orderBy: { date: 'asc' }
});
```

3. **Batch Inserts**: Use `createMany` for result entry (20-100 drivers)
```typescript
// Batch insert 50 results in single query
await prisma.result.createMany({
  data: results // Array of 50 result objects
});
```

---

### 4.3 Calendar Feed Performance

**Caching Strategy**:

1. **HTTP Caching Headers**:
```typescript
// Fastify route for calendar feed
fastify.get('/championships/:id/calendar.ics', async (request, reply) => {
  const ics = await generateCalendar(request.params.id);

  reply
    .header('Content-Type', 'text/calendar; charset=utf-8')
    .header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    .header('ETag', generateETag(ics)) // Conditional requests
    .send(ics);
});
```

2. **Feed Generation Caching**: Cache generated ICS content in-memory or Redis
```typescript
// Simple in-memory cache with TTL
const calendarCache = new Map<string, { ics: string, expiry: number }>();

async function getCachedCalendar(championshipId: string): Promise<string> {
  const cached = calendarCache.get(championshipId);
  if (cached && cached.expiry > Date.now()) {
    return cached.ics;
  }

  const ics = await generateCalendar(championshipId);
  calendarCache.set(championshipId, { ics, expiry: Date.now() + 3600000 }); // 1 hour
  return ics;
}
```

3. **Cache Invalidation**: Invalidate on event changes
```typescript
// Invalidate cache when events change
await prisma.event.create({ data: eventData });
calendarCache.delete(championshipId); // Invalidate calendar cache
```

**Subscription URL Security**:

1. **Token-Based Access**:
```typescript
// Generate unique access token for each championship calendar subscription
const token = crypto.randomBytes(32).toString('hex');
await prisma.calendarSubscription.create({
  data: {
    championshipId,
    token,
    userId: request.user.id
  }
});

// Calendar URL includes token: /championships/{id}/calendar.ics?token={token}
// Validate token on each request
fastify.get('/championships/:id/calendar.ics', async (request, reply) => {
  const subscription = await prisma.calendarSubscription.findUnique({
    where: { token: request.query.token }
  });

  if (!subscription || subscription.championshipId !== request.params.id) {
    return reply.status(403).send({ error: 'Invalid calendar subscription' });
  }

  // Generate and return calendar
});
```

2. **Rate Limiting**: Prevent abuse
```typescript
import rateLimit from '@fastify/rate-limit';

// Rate limit calendar endpoints: 60 requests/hour per token
await fastify.register(rateLimit, {
  max: 60,
  timeWindow: '1 hour',
  keyGenerator: (request) => request.query.token
});
```

**Expected Performance**:
- **Calendar generation (10 events)**: 20-50ms (ical.js parsing + string generation)
- **Calendar generation (100 events)**: 100-200ms
- **With caching**: 1-5ms (memory lookup)
- **Success Criterion**: SC-016 requires < 30 seconds. Easily achieved (actual ~100ms).

---

## 5. Authentication and Authorization

### 5.1 Integration with Existing Auth

**Approach**: Extend existing user auth system from specs 001 (admin-user) and 002 (normal-users)

**Review of Existing Auth**:
- **Spec 001 (Admin Users)**: Defines Admin, Editor, Member roles with series-specific permissions
- **Spec 002 (Normal Users)**: Defines registration, login, session management (JWT or session-based)
- **Assumption**: Specs 001-002 have implemented authentication infrastructure. This spec extends with championship-specific authorization

**User Roles Mapping**:

From spec 001, three base roles exist:
1. **Admin**: Full system access, can manage all championships
2. **Editor**: Can create/edit content, can create championships
3. **Member**: Basic access, can register for championships, view content

**Championship-Specific Roles** (new for this spec):
- **Organizer**: Creator of a championship, has full control over their championship (edit events, enter results, cancel/reschedule)
- **Participant/Driver**: Registered for a championship, can view events and standings

**Authorization Model**:

```typescript
// User entity (from specs 001-002)
interface User {
  id: number;
  email: string;
  role: 'admin' | 'editor' | 'member';
  // ... other user fields
}

// Championship entity
interface Championship {
  id: number;
  name: string;
  createdBy: number; // User ID of organizer
  // ... other championship fields
}

// Authorization checks
function canManageChampionship(user: User, championship: Championship): boolean {
  // Admins can manage all championships
  if (user.role === 'admin') return true;

  // Organizer (creator) can manage their championship
  if (championship.createdBy === user.id) return true;

  return false;
}

function canCreateChampionship(user: User): boolean {
  // Editors and Admins can create championships
  return user.role === 'admin' || user.role === 'editor';
}

function canRegisterForChampionship(user: User): boolean {
  // All authenticated users can register for championships
  return true;
}

function canViewChampionship(championship: Championship): boolean {
  // All championships are publicly viewable (no private championships for MVP)
  return true;
}
```

**JWT vs Sessions**:

Recommendation based on architecture:
- **JWT**: Better for stateless API architecture, scales horizontally easily, no session storage needed
- **Sessions**: Better for traditional web apps, easier to revoke, more secure (token in httpOnly cookie)

**Recommendation**: **JWT** for this project
- **Rationale**: Backend is API-only (Fastify), frontend is SPA (React). JWT fits stateless API model better
- **Storage**: Store JWT in httpOnly cookie (prevents XSS) with secure flag (HTTPS only)
- **Refresh Tokens**: Implement refresh token pattern for long-lived sessions (access token 15min, refresh token 7 days)
- **Revocation**: Maintain token blacklist in Redis for immediate revocation if needed (e.g., role change, account deactivation)

**JWT Implementation** (Fastify):
```typescript
import jwt from '@fastify/jwt';

// Register JWT plugin
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  cookie: {
    cookieName: 'token',
    signed: false
  }
});

// Authentication hook
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify(); // Populates request.user
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Protected route
fastify.get('/api/championships/my', {
  onRequest: [fastify.authenticate]
}, async (request, reply) => {
  // request.user contains decoded JWT payload { id, email, role }
  const championships = await prisma.championship.findMany({
    where: { createdBy: request.user.id }
  });
  return championships;
});
```

---

### 5.2 Championship Permissions

**Organizer Permissions**:

Championship creator (organizer) has these permissions:
1. Edit championship details (name, rules, allowed cars, points scheme)
2. Create/edit/delete events within their championship
3. Enter and modify race results
4. Cancel or reschedule events
5. View all registered participants
6. Delete their championship (if no events have results)

**Permission Enforcement**:

1. **Middleware Approach**:
```typescript
// Middleware to check championship ownership
fastify.decorateRequest('championship', null);

const checkChampionshipOwnership = async (request, reply) => {
  await request.jwtVerify(); // Ensure authenticated

  const championshipId = parseInt(request.params.id);
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId }
  });

  if (!championship) {
    return reply.status(404).send({ error: 'Championship not found' });
  }

  // Check if user is admin or organizer
  const isAdmin = request.user.role === 'admin';
  const isOrganizer = championship.createdBy === request.user.id;

  if (!isAdmin && !isOrganizer) {
    return reply.status(403).send({ error: 'Forbidden: You do not have permission to manage this championship' });
  }

  request.championship = championship; // Attach to request for use in handler
};

// Apply to protected routes
fastify.put('/api/championships/:id', {
  onRequest: [fastify.authenticate, checkChampionshipOwnership]
}, async (request, reply) => {
  // User is authorized, proceed with update
  const updated = await prisma.championship.update({
    where: { id: request.championship.id },
    data: request.body
  });
  return updated;
});
```

2. **Authorization Patterns**:

**Pattern 1: Route-Level Authorization** (preferred for championship management)
```typescript
// Each route explicitly checks permissions via middleware
fastify.post('/championships/:id/events', {
  onRequest: [authenticate, checkChampionshipOwnership]
}, handler);
```

**Pattern 2: Service-Level Authorization** (alternative)
```typescript
// Business logic checks permissions
async function createEvent(userId: number, championshipId: number, eventData: EventDto) {
  const championship = await prisma.championship.findUnique({ where: { id: championshipId } });

  if (!canManageChampionship(userId, championship)) {
    throw new ForbiddenError('You do not have permission to manage this championship');
  }

  return prisma.event.create({ data: { ...eventData, championshipId } });
}
```

**Recommendation**: Route-level authorization (Pattern 1) for clarity and Fastify's hook system. Follows Fastify best practices and makes permissions explicit in route definitions.

---

## 6. Open Questions

These questions require product/team decisions beyond technical implementation:

1. **Private vs Public Championships**: Should championships be publicly visible or support private/invite-only championships? Current spec assumes all championships are public.

2. **Registration Approval**: Should organizers approve driver registrations or are registrations automatic? Spec implies automatic registration.

3. **Maximum Participants**: Should there be a system-wide maximum or only per-championship maximums? Spec mentions per-championship limits (FR-031).

4. **Points Scheme Modification**: When organizer modifies points scheme mid-season, should it affect all historical results retroactively (FR-038 says yes) or only future events? This has major implications for championship fairness.

5. **URL Import Sources**: Which specific racing websites should be supported initially? Recommendation: Start with Formula 1, MotoGP, IndyCar (top 3 most requested).

6. **Calendar Subscription Authentication**: Should calendar subscription URLs be public (anyone with URL can subscribe) or require authentication? Recommendation: Public for MVP (simpler), add auth if users request private championships.

7. **Multi-Organizer Championships**: Should multiple users be able to co-organize a championship? Spec doesn't mention this. Recommendation: Single organizer for MVP, add co-organizers as future enhancement.

8. **Result Modification History**: How much audit trail is needed for result changes? Spec requires audit trail (FR-020) but doesn't specify UI visibility. Recommendation: Log all changes, show to admins/organizers only.

9. **Notification Channels**: Email, in-app, both? Spec mentions notifications (FR-053) but doesn't specify channel. Recommendation: Email for MVP (simpler), add in-app notifications later.

10. **Currency/Localization**: Support for multiple languages, timezones, date formats? Spec doesn't mention. Recommendation: English + UTC for MVP, add i18n if international user base develops.

---

## 7. Recommendations Summary

**Mandatory Decisions** (required for Phase 1):

- ✅ **Runtime**: Node.js 20 LTS + TypeScript 5.x
- ✅ **Backend**: Fastify 4.x web framework
- ✅ **Frontend**: React 18+ with TypeScript
- ✅ **Database**: PostgreSQL 15+ with Prisma 5.x ORM
- ✅ **Calendar Generation**: ical.js 1.5.x for ICS file generation
- ✅ **URL Parsing**: Cheerio 1.0.x for static HTML parsing (fallback to Puppeteer only if needed)
- ✅ **Testing**: Vitest for unit tests, Supertest for integration tests, Playwright for E2E tests
- ✅ **Authentication**: JWT tokens (httpOnly cookies) extending specs 001-002
- ✅ **Standings Calculation**: SQL aggregation (no premature caching)
- ✅ **Calendar Integration**: Webcal subscription URLs for MVP (defer Google Calendar API to post-MVP)

**Architectural Patterns**:

- ✅ **Modularity**: Backend API + Frontend SPA, clear separation, documented contracts
- ✅ **Observability**: Structured logging via Pino (Fastify built-in), log all API requests/responses
- ✅ **Simplicity First**: Start with simplest solutions, optimize only when profiling shows need
- ✅ **Authorization**: Route-level authorization via Fastify hooks/middleware
- ✅ **Error Handling**: Structured errors with user-friendly messages, detailed logging
- ✅ **Performance**: SQL aggregation, connection pooling, proper indexing, HTTP caching

**Deferred to Post-MVP** (Phase 3+):

- ⏭ **Caching**: Add Redis caching only if standings calculation exceeds 500ms p95
- ⏭ **Google Calendar API**: Add direct API integration only if users request it (webcal sufficient for MVP)
- ⏭ **Puppeteer**: Add JavaScript-rendered page parsing only if users request specific SPA websites
- ⏭ **Multi-Organizer**: Allow multiple organizers per championship (single organizer sufficient for MVP)
- ⏭ **Advanced Analytics**: Detailed performance metrics, dashboards (basic view counts sufficient for MVP)
- ⏭ **Internationalization**: Multi-language support (English + UTC sufficient for MVP)

**Next Steps** (Phase 1):

1. Create detailed data model (data-model.md) based on entity relationships in spec
2. Define API contracts (contracts/) for all endpoints
3. Write quickstart guide (quickstart.md) for local development setup
4. Generate tasks (tasks.md) for incremental implementation

**Success Metrics Validation**:

All success criteria from spec are achievable with this stack:
- ✅ SC-003: Standings update within 30 seconds (SQL aggregation: <1s)
- ✅ SC-006: 100+ participants, 50+ events (PostgreSQL scales to millions of rows)
- ✅ SC-009: Championship created in <5 minutes (React form + Fastify API)
- ✅ SC-016: Calendar export in <30 seconds (ical.js generation: ~100ms)
- ✅ SC-017: Calendar subscriptions sync within 24 hours (HTTP caching headers)
- ✅ SC-018: 95% calendar app compatibility (ical.js RFC compliance)

This research provides a complete technical foundation for Phase 1 implementation planning.
