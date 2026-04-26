# Voice Over Studio - MVP API Documentation (18 APIs)

## Scope: Minimal Viable Product
- Development Time: 3-4 weeks
- Monthly Cost: $30-60
- Providers: ElevenLabs + Local Storage + Free Libraries

---

## 1. VOICE TOOLS (4 APIs)

### 1.1 Voice Generator
- **POST** `/api/audio/generate` - Generate voice
  - Required: `text`, `voiceId`, `stability`, `similarity_boost`
  - Returns: `audioUrl`, `duration`, `voiceId`
- **GET** `/api/audio/voices` - Get available ElevenLabs voices
  - Returns: Array of voice objects

### 1.2 Voice Library
- **GET** `/api/voice-library` - Get saved voice presets
  - Returns: Array of saved voices
- **POST** `/api/voice-library` - Save voice preset
  - Required: `name`, `voiceId`, `settings`
  - Returns: `presetId`

---

## 2. AUDIO TOOLS (3 APIs)

### 2.1 Audio Mixer
- **POST** `/api/mixing/mix` - Mix 2 audio tracks
  - Required: `voiceoverPath`, `musicPath` (optional), `voiceVolume`, `musicVolume`
  - Returns: `outputUrl`, `duration`

### 2.2 Sound Effects
- **GET** `/api/sound-effects` - Get available effects
  - Query: `category` (optional)
  - Returns: Array of sound effects
- **POST** `/api/sound-effects/apply` - Apply effect to audio
  - Required: `audioPath`, `effectId`
  - Returns: `outputUrl`

---

## 3. PROJECT MANAGEMENT (5 APIs)

### 3.1 Projects
- **GET** `/api/projects` - Get all projects
- **POST** `/api/projects` - Create project
  - Required: `name`, `description`
  - Returns: `projectId`
- **GET** `/api/projects/:id` - Get project details
- **PUT** `/api/projects/:id` - Update project
- **DELETE** `/api/projects/:id` - Delete project

### 3.2 Project Files
- **POST** `/api/projects/:id/upload` - Upload file
  - Required: `file`
  - Returns: `fileId`, `filePath`, `url`
- **DELETE** `/api/projects/:id/files/:fileId` - Delete file

---

## 4. UTILITIES (3 APIs)

### 4.1 Health & Status
- **GET** `/api/health` - Health check
  - Returns: `status`, `timestamp`

### 4.2 File Management
- **GET** `/api/download/:fileId` - Download file
- **POST** `/api/upload` - Upload any file
  - Required: `file`
  - Returns: `fileId`, `filePath`, `url`

---

## REMOVED FROM MVP:

❌ Voice Blending (Phase 2)
❌ Voice Emotions (Phase 2)
❌ Music Generator (Phase 2)
❌ Video Studio (Phase 2)
❌ Animation Sync (Phase 2)
❌ Commercial Generator (Phase 2)
❌ Advanced Mixing Board (Phase 2)
❌ Multiple voice/music providers (Phase 2)
❌ User Authentication (Phase 2)
❌ Database APIs (internal only)

---

## ESTIMATED COSTS:

### ElevenLabs
- **Free Plan**: 10k characters/month
- **Starter**: $5/month (100k chars)
- **Professional**: $30/month (1M chars)
- **Recommended for MVP**: Starter ($5/month)

### Hosting
- Basic Node.js Server: $20-50/month (Heroku, DigitalOcean, Render)

### Storage
- Local File System: Included in hosting

### Total MVP Cost: $25-55/month ✅

---

## DEPLOYMENT:

### Option 1: DigitalOcean (Recommended)
- Droplet (1GB): $6/month
- App Platform: $12/month
- Total: $18/month + ElevenLabs $5 = **$23/month**

### Option 2: Heroku
- Basic Dyno: $50/month + ElevenLabs $5 = **$55/month**

### Option 3: Render
- Free tier initially, then $7/month + ElevenLabs = **$12/month**

---

## FEATURES INCLUDED:

✅ Generate professional voice-overs
✅ Save/load voice presets
✅ Mix voice with background music
✅ Apply sound effects
✅ Manage projects
✅ Upload/download audio files
✅ Professional dashboard
✅ Documentation

---

## TIMELINE:

### Week 1: Backend Build
- ElevenLabs integration
- Voice library endpoints
- Mixing API
- Project management

### Week 2: Frontend Integration
- Voice generator UI
- Audio mixer UI
- Project management UI
- File upload/download

### Week 3: Polish
- Error handling
- Testing
- Documentation
- Deploy

### Week 4: Launch Prep
- Beta testing
- Performance optimization
- User guide

---

Would you like me to:
1. Remove all the unnecessary APIs from the code?
2. Create only MVP routes?
3. Update the documentation to reflect MVP scope?
4. Create a Phase 2 roadmap file?
