# Voice Over Studio - Emotions & Cartoon Characters Feature

## Overview

The Voice Over Studio now includes two powerful voice generation features:

### 1. **Emotional Voices** 💙
Generate voice-overs with different emotions to add character and depth to your content.

### 2. **Cartoon Character Voices** 🎭
Create voice-overs using famous cartoon and character voices.

---

## Available Emotions

| Emotion | Description | Use Case |
|---------|-------------|----------|
| 😄 **Happy** | Cheerful and upbeat | Celebrations, celebrations, motivational content |
| 😢 **Sad** | Melancholic and sorrowful | Emotional moments, dramatic scenes |
| 😠 **Angry** | Furious and aggressive | Action scenes, confrontations |
| 😌 **Calm** | Peaceful and serene | Meditation, relaxation, tutorials |
| 😨 **Scared** | Frightened and anxious | Horror content, suspenseful moments |
| 🤩 **Excited** | Enthusiastic and energetic | Announcements, promotions, hype videos |
| 😏 **Sarcastic** | Witty and ironic | Comedy, sarcastic commentary |
| 🤫 **Whisper** | Soft and hushed | Intimate moments, secrets, ASMR |

---

## Available Cartoon Characters

| Character | Emoji | Description |
|-----------|-------|-------------|
| 🐭 **Mickey Mouse** | Classic cheerful Disney icon | Kids content, fun stories |
| 👨‍🚀 **Minion** | Funny yellow creature with gibberish accent | Comedy, entertainment |
| 🖤 **Darth Vader** | Deep, sinister villain voice | Sci-fi, dramatic moments |
| 👴 **Yoda** | Wise and ancient character | Educational, wisdom quotes |
| 🧽 **SpongeBob** | Enthusiastic and cheerful sea sponge | Kids content, fun scenes |
| ⚡ **Pikachu** | Cute Pokemon with signature sounds | Kids content, gaming |
| 💚 **Hulk** | Angry and powerful green giant | Action, intense moments |
| ❄️ **Elsa** | Cool and composed ice queen | Calm, magical moments |

---

## API Endpoints

### Get Emotions
```
GET /api/voice/emotions

Response:
[
  {
    id: "happy",
    name: "Happy",
    description: "Cheerful and upbeat",
    stability: 0.4,
    similarity_boost: 0.8,
    pitch: 1.1,
    speed: 1.05
  },
  ...
]
```

### Get Cartoon Characters
```
GET /api/voice/cartoon-characters

Response:
[
  {
    id: "mickey_mouse",
    name: "Mickey Mouse",
    description: "Cheerful and playful Disney icon",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    emotion: "cheerful",
    pitch: 1.2,
    speed: 1.1
  },
  ...
]
```

### Generate Emotional Voice
```
POST /api/voice/generate-emotion

Request:
{
  "text": "Hello, how are you feeling today?",
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "emotion": "happy"
}

Response:
{
  "success": true,
  "audioUrl": "/uploads/audio/emotion_happy_123456.mp3",
  "fileId": "emotion_happy_123456",
  "emotion": "happy",
  "emotionSettings": { ... },
  "timestamp": "2026-02-16T16:00:00.000Z"
}
```

### Generate Cartoon Voice
```
POST /api/voice/generate-cartoon

Request:
{
  "text": "Let's save the world!",
  "characterId": "spongebob"
}

Response:
{
  "success": true,
  "audioUrl": "/uploads/audio/cartoon_spongebob_123456.mp3",
  "fileId": "cartoon_spongebob_123456",
  "characterId": "spongebob",
  "characterName": "SpongeBob",
  "characterDescription": "Enthusiastic and cheerful sea sponge",
  "timestamp": "2026-02-16T16:00:00.000Z"
}
```

---

## How to Use

### Using Emotional Voices

1. Navigate to **Voice Tools** → **Emotions & Characters**
2. Select the **Emotional Voices** tab
3. Enter the text you want to hear
4. Click on an emotion (Happy, Sad, Angry, etc.)
5. Click **Generate Emotional Voice**
6. Listen to the generated audio
7. Download if you like it

