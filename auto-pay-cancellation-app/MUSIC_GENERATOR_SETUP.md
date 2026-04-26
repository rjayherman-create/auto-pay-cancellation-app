# AI Music Generator Integration Guide

## Overview
Your voice over app now includes AI music generation capabilities. You can generate royalty-free background music using three different AI services.

## Supported Services

### 1. **Suno AI** (Recommended)
- **Best for:** High-quality, diverse music generation
- **Features:** Custom lyrics support, style transfer, multiple voices
- **Signup:** https://www.suno.ai/
- **API Docs:** https://docs.suno.ai/

### 2. **Unetic**
- **Best for:** Fast, budget-friendly generation
- **Features:** Multiple genres, quality settings, batch processing
- **Signup:** https://unetic.ai/
- **API Docs:** https://api.unetic.ai/docs

### 3. **AudioCraft (Meta)**
- **Best for:** Open-source, on-premise option
- **Features:** MusicGen, AudioGen, code-execution
- **Signup:** https://www.audiocraft.metademolab.com/
- **Code:** https://github.com/facebookresearch/audiocraft

## Getting Started

### Step 1: Get API Keys

Choose at least one service above and sign up for an API key.

### Step 2: Add to .env

Update your `.env` file with your API keys:

```bash
# Music Generation APIs
SUNO_API_KEY=your-suno-key-here
UNETIC_API_KEY=your-unetic-key-here
AUDIOCRAFT_API_KEY=your-audiocraft-key-here
```

### Step 3: Restart Backend

```bash
# If using Docker
docker compose down && docker compose up

# If running locally
npm restart  # or restart your Node server
```

## API Endpoints

### Generate Music
**POST** `/api/music/generate`

Request:
```json
{
  "prompt": "Upbeat electronic dance music with strong bass",
  "duration": 30,
  "genre": "electronic",
  "service": "auto"
}
```

Response:
```json
{
  "success": true,
  "service": "suno",
  "trackId": "track-123",
  "status": "generating",
  "audioUrl": "https://...",
  "prompt": "Upbeat electronic dance music with strong bass",
  "duration": 30,
  "genre": "electronic"
}
```

### Check Generation Status
**GET** `/api/music/status/:trackId?service=suno`

Response:
```json
{
  "service": "suno",
  "trackId": "track-123",
  "status": "complete",
  "audioUrl": "https://...",
  "completed": true
}
```

### Get Available Styles
**GET** `/api/music/styles`

Response:
```json
[
  {
    "id": "ambient",
    "label": "Ambient",
    "description": "Calm, atmospheric background"
  },
  ...
]
```

## Usage Examples

### Basic Music Generation (Frontend)
```javascript
const response = await fetch('/api/music/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Calm lo-fi hip hop with rain sounds',
    duration: 60,
    genre: 'lofi',
    service: 'auto'
  })
});

const data = await response.json();
console.log(data.audioUrl); // Use in your video timeline
```

### Get Status (Polling)
```javascript
// Poll for completion
const trackId = data.trackId;
const checkStatus = setInterval(async () => {
  const response = await fetch(`/api/music/status/${trackId}?service=suno`);
  const status = await response.json();
  
  if (status.completed) {
    clearInterval(checkStatus);
    console.log('Music ready:', status.audioUrl);
  }
}, 2000);
```

## Tips for Best Prompts

### Be Specific
✅ Good: "Upbeat electronic dance music with strong bass and synth melody, 120 BPM, high energy"
❌ Poor: "Happy music"

### Include Elements
- **Tempo:** Fast, slow, moderate, 120 BPM
- **Instruments:** Piano, guitar, drums, synth, strings, flute
- **Mood:** Happy, sad, energetic, calm, mysterious, romantic
- **Background:** Rain sounds, birds, traffic, ocean waves
- **Era/Style:** 80s synthwave, modern trap, classical, indie folk

### Example Prompts
- "Cinematic orchestral piece with strings and French horns, epic, dramatic, building to crescendo"
- "Lo-fi hip hop beat with chill vibes, rain in background, downtempo, 80 BPM"
- "Corporate upbeat background music, positive, bright, suitable for presentations"
- "Jazz smooth saxophone with light drums, relaxing, late night, coffee shop vibe"

## Cost Considerations

| Service | Pricing | Notes |
|---------|---------|-------|
| Suno AI | $10-30/month | Pay-as-you-go, high quality |
| Unetic | $5-20/month | Budget-friendly option |
| AudioCraft | Free (self-hosted) | Open source, requires GPU |

## Integration with Video Timeline

The MusicGenerator component is ready to add to your VideoStudio. Here's how:

```javascript
import MusicGenerator from './components/MusicGenerator';

function VideoStudio() {
  const [showMusicGenerator, setShowMusicGenerator] = useState(false);
  const [musicTracks, setMusicTracks] = useState([]);

  const handleAddMusic = (track) => {
    setMusicTracks([...musicTracks, track]);
    // Add to your timeline
  };

  return (
    <>
      {/* Your existing studio UI */}
      {showMusicGenerator && (
        <MusicGenerator 
          onAddMusic={handleAddMusic}
          onClose={() => setShowMusicGenerator(false)}
        />
      )}
      <button onClick={() => setShowMusicGenerator(true)}>
        🎵 Generate Music
      </button>
    </>
  );
}
```

## Troubleshooting

### "API key not configured"
- Make sure you've added the key to `.env`
- Restart the backend server
- Check that the key matches the service

### "Generation failed"
- Check your API quota/credits
- Verify the service is up (check their status page)
- Try a different service (use `service: "auto"`)
- Check backend logs for detailed errors

### Slow Generation
- Most services take 10-60 seconds for high quality
- Use shorter durations for faster processing
- SimpleAI services are faster but lower quality

### Audio Quality Issues
- Use "high" quality setting (may cost more credits)
- Avoid conflicting sounds in prompt
- Try genre-specific prompts

## Next Steps

1. ✅ Sign up for at least one music service
2. ✅ Get your API key
3. ✅ Add to .env and restart backend
4. ✅ Test the `/api/music/styles` endpoint
5. ✅ Generate your first track!

## Files Modified/Created

- `/backend/routes/music.js` - Music generation API routes
- `/frontend/src/components/MusicGenerator.jsx` - UI component
- `/frontend/src/components/MusicGenerator.css` - Styling
- `.env.example` - Added music API keys
- `/backend/server.js` - Imported music routes

Let me know if you need help setting up specific services!
