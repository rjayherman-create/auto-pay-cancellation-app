# Voice Over Studio - Complete API Documentation

## Base URL
`http://localhost:3000/api`

---

## 1. VOICE TOOLS APIs

### 1.1 Voice Library
- **GET** `/voice-library` - Get all saved voice presets
- **POST** `/voice-library` - Create new voice preset
- **PUT** `/voice-library/:id` - Update voice preset
- **DELETE** `/voice-library/:id` - Delete voice preset
- **GET** `/voice-library/:id` - Get specific voice preset

### 1.2 Voice Generator
- **GET** `/audio/voices/elevenlabs` - Get available voices from ElevenLabs
- **GET** `/audio/voices/google` - Get available voices from Google TTS
- **POST** `/audio/generate/elevenlabs` - Generate voice using ElevenLabs
  - Required: `text`, `voiceId`, `stability`, `similarity_boost`
  - Returns: `audioUrl`, `duration`, `voiceId`
- **POST** `/audio/generate/google` - Generate voice using Google TTS
  - Required: `text`, `voice`, `language`
  - Returns: `audioUrl`, `duration`

### 1.3 Voice Blending
- **GET** `/voice-blending` - Get all blended voice projects
- **POST** `/voice-blending` - Create new blend project
  - Required: `name`, `voice1Id`, `voice2Id`, `blendRatio`
  - Returns: `projectId`, `blendedVoiceUrl`
- **PUT** `/voice-blending/:id` - Update blend project
- **DELETE** `/voice-blending/:id` - Delete blend project
- **POST** `/voice-blending/:id/generate` - Generate blended audio
  - Required: `text`, `projectId`
  - Returns: `audioUrl`, `duration`

### 1.4 Voice Emotions
- **GET** `/emotions` - Get available emotion presets
- **GET** `/emotions/voices` - Get voices with emotional variants
- **POST** `/audio/generate/emotion` - Generate voice with emotion
  - Required: `text`, `voiceId`, `emotion` (happy, sad, angry, calm, etc.)
  - Returns: `audioUrl`, `duration`, `emotion`
- **GET** `/emotions/:id` - Get specific emotion preset

---

## 2. AUDIO TOOLS APIs

### 2.1 Audio Mixer
- **POST** `/mixing/mix` - Mix multiple audio tracks
  - Required: `voiceover`, `backgroundMusic` (optional), `duration`
  - Returns: `outputUrl`, `duration`, `format`
- **GET** `/mixing/projects` - Get all mixing projects
- **POST** `/mixing/projects` - Create new mixing project
- **PUT** `/mixing/projects/:id` - Update mixing project
- **DELETE** `/mixing/projects/:id` - Delete mixing project

### 2.2 Advanced Mixing Board
- **GET** `/mixer/projects` - Get all mixer projects
- **POST** `/mixer/projects` - Create new mixer project
- **PUT** `/mixer/projects/:id` - Update mixer project with multiple tracks
  - Required: `tracks` (array of track objects with volume, pan, effects)
  - Returns: `projectId`, `mixedAudioUrl`
- **POST** `/mixer/:projectId/add-track` - Add track to mixing board
  - Required: `filePath`, `volume`, `pan`, `trackType`
- **POST** `/mixer/:projectId/remove-track/:trackId` - Remove track
- **POST** `/mixer/:projectId/apply-effect` - Apply effect to track
  - Required: `trackId`, `effectType`, `effectParameters`
- **POST** `/mixer/:projectId/export` - Export mixed audio
  - Required: `format` (mp3, wav, etc.), `quality`

### 2.3 Sound Effects
- **GET** `/sound-effects` - Get all available sound effects
- **GET** `/sound-effects/categories` - Get effect categories
- **POST** `/sound-effects/search` - Search sound effects
  - Required: `query`, `category` (optional)
- **GET** `/sound-effects/:id` - Get specific sound effect
- **POST** `/sound-effects/apply` - Apply effect to audio
  - Required: `audioPath`, `effectId`, `intensity`
  - Returns: `outputUrl`
- **POST** `/sound-effects/download/:id` - Download sound effect

---

## 3. PRODUCTION TOOLS APIs

### 3.1 Video Studio
- **POST** `/video/project` - Create new video project
  - Required: `name`, `duration`, `resolution` (1920x1080, etc.)
  - Returns: `projectId`
- **GET** `/video/project/:projectId` - Get video project details
- **PUT** `/video/project/:projectId` - Update video project
- **DELETE** `/video/project/:projectId` - Delete video project
- **POST** `/video/project/:projectId/track` - Add track to video
  - Required: `label`, `type` (animation, audio, text, etc.)
