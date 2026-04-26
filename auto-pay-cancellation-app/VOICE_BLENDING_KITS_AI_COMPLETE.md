# 🎨 KITS.AI VOICE BLENDING INTEGRATION - COMPLETE GUIDE

## Overview
Your Audio Production Studio now includes **professional voice blending** powered by Kits.ai. Blend any two cartoon voices to create unique synthetic voices that blend characteristics from both source voices.

---

## 🚀 WHAT'S NEW

### Voice Blending Studio Tab
A new **🎨 Voice Blending** tab is now available in your app with three main sections:

1. **➕ Create Blend** - Blend two voices with custom blend ratio
2. **🎤 Generate Audio** - Generate speech using blended voices
3. **📚 My Blends** - Manage and view all your blended voices

---

## 🎯 HOW IT WORKS

### Step 1: Access Voice Blending Studio
- Open your app: http://localhost:5173
- Click the **🎨 Voice Blending** tab
- Choose the **➕ Create Blend** sub-tab

### Step 2: Select Two Voices
- Choose **Voice 1** from the dropdown (e.g., "Cartoon Hero - Brave")
- Choose **Voice 2** from the dropdown (e.g., "Cartoon Villain - Deep")
- See descriptions of each voice's characteristics

### Step 3: Set the Blend Ratio
- Use the **blend slider** to control the mix percentage
- 100% left = 100% Voice 1, 0% Voice 2
- 50% middle = Equal blend of both voices
- 0% right = 0% Voice 1, 100% Voice 2

**Example Blends:**
- **70% Hero + 30% Villain** = Brave with slight menace
- **50% Hero + 50% Princess** = Friendly but authoritative
- **40% Villain + 60% Narrator** = Professional but dark

### Step 4: Name Your Blend
- Enter a memorable name (optional)
- Add a description explaining the blend purpose
- This helps identify blends later

### Step 5: Set Sample Text
- Enter text you want to hear with the blended voice
- Default: "Hello, this is a blended voice sample."
- This creates the preview audio

### Step 6: Create the Blend
- Click **✨ Create Blended Voice**
- The system processes and creates your blended voice
- A sample audio file is generated automatically
- Your blended voice is saved to **My Blends**

---

## 🎤 GENERATING AUDIO WITH BLENDED VOICES

### Access the Generator
1. Click the **🎤 Generate Audio** tab
2. Select a blended voice from your library
3. Listen to the sample audio preview

### Generate Speech
1. Enter text you want to generate
2. Adjust speed (0.5x to 2x) for pacing
3. Adjust pitch (0.5x to 2x) for tone
4. Click **🎤 Generate Audio**
5. Download the generated MP3

### Example Workflow
```
Text: "Let's save the kingdom!"
Voice: "Brave Hero Mix" (70% Hero + 30% Villain)
Speed: 1.0x (normal)
Pitch: 1.1x (slightly higher energy)
→ Generated unique voice audio ready to use
```

---

## 📚 MANAGING YOUR BLENDED VOICES

### View All Blends
- Click the **📚 My Blends** tab
- See cards for each blended voice
- Shows blend ratio (e.g., "60% Voice 1 - 40% Voice 2")

### Voice Card Information
Each blended voice card shows:
- **Name** - Your custom name for the blend
- **Description** - What you wrote when creating it
- **Blend Ratio** - Percentage breakdown
- **Sample Audio** - Listen to preview
- **Usage Stats** - How many times it's been used
- **Creation Date** - When the blend was created

### Listen to Samples
- Click the audio player on any voice card
- Preview how the blended voice sounds

### Delete Blends
- Click the 🗑️ button on any card
- Confirm deletion
- Blend is removed from your library

---

## 🔧 BACKEND API ENDPOINTS

### Voice Blending API
All endpoints are at `http://localhost:3000/api/voice-blending/`

#### GET /voices
Fetch available voices for blending
```bash
curl http://localhost:3000/api/voice-blending/voices
```

**Response:**
```json
{
  "success": true,
  "voices": [
    {
      "id": "kits_voice_1",
      "name": "Cartoon Hero - Brave",
      "description": "Young male, heroic tone, energetic",
      "category": "cartoon",
      "characteristics": ["male", "young", "energetic"]
    }
  ],
  "total": 6
}
```

#### POST /blend
Create a new blended voice
```bash
curl -X POST http://localhost:3000/api/voice-blending/blend \
  -H "Content-Type: application/json" \
  -d '{
    "voice1Id": "kits_voice_1",
    "voice2Id": "kits_voice_2",
    "blendName": "Heroic Villain",
    "voice1Weight": 0.7,
    "voice2Weight": 0.3,
    "sampleText": "Let's go on an adventure!",
    "description": "Brave with a hint of darkness"
  }'
```

