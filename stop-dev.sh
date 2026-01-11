#!/bin/bash

# SNRL Manager Development Environment Stop Script

set -e

echo "🛑 Stopping SNRL Manager Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
REMOVE_VOLUMES=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --clean) REMOVE_VOLUMES=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ "$REMOVE_VOLUMES" = true ]; then
    echo "${YELLOW}⚠️  Stopping containers and removing volumes (all data will be lost)...${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        echo "${GREEN}✓ Containers stopped and volumes removed${NC}"
    else
        echo "Cancelled."
        exit 0
    fi
else
    echo "${BLUE}Stopping containers (data will be preserved)...${NC}"
    docker-compose down
    echo "${GREEN}✓ Containers stopped${NC}"
fi

echo ""
echo "${GREEN}✅ Development environment stopped${NC}"
echo ""
echo "To start again: ./start-dev.sh"
echo "To remove all data: ./stop-dev.sh --clean"
