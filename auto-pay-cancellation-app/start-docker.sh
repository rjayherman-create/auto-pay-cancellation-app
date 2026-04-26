#!/bin/bash
# CardHugs Docker Container Startup Script

echo "🚀 Starting CardHugs Docker Containers..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating one..."
    cp .env.example .env 2>/dev/null || echo "Please create a .env file"
fi

# Start containers
echo "📦 Building and starting containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check status
docker-compose ps

echo ""
echo "✅ CardHugs is starting up!"
echo ""
echo "📍 Access Points:"
echo "   Frontend (UI):  http://localhost"
echo "   Backend (API):  http://localhost:8000"
echo "   Database:       localhost:5432"
echo ""
echo "💡 Useful Commands:"
echo "   View logs:      docker-compose logs -f"
echo "   Stop services:  docker-compose stop"
echo "   Restart:        docker-compose restart"
echo "   Remove all:     docker-compose down -v"
echo ""
