# Voice Over Studio - Cheap Deployment Guide ($20/month)

## Quick Summary
- **Total Cost**: $20/month
- **Hosting**: DigitalOcean ($6/month)
- **Database**: Free tier ($0)
- **Domain**: Freenom or Namecheap ($0-3/month optional)

---

## Option 1: DigitalOcean (Recommended) - $18/month ⭐

### Step 1: Create DigitalOcean Account
1. Go to https://www.digitalocean.com
2. Sign up (get $200 free credits with referral code)
3. Add payment method

### Step 2: Create a Droplet
1. Click "Create" → "Droplets"
2. **Choose Image**: Ubuntu 22.04 LTS
3. **Choose Plan**: Basic ($6/month for 1GB RAM, 25GB SSD)
4. **Region**: Choose closest to users
5. **Authentication**: SSH key (recommended) or password
6. Click "Create Droplet"

### Step 3: Configure Droplet
```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update
apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install npm globally
npm install -g npm@latest

# Install PM2 (process manager)
npm install -g pm2

# Install FFmpeg (for audio mixing)
apt install -y ffmpeg

# Install Git
apt install -y git

# Create app directory
mkdir /home/app
cd /home/app

# Clone your repository
git clone https://github.com/YOUR_REPO/voice-over-studio.git
cd voice-over-studio

# Install dependencies
npm install

# Create uploads directory
mkdir -p uploads/audio
mkdir -p uploads/video

# Start with PM2
pm2 start audio-production-studio/server.js --name "voice-studio"
pm2 startup
pm2 save

# Install Nginx as reverse proxy
apt install -y nginx

# Configure Nginx
```

### Step 4: Configure Nginx
Create `/etc/nginx/sites-available/voice-studio`:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 100M;
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/voice-studio /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx

# Enable nginx to start on reboot
systemctl enable nginx
```

### Step 5: Setup SSL (Free with Let's Encrypt)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot certonly --nginx -d YOUR_DOMAIN

# Auto-renew certificates
systemctl enable certbot.timer
systemctl start certbot.timer
```

### Step 6: Environment Variables
```bash
# Create .env file
cat > /home/app/voice-over-studio/.env << EOF
PORT=3000
NODE_ENV=production
ELEVENLABS_API_KEY=your_api_key_here
EOF
```

### Step 7: Monitor and Maintain
```bash
# View running processes
pm2 list

# View logs
pm2 logs voice-studio

# Restart app
pm2 restart voice-studio

# Monitor system resources
pm2 monit

# Check disk space
df -h

# Check memory usage
free -h
```

**Monthly Cost**: $6/month (Droplet)

---

## Option 2: Render (Easier for Beginners) - $7/month

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect GitHub repository

### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your repository
3. **Settings**:
   - Environment: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Plan: Free tier (or $7/month for hobby)

### Step 3: Add Environment Variables
1. Go to "Environment"
2. Add:
   - `PORT=3000`
   - `ELEVENLABS_API_KEY=your_key`
   - `NODE_ENV=production`

### Step 4: Deploy
- Click "Create Web Service"
- Render automatically deploys on push to GitHub

**Monthly Cost**: $0 (free tier) or $7/month (hobby)

---

## Option 3: Railway.app - $5/month

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Connect repository

### Step 2: Deploy
1. Click "New Project"
2. Select "Deploy from GitHub"
3. Choose your repository
4. Railway auto-detects Node.js

### Step 3: Configure
- Add environment variables
- Set PORT=3000
- Railway automatically assigns domain

**Monthly Cost**: $5/month (after $5 free credit)

---

## Option 4: Self-Host on Raspberry Pi - $0/month

### Requirements:
- Raspberry Pi 4 (4GB RAM) - $60 one-time
- Micro SD Card 32GB - $10 one-time
- Power supply - $15 one-time
- Network connection

### Setup:
```bash
# Install Ubuntu on Raspberry Pi
# Download Ubuntu Server for Arm64 from ubuntu.com
# Flash to SD card using Balena Etcher

# SSH into Pi
ssh ubuntu@YOUR_PI_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js, FFmpeg, etc (same as DigitalOcean)
# Configure Nginx as reverse proxy

# Use Ngrok or Cloudflare Tunnel for external access
```

