# 🎬 Animation Studio - Complete Guide

## Overview

The Animation Studio is a professional timeline-based animation system for creating 3-minute animations with:
- ✅ **Background images** (parallax-ready)
- ✅ **Animated characters/sprites** with transform controls
- ✅ **Voice-over synchronization** with waveform display
- ✅ **8 professional effects** (fade, particles, shake, glow, zoom, rotate, slide, blur)
- ✅ **Keyframe-based animation engine**
- ✅ **Real-time preview** with 30 FPS rendering
- ✅ **Video export** (MP4 with audio sync)

---

## Quick Start

### 1. **Create a New Project**

```
Project Name: "My Cool Animation"
Duration: 180 seconds (3 minutes)
Frame Rate: 30 FPS
Resolution: 1920x1080
```

### 2. **Upload Assets**

Click **📁 Assets** to open the Asset Manager:

- **🖼️ Backgrounds** - Drag in your background images
- **🧑 Characters** - Drag in character/sprite PNG files
- **✨ Effects** - Drag in particle/effect sprites

### 3. **Build Your Timeline**

**Step 1: Add Background**
- Select "Background" layer
- Click **+ Add Keyframe** at frame 0
- Move character to frame 60, adjust opacity

**Step 2: Add Character**
- Select "Character" layer
- Add keyframes for position, rotation, scale
- Character will interpolate smoothly between keyframes

**Step 3: Add Voice-Over**
- Click **🎤 + Upload Audio** in the timeline
- Audio waveform displays below timeline
- Click on waveform to add animation keyframes

**Step 4: Add Effects**
- Click **✨ Effects** button
- Choose effect type (Fade, Particles, Shake, etc.)
- Click **+ Add Effect** at current frame
- Effects trigger and play for their duration

---

## Features

### Timeline Editor

```
🎬 TIMELINE CONTROLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏮  ⏯  ⏭  [═════●════════════]  0:05.20
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎙️  WAVEFORM (Click to add keyframes)
[~~~~~~~●~~~~~~~~~~~~~~~~~~~~~~~~]

TRACKS:
─────────────────────────────────
🖼️ Background   [🖼️] ... [🖼️]
─────────────────────────────────
🧑 Character    [🧑] [🧑] [🧑]
─────────────────────────────────
✨ Effects      [✨] ... [✨]
─────────────────────────────────
```

### Keyframe Markers

- **●** = Position keyframe
- **Click** to add keyframe at current position
- **Drag** to move keyframe (optional future enhancement)
- **Delete** key to remove selected keyframe

### Animation Properties

Each keyframe can control:
- **X, Y** - Position (pixels)
- **Scale X, Y** - Size multiplier (0.5 = 50%, 2.0 = 200%)
- **Rotation** - Degrees (0-360)
- **Opacity** - Fade (0 = invisible, 1 = fully visible)

### Effects System

| Effect | Use Case | Parameters |
|--------|----------|-----------|
| **Fade** | Fade in/out scenes | startOpacity → endOpacity |
| **Particles** | Sparkle, dust | count, size, color |
| **Shake** | Impact/impact | intensity (0-50) |
| **Glow** | Magic spell, highlights | blur (1-50), color |
| **Zoom** | Focus/emphasis | startScale → endScale |
| **Rotate** | Spin objects | startRotation → endRotation |
| **Slide** | Smooth movement | startX → endX |
| **Blur** | Depth of field | startBlur → endBlur |

---

## Workflow Example: 3-Minute Animation

### Scene 1 (0-30 seconds)
```
Frame 0:    Background appears (opacity 0 → 1)
Frame 60:   Character enters from left
Frame 180:  Character speaks (voice-over plays)
```

### Scene 2 (30-60 seconds)
```
Frame 900:  Add particle effect (celebration)
Frame 1200: Character performs action
Frame 1350: Fade out with glow effect
```

### Scene 3 (60-180 seconds)
```
Frame 1800: New background appears
Frame 2100: Multiple characters zoom in
Frame 2700: Final pose with dramatic fade
Frame 5400: END
```

---

## Advanced Features

### Voice Synchronization

1. Upload audio file (MP3, WAV, M4A)
2. Waveform automatically displays
3. Click on waveform to add keyframes that sync with audio peaks
4. Play timeline - audio plays in sync

