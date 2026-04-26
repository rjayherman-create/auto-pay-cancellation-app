.PHONY: help build up down logs dev prod test clean migrate seed setup

help:
	@echo "CardHugs Docker Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development:"
	@echo "  dev              Start development environment with hot reload"
	@echo "  logs             View logs from all services"
	@echo "  logs-backend     View backend logs only"
	@echo "  logs-frontend    View frontend logs only"
	@echo "  logs-db          View database logs only"
	@echo "  shell-backend    SSH into backend container"
	@echo "  shell-frontend   SSH into frontend container"
	@echo ""
	@echo "Build & Deployment:"
	@echo "  build            Build all images"
	@echo "  build-backend    Build backend image only"
	@echo "  build-frontend   Build frontend image only"
	@echo "  up               Start all services (development)"
	@echo "  down             Stop all services"
	@echo "  prod             Start production environment"
	@echo ""
	@echo "Database:"
	@echo "  migrate          Run database migrations"
	@echo "  seed             Seed sample data"
	@echo "  setup            Migrate + seed (full setup)"
	@echo "  db-shell         Connect to PostgreSQL shell"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean            Stop and remove containers"
	@echo "  clean-all        Clean everything including volumes"
	@echo "  clean-images     Remove all built images"
	@echo ""
	@echo "Testing & Verification:"
	@echo "  test             Run health checks"
	@echo "  status           Show service status"
	@echo "  inspect          Inspect running containers"

# Development
dev:
	docker compose up

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-db:
	docker compose logs -f postgres

shell-backend:
	docker compose exec backend sh

shell-frontend:
	docker compose exec frontend sh

# Build
build:
	docker compose build

build-backend:
	docker compose build backend

build-frontend:
	docker compose build frontend

# Deployment
up:
	docker compose up -d

down:
	docker compose down

prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Database operations
migrate:
	docker compose exec backend npm run migrate

seed:
	docker compose exec backend npm run seed

setup:
	docker compose exec backend npm run setup

db-shell:
	docker compose exec postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-cardhugs}

# Cleanup
clean:
	docker compose down

clean-all:
	docker compose down -v

clean-images:
	docker compose down -v --rmi all

# Testing
test:
	@echo "Running health checks..."
	@docker compose ps
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:8000/health || echo "Backend not responding"
	@echo ""
	@echo "Frontend health:"
	@curl -s http://localhost/ > /dev/null && echo "Frontend is running" || echo "Frontend not responding"
	@echo ""
	@echo "Database connection:"
	@docker compose exec -T postgres pg_isready -U ${DB_USER:-postgres} || echo "Database not ready"

status:
	docker compose ps

inspect:
	@echo "=== Network ==="
	docker network inspect cardhugs_cardhugs-network || true
	@echo ""
	@echo "=== Containers ==="
	docker compose ps
	@echo ""
	@echo "=== Images ==="
	docker images | grep cardhugs || echo "No cardhugs images found"
