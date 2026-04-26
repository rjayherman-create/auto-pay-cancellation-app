# 🎬 Audio Production Studio
## Professional Voice Generation, Audio Mixing & Animation Sync

**A completely independent, standalone application for creating cartoons, commercials, and professional voiceovers.**

---

## 📋 Features

✅ **Voice Generation**
- 100+ professional voices via ElevenLabs
- Custom character voices
- Real-time audio streaming
- Customizable tone and quality

✅ **Audio Mixing**
- Multi-track mixing (voice + music + effects)
- Professional FFmpeg processing
- Real-time volume control
- High-quality MP3 export

✅ **Animation Sync**
- Frame-accurate audio-video synchronization
- 3-minute cartoon support (24/30/60 FPS)
- Scene breakpoint management
- Automatic timeline generation

✅ **Commercial Generation**
- Ready-made commercial templates
- 15s, 30s, 60s formats
- Product ads, promos, social media clips
- Voiceover + background music included

✅ **Multi-Platform Export**
- YouTube (1920x1080 @ 60fps)
- TikTok (1080x1920 @ 30fps)
- Instagram (1080x1080 @ 30fps)
- Web (1280x720 WebM)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- ElevenLabs API key (free at https://elevenlabs.io)

### Step 1: Clone & Setup

```bash
cd audio-production-studio
cp .env.example .env
```

### Step 2: Add API Key

Edit `.env` and add your ElevenLabs key:
```
ELEVENLABS_API_KEY=sk_your_key_here
```

### Step 3: Build & Run

```bash
docker-compose build
docker-compose up -d
```

### Step 4: Access

- **API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## 📡 API Endpoints

### Voice Generation

#### Generate Voice
```bash
POST /api/audio/generate/elevenlabs
Content-Type: application/json

{
  "text": "Hello! I'm a cartoon character!",
  "voiceId": "Rachel",
  "stability": 0.5,
  "similarity_boost": 0.75
}
```

#### Get Voices
```bash
GET /api/audio/voices/elevenlabs
```

#### Create Character
```bash
POST /api/audio/character/create

{
  "characterName": "Hero",
  "samples": [],
  "personality": {
    "age": "child",
    "tone": "friendly",
    "pitch": 1.2
  }
}
```

#### Generate Commercial
```bash
POST /api/audio/commercial/generate

{
  "productName": "MyApp",
  "tagline": "The smart choice",
  "callToAction": "Get it now!",
  "duration": 30,
  "voiceId": "Rachel"
}
```

### Audio Mixing

#### Mix Audio
```bash
POST /api/mixing/mix

{
  "voiceover": {
    "path": "/uploads/audio/voice.mp3",
    "volume": 1.0
  },
  "backgroundMusic": {
    "path": "/uploads/audio/music.mp3",
    "volume": 0.3
  },
  "duration": 180
}
```

#### Adjust Audio
```bash
POST /api/mixing/adjust

{
  "inputPath": "/uploads/audio/voice.mp3",
  "volume": 1.5,
  "speed": 1.0,
  "pitch": 0
}
```

### Animation

#### Create Timeline
```bash
POST /api/animation/timeline

{
  "audioPath": "/uploads/audio/mixed.mp3",
  "sceneBreakpoints": [
    {
      "startTime": 0,
      "dialogue": "Welcome!",
      "action": "Scene 1"
    }
  ]
}
```

#### Create Project
```bash
POST /api/animation/project

{
  "title": "My 3-Minute Cartoon",
  "duration": 180,
  "characterVoices": [
    {"characterName": "Hero", "voiceId": "Rachel"}
  ],
  "fps": 24
}
```

#### Composite Audio + Video
```bash
POST /api/animation/composite

{
  "videoPath": "/uploads/video/animation.mp4",
  "audioPath": "/uploads/audio/mixed.mp3",
  "audioVolume": 1.0,
  "videoVolume": 0.3
}
```

#### Export for Platform
```bash
POST /api/animation/export/youtube

{
  "videoPath": "/uploads/video/composite.mp4"
}
```

Platforms: `youtube`, `tiktok`, `instagram`, `web`

---

## 📁 Project Structure

```
audio-production-studio/
├── src/
│   ├── services/
│   │   ├── audioService.js         # Voice generation
│   │   ├── audioMixingService.js   # FFmpeg mixing
│   │   └── animationService.js     # Animation sync
│   └── routes/
│       ├── audioRoutes.js
│       ├── mixingRoutes.js
│       └── animationRoutes.js
├── uploads/
│   ├── audio/                      # Generated audio
│   └── video/                      # Generated video
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 🔧 Environment Variables

```bash
NODE_ENV=development
PORT=3000

# ElevenLabs (Required)
ELEVENLABS_API_KEY=sk_your_key_here

# Kits.ai (Optional)
KITSAI_API_KEY=your_key_here

# Frontend
VITE_API_URL=http://localhost:3000
```

---

## 💡 Use Cases

### Create 3-Minute Cartoon
```
1. Generate character voices
2. Create animation project
3. Mix audio (voices + music + effects)
4. Generate sync timeline
5. Export for animation software
```

### Create 30-Second Commercial
```
1. Generate commercial
2. Download voiceover
3. Add to video editor
4. Export for platforms
```

### Generate Multi-App Promo Campaign
```
1. Create commercial for each app
2. Mix audio tracks
3. Export to YouTube, TikTok, Instagram
4. Download all assets
```

---

## 🐳 Docker Commands

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down

# Rebuild (no cache)
docker-compose build --no-cache
```

---

## 📝 Example: Complete Workflow

```javascript
const API = 'http://localhost:3000';

// 1. Generate voice
const voice = await fetch(`${API}/api/audio/generate/elevenlabs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hello from the animation studio!",
    voiceId: 'Rachel'
  })
});

