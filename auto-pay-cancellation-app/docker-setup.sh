#!/bin/bash
# Setup script for CardHugs Docker environment
# Usage: bash docker-setup.sh

set -e

echo "╔════════════════════════════════════════╗"
echo "║    CardHugs Docker Environment Setup    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Docker installation
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✓ Docker found: $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi
echo "✓ Docker Compose found"

# Create .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ .env created (edit with your settings)"
    else
        echo "⚠ .env.example not found, skipping"
    fi
fi

# Generate JWT secret if not set
echo ""
echo "Configuring security settings..."
if grep -q "JWT_SECRET=your-secret" .env; then
    JWT_SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|JWT_SECRET=your-secret-key-change-in-production|JWT_SECRET=$JWT_SECRET|" .env
    else
        sed -i "s|JWT_SECRET=your-secret-key-change-in-production|JWT_SECRET=$JWT_SECRET|" .env
    fi
    echo "✓ JWT_SECRET generated"
fi

# Create database directory if it doesn't exist
echo ""
echo "Setting up volumes..."
mkdir -p database/data
echo "✓ Database data directory created"

# Build images
echo ""
echo "Building Docker images..."
echo "This may take a few minutes on first run..."
docker compose build

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        Setup Complete! 🎉              ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Review and customize .env file"
echo "2. Start the application:"
echo "   docker compose up"
echo ""
echo "3. Initialize the database (in another terminal):"
echo "   docker compose exec backend npm run setup"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:8000"
echo "   API Health: http://localhost:8000/health"
echo ""
echo "For more information, see DOCKER_DEPLOYMENT_GUIDE.md"
