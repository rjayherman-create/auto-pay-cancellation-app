# CardHugs Voice-Over App - Docker Deployment Guide

This project is now fully containerized following Docker best practices with optimized multi-stage builds, security hardening, and production-ready configurations.

## Quick Start

### Prerequisites
- Docker Desktop (or Docker Engine on Linux)
- Docker Compose v2.0+

### 1. Setup Environment Variables

Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_NAME=cardhugs
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=postgres
DB_PORT=5432

# Backend
NODE_ENV=production
PORT=8000
JWT_SECRET=your-secure-jwt-secret
FAL_KEY=your-fal-key

# Frontend
VITE_API_URL=http://localhost:8000
```

### 2. Development Mode (with hot reload)

Start containers with automatic code reloading:
```bash
docker compose up
```

This uses the default `docker-compose.yml` + `docker-compose.override.yml` for development.

Access the app:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- Database: localhost:5432

### 3. Production Mode

Start with production configuration:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Key differences from development:
- Increased resource limits
- Enhanced restart policies
- Optimized memory settings
- No volume mounts for code

## File Structure

```
.
├── docker-compose.yml              # Main config (development base)
├── docker-compose.override.yml     # Dev overrides (hot reload)
├── docker-compose.prod.yml         # Production overrides
├── .dockerignore                   # Files excluded from builds
├── .env.example                    # Environment template
│
├── backend-node/
│   ├── Dockerfile                  # Multi-stage backend build
│   ├── .dockerignore              # Backend-specific exclusions
│   ├── server.js                   # Express app entry point
│   ├── package.json                # Dependencies
│   └── src/                        # Source code
│
├── cardhugs-frontend/
│   ├── Dockerfile                  # Multi-stage React build
│   ├── .dockerignore              # Frontend-specific exclusions
│   ├── nginx.conf                  # Production nginx config
│   ├── vite.config.ts              # Vite build config
│   ├── package.json                # Dependencies
│   └── src/                        # React components
│
└── database/
    ├── init.sql                    # Schema initialization
    └── data/                       # Persistent volume
```

## Docker Compose Services

### PostgreSQL (postgres)
- Image: `postgres:15-alpine`
- Port: 5432
- Volume: `postgres_data` (persistent)
- Health check: Enabled

### Node.js Backend (backend)
- Build: `backend-node/Dockerfile` (multi-stage)
- Port: 8000
- Depends on: postgres (healthy)
- Hot reload: ✓ (development only)
- Health check: HTTP /health endpoint

### React Frontend (frontend)
- Build: `cardhugs-frontend/Dockerfile` (multi-stage)
- Port: 80
- Server: Nginx with compression & caching
- Proxy: /api routes to backend
- Health check: Enabled

## Key Features & Best Practices

### Multi-Stage Builds
- **Backend**: 3 stages (dependencies, builder, runtime) for minimal final image
- **Frontend**: 3 stages (dependencies, builder, nginx) using pre-built dist

### Security
- Non-root users: `nodejs` (backend), `nginx` (frontend)
- Reduced attack surface with alpine base images
- Security headers in nginx.conf
- No hardcoded secrets (environment-based)

### Performance Optimization
- Layer caching: package.json copied before source code
- Gzip compression enabled
- Long-term asset caching (1 year for static files)
- Resource limits configured per service

### Networking
- Custom bridge network: `cardhugs-network`
- Service discovery via DNS (postgres, backend, frontend)
- API proxy: frontend → backend through nginx

### Health Checks
- Database: PostgreSQL readiness probe
- Backend: HTTP health endpoint
- Frontend: HTTP 200 response

### Development Features
- Hot code reload via bind mounts
- `docker-compose.override.yml` auto-applied
- `nodemon` for backend auto-restart
- Console output streaming
- Debug environment variables

## Common Commands

```bash
# Start all services (development)
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild images
docker compose build

# Rebuild specific service
docker compose build backend

# Execute command in running container
docker compose exec backend npm run setup

# Scale service (careful with postgres!)
docker compose up --scale backend=2

# Production start
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Database Initialization

First run will create the database and tables:

```bash
# Apply migrations
docker compose exec backend npm run migrate

# Seed sample data
docker compose exec backend npm run seed

# Both together
docker compose exec backend npm run setup
```

## Troubleshooting

### Services won't start
```bash
# Check service status
docker compose ps

# View detailed logs
docker compose logs

# Inspect specific service
docker compose logs postgres
```

### Database connection fails
```bash
# Ensure postgres is healthy
docker compose ps postgres

# Check network connectivity
docker compose exec backend curl postgres:5432

# View postgres logs
docker compose logs postgres
```

### Port already in use
```bash
# Find process using port (e.g., 8000)
lsof -i :8000

# Change port in .env or docker-compose.yml
```

### Rebuild without cache
```bash
docker compose build --no-cache
```

### Clean everything
```bash
# Remove all containers, networks, volumes
docker compose down -v

# Remove images too
docker compose down -v --rmi all
```

## Performance Tuning

### Increase Backend Memory (Node.js)
Edit `docker-compose.yml`:
```yaml
environment:
  NODE_OPTIONS: --max-old-space-size=2048
```

### Increase Database Memory
```yaml
environment:
  POSTGRES_INITDB_ARGS: "-c shared_buffers=512MB"
```

### Increase Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | App environment | production, development |
| `DB_NAME` | Database name | cardhugs |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | secure-password |
| `DB_HOST` | Database hostname | postgres |
| `JWT_SECRET` | Token signing secret | your-secret-key |
| `FAL_KEY` | FAL AI API key | fal-xxxxx |
| `VITE_API_URL` | Frontend API endpoint | http://localhost:8000 |

## Next Steps

1. **Customize .env** with your actual secrets
2. **Initialize database**: `docker compose exec backend npm run setup`
3. **Access the app**: http://localhost
4. **Test API**: http://localhost:8000/health
5. **Deploy to production**: Use `docker-compose.prod.yml`

## Support

For issues:
1. Check logs: `docker compose logs`
2. Verify health: `docker compose ps`
3. Inspect services: `docker compose inspect`
4. Review .env configuration

---
Generated with Docker best practices for containerization.