// 2. Mix with background music
const mixed = await fetch(`${API}/api/mixing/mix`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    voiceover: { path: voice.audioPath, volume: 1.0 },
    backgroundMusic: { path: '/uploads/audio/music.mp3', volume: 0.3 },
    duration: 180
  })
});

// 3. Create animation timeline
const timeline = await fetch(`${API}/api/animation/timeline`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audioPath: mixed.outputPath
  })
});

// 4. Export for YouTube
const exported = await fetch(`${API}/api/animation/export/youtube`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoPath: '/uploads/video/final.mp4'
  })
});
```

---

## 🛠️ Troubleshooting

### API not responding
```bash
docker-compose logs api
curl http://localhost:3000/health
```

### FFmpeg errors
```bash
docker-compose restart ffmpeg
```

### Out of memory
```bash
# Increase Docker memory limit
# Reduce batch size for processing
```

### File not found errors
```bash
# Verify file path: /uploads/audio/filename.mp3
# List files: curl http://localhost:3000/api/audio/list
```

---

## 📚 Documentation

- **API Reference:** See endpoints above
- **ElevenLabs:** https://elevenlabs.io/docs
- **FFmpeg:** https://ffmpeg.org/documentation.html
- **Docker:** https://docker.com/docs

---

## 🔐 Security Notes

1. **API Keys:**
   - Never commit `.env` file
   - Use environment variables in production
   - Rotate keys regularly

2. **File Access:**
   - Validate all file paths
   - Implement user permissions
   - Use signed URLs for downloads

3. **Rate Limiting:**
   - Implement per-user limits
   - Monitor API usage
   - Alert on anomalies

---

## 🚀 Deployment

### Local Development
- Current Docker Compose setup
- Single machine
- Perfect for testing

### Production (Small)
- Kubernetes cluster
- Multiple replicas
- Database backups
- Redis caching

### Production (Large)
- Load balancer
- Auto-scaling
- Message queue
- CDN for video
- Object storage (S3/GCS)

---

## 📞 Support

- **Issues:** Check logs with `docker-compose logs -f api`
- **API Errors:** Response includes error message
- **Setup Help:** Review `.env.example` and this README

---

## 📄 License

MIT

---

**🎬 Ready to create amazing audio and animations!**

Get started: http://localhost:3000/health
