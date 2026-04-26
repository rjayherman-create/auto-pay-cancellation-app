# 🚀 Deployment Guide

## Local Deployment

### Development
```bash
npm run dev
# Frontend: http://localhost:8080
# Backend: http://localhost:5000
```

### Production
```bash
npm run build
npm start
```

## Docker Deployment

### Build Image
```bash
docker build -t production-studio:latest .
```

### Run Container
```bash
docker run -d \
  -p 5000:5000 \
  -p 8080:8080 \
  -v ./uploads:/app/uploads \
  -v ./projects:/app/projects \
  --restart unless-stopped \
  --name production-studio \
  production-studio:latest
```

### Docker Compose
```bash
docker-compose up -d
```

## Cloud Deployment

### AWS

#### Using ECS
```bash
# Create ECR repository
aws ecr create-repository --repository-name production-studio

# Build and push image
docker build -t production-studio .
docker tag production-studio:latest YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/production-studio:latest
docker push YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/production-studio:latest

# Create ECS task definition (see aws-ecs-task-definition.json)
aws ecs register-task-definition --cli-input-json file://aws-ecs-task-definition.json
```

#### Using Elastic Beanstalk
```bash
# Initialize Elastic Beanstalk
eb init -p docker production-studio

# Create environment
eb create production-environment

# Deploy
eb deploy
```

### Google Cloud Platform

#### Using Cloud Run
```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/production-studio

# Deploy
gcloud run deploy production-studio \
  --image gcr.io/PROJECT-ID/production-studio \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### Using Cloud Build
```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Azure

#### Using Container Instances
```bash
az container create \
  --resource-group myResourceGroup \
  --name production-studio \
  --image myacr.azurecr.io/production-studio:latest \
  --ports 5000 8080 \
  --environment-variables NODE_ENV=production
```

#### Using App Service
```bash
# Create app service plan
az appservice plan create \
  --name myAppPlan \
  --resource-group myResourceGroup \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppPlan \
  --name production-studio \
  --deployment-container-image-name myacr.azurecr.io/production-studio:latest
```

### Heroku

```bash
# Login
heroku login

# Create app
heroku create production-studio

# Add remote
git remote add heroku https://git.heroku.com/production-studio.git

# Set buildpack
heroku buildpacks:set heroku/docker

# Deploy
git push heroku main
```

### DigitalOcean

```bash
# Create app
doctl apps create --spec app.yaml

# Or use Docker
docker run -d \
  -p 5000:5000 \
  -p 8080:8080 \
  production-studio:latest
```

## Kubernetes Deployment

### Create Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: production-studio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: production-studio
  template:
    metadata:
      labels:
        app: production-studio
    spec:
      containers:
      - name: production-studio
        image: production-studio:latest
        ports:
        - containerPort: 5000
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: production
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### Deploy to Kubernetes
```bash
kubectl apply -f deployment.yaml
kubectl service expose deployment production-studio --type=LoadBalancer
```

## Environment Configuration

### Production Environment
```env
NODE_ENV=production
PORT=5000
VITE_API_URL=https://yourdomain.com
```

### Staging Environment
```env
NODE_ENV=staging
PORT=5000
VITE_API_URL=https://staging.yourdomain.com
```

## SSL/TLS Setup

### Using Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
    }

    location /api {
        proxy_pass http://localhost:5000;
    }
}
```

### Using Let's Encrypt
```bash
certbot certonly --standalone -d yourdomain.com
```

## Database (Optional)

For future versions with persistent data:

### PostgreSQL
```bash
docker run -d \
  --name production-studio-db \
  -e POSTGRES_PASSWORD=password \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15
```

### MongoDB
```bash
docker run -d \
  --name production-studio-db \
  -v mongo-data:/data/db \
  mongo:latest
```

## Monitoring

### Health Checks
```bash
curl http://localhost:5000/api/health
```

### Logging
```bash
# Docker logs
docker logs production-studio

# Follow logs
docker logs -f production-studio
```

### Performance Monitoring
- CPU usage
- Memory usage
- Disk space
- API response times
- Video render times

## Backup & Recovery

### Backup Projects
```bash
docker cp production-studio:/app/projects ./backup/projects
```

### Restore Projects
```bash
docker cp ./backup/projects production-studio:/app/
```

## Scaling

### Horizontal Scaling (Kubernetes)
```bash
kubectl scale deployment production-studio --replicas=3
```

### Vertical Scaling
Increase container resources in deployment manifest.

## CI/CD

Automated deployment via GitHub Actions:
1. Push to main branch
2. GitHub Actions builds image
3. Push to container registry
4. Deploy to production

See `.github/workflows/build-deploy.yml` for configuration.

## Troubleshooting

### Container won't start
```bash
docker logs production-studio
```

### Port already in use
```bash
docker ps
docker stop container-id
```

### Memory issues
```bash
docker stats production-studio
# Increase memory limit in docker-compose.yml
```

### Network issues
```bash
docker network ls
docker network inspect production-studio-network
```

## Performance Optimization

### Enable Caching
- Redis for session caching
- Browser cache headers
- CDN for static assets

### Database Optimization
- Index frequently queried fields
- Archive old projects
- Optimize queries

### Application Optimization
- Enable gzip compression
- Minimize CSS/JS
- Optimize images
- Remove console logs

## Security Hardening

- Use secrets management (AWS Secrets Manager, etc.)
- Enable WAF (Web Application Firewall)
- Regular security updates
- Implement rate limiting
- Use HTTPS/TLS everywhere
- Regular backups
- Monitoring and alerts

## Disaster Recovery

### Backup Strategy
- Daily backups to S3/Cloud Storage
- Keep 30-day backup retention
- Test recovery procedures

### Recovery Plan
- RPO (Recovery Point Objective): 1 day
- RTO (Recovery Time Objective): 4 hours
- Documented procedures
- Regular drills

---

For more information, see [README.md](../README.md)
