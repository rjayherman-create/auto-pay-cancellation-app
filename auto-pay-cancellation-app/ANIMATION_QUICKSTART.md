# 🎬 Animation Studio - Quick Start Guide

## Installation (5 minutes)

### 1. Install Dependencies

```bash
# Root directory
npm install

# Frontend dependencies
cd frontend
npm install
cd ..

# Ensure FFmpeg is installed
# macOS: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg
# Windows: Download from https://ffmpeg.org/download.html
```

### 2. Start the Application

```bash
# Development mode (runs both backend and frontend)
npm run dev

# Or run separately:
# Terminal 1 - Backend (port 5000)
npm start

# Terminal 2 - Frontend (port 8080)
cd frontend && npm run dev
```

### 3. Open in Browser

```
http://localhost:8080
```

---

## First Animation (15 minutes)

### Step 1: Navigate to Animation Studio

- Click **🎬 Animation Studio** tab (default)

### Step 2: Upload Assets

1. Click **📁 Assets** button
2. Upload a **background image** (1920×1080)
3. Upload a **character sprite** (PNG with transparency)
4. Upload voice-over audio (MP3/WAV)

### Step 3: Create Keyframes

**Background Layer:**
- Select "Background" layer
- Click **+ Add Keyframe at 0**
- Move to frame 60, adjust opacity to 1.0

**Character Layer:**
- Select "Character" layer
- Add keyframe at frame 60 (x: 0, y: 500)
- Add keyframe at frame 180 (x: 500, y: 500)
- Character will smoothly move between these positions

**Voice-Over:**
- Waveform should display in timeline
- Click on waveform to add animation keyframes

### Step 4: Add Effects

1. Click **✨ Effects** button
2. Select an effect (e.g., "Fade")
3. Click **+ Add Fade Effect**
- Effect appears in timeline

### Step 5: Preview

1. Click **▶ Play**
2. Watch animation in real-time preview
3. Adjust keyframes as needed

### Step 6: Export

1. Click **💾 Export Video**
2. System renders all frames
3. MP4 file downloads automatically

---

## Feature Overview

### Timeline Controls

```
⏮ Rewind to start
▶ Play/Pause
⏭ Jump to end
─────● Scrubber (click to jump to frame)
🔍− Zoom out
🔍+ Zoom in
```

### Layers

- **🖼️ Background** - Static or animated background
- **🧑 Character** - Main animated element
- **✨ Effects** - Overlays and visual effects

### Effects Available

| Icon | Effect | Description |
|------|--------|-------------|
| 🌫️ | Fade | Fade in/out overlay |
| ✨ | Particles | Floating particles |
| 📳 | Shake | Camera shake |
| 💫 | Glow | Glowing effect |
| 🔍 | Zoom | Scale in/out |
| 🔄 | Rotate | Spin objects |
| ➡️ | Slide | Smooth movement |
| 🌀 | Blur | Gaussian blur |

---

## Animation Settings

### Project Properties

- **Duration**: 180 seconds (3 minutes)
- **FPS**: 30 frames per second
- **Resolution**: 1920×1080 (Full HD)
- **Total Frames**: 5,400

### Timeline Navigation

- **Scrubber**: Drag to jump to any frame
- **Keyboard**: (Press ▶ to see playback controls)
- **Click on waveform**: Add keyframes at audio peaks

### Keyframe Properties

Each keyframe stores:
- **Position** (X, Y)
- **Scale** (X, Y multiplier)
- **Rotation** (0-360 degrees)
- **Opacity** (0-1 opacity)

---

## Tips & Tricks

### Performance

1. **Image Optimization**
   - Background: 1920×1080 max
   - Character: 512×512 max
   - Effects: 256×256 max

2. **Keyframe Efficiency**
   - Only add keyframes when values change
   - Longer interpolation ranges = smoother motion
   - Group related keyframes

3. **Effect Usage**
   - Limit to 2-3 concurrent effects
   - Keep effect duration 30-60 frames
   - Test preview before export

### Voice Sync

1. Upload audio first
2. Play timeline to hear voice
3. Click on waveform peaks to sync character animations
4. Use "Slide" effect for mouth movements

### Character Animation Workflow

1. Create keyframe for initial pose
2. Move to next major pose keyframe
3. Add intermediate keyframes for smooth transitions
4. Preview and adjust timing

---

## Troubleshooting

### Canvas Not Showing

- Ensure assets are uploaded
- Check browser console (F12) for errors
- Try refreshing page

### Audio Not Playing

- Verify audio file format (MP3/WAV supported)
- Check browser volume
- Ensure audio upload completed

### Slow Playback

- Reduce zoom level (use 🔍− button)
- Close other browser tabs
- Clear browser cache

### Export Fails

- Install FFmpeg: `ffmpeg -version`
- Check disk space
- Verify all assets are loaded
- Try smaller project first

---

## Common Workflows

### Workflow 1: Character Speaking

```
Frame 0:    Character appears (fade in)
Frame 60:   Voice starts (click waveform)
Frame 120:  Character gesture (rotate, scale)
Frame 180:  Voice ends, character freezes
Frame 240:  Character exits (fade out)
```

### Workflow 2: Scene Transition

```
Frame 0:    Background A visible
Frame 120:  Add fade effect (transition)
Frame 150:  Background B visible
Frame 180:  New character appears
```

### Workflow 3: Particle Effect

```
Frame 0:    Background + character
Frame 60:   Add particles effect
Frame 90:   Effect completes, character reacts
```

---

## Keyboard Shortcuts (Future)

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| 0 | Rewind to start |
| End | Jump to end |
| Delete | Remove keyframe |
| + | Zoom in |
| - | Zoom out |

---

## Next Steps

1. **Create your first animation** (15 mins)
2. **Add voice-over sync** (voice narration)
3. **Layer effects** for visual appeal
4. **Export and share** on social media
5. **Explore advanced features** (templates, filters)

---

## Support Resources

- 📖 See `ANIMATION_STUDIO_COMPLETE.md` for full documentation
- 🐛 Check browser console for error messages
- 💬 Refer to inline UI tooltips (hover over buttons)

---

## What You Can Create

✅ Educational explainer videos
✅ Character-based storytelling
✅ Product demonstrations
✅ Animated presentations
✅ Comedy skits with voiceovers
✅ Music videos with lyrics
✅ Social media content
✅ Training materials

---

**Ready to start creating? Open http://localhost:8080 now!** 🎬✨