**Pros:**
- No recurring costs
- Full control
- Unlimited bandwidth (home ISP limits apply)

**Cons:**
- Requires setup time
- Home internet might be unreliable
- 24/7 power consumption (~$5/month electricity)

**Total Cost**: ~$5/month (electricity)

---

## Cost Comparison:

| Provider | Monthly | Setup | Effort | Uptime |
|----------|---------|-------|--------|--------|
| DigitalOcean | $6 | 30min | Medium | 99.9% |
| Render | $7 | 5min | Easy | 99.5% |
| Railway | $5 | 10min | Easy | 99.5% |
| Self-Host | $5 | 2hrs | Hard | 95% |

---

## Recommended: DigitalOcean

**Why?**
- ✅ Cheapest at $6/month
- ✅ Full control
- ✅ Easy scaling later
- ✅ Good documentation
- ✅ 99.9% uptime SLA

**Get started in 30 minutes:**
1. Create account
2. Create droplet
3. SSH into it
4. Copy/paste commands
5. Done!

---

## Full Deployment Script (DigitalOcean)

Save this as `deploy.sh`:

```bash
#!/bin/bash

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y nodejs npm git nginx ffmpeg curl

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Clone repository
cd /home
git clone https://github.com/YOUR_USERNAME/voice-over-studio.git app
cd app

# Install app dependencies
npm install

# Create directories
mkdir -p uploads/audio uploads/video
chmod -R 755 uploads

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=production
ELEVENLABS_API_KEY=your_key_here
EOF

# Start with PM2
pm2 start audio-production-studio/server.js --name "voice-studio"
pm2 startup
pm2 save

# Configure Nginx
cat > /etc/nginx/sites-available/voice-studio << 'NGINX'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    client_max_body_size 100M;
}
NGINX

ln -s /etc/nginx/sites-available/voice-studio /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl restart nginx
systemctl enable nginx

# Setup SSL
apt install -y certbot python3-certbot-nginx
# Manual: certbot certonly --nginx -d your.domain

echo "✅ Deployment complete!"
echo "Your app is running at http://YOUR_DROPLET_IP"
```

---

## Monitoring & Maintenance

### Daily:
- Check logs: `pm2 logs`
- Monitor: `pm2 monit`

### Weekly:
- Backup uploads: `tar -czf backup.tar.gz uploads/`
- Check disk: `df -h`

### Monthly:
- Update packages: `apt update && apt upgrade`
- Review analytics
- Check API usage

---

## Scaling (When You Need It)

### If 1 Droplet isn't enough:
1. Upgrade to $12/month (2GB RAM)
2. If still not enough, add database ($15/month)
3. Add load balancer ($20/month)

**Total cost before scaling**: $6/month + ElevenLabs $5-30 = **$11-36/month**

---

## Environment Variables

Store these securely:

```env
# Required
PORT=3000
NODE_ENV=production
ELEVENLABS_API_KEY=sk-xxxxx

# Optional (Phase 2+)
SUNO_API_KEY=optional
DATABASE_URL=optional
REDIS_URL=optional
SMTP_KEY=optional
```

---

## Backup Strategy

```bash
# Daily backup script
#!/bin/bash
tar -czf /backups/voiceover-$(date +%Y%m%d).tar.gz \
  /home/app/uploads \
  /home/app/.env \
  /home/app/data

# Upload to S3 (optional)
aws s3 cp /backups/voiceover-*.tar.gz s3://my-bucket/backups/
```

---

## Summary

### MVP Deployment ($20/month max):
- **Server**: DigitalOcean Droplet $6/month
- **API**: ElevenLabs $5-10/month
- **Domain**: Free (use IP) or $3/month
- **Storage**: Included
- **Total**: $11-19/month

### Setup Time: 30 minutes ⏱️

### Next Steps:
1. Create DigitalOcean account
2. Create droplet
3. Run deployment script
4. Point domain to IP
5. Get ElevenLabs API key
6. Deploy and launch!

**Good luck! 🚀**
