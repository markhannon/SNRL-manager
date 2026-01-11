# Quickstart Guide: Simracing Championship Series

**Feature**: 004-simracing-series
**Date**: 2026-01-09

## Overview

The Simracing Championship Series feature enables organizers to create and manage full-season racing championships with multiple events, race sessions, and automated standings calculation. Drivers can register for championships, view events and results, and export calendars to their personal calendar applications.

**Key Capabilities**:
- Create championships with simulator-specific configurations, points schemes, and allowed cars
- Schedule events with tracks, race lengths, and multiple race sessions
- Enter race results with penalties, DNF/DNS handling, and draft/published workflow
- View automatically calculated championship standings with tie-breaking
- Export championship calendars to ICS format or subscribe for auto-updates
- Import championship schedules from external racing websites
- Cancel or reschedule events with participant notifications

## Prerequisites

Before setting up the local development environment, ensure you have:

- **Node.js 20 LTS** or later (check with `node --version`)
- **PostgreSQL 15+** (check with `psql --version`)
- **npm** or **yarn** package manager
- **Git** for version control

## Local Development Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd SNRL-manager

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb snrl_manager_dev

# Or using psql
psql -U postgres
CREATE DATABASE snrl_manager_dev;
\q

# Configure environment variables
cd backend
cp .env.example .env
```

Edit `.env` file with your database credentials:

```env
# Database connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/snrl_manager_dev"

# JWT authentication (from specs 001-002)
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRY="15m"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRY="7d"

# Application
NODE_ENV="development"
PORT=3001

# Calendar subscription base URL
CALENDAR_BASE_URL="http://localhost:3001"
```

```bash
# Run Prisma migrations to create database schema
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

### 3. Seed Data (Optional)

Populate the database with sample data for testing:

```bash
# Run seed script
npm run db:seed
```

This creates:
- Sample users (organizer, drivers)
- Sample points schemes (F1-style, MotoGP-style)
- Sample championships with events and results
- Sample registrations and standings

### 4. Start Development Servers

Open two terminal windows:

**Terminal 1: Backend (Fastify API server)**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:3001

**Terminal 2: Frontend (React development server)**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

### 5. Verify Setup

Open your browser to http://localhost:3000

- Log in with seed user credentials (see seed script output)
- Navigate to Championships page
- View sample championship with events and standings

## API Quick Examples

All API examples assume:
- Backend running on http://localhost:3001
- Authentication token obtained via login (specs 001-002)
- Replace `<token>` with your actual JWT token

### Authentication

First, obtain a JWT token by logging in:

```bash
# Login (from specs 001-002)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@example.com",
    "password": "password123"
  }'

# Response includes token:
# { "token": "eyJhbGc...", "user": { ... } }
```

Use the token in subsequent requests:
```bash
Authorization: Bearer eyJhbGc...
```

### Create a Championship

```bash
curl -X POST http://localhost:3001/api/championships \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2026 iRacing GT3 World Championship",
    "description": "Global GT3 championship featuring legendary circuits",
    "simulator": "iRacing",
    "seasonStart": "2026-03-01",
    "seasonEnd": "2026-10-31",
    "pointsSchemeId": 1,
    "allowedCars": [
      "BMW M4 GT3",
      "Porsche 911 GT3 R (992)",
      "Ferrari 296 GT3",
      "Mercedes-AMG GT3 2020"
    ],
    "rulesText": "Standard GT3 regulations apply. No custom setups allowed.",
    "maxParticipants": 50
  }'
```

**Response (201 Created)**:
```json
{
  "id": 1,
  "name": "2026 iRacing GT3 World Championship",
  "simulator": "iRacing",
  "status": "DRAFT",
  "seasonStart": "2026-03-01",
  "seasonEnd": "2026-10-31",
  "pointsSchemeId": 1,
  "createdBy": 123,
  "createdAt": "2026-01-09T10:00:00Z"
}
```

### List Championships

