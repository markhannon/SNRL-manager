# SNRL Manager

Content and Series Management System for Simracing North Regional League

## Overview

SNRL Manager is a web application for managing simracing content, series, and championships. This implementation currently includes the **MVP** (Minimum Viable Product) covering:

- **User Story 1**: Series Management (Complete)
- **User Story 2**: Content Creation with Versioning (In Progress)

## Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Fastify 4.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with bcrypt
- **Logging**: Pino

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript 5.x
- **Build Tool**: Vite
- **Styling**: Inline CSS (for MVP)

## Project Structure

```
SNRL-manager/
├── backend/
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── middleware/   # Auth & authorization
│   │   ├── models/       # TypeScript types
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities (validation, logger, etc.)
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   └── services/     # API client
│   └── package.json
└── specs/                # Feature specifications
```

## Current Implementation Status

### ✅ Completed (48 tasks)

**Phase 1: Setup** (4 tasks)
- Project directory structure created
- Backend and frontend scaffolding

**Phase 2: Foundational** (12 tasks)
- Prisma schema with 4 entities: ContentSeries, ContentItem, ContentVersion, ContentMetadata
- Database migrations with PostgreSQL full-text search trigger
- Validation utilities for content title/body size limits
- Authorization middleware for series-specific permissions
- Model type definitions for all entities

**Phase 3: User Story 1 - Series Management** (13 tasks)
- SeriesService with full CRUD operations
- Series API routes (GET/POST/PUT/DELETE)
- Authentication & authorization middleware
- React components: SeriesList, SeriesForm, SeriesCard
- SeriesPage integrating all components
- Frontend series service and React hooks

### 🚧 Not Yet Implemented

**Phase 4: User Story 2 - Content Creation with Versioning** (19 tasks)
- ContentService with atomic version creation
- VersionService for version history
- Content API routes
- React components for content editing
- Version history UI

## Database Schema

The system uses PostgreSQL with Prisma ORM. Key entities:

- **ContentSeries**: Organizational containers for content
- **ContentItem**: Individual content with lifecycle (draft/published/archived)
- **ContentVersion**: Immutable version snapshots
- **ContentMetadata**: View tracking and analytics
- **User**: From feature 001-admin-user (authentication)
- **SeriesPermission**: From feature 001-admin-user (authorization)

## Development Setup

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run prisma:migrate
npm run dev
```

The backend will start on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Series Management

- `GET /api/series` - List all series (with pagination, search, filters)
- `POST /api/series` - Create new series (Editor/Admin only)
- `GET /api/series/:id` - Get series by ID
- `PUT /api/series/:id` - Update series (Editor/Admin only)
- `DELETE /api/series/:id` - Soft-delete series (Editor/Admin only)

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

## Features Implemented

### Series Management (US1)
- ✅ Create series with title and description
- ✅ List series with pagination and search
- ✅ Update series metadata
- ✅ Soft-delete series
- ✅ Content count tracking per series
- ✅ Role-based access control (Editor/Admin required)

## Next Steps

To complete the MVP:

1. Implement **Phase 4: User Story 2** - Content Creation with Versioning (19 tasks)
   - ContentService with atomic transactions
   - Version management
   - Content editing UI
   - Version history display

This will deliver the complete MVP with series creation and content management with full version history.

## Documentation

- Feature specifications: `specs/003-database/`
- Implementation plan: `specs/003-database/plan.md`
- Data model: `specs/003-database/data-model.md`
- API contracts: `specs/003-database/contracts/openapi.yaml`
- Task breakdown: `specs/003-database/tasks.md`

## License

MIT