### Using Cartoon Characters

1. Navigate to **Voice Tools** → **Emotions & Characters**
2. Select the **Cartoon Characters** tab
3. Enter the text you want the character to say
4. Click on a character (Mickey Mouse, SpongeBob, etc.)
5. Click **Generate Cartoon Voice**
6. Listen to the generated audio
7. Download if you like it

---

## Technical Details

### Voice Settings for Emotions

Each emotion adjusts these parameters:

- **Stability** (0.0 - 1.0): How consistent the voice is
  - Happy: 0.4 (variable, expressive)
  - Calm: 0.8 (consistent, stable)

- **Similarity Boost** (0.0 - 1.0): How similar to the base voice
  - Whisper: 0.9 (stays true to voice)
  - Sarcastic: 0.85 (maintains personality)

- **Pitch** (0.65 - 1.4): Higher = higher pitch
  - Pikachu: 1.4 (very high)
  - Hulk: 0.65 (very low)

- **Speed** (0.85 - 1.2): How fast to speak
  - Angry: 1.15 (rushed)
  - Calm: 0.95 (slower)

---

## Use Cases

### Educational Content
- Use **Calm Yoda** to explain concepts
- Use **Excited SpongeBob** for engaging kids' lessons

### Entertainment
- Use **Sarcastic tone** for commentary
- Use **Angry Hulk** for action scene drama

### Marketing
- Use **Excited** emotion for product announcements
- Use **Calm Elsa** for premium product descriptions

### Storytelling
- Use **Happy Mickey** for cheerful scenes
- Use **Scared** emotion for suspenseful moments
- Use **Sad** emotion for emotional beats

### Gaming
- Use **Pikachu** for Pokemon content
- Use **Darth Vader** for boss battle dialogues

### ASMR/Relaxation
- Use **Whisper** emotion for calming content
- Use **Calm Elsa** for meditation content

---

## Customization

### Adding New Characters

To add a new cartoon character, edit `voiceRoutes.js`:

```javascript
const CARTOON_CHARACTERS = {
  your_character: {
    name: 'Character Name',
    description: 'Description of character',
    voiceId: 'VOICE_ID_FROM_ELEVENLABS',
    emotion: 'default_emotion',
    pitch: 1.0,
    speed: 1.0
  }
}
```

### Adding New Emotions

To add a new emotion, add to the `EMOTIONS` object:

```javascript
const EMOTIONS = {
  your_emotion: {
    name: 'Emotion Name',
    description: 'Description',
    stability: 0.5,
    similarity_boost: 0.75,
    pitch: 1.0,
    speed: 1.0
  }
}
```

---

## Saving Presets

You can save your favorite emotion and character combinations:

1. Generate a voice successfully
2. Click **Create Another** to reset
3. The audio is automatically saved with metadata

To save a preset to your Voice Library:
```
POST /api/voice/library

Request:
{
  "name": "Happy Mickey",
  "characterId": "mickey_mouse"
}
```

---

## Troubleshooting

### Audio not generating
- Check your ElevenLabs API key
- Ensure you've entered text
- Check you've selected an emotion or character

### Poor audio quality
- Try adjusting the emotion (different emotions = different stability)
- For characters, try a different base voice
- Ensure your text is clear and well-written

### Character voice sounds wrong
- Different characters use different base voices
- Try using a different character
- Experiment with emotion combinations

---

## Future Enhancements

Phase 2 features coming:
- [ ] Custom character creation
- [ ] Voice blending with emotions
- [ ] Batch generation (multiple lines at once)
- [ ] Real-time voice preview
- [ ] Voice effects (reverb, echo, etc.)
- [ ] Emotion intensity levels (1-10)

---

## Performance

- Average generation time: 2-5 seconds
- File size: 500KB - 2MB per minute of audio
- Storage: Unlimited with your plan

---

## Support

For issues or feature requests, visit the Documentation menu or contact support.
