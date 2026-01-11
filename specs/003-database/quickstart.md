# Quickstart Guide: Content and Series Data Management

**Feature**: 003-database
**Date**: 2026-01-10

## Overview

This guide walks you through setting up, developing, and testing the Content and Series Data Management feature. It covers local development environment setup, database migrations, API testing for content workflows, and troubleshooting.

**Dependencies**: This feature extends the database schema from feature 001-admin-user (User, SeriesPermission tables).

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20 LTS** (check: `node --version`)
- **npm 10+** (check: `npm --version`)
- **PostgreSQL 15+** (check: `psql --version`)
- **Git** (check: `git --version`)

**Important**: Feature 001-admin-user must be implemented first, as content management depends on the User and SeriesPermission tables.

## Initial Setup

### 1. Clone Repository and Checkout Branch

```bash
# Clone the repository (if not already cloned)
git clone <repository-url> snrl-manager
cd snrl-manager

# Checkout the content management feature branch
git checkout 003-database
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

**Note**: If you already completed setup for 001-admin-user, your database and `.env` file are ready. Just run the new migrations (step 4).

```bash
# Create PostgreSQL database (skip if already exists)
createdb snrl_manager_dev

# Set up environment variables (skip if already exists)
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

# Generate Prisma client (includes new content models)
npx prisma generate

# Run migrations (creates content_series, content_items, content_versions, content_metadata tables)
npx prisma migrate dev --name add_content_management

# Seed database with sample content series and content items
npx prisma db seed
```

**Seed Data** (development only):

- Admin user: `admin@snrl.example` / `admin123` (from 001-admin-user)
- Editor user: `editor@snrl.example` / `editor123` (from 001-admin-user)
- Sample series: "iRacing Setups", "League News"
- Sample content: Published setup guide with version history

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

1. Open browser to `http://localhost:5173`
2. Login with editor credentials: `editor@snrl.example` / `editor123`
3. Navigate to "Series" section
4. You should see sample series and content

## API Testing

### Using cURL

#### 1. Login (Prerequisite)

```bash
# Login as editor and save cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@snrl.example","password":"editor123"}' \
  -c cookies.txt

# Response includes user object with role='editor'
```

#### 2. List Series

```bash
# List all series
curl http://localhost:3000/api/series \
  -b cookies.txt

# With search
curl "http://localhost:3000/api/series?search=iRacing" \
  -b cookies.txt

# Response:
# {
#   "data": [
#     {
#       "id": 1,
#       "title": "iRacing Setups",
#       "description": "Car setup guides...",
#       "created_by": 2,
#       "creator_name": "Test Editor",
#       "created_at": "2026-01-10T10:00:00Z",
#       "content_count": 5
#     }
#   ],
#   "pagination": { "page": 1, "limit": 25, "total": 2, "totalPages": 1 }
# }
```

#### 3. Create Series

```bash
curl -X POST http://localhost:3000/api/series \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Race Strategy Guides",
    "description": "Pit strategy, fuel calculations, and race tactics"
  }'

# Response: 201 Created with series object
```

#### 4. Get Series Details

```bash
curl http://localhost:3000/api/series/1 \
  -b cookies.txt

# Response includes series info + content list
```

#### 5. Create Content in Series

```bash
curl -X POST http://localhost:3000/api/series/1/content \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Mazda MX-5 Setup for Laguna Seca",
    "body": "# Setup Overview\n\nThis guide covers optimal setup for the Mazda MX-5 at Laguna Seca.\n\n## Suspension\n- Front ARB: 3 clicks\n- Rear ARB: 5 clicks\n\n## Tire Pressures\n- FL/FR: 24.5 PSI\n- RL/RR: 25.0 PSI"
  }'

# Response: 201 Created with content object
# {
#   "id": 42,
#   "series_id": 1,
#   "title": "Mazda MX-5 Setup for Laguna Seca",
#   "author_id": 2,
#   "status": "draft",
#   "current_version": 1,
#   "published_version": null,
#   ...
# }
```

#### 6. Get Content Details

```bash
curl http://localhost:3000/api/content/42 \
  -b cookies.txt

# Response includes full body content
```

#### 7. Update Content (Creates New Version)

```bash
curl -X PUT http://localhost:3000/api/content/42 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Mazda MX-5 Setup for Laguna Seca (Updated)",
    "body": "# Updated Setup\n\nRevised setup based on testing..."
  }'

# Response: 200 OK with updated content
# current_version incremented to 2
```

#### 8. Publish Content

