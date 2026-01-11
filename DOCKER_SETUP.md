# Docker Development Environment

This guide explains how to set up the SNRL-manager development environment using Docker.

## Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- Node.js 20+ LTS installed locally (for running the app)

## Quick Start

### 1. Start Docker Containers

```bash
# Start all services (PostgreSQL, Redis, pgAdmin)
docker-compose up -d

# Check that all containers are running
docker-compose ps
```

Expected output:
```
NAME             IMAGE                  STATUS        PORTS
snrl-postgres    postgres:16-alpine     Up (healthy)  0.0.0.0:5432->5432/tcp
snrl-redis       redis:7-alpine         Up (healthy)  0.0.0.0:6379->6379/tcp
snrl-pgadmin     dpage/pgadmin4:latest  Up            0.0.0.0:5050->80/tcp
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example backend/.env

# The default configuration should work with Docker setup:
# DATABASE_URL="postgresql://snrl_user:snrl_password@localhost:5432/snrl_manager?schema=public"
```

### 3. Initialize the Database

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 4. Start the Application

```bash
# Terminal 1: Start the backend
cd backend
npm run dev

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@snrl.local / admin)

## Services

### PostgreSQL Database

- **Port**: 5432
- **Database**: snrl_manager
- **User**: snrl_user
- **Password**: snrl_password
- **Connection String**: `postgresql://snrl_user:snrl_password@localhost:5432/snrl_manager`

### Redis (Optional)

- **Port**: 6379
- **Connection String**: `redis://localhost:6379`
- Currently not used by the application but available for future features (caching, sessions)

### pgAdmin (Database Management UI)

- **URL**: http://localhost:5050
- **Email**: admin@snrl.local
- **Password**: admin

To connect to the database in pgAdmin:
1. Open http://localhost:5050
2. Login with the credentials above
3. Right-click "Servers" → "Register" → "Server"
4. General tab: Name = "SNRL Local"
5. Connection tab:
   - Host: host.docker.internal (Mac/Windows) or 172.17.0.1 (Linux)
   - Port: 5432
   - Database: snrl_manager
   - Username: snrl_user
   - Password: snrl_password

## Docker Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f postgres
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data!)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart postgres
```

### Database Management

```bash
# Connect to PostgreSQL directly
docker exec -it snrl-postgres psql -U snrl_user -d snrl_manager

# Backup database
docker exec snrl-postgres pg_dump -U snrl_user snrl_manager > backup.sql

# Restore database
docker exec -i snrl-postgres psql -U snrl_user -d snrl_manager < backup.sql

# Reset database (WARNING: deletes all data!)
docker-compose down -v postgres
docker-compose up -d postgres
cd backend && npx prisma migrate dev --name init
```

## Troubleshooting

### Port Already in Use

If you get "port already allocated" errors:

```bash
# Check what's using the port
lsof -i :5432  # For PostgreSQL
lsof -i :6379  # For Redis
lsof -i :5050  # For pgAdmin

# Either stop the conflicting service or change the port in docker-compose.yml
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running and healthy
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec snrl-postgres pg_isready -U snrl_user -d snrl_manager

# Verify environment variables
cat backend/.env | grep DATABASE_URL
```

### Reset Everything

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Reinitialize database
cd backend
npx prisma migrate dev --name init
```

## Production Considerations

This Docker setup is for **local development only**. For production:

1. Use stronger passwords
2. Don't expose pgAdmin
3. Use Docker secrets for sensitive data
4. Configure proper backups
5. Use managed database services (AWS RDS, etc.)
6. Enable SSL for database connections
7. Set up proper monitoring

## Database Schema

After running migrations, your database will have:

- **11 models** for the championship system
- **7 enums** for status tracking
- **Indexes** for performance
- **Foreign keys** for data integrity
- **Full-text search** support (PostgreSQL)

To view the schema:

```bash
cd backend
npx prisma studio
```

This opens Prisma Studio at http://localhost:5555 for visual database browsing.

## Next Steps

1. Start the Docker containers
2. Run database migrations
3. Start backend and frontend
4. Create your first championship!

For more information, see the main README.md file.
