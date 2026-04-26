# Docker Deployment - Quick Reference

## Start the Application

```bash
# Development (with hot reload)
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Using Makefile
make dev          # Start development
make prod         # Start production
```

## Access the Application

| Component | URL | Purpose |
|-----------|-----|---------|
| Frontend | http://localhost | Web UI |
| Backend API | http://localhost:8000 | REST API |
| API Health | http://localhost:8000/health | Status check |
| Database | localhost:5432 | PostgreSQL |

## Common Operations

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Initialize database
docker compose exec backend npm run setup

# Connect to database
docker compose exec postgres psql -U postgres -d cardhugs

# Rebuild images
docker compose build

# Run backend shell
docker compose exec backend sh

# Restart a service
docker compose restart backend
```

## Using Makefile

```bash
make help          # Show all commands
make dev           # Start development
make prod          # Start production
make logs          # View logs
make migrate       # Run migrations
make setup         # Initialize database
make clean         # Stop services
make test          # Run health checks
```

## Configuration Files

- `.env` - Environment variables (create from `.env.example`)
- `docker-compose.yml` - Base configuration
- `docker-compose.override.yml` - Development overrides (auto-loaded)
- `docker-compose.prod.yml` - Production overrides
- `.dockerignore` - Files excluded from builds

## Architecture

```
┌─────────────────────────────────────────┐
│     React Frontend (nginx:80)           │
│  - Build stage: compile TypeScript      │
│  - Runtime: nginx with compression      │
│  - Proxy: /api → backend:8000          │
└────────────────┬────────────────────────┘
                 │
                 ├─ API calls
                 │
         ┌───────▼──────────┐
         │  Express Backend  │
         │   (node:8000)     │
         └────────┬──────────┘
                  │
          ┌──────▼──────────┐
          │   PostgreSQL    │
          │  (postgres:5432)│
          └─────────────────┘
```

## Multi-Stage Build Benefits

- **Backend**: 3 stages reduce image size by stripping dev dependencies
- **Frontend**: 3 stages eliminate build tools from final image
- **Security**: Non-root users in all containers
- **Performance**: Layer caching optimized for fast rebuilds

## Development Workflow

1. **First time setup**:
   ```bash
   docker compose up
   docker compose exec backend npm run setup
   ```

2. **Edit code**: Changes auto-reload (configured in docker-compose.override.yml)

3. **View changes**: Refresh browser or wait for backend restart

4. **Check logs**: `docker compose logs -f backend`

## Production Checklist

- [ ] Set strong passwords in `.env`
- [ ] Change `JWT_SECRET` to secure random value
- [ ] Configure `FAL_KEY` for AI features
- [ ] Update `VITE_API_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Use `docker-compose.prod.yml` for deployment
- [ ] Enable database backups
- [ ] Monitor resource usage

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 80 in use | Change port in docker-compose.yml or stop other services |
| Port 8000 in use | Kill process: `lsof -i :8000` |
| Database won't connect | Check postgres is healthy: `docker compose ps postgres` |
| Services won't start | Review logs: `docker compose logs` |
| Frontend blank page | Check browser console for API errors |
| Backend crashes | View logs: `docker compose logs backend` |

## Environment Variables

Create `.env` from `.env.example` and customize:

```env
DB_NAME=cardhugs
DB_USER=postgres
DB_PASSWORD=your-secure-password
NODE_ENV=production
JWT_SECRET=your-secret-key
FAL_KEY=your-fal-key
VITE_API_URL=http://localhost:8000
```

## Security Notes

- ✓ All containers run as non-root users
- ✓ Alpine base images for minimal attack surface
- ✓ Health checks enabled for all services
- ✓ Network isolation with custom bridge network
- ✓ Sensitive data in environment variables only
- ✓ Nginx security headers configured

## Performance Tuning

Adjust in docker-compose.yml:

```yaml
# Backend memory
environment:
  NODE_OPTIONS: --max-old-space-size=2048

# Database shared buffers
environment:
  POSTGRES_INITDB_ARGS: "-c shared_buffers=512MB"

# Resource limits
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

---
For detailed documentation, see DOCKER_DEPLOYMENT_GUIDE.md