```bash
curl -X POST http://localhost:3000/api/content/42/publish \
  -b cookies.txt

# Response: 200 OK with content object
# status='published', published_version=2, published_at=<timestamp>
```

#### 9. Edit Published Content (Creates Draft Version)

```bash
# Editing published content creates new draft version
curl -X PUT http://localhost:3000/api/content/42 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Mazda MX-5 Setup for Laguna Seca (v3)",
    "body": "# Latest Changes\n\nAdded tire compound recommendations..."
  }'

# Response: 200 OK
# current_version=3, published_version=2 (published version unchanged)
# Members still see version 2, editors see version 3 with "draft changes" indicator
```

#### 10. Re-Publish Draft Changes

```bash
# Publish the draft changes (version 3)
curl -X POST http://localhost:3000/api/content/42/publish \
  -b cookies.txt

# Response: 200 OK
# published_version=3 (now matches current_version)
# Members now see version 3
```

#### 11. View Version History

```bash
curl http://localhost:3000/api/content/42/versions \
  -b cookies.txt

# Response:
# {
#   "data": [
#     {
#       "id": 103,
#       "content_item_id": 42,
#       "version_number": 3,
#       "title": "Mazda MX-5 Setup for Laguna Seca (v3)",
#       "author_id": 2,
#       "author_name": "Test Editor",
#       "created_at": "2026-01-10T15:00:00Z",
#       "is_current": true
#     },
#     {
#       "version_number": 2,
#       "title": "Mazda MX-5 Setup for Laguna Seca (Updated)",
#       "is_current": false,
#       ...
#     },
#     {
#       "version_number": 1,
#       "title": "Mazda MX-5 Setup for Laguna Seca",
#       "is_current": false,
#       ...
#     }
#   ]
# }
```

#### 12. Get Specific Version

```bash
curl http://localhost:3000/api/content/42/versions/1 \
  -b cookies.txt

# Response: Version 1 with full title and body snapshot
```

#### 13. Restore Old Version

```bash
# Restore version 1 (creates new version 4 with version 1's content)
curl -X POST http://localhost:3000/api/content/42/versions/1/restore \
  -b cookies.txt

# Response: 200 OK
# {
#   "content": { "id": 42, "current_version": 4, ... },
#   "newVersion": { "version_number": 4, "title": "Mazda MX-5 Setup for Laguna Seca", ... }
# }
# Version 4 is created with content from version 1
```

#### 14. Archive Content

```bash
curl -X POST http://localhost:3000/api/content/42/archive \
  -b cookies.txt

# Response: 200 OK
# status='archived' (hidden from members, visible to editors)
```

#### 15. Record View (Member Action)

```bash
# Login as member first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@snrl.example","password":"member123"}' \
  -c member_cookies.txt

# Record view on published content
curl -X POST http://localhost:3000/api/content/42/view \
  -b member_cookies.txt

# Response: 200 OK
# { "success": true, "view_count": 43 }
```

#### 16. Get Content Metadata

```bash
# Switch back to editor cookies
curl http://localhost:3000/api/content/42/metadata \
  -b cookies.txt

# Response:
# {
#   "content_item_id": 42,
#   "view_count": 43,
#   "unique_viewer_count": 15,
#   "last_viewed_at": "2026-01-10T16:30:00Z"
# }
```

#### 17. Search Content

```bash
# Full-text search
curl "http://localhost:3000/api/content/search?q=mazda+setup" \
  -b cookies.txt

# Search with filters
curl "http://localhost:3000/api/content/search?q=setup&series=1&status=published" \
  -b cookies.txt

# Response: paginated list of matching content
```

#### 18. Get Series Analytics

```bash
curl http://localhost:3000/api/series/1/analytics \
  -b cookies.txt

# Response:
# {
#   "series_id": 1,
#   "total_content": 5,
#   "total_views": 250,
#   "avg_views_per_content": 50.0,
#   "most_popular": [
#     { "id": 42, "title": "...", "view_count": 120 },
#     { "id": 43, "title": "...", "view_count": 80 },
#     ...
#   ]
# }
```

#### 19. Delete Series (Soft-Delete with Cascade)

```bash
curl -X DELETE http://localhost:3000/api/series/1 \
  -b cookies.txt

# Response:
# {
#   "success": true,
#   "archivedCount": 5,
#   "message": "Series deleted and 5 content items archived"
# }
```

### Using Postman/Insomnia

1. Import `specs/003-database/contracts/openapi.yaml` as OpenAPI 3.0 spec
2. Set base URL: `http://localhost:3000/api`
3. Login endpoint automatically sets cookie for subsequent requests
4. All endpoints are documented with request/response examples