### Interpolation

All numeric properties automatically interpolate between keyframes:

```
Frame 0:   x = 0
Frame 30:  x = 300
Frame 15:  x = 150 (automatically calculated)
```

### Layering

- Layers render in order: Background → Character → Effects
- Effects always render on top
- Modify Z-order through UI (future enhancement)

### Real-Time Preview

- Press **▶** to play timeline
- Press **⏸** to pause
- Adjust zoom to see full canvas or zoom in for details
- Scrubber allows frame-by-frame navigation

---

## Keyboard Shortcuts (Planned)

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `0` | Jump to start |
| `End` | Jump to end |
| `Delete` | Remove selected keyframe |
| `+` | Zoom in |
| `-` | Zoom out |
| `E` | Add effect |
| `K` | Add keyframe |

---

## Export & Rendering

### Video Export Options

```
Format: MP4 (H.264 codec)
Codec: libx264
Pixel Format: yuv420p (YouTube compatible)
Audio: AAC (if voice-over added)
Quality: High (CRF 18)
```

**Process:**
1. Click **💾 Export Video**
2. System renders each frame to PNG
3. FFmpeg combines frames + audio
4. MP4 file downloads automatically

**Estimated Time:**
- 3-minute animation (5400 frames): ~30-60 seconds

---

## Performance Tips

1. **Use appropriate image sizes:**
   - Backgrounds: 1920×1080 (full resolution)
   - Characters: 512×512 (sprite size)
   - Effects: 256×256 (small particles)

2. **Optimize keyframes:**
   - Don't add unnecessary keyframes
   - Use long interpolation ranges for smooth motion

3. **Effect duration:**
   - Keep effects short (30-60 frames)
   - Multiple effects cause slowdown

4. **Preview before export:**
   - Always test playback
   - Check audio sync

---

## API Reference

### Backend Endpoints

```
POST /api/animation/render
├─ Input: { project, format: 'mp4' }
└─ Output: Video file stream

POST /api/animation/upload-audio
├─ Input: FormData with audio file
└─ Output: { audioPath, filename, duration }

GET /api/animation/projects
└─ Output: Array of saved projects

POST /api/animation/projects
├─ Input: { project }
└─ Output: { projectId, message }
```

### Project Structure

```json
{
  "name": "My Animation",
  "duration": 180,
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "assets": {
    "backgrounds": [...],
    "characters": [...],
    "effects": [...]
  },
  "timeline": {
    "background": [
      { frame: 0, assetIndex: 0, x: 0, y: 0, ... }
    ],
    "character": [...],
    "effects": [...],
    "voiceover": { name, duration, audioPath }
  }
}
```

---

## Troubleshooting

### Canvas Not Rendering
- Ensure assets have valid `imageData` (base64)
- Check browser console for errors
- Verify canvas context is 2D

### Audio Not Syncing
- Ensure audio file is uploaded before adding keyframes
- Check that audio duration matches project timeline
- FFmpeg must be installed for export

### Slow Performance
- Reduce zoom level
- Remove unused keyframes
- Decrease effect count per scene
- Close other browser tabs

### Export Fails
- Check FFmpeg installation: `ffmpeg -version`
- Ensure sufficient disk space (/tmp directory)
- Verify audio file path is correct

---

## Installation & Setup

### Requirements
```
Node.js 16+
FFmpeg (for video export)
Modern browser (Chrome, Firefox, Safari, Edge)
```

### Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu):**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### Start Application

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

Access at: `http://localhost:8080`

---

## Future Enhancements

- [ ] Skeleton animation support
- [ ] SVG shape drawing tools
- [ ] Text effects & typography
- [ ] Mask/crop tools
- [ ] Color grading
- [ ] Motion blur
- [ ] 3D perspective transforms
- [ ] Audio mixing for multiple tracks
- [ ] Undo/Redo system
- [ ] Project templates
- [ ] Cloud storage integration
- [ ] Collaborative editing
- [ ] AI scene generation

---

## Support

For issues or feature requests:
1. Check troubleshooting section
2. Review browser console logs
3. Verify all assets are uploaded correctly
4. Test with sample files first

**Happy animating! 🎬✨**
