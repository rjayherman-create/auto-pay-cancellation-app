# Standalone Music Generator - Setup Guide

## 🎵 What Was Added

You now have a **separate Music Generator application** accessible from a beautiful main menu.

## 📍 How to Access

### Step 1: Start Your App
```bash
# If using Docker
docker compose up

# If running locally
npm start
```

### Step 2: Open in Browser
Navigate to: `http://localhost:8000`

### Step 3: Click on Music Generator
You'll see the main menu with two options:
- 🎥 **Video Studio** - Your animation editor
- 🎵 **Music Generator** - AI-powered music creation (NEW!)

Click the **Music Generator** card to open it.

---

## 🎵 Music Generator Features

### Left Panel - Creator
- **📝 Music Description** - Describe what music you want
- **⏱️ Duration** - Select music length (10-120 seconds)
- **🎼 Genre/Style** - Choose from 30+ genres:
  - Ambient, Electronic, Cinematic, Lo-Fi, Corporate
  - Jazz, Orchestral, Folk, Pop, Rock, and more
- **🤖 AI Service** - Auto-select or pick specific service

### Right Panel - Library
- **Music History** - All generated tracks in one place
- **Audio Preview** - Listen before downloading
- **Download** - Save tracks as MP3 files
- **Delete** - Remove from library
- **Statistics** - Track total generated & downloads

---

## 🎯 Quick Start

### Generate Your First Music Track:

1. **Open Music Generator** from main menu
2. **Describe your music:**
   - Example: "Upbeat electronic dance music with strong bass and synth melody"
   - Example: "Calm lo-fi hip hop with rain sounds and relaxing vibes"
3. **Set duration:** Drag slider to desired seconds (default 30s)
4. **Select genre:** Choose from dropdown (optional - system suggests)
5. **Click "Generate Music"** button
6. **Wait 10-60 seconds** for AI to create track
7. **Preview** the audio
8. **Download** or **Delete** when done

---

## 🔑 API Keys Setup

Before generating music, add your API keys:

### Step 1: Edit .env File
```bash
# Music Generation APIs
SUNO_API_KEY=your-key-here
UNETIC_API_KEY=your-key-here
AUDIOCRAFT_API_KEY=your-key-here
```

### Step 2: Get Your Keys

**Option A: Suno AI (Recommended)**
1. Go to: https://www.suno.ai/
2. Sign up for free account
3. Navigate to Settings → API Keys
4. Copy your API key

**Option B: Unetic**
1. Go to: https://unetic.ai/
2. Create account
3. Go to Dashboard → API
4. Generate and copy key

**Option C: AudioCraft (Meta)**
1. Go to: https://www.audiocraft.metademolab.com/
2. Request access
3. Get API key from dashboard

### Step 3: Restart Backend
```bash
# If using Docker
docker compose down && docker compose up

# If local
npm restart
```

---

## 💡 Tips for Best Results

### Be Specific in Your Prompts
❌ **Too vague:** "happy music"
✅ **Good:** "upbeat electronic dance music with strong bass"
✅ **Better:** "upbeat electronic dance music with strong bass and synth melody, 120 BPM, high energy, modern production"

### Include These Elements:
- **Tempo:** Fast, slow, moderate, or specific BPM (e.g., 120 BPM)
- **Instruments:** Piano, guitar, drums, synth, strings, flute, cello, brass
- **Mood:** Happy, sad, energetic, calm, mysterious, romantic, dark, bright
- **Background:** Rain, birds, traffic, ocean waves, wind, crickets
- **Era/Style:** 80s synthwave, modern trap, classical, indie folk, lo-fi, jazz

### Example Prompts:
1. "Cinematic orchestral piece with strings and French horns, epic, dramatic, building to crescendo"
2. "Lo-fi hip hop beat with chill vibes, rain in background, downtempo, 80 BPM"
3. "Corporate upbeat background music, positive, bright, suitable for presentations"
4. "Jazz smooth saxophone with light drums, relaxing, late night, coffee shop vibe"
5. "Dark ambient electronic, mysterious, eerie, deep bass, sci-fi atmosphere"

---

## 📊 Statistics & Library

### Track All Your Creations
- **Generated Counter** - Shows how many tracks you've created
- **Download Counter** - Shows how many you've downloaded
- **Music Library** - Stores all your generated tracks
- **Timestamps** - See when each track was created

### Export Your Music
- **Download** - Save any track as MP3 to your computer
- **Use in Video Studio** - Generated tracks can be imported to Video Studio
- **Share** - Music is royalty-free and ready to use

---

## 🔧 Backend API Endpoints

The music generator uses these API routes:

### Generate Music
```
POST /api/music/generate
Body: {
  "prompt": "Your music description",
  "duration": 30,
  "genre": "ambient",
  "service": "auto"
}
```

### Get Music Styles
```
GET /api/music/styles
Returns: Array of available genres
```

### Check Generation Status
```
GET /api/music/status/:trackId?service=suno
```

---

## 📁 Files Created/Modified

### New Components:
- `/frontend/src/components/MainMenu.jsx` - Menu system
- `/frontend/src/components/MainMenu.css` - Menu styling
- `/frontend/src/components/MusicGeneratorApp.jsx` - Standalone app
- `/frontend/src/components/MusicGeneratorApp.css` - App styling
- `/backend/routes/music.js` - Music API routes

### Modified Files:
- `/frontend/src/App.jsx` - Now shows MainMenu
- `/backend/server.js` - Added music routes
- `.env.example` - Added music API keys

---

## ⚠️ Troubleshooting

### "API key not configured"
- Ensure you've added the key to `.env`
- Restart backend: `docker compose down && docker compose up`
- Check the key is pasted correctly (no extra spaces)

### Generation fails
- Check you have remaining credits with the service
- Try a shorter duration first
- Check service status page
- Use "Auto" service to try alternatives

### No audio plays
- Wait for progress bar to reach 100%
- Check browser console for errors
- Try a different service
- Refresh the page and try again

### Can't find Music Generator
- Make sure you're at `http://localhost:8000`
- You should see the main menu with two cards
- If still not there, clear browser cache and refresh

---

## 🚀 Next Steps

1. ✅ Add API key to `.env` file
2. ✅ Restart your backend
3. ✅ Open http://localhost:8000
4. ✅ Click Music Generator from menu
5. ✅ Describe your first music track
6. ✅ Generate and download!

---

## 📝 Menu Navigation

The app now has three views:

### Main Menu (Home)
- 🎥 Video Studio Card
- 🎵 Music Generator Card
- Beautiful animations and hover effects

### Video Studio
- Your existing animation editor
- ← Menu button to return

### Music Generator
- Left: Music creation panel
- Right: Music library
- ← Menu button to return

---

## 💾 Save Your Music

All generated music is:
- ✅ Royalty-free
- ✅ Ready to download
- ✅ Stored in browser cache
- ✅ Can be used in Video Studio

---

## Support

Need help? Check:
- `/MUSIC_GENERATOR_SETUP.md` - Detailed API documentation
- Backend console logs: `docker logs <container-name>`
- Browser console: Press F12 and check Console tab

Enjoy creating with AI! 🎵