### Using VS Code REST Client

Create `content-test.http`:

```http
### Variables
@baseUrl = http://localhost:3000/api
@editorEmail = editor@snrl.example
@editorPassword = editor123

### Login as Editor
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "{{editorEmail}}",
  "password": "{{editorPassword}}"
}

### List Series
GET {{baseUrl}}/series?page=1&limit=10

### Create Series
POST {{baseUrl}}/series
Content-Type: application/json

{
  "title": "Test Series",
  "description": "Created via REST Client"
}

### Create Content in Series
POST {{baseUrl}}/series/1/content
Content-Type: application/json

{
  "title": "Test Content Item",
  "body": "# Test\n\nThis is test content."
}

### Get Content Details
GET {{baseUrl}}/content/42

### Update Content
PUT {{baseUrl}}/content/42
Content-Type: application/json

{
  "title": "Updated Title",
  "body": "# Updated Content\n\nRevised body text."
}

### Publish Content
POST {{baseUrl}}/content/42/publish

### View Version History
GET {{baseUrl}}/content/42/versions

### Restore Version
POST {{baseUrl}}/content/42/versions/1/restore

### Search Content
GET {{baseUrl}}/content/search?q=test&status=published
```

## Running Tests

### Unit Tests

```bash
cd backend

# Run all unit tests
npm run test

# Run specific test file
npm run test -- content.service.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Key Test Files**:
- `tests/unit/services/series.service.test.ts` - Series CRUD logic
- `tests/unit/services/content.service.test.ts` - Content lifecycle and versioning
- `tests/unit/services/version.service.test.ts` - Version history and restoration
- `tests/unit/services/metadata.service.test.ts` - View tracking

### Integration Tests

```bash
cd backend

# Run API integration tests
npm run test:integration

# Run specific integration test
npm run test:integration -- series.routes.test.ts
```

**Key Test Files**:
- `tests/integration/api/series.routes.test.ts` - Series API endpoints
- `tests/integration/api/content.routes.test.ts` - Content API endpoints
- `tests/integration/api/versions.routes.test.ts` - Version API endpoints
- `tests/integration/api/search.routes.test.ts` - Search and filtering

### End-to-End Tests

```bash
cd frontend

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests in UI mode (visual)
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- series-management.spec.ts
```

**Key Test Files**:
- `tests/e2e/editor/series-management.spec.ts` - Series creation and management
- `tests/e2e/editor/content-editing.spec.ts` - Content creation and editing
- `tests/e2e/editor/version-restore.spec.ts` - Version history and restoration
- `tests/e2e/member/content-browsing.spec.ts` - Member content browsing
- `tests/e2e/member/content-viewing.spec.ts` - Member content viewing and view tracking

## Database Management

### Prisma Studio (Database GUI)

```bash
cd backend

# Open Prisma Studio in browser
npx prisma studio
```

Navigate to:
- `content_series` table to view series
- `content_items` table to view content
- `content_versions` table to view version history
- `content_metadata` table to view analytics

### View Database Schema

```bash
cd backend

# View current schema
npx prisma db pull

# Introspect database
npx prisma introspect
```

### Reset Database

```bash
cd backend

# Reset database and re-run all migrations
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Re-run all migrations
# 3. Run seed script
```

### Create New Migration

```bash
cd backend

# After modifying schema.prisma
npx prisma migrate dev --name <migration_name>

# Example:
npx prisma migrate dev --name add_content_tags
```

## Debugging

### Backend Debugging (Node.js)

**VS Code `launch.json`**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/index.ts",
      "preLaunchTask": "npm: dev",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

Set breakpoints in `backend/src/services/content.service.ts` or other files.

### Frontend Debugging (React)

Use browser DevTools:

1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Find React components under `webpack://`
4. Set breakpoints in component logic

### Database Query Debugging

Enable Prisma query logging in `backend/.env`:

```env
# Add to .env
DATABASE_URL="postgresql://...?schema=public&connection_limit=10&pool_timeout=20"
DEBUG="prisma:query"
```

All database queries will be logged to console with timing information.

### Inspecting Version History

```bash
# Connect to PostgreSQL
psql snrl_manager_dev

# View all versions for content item 42
SELECT version_number, title, author_id, created_at, is_current
FROM content_versions
WHERE content_item_id = 42
ORDER BY version_number DESC;

# View content metadata
SELECT ci.id, ci.title, ci.status, ci.current_version, ci.published_version,
       cm.view_count, cm.last_viewed_at
FROM content_items ci
LEFT JOIN content_metadata cm ON cm.content_item_id = ci.id
WHERE ci.series_id = 1;
```