```bash
# Get all championships
curl http://localhost:3001/api/championships

# Filter by simulator
curl http://localhost:3001/api/championships?simulator=iRacing

# Filter by status
curl http://localhost:3001/api/championships?status=ACTIVE

# Search by name
curl http://localhost:3001/api/championships?search=GT3

# Paginated results
curl http://localhost:3001/api/championships?limit=25&offset=0
```

### Create an Event

```bash
curl -X POST http://localhost:3001/api/championships/1/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Round 1: Spa-Francorchamps",
    "track": "Circuit de Spa-Francorchamps",
    "eventDate": "2026-03-15T14:00:00Z",
    "raceLengthValue": 60,
    "raceLengthUnit": "MINUTES"
  }'
```

**Response (201 Created)**:
```json
{
  "id": 1,
  "championshipId": 1,
  "name": "Round 1: Spa-Francorchamps",
  "track": "Circuit de Spa-Francorchamps",
  "eventDate": "2026-03-15T14:00:00Z",
  "status": "SCHEDULED",
  "raceLengthValue": 60,
  "raceLengthUnit": "MINUTES",
  "createdAt": "2026-01-09T10:05:00Z"
}
```

### List Events for Championship

```bash
# Get all events for championship
curl http://localhost:3001/api/championships/1/events

# Filter by status
curl http://localhost:3001/api/championships/1/events?status=SCHEDULED
```

### Register for Championship

```bash
curl -X POST http://localhost:3001/api/championships/1/register \
  -H "Authorization: Bearer <token>"
```

**Response (201 Created)**:
```json
{
  "id": 1,
  "championshipId": 1,
  "driverId": 456,
  "status": "ACTIVE",
  "registeredAt": "2026-01-09T10:10:00Z"
}
```

### Enter Race Results

Results are entered as drafts, then published when finalized:

```bash
curl -X POST http://localhost:3001/api/events/1/results \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "results": [
      {
        "driverId": 101,
        "finishingPosition": 1,
        "resultStatus": "CLASSIFIED",
        "penalties": []
      },
      {
        "driverId": 102,
        "finishingPosition": 2,
        "resultStatus": "CLASSIFIED",
        "penalties": [
          {
            "type": "TIME_PENALTY",
            "value": 5,
            "reason": "Track limits violation at Eau Rouge"
          }
        ]
      },
      {
        "driverId": 103,
        "finishingPosition": null,
        "resultStatus": "DNF",
        "penalties": []
      },
      {
        "driverId": 104,
        "finishingPosition": 3,
        "resultStatus": "CLASSIFIED",
        "penalties": []
      }
    ]
  }'
```

**Response (201 Created)**:
```json
{
  "data": [
    {
      "id": 1,
      "eventId": 1,
      "driverId": 101,
      "finishingPosition": 1,
      "pointsAwarded": 25,
      "isDraft": true
    },
    {
      "id": 2,
      "eventId": 1,
      "driverId": 102,
      "finishingPosition": 2,
      "pointsAwarded": 18,
      "penalties": [
        {
          "type": "TIME_PENALTY",
          "value": 5,
          "reason": "Track limits violation at Eau Rouge"
        }
      ],
      "isDraft": true
    }
  ],
  "isDraft": true
}
```

### Publish Results

Publishing results makes them final and triggers standings calculation:

```bash
curl -X POST http://localhost:3001/api/events/1/results/publish \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK)**:
```json
{
  "published": true,
  "publishedAt": "2026-01-09T10:30:00Z",
  "resultsCount": 20,
  "standingsUpdated": true
}
```

### View Championship Standings

```bash
curl http://localhost:3001/api/championships/1/standings
```

**Response (200 OK)**:
```json
{
  "championshipId": 1,
  "lastCalculated": "2026-01-09T10:30:00Z",
  "standings": [
    {
      "position": 1,
      "driverId": 101,
      "driverName": "John Smith",
      "totalPoints": 43,
      "eventsParticipated": 2,
      "wins": 1,
      "podiums": 2,
      "bestFinish": 1,
      "pointsBreakdown": [
        { "eventId": 1, "eventName": "Round 1: Spa", "points": 25, "position": 1 },
        { "eventId": 2, "eventName": "Round 2: Monza", "points": 18, "position": 2 }
      ]
    },
    {
      "position": 2,
      "driverId": 102,
      "driverName": "Jane Doe",
      "totalPoints": 36,
      "eventsParticipated": 2,
      "wins": 0,
      "podiums": 2,
      "bestFinish": 2
    }
  ]
}
```

### Cancel an Event

```bash
curl -X POST http://localhost:3001/api/events/1/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Insufficient participants signed up for this event"
  }'
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "status": "CANCELLED",
  "cancellationReason": "Insufficient participants signed up for this event",
  "cancelledAt": "2026-01-09T11:00:00Z",
  "cancelledBy": 123
}
```

### Reschedule an Event

```bash
curl -X POST http://localhost:3001/api/events/1/reschedule \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newDate": "2026-04-15T14:00:00Z"
  }'
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "eventDate": "2026-04-15T14:00:00Z",
  "originalEventDate": "2026-03-15T14:00:00Z",
  "rescheduleDateHistory": ["2026-03-15T14:00:00Z"]
}
```

### Export Calendar

```bash
# Download ICS file
curl http://localhost:3001/api/championships/1/calendar.ics > championship.ics

# Import into calendar application
# macOS: open championship.ics
# Windows: start championship.ics
# Linux: xdg-open championship.ics
```

**ICS File Format**:
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SNRL Manager//EN
BEGIN:VEVENT
SUMMARY:2026 iRacing GT3 Championship - Round 1: Spa-Francorchamps
DTSTART:20260315T140000Z
DTEND:20260315T150000Z
LOCATION:Circuit de Spa-Francorchamps
DESCRIPTION:Track: Circuit de Spa-Francorchamps\nRace Length: 60 minutes
URL:http://localhost:3000/championships/1/events/1
END:VEVENT
END:VCALENDAR
```

### Create Calendar Subscription

Get a subscription URL for automatic calendar updates:

```bash
curl -X POST http://localhost:3001/api/championships/1/calendar/subscribe \
  -H "Authorization: Bearer <token>"
```

**Response (201 Created)**:
```json
{
  "subscriptionUrl": "webcal://localhost:3001/calendar/feed/abc123xyz789def456ghi012",
  "token": "abc123xyz789def456ghi012",
  "expiresAt": null
}
```

**Use Subscription URL**:
- **Google Calendar**: Settings → Add calendar → From URL → Paste `webcal://...`
- **Apple Calendar**: File → New Calendar Subscription → Paste URL
- **Outlook**: Add Calendar → From Internet → Paste URL

### Import Championship from URL

```bash
# Step 1: Initiate import
curl -X POST http://localhost:3001/api/championships/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://www.formula1.com/en/racing/2026"
  }'
```

**Response (201 Created)**:
```json
{
  "importId": 1,
  "status": "ready_for_review",
  "parsedData": {
    "name": "2026 Formula 1 World Championship",
    "seasonStart": "2026-03-01",
    "seasonEnd": "2026-11-30",
    "events": [
      { "name": "Bahrain Grand Prix", "date": "2026-03-01", "track": "Bahrain International Circuit" },
      { "name": "Saudi Arabian Grand Prix", "date": "2026-03-15", "track": "Jeddah Corniche Circuit" }
    ]
  }
}
```

```bash
# Step 2: Finalize import with simulator and track mappings
curl -X POST http://localhost:3001/api/championships/import/1/finalize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "simulator": "iRacing",
    "pointsSchemeId": 1,
    "trackMappings": {
      "Bahrain International Circuit": "Bahrain International Circuit - Grand Prix",
      "Jeddah Corniche Circuit": "Jeddah Corniche Circuit"
    },
    "allowedCars": ["Formula 1 2024"]
  }'
```