**Response:**
```json
{
  "success": true,
  "blendedVoice": {
    "id": "blend_uuid_123",
    "name": "Heroic Villain",
    "description": "Brave with a hint of darkness",
    "voice1": { "id": "kits_voice_1", "weight": 0.7 },
    "voice2": { "id": "kits_voice_2", "weight": 0.3 },
    "sampleAudioUrl": "/uploads/blended-voices/...",
    "createdAt": "2026-02-16T13:10:46.990Z",
    "usageCount": 0,
    "metadata": { "blendRatio": "70% voice1 - 30% voice2" }
  }
}
```

#### GET /blended
Get all blended voices
```bash
curl http://localhost:3000/api/voice-blending/blended
```

#### GET /blended/:voiceId
Get a specific blended voice
```bash
curl http://localhost:3000/api/voice-blending/blended/blend_uuid_123
```

#### POST /generate
Generate audio with a blended voice
```bash
curl -X POST http://localhost:3000/api/voice-blending/generate \
  -H "Content-Type: application/json" \
  -d '{
    "blendedVoiceId": "blend_uuid_123",
    "text": "Hello there!",
    "speed": 1.0,
    "pitch": 1.0
  }'
```

**Response:**
```json
{
  "success": true,
  "audio": {
    "audioId": "audio_uuid",
    "blendedVoiceId": "blend_uuid_123",
    "text": "Hello there!",
    "audioUrl": "/uploads/blended-voices/generated_...",
    "generatedAt": "2026-02-16T13:10:46.990Z"
  }
}
```

#### PUT /blended/:voiceId
Update blended voice metadata
```bash
curl -X PUT http://localhost:3000/api/voice-blending/blended/blend_uuid_123 \
  -H "Content-Type: application/json" \
  -d '{ "description": "Updated description" }'
```

#### DELETE /blended/:voiceId
Delete a blended voice
```bash
curl -X DELETE http://localhost:3000/api/voice-blending/blended/blend_uuid_123
```

#### GET /stats
Get blending statistics
```bash
curl http://localhost:3000/api/voice-blending/stats
```

---

## 🔑 ENVIRONMENT SETUP

### Add Kits.ai API Key

1. **Get your Kits.ai API key:**
   - Visit https://kits.ai
   - Create an account
   - Go to Settings → API Keys
   - Copy your API key

2. **Update .env file:**
   ```env
   KITSAI_API_KEY=your_kitsai_api_key_here
   KITSAI_API_URL=https://api.kits.ai/v1
   ```

3. **Restart your server:**
   ```bash
   npm run dev
   ```

---

## 📊 BLENDED VOICE DATA STRUCTURE

Each blended voice stores:
```json
{
  "id": "unique-blend-id",
  "name": "Heroic Villain Mix",
  "description": "Brave hero with menacing undertones",
  "voice1": {
    "id": "kits_voice_1",
    "weight": 0.7
  },
  "voice2": {
    "id": "kits_voice_2",
    "weight": 0.3
  },
  "sampleText": "Let's save the kingdom!",
  "sampleAudioUrl": "/uploads/blended-voices/blended_...",
  "sampleAudioPath": "path/to/audio.mp3",
  "createdAt": "2026-02-16T13:10:46.990Z",
  "status": "ready",
  "usageCount": 5,
  "lastUsedAt": "2026-02-16T14:20:00.000Z",
  "tags": ["blended", "cartoon"],
  "metadata": {
    "blendRatio": "70% voice1 - 30% voice2",
    "apiResponse": { /* Full API response */ }
  }
}
```

---

## 🎯 REAL-WORLD EXAMPLES

### Example 1: Cartoon Character Blend
```
Goal: Create a unique voice for a tough-but-kind superhero

Step 1: Select Voices
- Voice 1: "Cartoon Hero - Brave" (energetic, heroic)
- Voice 2: "Cartoon Narrator - Professional" (deep, wise)

Step 2: Set Ratio
- 60% Hero + 40% Narrator
  → Results in authoritative yet youthful voice

Step 3: Generate Dialogue
- "Don't worry, I'll protect you!"
- Download as superhero_voice_01.mp3
- Use in animation project
```

### Example 2: Villain Character
```
Goal: Create a menacing villain voice

Step 1: Select Voices
- Voice 1: "Cartoon Villain - Deep" (menacing, dark)
- Voice 2: "Cartoon Mystic - Mysterious" (ethereal, wise)

Step 2: Set Ratio
- 75% Villain + 25% Mystic
  → Results in powerful, mystical threat

Step 3: Generate Dialogue
- "Your kingdom is mine now..."
- Download as villain_voice_dark.mp3
- Layer with music and effects in Audio Mixer
```