### Viewing Application Logs

**Backend Logs** (Pino structured logging):

```bash
cd backend

# View logs in development
npm run dev

# Logs are automatically formatted for readability in development
# In production, logs are JSON for machine parsing
```

**Example Log Output**:

```json
{
  "level": 30,
  "time": 1704891234567,
  "msg": "Content created",
  "contentId": 42,
  "seriesId": 1,
  "authorId": 2,
  "status": "draft"
}
```

## Troubleshooting

### Database Connection Errors

**Error**: `Can't reach database server at localhost:5432`

**Solution**:

```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL if not running
# macOS (Homebrew):
brew services start postgresql

# Linux (systemd):
sudo systemctl start postgresql
```

### Migration Failures

**Error**: `Migration failed to apply`

**Solution**:

```bash
# Check migration status
npx prisma migrate status

# Reset database and re-run migrations
npx prisma migrate reset

# If specific migration is problematic, delete it and re-create
rm backend/prisma/migrations/<migration_folder>
npx prisma migrate dev
```

### Full-Text Search Not Working

**Error**: Search returns no results or errors

**Solution**:

Ensure PostgreSQL full-text search trigger is created:

```sql
-- Connect to database
psql snrl_manager_dev

-- Create trigger (if not exists)
CREATE TRIGGER content_items_search_vector_update
BEFORE INSERT OR UPDATE ON content_items
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, body);

-- Rebuild search vectors for existing content
UPDATE content_items SET search_vector = to_tsvector('english', title || ' ' || body);
```

### Version Conflicts

**Error**: Multiple versions marked as `is_current=true`

**Solution**:

This indicates a concurrency bug. Fix manually:

```sql
-- Find content with multiple current versions
SELECT content_item_id, COUNT(*) as current_count
FROM content_versions
WHERE is_current = true
GROUP BY content_item_id
HAVING COUNT(*) > 1;

-- Fix by marking only highest version as current
UPDATE content_versions SET is_current = false
WHERE content_item_id = <id>;

UPDATE content_versions SET is_current = true
WHERE content_item_id = <id> AND version_number = (
  SELECT MAX(version_number) FROM content_versions WHERE content_item_id = <id>
);
```

### Draft Content Visible to Members

**Error**: Members see draft or archived content

**Solution**:

Check authorization logic in `content.service.ts`:

```typescript
// Ensure this check exists
function getContentForUser(contentId: number, user: User) {
  const content = await prisma.contentItem.findUnique({ where: { id: contentId } });

  // Members only see published content
  if (user.role === 'member' && content.status !== 'published') {
    throw new ForbiddenError('Content not available');
  }

  return content;
}
```

## Performance Monitoring

### Query Performance

Enable query timing in Prisma:

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### API Response Times

Check Fastify logs for response times:

```bash
# Look for 'responseTime' in logs
npm run dev | grep responseTime
```

## Security Checklist (Pre-Deployment)

Before deploying to production:

- [ ] Change default admin/editor passwords
- [ ] Set strong `JWT_SECRET` (minimum 32 characters)
- [ ] Enable HTTPS (update `CORS_ORIGIN` to https://)
- [ ] Set `NODE_ENV=production`
- [ ] Enable rate limiting on API endpoints
- [ ] Configure PostgreSQL connection pooling
- [ ] Set up database backups
- [ ] Review and test all authorization checks
- [ ] Test that members cannot view draft/archived content
- [ ] Verify version history is immutable
- [ ] Ensure content body size limits are enforced (100KB max)

## Next Steps

After completing local development:

1. **Run full test suite**: `npm run test && npm run test:integration && npm run test:e2e`
2. **Review code coverage**: `npm run test:coverage` (aim for >80%)
3. **Test all user scenarios from spec**: Complete acceptance scenarios from User Stories 1-7
4. **Performance testing**: Verify search with 10k+ content items meets <2s requirement
5. **Deploy to staging**: Test in staging environment before production
6. **Monitor logs**: Set up log aggregation (e.g., Datadog, LogDNA) for production

## Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Fastify Docs**: https://www.fastify.io/docs/latest/
- **PostgreSQL Full-Text Search**: https://www.postgresql.org/docs/current/textsearch.html
- **React Docs**: https://react.dev
- **Vitest Docs**: https://vitest.dev
- **Playwright Docs**: https://playwright.dev
