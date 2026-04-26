# CardHugs Docker Containers - Setup & Operations

## ✅ Current Status

All containers are **built and running**:

```
✅ cardhugs-postgres   (PostgreSQL 15)      - Port 5432
✅ cardhugs-backend    (Node.js)            - Port 8000  
✅ cardhugs-frontend   (Nginx + React)      - Port 80
```

---

## 🚀 Quick Start

### Start All Containers

**Windows:**
```bash
start-docker.bat
```

**Linux/Mac:**
```bash
./start-docker.sh
```

**Or directly:**
```bash
docker-compose up -d
```

### Access the Application

- **Frontend (UI):** http://localhost
- **Backend API:** http://localhost:8000
- **Database:** localhost:5432

---

## 📦 Container Details

### 1. PostgreSQL Database
```
Image:     postgres:15-alpine
Container: cardhugs-postgres
Port:      5432
Volume:    postgres_data (persistent)
Status:    ✅ Healthy
```

**Database Credentials:**
```
Host:     postgres (or localhost:5432)
Database: cardhugs
User:     postgres
Password: postgres (change in production!)
```

### 2. Backend (Node.js API)
```
Image:     cardhugsadminsystem-backend
Container: cardhugs-backend
Port:      8000
Volume:    ./backend-node/uploads (mounted)
Status:    ✅ Running
```

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Features:**
- Express.js REST API
- PostgreSQL integration
- OpenAI integration ready
- Replicate AI integration ready
- File upload support

### 3. Frontend (React + Nginx)
```
Image:     cardhugsadminsystem-frontend
Container: cardhugs-frontend
Port:      80
Status:    ✅ Running
```

**Built with:**
- React 18
- Vite (dev build)
- Tailwind CSS
- React Router

---

## 🛠️ Common Docker Commands

### View Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose stop
```

### Restart Services
```bash
docker-compose restart

# Specific service
docker-compose restart backend
```

### Rebuild Containers
```bash
docker-compose build --no-cache
```

### Complete Reset
```bash
docker-compose down -v
docker-compose up -d
```

### Execute Commands in Container
```bash
# Backend shell
docker exec -it cardhugs-backend sh

# Frontend shell
docker exec -it cardhugs-frontend sh

# Database psql
docker exec -it cardhugs-postgres psql -U postgres -d cardhugs
```

---

## 📝 Environment Configuration

**File:** `.env`

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cardhugs
DB_USER=postgres
DB_PASSWORD=postgres

# Node
NODE_ENV=production
PORT=8000

# JWT
JWT_SECRET=your-secret-key-change-in-production

# APIs
VITE_API_URL=http://localhost:8000
OPENAI_API_KEY=sk-...
FAL_KEY=
REPLICATE_API_TOKEN=
```

### For Production

Change these immediately:
```env
DB_PASSWORD=strong-password-here
JWT_SECRET=very-long-random-secret-key
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### Frontend Not Responding

```bash
# Check status
docker-compose ps frontend

# View logs
docker-compose logs frontend

# Restart
docker-compose restart frontend
```

### Backend API Not Working

```bash
# Check if service is healthy
docker-compose ps backend

# Test health endpoint
curl http://localhost:8000/health

# View logs
docker-compose logs backend

# Restart
docker-compose restart backend
```

### Database Connection Error

```bash
# Check database status
docker-compose ps postgres

# Test connection
docker exec -it cardhugs-postgres psql -U postgres -d cardhugs -c "SELECT 1"

# View logs
docker-compose logs postgres
```

### Port Already in Use

```bash
# Find what's using the port
netstat -ano | findstr :8000    # Windows
lsof -i :8000                   # Mac/Linux

# Kill the process or change port in docker-compose.yml
```

---

## 📊 Docker Compose Services

### Service Dependencies

```
frontend
  ↓ depends on
backend
  ↓ depends on
postgres (healthy)
```

The frontend will wait for the backend, which will wait for postgres to be healthy.

### Network

All services communicate via `cardhugs-network` bridge:
- Frontend → Backend: `http://backend:8000`
- Backend → Database: `postgres://postgres:postgres@postgres:5432/cardhugs`

---

## 🔍 Monitoring

### Real-time Resource Usage

```bash
docker stats
```

### View Container Inspection

```bash
docker inspect cardhugs-backend
```

### Check Network

```bash
docker network inspect cardhugs-network
```

---

## 🔐 Security Checklist

- [ ] Change `DB_PASSWORD` in `.env`
- [ ] Change `JWT_SECRET` in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS in production (reverse proxy)
- [ ] Enable Docker authentication
- [ ] Set resource limits in compose file
- [ ] Regular backups of `postgres_data` volume

---

## 📦 Backing Up Data

### Backup Database

```bash
docker exec cardhugs-postgres pg_dump -U postgres -d cardhugs > backup.sql
```

### Backup Uploads

```bash
# Linux/Mac
tar -czf uploads-backup.tar.gz backend-node/uploads/

# Windows
Compress-Archive -Path backend-node/uploads\ -DestinationPath uploads-backup.zip
```

### Restore Database

```bash
docker exec -i cardhugs-postgres psql -U postgres -d cardhugs < backup.sql
```

---

## 🚀 Deployment Options

### Docker Swarm
```bash
docker swarm init
docker stack deploy -c docker-compose.yml cardhugs
```

### Kubernetes
```bash
# Convert to Kubernetes manifests
kompose convert

# Deploy
kubectl apply -f .
```

### Cloud Platforms

The containers are ready for:
- AWS ECS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Heroku (with modifications)

---

## 📈 Scaling

### Scale Backend

```bash
docker-compose up -d --scale backend=3
```

### Scale Frontend

```bash
docker-compose up -d --scale frontend=2
```

(Requires load balancer configuration)

---

## ✅ Health Checks

All services have health checks configured:

```bash
# Check health
docker-compose ps

# Health check interval: 30s
# Start period: 5-15s
# Timeout: 3-5s
# Retries: 3
```

---

## 📞 Support

### Check Logs First
```bash
docker-compose logs -f
```

### Common Issues

1. **Port in use:** Change ports in docker-compose.yml
2. **Permission denied:** Use `sudo docker-compose` on Linux
3. **Out of disk:** Run `docker system prune`
4. **Slow startup:** Wait for health checks (up to 60 seconds)

---

## 🎯 Next Steps

1. ✅ Containers are running
2. Access frontend at http://localhost
3. Login with your credentials
4. Start creating cards!

---

**All containers are ready to use!** 🎉
