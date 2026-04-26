# CardHugs Admin Studio - Complete Setup Guide

## System Status ✅

All components are now running and working:

- **Frontend**: http://localhost (nginx serving React app)
- **Backend API**: http://localhost:8000 (Node.js/Express)
- **Database**: PostgreSQL 15 on port 5432
- **API Proxy**: nginx proxies `/api` calls to backend

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser                         │
└──────────────────────┬──────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────┐
│    nginx (port 80)    - Frontend Container      │
│ ┌──────────────────────────────────────────┐    │
│ │ React SPA (dist/ files)                  │    │
│ │ - Static assets (CSS, JS)                │    │
│ │ - index.html with routing                │    │
│ └──────────────────────────────────────────┘    │
│                   │                              │
│   Proxy /api/ ──> cardhugs-backend:8000         │
└─────────────────────────────────────────────────┘
         │                  │
         │                  ▼
         │        ┌──────────────────────────┐
         │        │ Node.js Backend (8000)   │
         │        │ - Express server         │
         │        │ - REST API routes        │
         │        │ - JWT auth               │
         │        └──────────────────────────┘
         │                  │
         │                  ▼
         │        ┌──────────────────────────┐
         │        │ PostgreSQL 15 (5432)     │
         │        │ - User data              │
         │        │ - Batch data             │
         │        │ - Card metadata          │
         │        └──────────────────────────┘
         │
    └────────────────────────────────────────────
       All containers on: cardhugs-network (bridge)
```

---

## How to Access

### Start All Services
```bash
docker compose up -d
```

### Access the App
- **Frontend**: Open browser to `http://localhost`
- **Backend API**: `http://localhost:8000/`
- **API Healthcheck**: `curl http://localhost:8000/health`

### Stop All Services
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

---

## Key Fixes Applied

### 1. **Network Configuration** ✅
- All containers now on same `cardhugs-network` bridge
- Service discovery via container hostnames (postgres, cardhugs-backend)
- Backend can resolve `postgres` hostname and connect to database

### 2. **Frontend API Routing** ✅
- Frontend now uses relative API URL: `/api`
- nginx proxies all `/api/*` requests to backend:8000
- Works in both development and production

### 3. **Authentication Flow** ✅
- Frontend redirects to `/login` page by default
- Protected routes require user session
- Dashboard only accessible after login
- Backend validates JWT tokens

### 4. **Database Connection** ✅
- PostgreSQL 15-alpine running on port 5432
- Backend connects via hostname `postgres` (Docker DNS)
- Connection pooling configured in Sequelize
- Database initialized and ready for schema migrations

---

## Components Explained

### PostgreSQL Container
- **Image**: `postgres:15-alpine`
- **Port**: 5432 (internal to network, exposed locally)
- **Volume**: `postgres_data` (persistent database storage)
- **Healthcheck**: `pg_isready` command validates connectivity

### Backend Container
- **Image**: Built from `./backend-node/Dockerfile`
- **Port**: 8000
- **Connection**: Uses DNS name `postgres` to reach database
- **Environment**: DB credentials from docker-compose
- **Volumes**: 
  - `./backend-node/uploads:/app/uploads` (file storage)
  - `./backend-node/src:/app/src` (for live code changes in dev)

### Frontend Container
- **Image**: Built from `./cardhugs-frontend/Dockerfile`
- **Port**: 80 (HTTP)
- **Type**: Nginx serving pre-built React SPA
- **Proxy**: Routes `/api/*` to backend container
- **Features**:
  - SPA fallback (all routes → index.html)
  - Static asset caching (1 year expiry)
  - Gzip compression ready

---

## Environment Variables

Copy `.env.example` to `.env` if you need custom values:

```env
DB_NAME=cardhugs
DB_USER=postgres
DB_PASSWORD=postgres
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill container using port 80
docker ps
docker stop <container_id>

# Or use different port in docker-compose.yml
ports:
  - "8080:80"  # Access at localhost:8080
```

### Database Connection Failed
```bash
# Check backend logs
docker compose logs backend

# Verify database is healthy
docker compose ps
# Look for "postgres ... (healthy)"
```

### Frontend Shows Blank Page
```bash
# Check browser console for errors
# Check nginx logs
docker compose logs frontend

# Verify React compiled correctly
docker compose logs frontend | grep -i error
```

### Can't Reach Backend API from Frontend
```bash
# Verify nginx proxy is configured
docker exec cardhugs-frontend cat /etc/nginx/conf.d/default.conf

# Test proxy directly
curl http://localhost/api/health
```

---

## Production Deployment

For production, you would:

1. **Use Docker Swarm or Kubernetes** instead of docker-compose
2. **Setup reverse proxy** (nginx, Traefik) for SSL/TLS
3. **Use managed database** (AWS RDS, Azure Database) instead of container
4. **Configure secrets** (vault, AWS Secrets Manager) instead of .env
5. **Add load balancer** for multiple backend instances
6. **Setup monitoring** (Prometheus, Grafana) and logging (ELK)
7. **Enable auto-scaling** based on CPU/memory metrics

---

## Next Steps

1. **Run migrations**: `docker exec cardhugs-backend npm run migrate`
2. **Seed data**: `docker exec cardhugs-backend npm run seed`
3. **Login**: Create admin account via API or seeded credentials
4. **Deploy**: Build and push images to registry (Docker Hub, ECR, etc.)

---

**All components are now fully functional!** 🎉