- **POST** `/video/project/:projectId/remove-track/:trackId` - Remove track
- **POST** `/video/project/:projectId/export` - Export video
  - Required: `format` (mp4, mov, etc.), `quality` (hd, 4k, etc.)
  - Returns: `exportId`, `status`
- **GET** `/video/export/:exportId/status` - Get export status

### 3.2 Music Generator
- **GET** `/music/styles` - Get available music styles/genres
- **POST** `/music/generate` - Generate music
  - Required: `prompt`, `duration`, `genre`, `service` (auto, suno, unetic, audiocraft)
  - Returns: `trackId`, `audioUrl`, `status`
- **GET** `/music/status/:trackId` - Get music generation status
- **GET** `/music/download/:trackId` - Download generated music
- **POST** `/music/save` - Save generated music to library
  - Required: `trackId`, `name`, `genre`

### 3.3 Animation Sync
- **POST** `/animation/timeline` - Create animation timeline
  - Required: `audioPath`, `sceneBreakpoints` (optional)
  - Returns: `timelineId`, `totalFrames`, `fps`
- **GET** `/animation/timeline/:timelineId` - Get timeline details
- **PUT** `/animation/timeline/:timelineId` - Update timeline
- **POST** `/animation/timeline/:timelineId/add-scene` - Add scene to timeline
- **POST** `/animation/timeline/:timelineId/export` - Export with animation sync
- **GET** `/animation/scenes` - Get available animation scenes

### 3.4 Commercial Generator
- **POST** `/audio/commercial/generate` - Generate commercial script
  - Required: `productName`, `tagline`, `callToAction`, `duration`, `voiceId`
  - Returns: `script`, `voiceoverUrl`, `music`, `videoUrl` (optional)
- **GET** `/audio/commercial/templates` - Get commercial templates
- **POST** `/audio/commercial/preview` - Preview commercial before generation

---

## 4. PROJECT MANAGEMENT APIs

### 4.1 Projects
- **GET** `/projects` - Get all projects
- **POST** `/projects` - Create new project
  - Required: `name`, `type` (voiceover, video, music, etc.), `description`
  - Returns: `projectId`, `created`
- **GET** `/projects/:id` - Get project details
- **PUT** `/projects/:id` - Update project
- **DELETE** `/projects/:id` - Delete project
- **POST** `/projects/:id/duplicate` - Duplicate project
- **POST** `/projects/:id/export` - Export complete project
- **POST** `/projects/:id/share` - Share project
  - Required: `emails` (array)

### 4.2 Project Files
- **GET** `/projects/:projectId/files` - Get all files in project
- **POST** `/projects/:projectId/upload` - Upload file to project
  - Required: `file`, `type` (audio, video, image, etc.)
  - Returns: `fileId`, `filePath`, `fileSize`
- **DELETE** `/projects/:projectId/files/:fileId` - Delete file
- **POST** `/projects/:projectId/files/:fileId/rename` - Rename file

---

## 5. DATABASE/LIBRARY APIs

### 5.1 Voice Database
- **GET** `/database/voices` - Get all voices in database
- **GET** `/database/voices/blended` - Get blended voices
- **GET** `/database/voices/emotional` - Get emotional voices
- **POST** `/database/voices/import` - Import new voice

### 5.2 Audio Database
- **GET** `/database/audio` - Get all audio files
- **GET** `/database/audio/effects` - Get sound effects library
- **POST** `/database/audio/upload` - Upload audio file
- **DELETE** `/database/audio/:id` - Delete audio file

### 5.3 Projects Database
- **GET** `/database/projects` - Get all saved projects
- **POST** `/database/projects/backup` - Backup all projects

### 5.4 Music Tracks
- **GET** `/database/music` - Get all music tracks
- **POST** `/database/music/import` - Import music track
- **DELETE** `/database/music/:id` - Delete music track

---

## 6. UTILITY APIs

### 6.1 Health & Status
- **GET** `/health` - Health check endpoint
  - Returns: `status`, `timestamp`

### 6.2 File Management
- **POST** `/upload` - Upload file
  - Required: `file`
  - Returns: `fileId`, `filePath`, `fileSize`, `url`
- **GET** `/download/:fileId` - Download file
- **DELETE** `/files/:fileId` - Delete uploaded file

### 6.3 Settings
- **GET** `/settings` - Get user settings
- **PUT** `/settings` - Update user settings
  - Optional: `apiKeys`, `preferences`, `defaultQuality`

### 6.4 Search
- **POST** `/search` - Global search
  - Required: `query`, `type` (all, voices, projects, audio, etc.)
  - Returns: `results` (array of matching items)

---