**Response (201 Created)**:
```json
{
  "id": 2,
  "name": "2026 Formula 1 World Championship",
  "status": "DRAFT",
  "simulator": "iRacing",
  "eventCount": 20
}
```

## Testing

### Run Unit Tests

```bash
cd backend
npm test

# Watch mode for development
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Run Integration Tests

```bash
npm run test:integration
```

Integration tests cover:
- All API endpoints (championships, events, results, standings)
- Authentication and authorization
- Database operations
- Calendar generation
- URL import workflow

### Run E2E Tests

```bash
cd frontend
npm run test:e2e
```

E2E tests cover critical user journeys:
- Organizer creates championship and adds events
- Driver registers for championship
- Organizer enters results and publishes
- Driver views standings
- Calendar export and subscription

### Run Specific Test File

```bash
# Backend
cd backend
npm test -- services/standings.test.ts

# Frontend
cd frontend
npm test -- src/components/Championship.test.tsx
```

## Common Development Tasks

### Add a New Database Migration

When you modify the Prisma schema:

```bash
cd backend

# Edit schema
vim prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_feature_description

# Example migration names:
# - add_event_notes_field
# - create_team_entity
# - add_qualifying_bonus_points
```

This:
1. Generates SQL migration file in `prisma/migrations/`
2. Applies migration to development database
3. Regenerates Prisma Client with new schema

### Reset Database

Warning: This deletes all data!

```bash
cd backend

# Reset database to clean state
npx prisma migrate reset

# Re-seed with sample data
npm run db:seed
```

### View Database with Prisma Studio

```bash
cd backend
npx prisma studio
```

Opens browser-based database GUI at http://localhost:5555

- View and edit all tables
- Run queries
- Explore relationships

### Update Dependencies

```bash
# Backend
cd backend
npm outdated
npm update

# Frontend
cd frontend
npm outdated
npm update

# Update specific package
npm install <package>@latest
```

### Generate OpenAPI Documentation

The OpenAPI spec is maintained at `specs/004-simracing-series/contracts/openapi.yaml`.

View interactive API documentation:

```bash
# Install Swagger UI locally (optional)
npx @redocly/cli preview-docs specs/004-simracing-series/contracts/openapi.yaml

# Opens browser with interactive API docs
```

Or use online viewer:
1. Copy contents of `openapi.yaml`
2. Go to https://editor.swagger.io
3. Paste and explore

### Debug Backend API

Enable debug logging:

```env
# .env
LOG_LEVEL=debug
```

```bash
cd backend
npm run dev
```

Logs show:
- All SQL queries with execution time
- Request/response bodies
- Authentication flow
- Standings calculation steps

### Debug Frontend

React DevTools extension:
- Install React DevTools browser extension
- Open DevTools → Components tab
- Inspect component state, props, hooks

Console logging:
```typescript
console.log('Championship data:', championship);
```

## Troubleshooting

### Database Connection Errors

**Error**: `Connection to database failed`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -l | grep snrl_manager_dev`
3. Verify credentials in `.env` match PostgreSQL user
4. Test connection: `psql -U postgres -d snrl_manager_dev`

### Prisma Migration Errors

**Error**: `Migration failed to apply`

**Solution**:
1. Check PostgreSQL logs for details
2. Reset database: `npx prisma migrate reset`
3. If stuck, manually drop database and recreate:
   ```bash
   dropdb snrl_manager_dev
   createdb snrl_manager_dev
   npx prisma migrate dev
   ```

### Port Already in Use

**Error**: `Port 3001 already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3002
```

### JWT Token Expired

**Error**: `401 Unauthorized - Token expired`

**Solution**:
1. Log in again to get new token
2. Increase token expiry in `.env` for development:
   ```env
   JWT_EXPIRY="24h"
   ```

### Calendar Not Updating

**Issue**: Subscribed calendar not showing new events

**Explanation**: Calendar applications refresh subscriptions every 12-24 hours.

**Solution**:
- Force refresh in calendar app (varies by application)
- Google Calendar: Remove and re-add subscription
- Apple Calendar: Calendar → Preferences → Accounts → Refresh

