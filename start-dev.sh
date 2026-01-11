#!/bin/bash

# SNRL Manager Development Environment Startup Script

set -e

echo "🚀 Starting SNRL Manager Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "${BLUE}Step 1: Starting Docker containers...${NC}"
docker-compose up -d

echo ""
echo "${BLUE}Step 2: Waiting for PostgreSQL to be ready...${NC}"
until docker exec snrl-postgres pg_isready -U snrl_user -d snrl_manager > /dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "${GREEN}✓ PostgreSQL is ready${NC}"

echo ""
echo "${BLUE}Step 3: Checking backend environment...${NC}"
if [ ! -f "backend/.env" ]; then
  echo "${YELLOW}Creating backend/.env from .env.example...${NC}"
  cp .env.example backend/.env
  echo "${GREEN}✓ Created backend/.env${NC}"
else
  echo "${GREEN}✓ backend/.env already exists${NC}"
fi

echo ""
echo "${BLUE}Step 4: Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
  npm install
  echo "${GREEN}✓ Backend dependencies installed${NC}"
else
  echo "${GREEN}✓ Backend dependencies already installed${NC}"
fi

echo ""
echo "${BLUE}Step 5: Generating Prisma Client...${NC}"
npx prisma generate
echo "${GREEN}✓ Prisma Client generated${NC}"

echo ""
echo "${BLUE}Step 6: Running database migrations...${NC}"
npx prisma migrate deploy || {
  echo "${YELLOW}No migrations found or already applied. Running dev migration...${NC}"
  npx prisma migrate dev --name init || echo "${YELLOW}Migrations may already be applied${NC}"
}
echo "${GREEN}✓ Database migrations complete${NC}"

cd ..

echo ""
echo "${BLUE}Step 7: Installing frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
  npm install
  echo "${GREEN}✓ Frontend dependencies installed${NC}"
else
  echo "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
cd ..

echo ""
echo "${GREEN}✅ Development environment is ready!${NC}"
echo ""
echo "📊 Services:"
echo "  - PostgreSQL:  localhost:5432"
echo "  - Redis:       localhost:6379"
echo "  - pgAdmin:     http://localhost:5050"
echo ""
echo "🔧 To start the application:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "📖 For more information, see DOCKER_SETUP.md"
echo ""
echo "To stop Docker containers: docker-compose down"
echo "To view logs: docker-compose logs -f"