### Example 3: Comic Relief Character
```
Goal: Create a funny sidekick voice

Step 1: Select Voices
- Voice 1: "Cartoon Sidekick - Funny" (humorous, quirky)
- Voice 2: "Cartoon Hero - Brave" (energetic, positive)

Step 2: Set Ratio
- 65% Sidekick + 35% Hero
  → Results in funny but capable character

Step 3: Generate Dialogue
- "Did someone say snacks?"
- "I'm ready for adventure!"
- Download both and use in scenes
```

---

## 💡 TIPS & TRICKS

### Blend Ratio Tips
- **80/20** = One voice dominates with subtle character addition
- **70/30** = Clear primary voice with secondary influence
- **60/40** = Balanced blend with both voices prominent
- **50/50** = Equal voices, creates entirely new sound
- **40/60** = Secondary voice takes lead role

### Using Blended Voices Effectively
1. **Start with samples** - Always preview with sample text first
2. **Adjust speed/pitch** - Fine-tune generated audio settings
3. **Layer with effects** - Enhance blended voices in Audio Mixer
4. **Keep templates** - Save successful blends for reuse
5. **Tag by character** - Name blends by character type

### Quality Tips
- **Use clear voices** - Blend quality voices for best results
- **Avoid extreme ratios** - 100/0 just uses one voice
- **Different characteristics** - Blend contrasting voices for unique results
- **Generate multiple takes** - Create variations of same dialogue

---

## 📁 FILE STRUCTURE

### New Files Created
```
audio-production-studio/
├── src/
│   ├── services/
│   │   └── voiceBlendingService.js    (Kits.ai integration)
│   ├── routes/
│   │   └── voiceBlendingRoutes.js     (API endpoints)
│   └── data/
│       └── blended-voices.json        (Local storage)
├── frontend/src/
│   ├── VoiceBlending.jsx              (UI component)
│   └── VoiceBlending.css              (Styling)
└── uploads/
    └── blended-voices/                (Audio files)
```

---

## 🔐 SECURITY CONSIDERATIONS

- API key stored in .env (never commit)
- Blended voices stored locally in JSON
- Audio files saved to uploads directory
- CORS enabled for frontend access
- Input validation on all endpoints

---

## 🆘 TROUBLESHOOTING

### Voices Not Loading
```
Issue: No voices appear in dropdown
Solution:
1. Check KITSAI_API_KEY in .env
2. Verify server is running (npm run dev)
3. Check browser console for errors
4. System provides mock voices as fallback
```

### Audio Not Generating
```
Issue: "Failed to generate audio"
Solution:
1. Verify blended voice exists
2. Check text is not empty
3. Ensure server is running
4. Check network tab in browser DevTools
```

### Blends Not Saving
```
Issue: Created blend doesn't appear in library
Solution:
1. Check data/blended-voices.json exists
2. Verify upload directory has write permissions
3. Restart server: npm run dev
4. Check browser console for errors
```

### Slow Performance
```
Solution:
1. Limit number of saved blends (archive old ones)
2. Delete unused blended voices
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart server and browser
```

---

## 🚀 QUICK START REFERENCE

| Task | Action |
|------|--------|
| Create blend | Voice Blending → Create Blend → Select voices → Set ratio → Create |
| Generate audio | Voice Blending → Generate Audio → Select blend → Enter text → Generate |
| View blends | Voice Blending → My Blends |
| Listen to sample | Voice Blending → My Blends → Click play button |
| Delete blend | Voice Blending → My Blends → Click 🗑️ |
| API: List voices | GET /api/voice-blending/voices |
| API: Create blend | POST /api/voice-blending/blend |
| API: Generate audio | POST /api/voice-blending/generate |

---

## 📞 SUPPORT & NEXT STEPS

### Features You Have
✅ Blend any two cartoon voices  
✅ Listen to previews before using  
✅ Generate custom dialogue  
✅ Adjust speed & pitch  
✅ Save blends to library  
✅ Usage tracking & statistics  

### Integrate with Other Features
1. **Projects Tab** - Assign blended voices to characters
2. **Voice Generator** - Generate audio for multiple lines
3. **Audio Mixer** - Layer blended voices with music
4. **Animation Sync** - Sync blended voices to timeline
5. **Commercial Gen** - Create ads with blended voices

### Ready to Use
Your voice blending system is fully integrated and production-ready!

Go to: http://localhost:5173 → Click 🎨 Voice Blending Tab → Start creating!

---

**Happy Voice Blending! 🎨🎤✨**