### Standings Not Calculating

**Issue**: Standings show incorrect points or positions

**Solution**:
1. Verify results are published (not draft)
2. Check event status is not CANCELLED
3. Manually recalculate standings:
   ```bash
   # If standings service has recalculate endpoint
   curl -X POST http://localhost:3001/api/championships/1/standings/recalculate \
     -H "Authorization: Bearer <token>"
   ```

### Import Parsing Fails

**Error**: `Failed to parse championship from URL`

**Solution**:
1. Verify URL is accessible: `curl <url>`
2. Check if website changed structure (common with external sites)
3. Check import logs for specific parsing errors
4. Use manual championship creation as fallback

## Next Steps

After setting up the local environment:

1. **Review Documentation**:
   - [data-model.md](./data-model.md) - Database schema and design decisions
   - [contracts/openapi.yaml](./contracts/openapi.yaml) - Complete API specification
   - [../plan.md](./plan.md) - Implementation plan and tasks (Phase 2)

2. **Explore Codebase**:
   - `backend/src/routes/` - API endpoint implementations
   - `backend/src/services/` - Business logic (standings calculation, calendar generation)
   - `backend/prisma/schema.prisma` - Database schema
   - `frontend/src/components/` - React components

3. **Try Sample Workflows**:
   - Create a test championship with your favorite simulator
   - Add events for a realistic season schedule
   - Register as a driver
   - Enter results and view standings
   - Export calendar to your personal calendar

4. **Run Tests**:
   - Execute full test suite to verify setup
   - Write tests for new features you develop
   - Maintain test coverage above 80%

5. **Contribute**:
   - Check existing issues and PRs
   - Follow coding standards and commit conventions
   - Write tests for new features
   - Update documentation for API changes

## Additional Resources

### API Documentation
- OpenAPI Spec: `specs/004-simracing-series/contracts/openapi.yaml`
- Interactive Docs: Run `npx @redocly/cli preview-docs` in spec directory

### Database Schema
- Prisma Schema: `backend/prisma/schema.prisma`
- ER Diagram: Generate with `npx prisma-erd-generator`
- Data Model Docs: `specs/004-simracing-series/data-model.md`

### Development Tools
- Prisma Studio: `npx prisma studio` (database GUI)
- Fastify DevTools: Built-in logging and request inspection
- React DevTools: Browser extension for component debugging

### Learning Resources
- Fastify Docs: https://www.fastify.io/docs/latest/
- Prisma Docs: https://www.prisma.io/docs/
- React Docs: https://react.dev/
- PostgreSQL Docs: https://www.postgresql.org/docs/

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas
- Contributing Guide: See CONTRIBUTING.md for guidelines

## Development Workflow Summary

**Typical feature development cycle**:

1. **Create feature branch**: `git checkout -b feature/add-qualifying-sessions`
2. **Update schema** (if needed): Edit `prisma/schema.prisma`
3. **Create migration**: `npx prisma migrate dev --name add_qualifying_sessions`
4. **Update API contracts**: Modify `contracts/openapi.yaml`
5. **Implement backend**: Add routes, services, validation
6. **Write backend tests**: Unit and integration tests
7. **Implement frontend**: Components, hooks, API calls
8. **Write frontend tests**: Component and E2E tests
9. **Test locally**: Run full test suite, manual testing
10. **Commit and push**: `git commit -m "Add qualifying session support"`
11. **Create PR**: Request review, address feedback
12. **Merge**: After approval and CI passing

**Code quality checks**:
- TypeScript compilation: `npm run build`
- Linting: `npm run lint`
- Type checking: `npx tsc --noEmit`
- Tests: `npm test`
- Test coverage: `npm test -- --coverage`

Follow the project constitution principles:
- **Simplicity First**: Solve known problems, avoid premature optimization
- **Modularity**: Clear separation between API, services, database
- **Observability**: Structured logging, error tracking, query logging
- **Quality**: Comprehensive tests, type safety, code review

Happy coding!
