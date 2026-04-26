# 🎙️ VOICE-OVER APP - RUNNING ON PORT 8080

## ✅ STATUS: LIVE & READY

---

## 🌐 ACCESS YOUR VOICE-OVER APP

### Main Application
```
http://localhost:8080
```

### Backend API
```
http://localhost:3000
```

---

## 📦 RUNNING SERVICES

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| **Voice-Over Frontend** | 8080 | ✓ Healthy | React UI for voice production |
| **Voice-Over API** | 3000 | ✓ Healthy | Audio processing backend |
| **FFmpeg** | - | ✓ Running | Audio codec support |

---

## 🎯 IMPORTANT NOTES

- Voice-Over app is on **port 8080** (NOT localhost)
- No cache issues this time - completely separate port
- CardHugs app (if needed) can use port 80 separately

---

## 🎙️ WHAT YOU CAN DO

✓ Record voice directly in browser
✓ Upload audio files (MP3, WAV, etc)
✓ Apply professional audio effects
✓ Adjust pitch, tone, and volume
✓ Blend multiple voice tracks
✓ Export processed audio
✓ Download ready-to-use files

---

## 🚀 QUICK START

1. **Open browser**: http://localhost:8080
2. **Record or upload** voice
3. **Apply effects**
4. **Blend voices** (if needed)
5. **Export audio**
6. **Download file**

---

## 🔧 DOCKER COMMANDS

From `audio-production-studio` directory:

```powershell
# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Start services
docker compose up -d
```

---

## 📊 RUNNING CONTAINERS

```
audio-studio-frontend   0.0.0.0:8080->5173/tcp   ✓ Healthy
audio-studio-api        0.0.0.0:3000->3000/tcp   ✓ Healthy
audio-studio-ffmpeg     -                         ✓ Running
```

---

## ✨ FEATURES

### Audio Recording
- Record directly in browser
- Real-time waveform display
- Volume monitoring

### Audio Upload
- Support for multiple formats
- Drag & drop upload
- File validation

### Audio Effects
- Professional effects library
- Real-time preview
- Parameter adjustment
- EQ and filtering

### Voice Blending
- Layer multiple voices
- Voice combination tools
- Harmony creation
- Professional mixing

### Audio Export
- Multiple format export
- Quality options
- Download ready files

---

## 🎙️ WORKFLOW

```
User opens: http://localhost:8080
         ↓
React Frontend loads on port 8080
         ↓
Record or upload voice file
         ↓
Apply audio effects via API (port 3000)
         ↓
FFmpeg processes audio
         ↓
User exports processed audio
         ↓
Download file to device
```

---

## 💾 API ENDPOINTS

### Health Check
```
GET http://localhost:3000/health
```

### Upload Audio
```
POST http://localhost:3000/api/upload
Content-Type: multipart/form-data
```

### Apply Effects
```
POST http://localhost:3000/api/effects
Body: { effects: [...], audio_id: "..." }
```

### Export Audio
```
GET http://localhost:3000/api/export/:id
```

---

## ⚙️ CONFIGURATION

### Environment Variables
File: `audio-production-studio/.env.example`

```env
NODE_ENV=development
PORT=3000
ELEVENLABS_API_KEY=optional
KITSAI_API_KEY=optional
```

---

## 🐛 TROUBLESHOOTING

### Page won't load
```powershell
cd audio-production-studio
docker compose ps
docker compose logs frontend
```

### API not responding
```powershell
docker compose logs api
docker compose restart api
```

### Audio processing slow
- Check system RAM (needs 2GB+)
- Try smaller audio files
- Check FFmpeg logs

### Port already in use
```powershell
# Change port in docker-compose.yml frontend ports
ports:
  - "8888:5173"  # Use different port
```

---

## 📝 IMPORTANT

✓ Voice-Over app is **SEPARATE** from CardHugs
✓ Running on **port 8080** (not port 80)
✓ **No browser cache issues** with separate port
✓ Fully functional and ready to use

---

## 🎯 NEXT STEPS

1. Go to: **http://localhost:8080**
2. Start creating voice-overs!
3. Record, edit, blend, export
4. Download your audio files

---

**✅ Voice-Over Production Studio is READY!**

🎙️ http://localhost:8080
