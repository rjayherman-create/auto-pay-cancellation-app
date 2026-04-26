# 🎬 CardHugs Studio - Quick Start

## Start Your Application

### Option 1: Using Docker (Recommended)
```bash
docker compose up
```

### Option 2: Local Development
```bash
# Backend
cd backend
npm install
npm start

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Access the Application

Open your browser and go to:
```
http://localhost:8000
```

You'll see the **Main Menu** with two options:

---

## 🎥 Video Studio

**What it does:**
- Create animated videos
- Edit animations on a timeline
- Add effects and transitions
- Professional video editing tools

**How to use:**
1. Click the **Video Studio** card
2. Use the timeline editor
3. Add animations, effects, and transitions
4. Export your final video

---

## 🎵 Music Generator (NEW!)

**What it does:**
- Generate unlimited AI-powered background music
- Choose from 30+ music genres
- Download royalty-free tracks
- Preview before downloading

**How to use:**
1. Click the **Music Generator** card
2. Describe the music you want (e.g., "upbeat electronic dance with strong bass")
3. Select duration and genre
4. Click "Generate Music"
5. Wait 10-60 seconds for AI to create
6. Download the track

---

## 🔑 Setup API Keys (For Music Generator)

### Step 1: Add to .env file
```bash
# Music Generation APIs
SUNO_API_KEY=your-key-here
UNETIC_API_KEY=your-key-here
AUDIOCRAFT_API_KEY=your-key-here
```

### Step 2: Get API Keys

**Suno AI (Recommended):**
- Go to: https://www.suno.ai/
- Sign up → Settings → API Keys
- Copy key to `.env`

**Unetic:**
- Go to: https://unetic.ai/
- Sign up → Dashboard → API
- Copy key to `.env`

### Step 3: Restart Backend
```bash
docker compose down && docker compose up
```

---

## 📍 Menu Navigation

### Main Menu (Home)
- See all available applications
- Beautiful card layout with animations
- Click any card to launch app

### Inside Apps
- Click **← Menu** button (top-left) to return to main menu
- Each app is fully independent

---

## 🎵 Music Generator Examples

### Example 1: Upbeat Electronic
**Input:** "Upbeat electronic dance music with strong bass and synth melody, 120 BPM, high energy"
**Duration:** 30 seconds
**Genre:** Electronic
**Result:** High-energy dance track

### Example 2: Relaxing Lo-Fi
**Input:** "Calm lo-fi hip hop with rain sounds and relaxing vibes, slow tempo"
**Duration:** 60 seconds
**Genre:** Lo-Fi
**Result:** Chill background music

### Example 3: Cinematic
**Input:** "Cinematic orchestral piece with strings and French horns, epic, dramatic"
**Duration:** 45 seconds
**Genre:** Orchestral
**Result:** Movie-quality background music

---

## 💡 Tips for Best Results

✅ **Be specific:**
- Tempo (fast, slow, moderate)
- Instruments (piano, guitar, drums, synth)
- Mood (happy, sad, energetic, calm)
- Background sounds (rain, birds, waves)

❌ **Don't:**
- Just say "happy music"
- Be too vague
- Ask for copyrighted songs

---

## 🚀 Features

### Video Studio
- ✅ Animation timeline
- ✅ Track editor (animation, voice, music, effects, text)
- ✅ Playback controls
- ✅ Project management
- ✅ Export to video

### Music Generator
- ✅ AI-powered music creation
- ✅ 30+ genres and styles
- ✅ Customizable duration (10-120 seconds)
- ✅ Audio preview player
- ✅ Download as MP3
- ✅ Music library
- ✅ No watermarks
- ✅ Royalty-free

---

## 📊 Ports & Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 8000 | http://localhost:8000 |
| Backend | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |

---

## 🆘 Troubleshooting

### "Music Generator doesn't work"
1. Check you've added API keys to `.env`
2. Restart backend: `docker compose down && docker compose up`
3. Clear browser cache (Ctrl+Shift+Del)
4. Refresh page (Ctrl+R)

### "API key not configured"
- Make sure key is in `.env` file
- No extra spaces before/after key
- Restart backend after adding
- Check exact key spelling

### "Generation takes too long"
- Some services take 30-60 seconds
- Try a shorter duration (30s instead of 60s)
- Try different service (auto-select)
- Check service status page

### "Can't see Music Generator in menu"
- Ensure you're at `http://localhost:8000`
- Browser shows main menu with two cards
- Try hard refresh: Ctrl+Shift+R

---

## 📁 Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MainMenu.jsx (NEW - Main navigation)
│   │   │   ├── MainMenu.css
│   │   │   ├── VideoStudio.jsx
│   │   │   ├── MusicGeneratorApp.jsx (NEW - Standalone app)
│   │   │   └── MusicGeneratorApp.css
│   │   └── App.jsx (Updated to use MainMenu)
│   └── package.json
├── backend/
│   ├── routes/
│   │   ├── animation.js
│   │   └── music.js (NEW - Music API)
│   ├── server.js (Updated)
│   └── package.json
└── docker-compose.yml
```

---

## 🎬 Next Steps

1. ✅ Start the application: `docker compose up`
2. ✅ Open: `http://localhost:8000`
3. ✅ See the main menu with Video Studio & Music Generator
4. ✅ Click Music Generator
5. ✅ Add API key to `.env` (Suno, Unetic, or AudioCraft)
6. ✅ Generate your first music track!

---

## 📚 Documentation

- `MUSIC_GENERATOR_SETUP.md` - Detailed music generator guide
- `MUSIC_GENERATOR_STANDALONE.md` - Standalone app setup
- Backend logs: `docker logs <container>`
- Browser console: F12 → Console tab

---

## 🎉 You're All Set!

Your CardHugs Studio is ready with:
- ✅ Beautiful main menu
- ✅ Video Studio for animations
- ✅ Music Generator for AI music
- ✅ Professional UI/UX
- ✅ Easy navigation

Start creating! 🚀