## 7. AUTHENTICATION APIs (Optional)

### 7.1 User Management
- **POST** `/auth/login` - User login
  - Required: `email`, `password`
- **POST** `/auth/logout` - User logout
- **POST** `/auth/register` - User registration
- **GET** `/auth/me` - Get current user
- **PUT** `/auth/profile` - Update user profile

### 7.2 API Keys
- **GET** `/auth/api-keys` - Get user API keys
- **POST** `/auth/api-keys` - Generate new API key
- **DELETE** `/auth/api-keys/:keyId` - Delete API key

---

## 8. ERROR HANDLING

All endpoints should return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "timestamp": "2026-02-16T16:00:00.000Z"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 9. REQUEST/RESPONSE EXAMPLES

### Example: Generate Voice
```
POST /api/audio/generate/elevenlabs
Content-Type: application/json

{
  "text": "Hello, this is a test voice",
  "voiceId": "Rachel",
  "stability": 0.5,
  "similarity_boost": 0.75
}

Response 200:
{
  "success": true,
  "audioUrl": "/uploads/audio/voice_123456.mp3",
  "duration": 3.5,
  "voiceId": "Rachel",
  "timestamp": "2026-02-16T16:00:00.000Z"
}
```

### Example: Generate Music
```
POST /api/music/generate
Content-Type: application/json

{
  "prompt": "Upbeat electronic dance music with strong bass",
  "duration": 30,
  "genre": "electronic",
  "service": "auto"
}

Response 200:
{
  "success": true,
  "trackId": "music_789456",
  "audioUrl": "/uploads/music/track_789456.mp3",
  "status": "generated",
  "duration": 30,
  "genre": "electronic"
}
```

### Example: Create Project
```
POST /api/projects
Content-Type: application/json

{
  "name": "Commercial 2026",
  "type": "commercial",
  "description": "Product commercial for new launch"
}

Response 201:
{
  "success": true,
  "projectId": "proj_123456",
  "name": "Commercial 2026",
  "type": "commercial",
  "created": "2026-02-16T16:00:00.000Z",
  "lastModified": "2026-02-16T16:00:00.000Z"
}
```

---

## 10. IMPLEMENTATION PRIORITY

### Phase 1 (Core)
- ✅ Voice Generator (ElevenLabs)
- ✅ Audio Mixer
- ✅ Sound Effects
- ✅ Project Management
- ✅ File Upload/Download

### Phase 2 (Extended)
- Music Generator
- Video Studio
- Animation Sync
- Voice Blending
- Voice Emotions

### Phase 3 (Advanced)
- Commercial Generator
- Advanced Mixing Board
- User Authentication
- Database Management
- Social Sharing

---

## 11. EXTERNAL API INTEGRATIONS

### ElevenLabs TTS
- Base URL: `https://api.elevenlabs.io`
- Endpoints: `/v1/text-to-speech/{voice_id}`, `/v1/voices`
- Authentication: API Key in header

### Suno AI Music
- Base URL: `https://api.suno.ai`
- Endpoints: `/api/custom_generate`, `/api/metadata/{trackId}`
- Authentication: Bearer Token

### Google Cloud TTS (Optional)
- Base URL: `https://texttospeech.googleapis.com`
- Endpoints: `/v1/text:synthesize`
- Authentication: API Key

### Unetic Music (Optional)
- Base URL: `https://api.unetic.ai`
- Endpoints: `/v1/music/generate`
- Authentication: Bearer Token

### AudioCraft by Meta (Optional)
- Base URL: `https://api.audiocraft.meta.com`
- Endpoints: `/v1/musicgen`
- Authentication: Bearer Token

---

## 12. DATABASE MODELS

### Voice Object
```json
{
  "id": "voice_123",
  "name": "Rachel",
  "provider": "elevenlabs",
  "gender": "female",
  "accent": "american",
  "language": "en",
  "description": "Professional narrator voice"
}
```

### Project Object
```json
{
  "id": "proj_123",
  "name": "Project Name",
  "type": "voiceover",
  "description": "Project description",
  "created": "2026-02-16T16:00:00.000Z",
  "lastModified": "2026-02-16T16:00:00.000Z",
  "files": [],
  "status": "active"
}
```

### Audio File Object
```json
{
  "id": "file_123",
  "filename": "audio.mp3",
  "filepath": "/uploads/audio/audio_123.mp3",
  "filesize": 1024000,
  "duration": 30,
  "format": "mp3",
  "uploaded": "2026-02-16T16:00:00.000Z",
  "url": "http://localhost:3000/uploads/audio/audio_123.mp3"
}
```

---

This comprehensive list covers all APIs needed for the Voice Over Studio application.
