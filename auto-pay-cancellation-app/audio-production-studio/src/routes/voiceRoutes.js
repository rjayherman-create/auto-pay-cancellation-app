import express from 'express';
import axios from 'axios';
import { promises as fs } from 'fs';

const router = express.Router();

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'your-api-key';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Cartoon character voices mapping
const CARTOON_CHARACTERS = {
  mickey_mouse: {
    name: 'Mickey Mouse',
    description: 'Cheerful and playful Disney icon',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sunny - Similar to Mickey
    emotion: 'cheerful',
    pitch: 1.2,
    speed: 1.1
  },
  minion: {
    name: 'Minion',
    description: 'Funny yellow creature with gibberish accent',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Brian - Fun and quirky
    emotion: 'playful',
    pitch: 1.3,
    speed: 1.15
  },
  darth_vader: {
    name: 'Darth Vader',
    description: 'Deep, sinister villain voice',
    voiceId: 'JBFqnCBsd6RMkjVY1ZUk', // Chris - Deep and authoritative
    emotion: 'menacing',
    pitch: 0.7,
    speed: 0.9
  },
  yoda: {
    name: 'Yoda',
    description: 'Wise and ancient character',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sunny - Wise sounding
    emotion: 'wise',
    pitch: 0.9,
    speed: 0.95
  },
  spongebob: {
    name: 'SpongeBob',
    description: 'Enthusiastic and cheerful sea sponge',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Brian - High and energetic
    emotion: 'excited',
    pitch: 1.25,
    speed: 1.1
  },
  pikachu: {
    name: 'Pikachu',
    description: 'Cute Pokemon with signature sounds',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sunny - High pitched
    emotion: 'cute',
    pitch: 1.4,
    speed: 1.2
  },
  hulk: {
    name: 'Hulk',
    description: 'Angry and powerful green giant',
    voiceId: 'JBFqnCBsd6RMkjVY1ZUk', // Chris - Deep and strong
    emotion: 'angry',
    pitch: 0.65,
    speed: 0.95
  },
  elsa: {
    name: 'Elsa',
    description: 'Cool and composed ice queen',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sunny - Calm and composed
    emotion: 'calm',
    pitch: 1.1,
    speed: 1.0
  }
};

// Emotion presets with voice settings
const EMOTIONS = {
  happy: {
    name: 'Happy',
    description: 'Cheerful and upbeat',
    stability: 0.4,
    similarity_boost: 0.8,
    pitch: 1.1,
    speed: 1.05
  },
  sad: {
    name: 'Sad',
    description: 'Melancholic and sorrowful',
    stability: 0.7,
    similarity_boost: 0.85,
    pitch: 0.95,
    speed: 0.9
  },
  angry: {
    name: 'Angry',
    description: 'Furious and aggressive',
    stability: 0.6,
    similarity_boost: 0.9,
    pitch: 0.85,
    speed: 1.15
  },
  calm: {
    name: 'Calm',
    description: 'Peaceful and serene',
    stability: 0.8,
    similarity_boost: 0.75,
    pitch: 0.95,
    speed: 0.95
  },
  scared: {
    name: 'Scared',
    description: 'Frightened and anxious',
    stability: 0.5,
    similarity_boost: 0.8,
    pitch: 1.15,
    speed: 1.1
  },
  excited: {
    name: 'Excited',
    description: 'Enthusiastic and energetic',
    stability: 0.5,
    similarity_boost: 0.75,
    pitch: 1.2,
    speed: 1.15
  },
  sarcastic: {
    name: 'Sarcastic',
    description: 'Witty and ironic',
    stability: 0.6,
    similarity_boost: 0.85,
    pitch: 1.0,
    speed: 1.05
  },
  whisper: {
    name: 'Whisper',
    description: 'Soft and hushed',
    stability: 0.7,
    similarity_boost: 0.9,
    pitch: 0.9,
    speed: 0.85
  }
};

// Get available standard voices from ElevenLabs
router.get('/voices', async (req, res) => {
  try {
    const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    res.json(response.data.voices);
  } catch (error) {
    console.error('Error fetching voices:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch voices',
      message: error.message 
    });
  }
});

// Get cartoon character voices
router.get('/cartoon-characters', (req, res) => {
  try {
    const characters = Object.entries(CARTOON_CHARACTERS).map(([key, value]) => ({
      id: key,
      ...value
    }));

    res.json(characters);
  } catch (error) {
    console.error('Error fetching cartoon characters:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get specific cartoon character
router.get('/cartoon-characters/:characterId', (req, res) => {
  try {
    const { characterId } = req.params;
    const character = CARTOON_CHARACTERS[characterId];

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({
      id: characterId,
      ...character
    });
  } catch (error) {
    console.error('Error fetching character:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get available emotions
router.get('/emotions', (req, res) => {
  try {
    const emotions = Object.entries(EMOTIONS).map(([key, value]) => ({
      id: key,
      ...value
    }));

    res.json(emotions);
  } catch (error) {
    console.error('Error fetching emotions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate voice with emotion
router.post('/generate-emotion', async (req, res) => {
  try {
    const { text, voiceId, emotion = 'happy' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!voiceId) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    if (!EMOTIONS[emotion]) {
      return res.status(400).json({ error: 'Invalid emotion' });
    }

    const emotionSettings = EMOTIONS[emotion];

    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: emotionSettings.stability,
          similarity_boost: emotionSettings.similarity_boost
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save audio file
    const fileId = `emotion_${emotion}_${Date.now()}`;
    const filePath = `/uploads/audio/${fileId}.mp3`;
    const fullPath = `./uploads/audio/${fileId}.mp3`;

    await fs.writeFile(fullPath, response.data);

    res.json({
      success: true,
      audioUrl: filePath,
      fileId,
      voiceId,
      emotion,
      emotionSettings,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating emotional voice:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate voice',
      message: error.message 
    });
  }
});

// Generate cartoon character voice
router.post('/generate-cartoon', async (req, res) => {
  try {
    const { text, characterId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!characterId || !CARTOON_CHARACTERS[characterId]) {
      return res.status(400).json({ error: 'Invalid character ID' });
    }

    const character = CARTOON_CHARACTERS[characterId];

    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${character.voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save audio file
    const fileId = `cartoon_${characterId}_${Date.now()}`;
    const filePath = `/uploads/audio/${fileId}.mp3`;
    const fullPath = `./uploads/audio/${fileId}.mp3`;

    await fs.writeFile(fullPath, response.data);

    res.json({
      success: true,
      audioUrl: filePath,
      fileId,
      characterId,
      characterName: character.name,
      characterDescription: character.description,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating cartoon voice:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate voice',
      message: error.message 
    });
  }
});

// Generate standard voice
router.post('/generate', async (req, res) => {
  try {
    const { text, voiceId, stability = 0.5, similarity_boost = 0.75 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!voiceId) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability,
          similarity_boost
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save audio file
    const fileId = `voice_${Date.now()}`;
    const filePath = `/uploads/audio/${fileId}.mp3`;
    const fullPath = `./uploads/audio/${fileId}.mp3`;

    await fs.writeFile(fullPath, response.data);

    res.json({
      success: true,
      audioUrl: filePath,
      fileId,
      voiceId,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating voice:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate voice',
      message: error.message 
    });
  }
});

// Get voice library (saved presets)
router.get('/library', async (req, res) => {
  try {
    const voiceLibraryPath = './data/voice-library.json';

    if (await fs.access(voiceLibraryPath).then(() => true).catch(() => false)) {
      const library = JSON.parse(await fs.readFile(voiceLibraryPath, 'utf8'));
      res.json(library);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading voice library:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Save voice preset to library
router.post('/library', async (req, res) => {
  try {
    const { name, voiceId, emotion, characterId, stability, similarity_boost } = req.body;

    if (!name || (!voiceId && !emotion && !characterId)) {
      return res.status(400).json({ error: 'Name and voiceId/emotion/characterId are required' });
    }

    const voiceLibraryPath = './data/voice-library.json';

    let library = [];
    if (await fs.access(voiceLibraryPath).then(() => true).catch(() => false)) {
      library = JSON.parse(await fs.readFile(voiceLibraryPath, 'utf8'));
    }

    const preset = {
      id: `preset_${Date.now()}`,
      name,
      voiceId: voiceId || null,
      emotion: emotion || null,
      characterId: characterId || null,
      stability: stability || 0.5,
      similarity_boost: similarity_boost || 0.75,
      created: new Date().toISOString()
    };

    library.push(preset);
    await fs.writeFile(voiceLibraryPath, JSON.stringify(library, null, 2));

    res.json({
      success: true,
      preset
    });
  } catch (error) {
    console.error('Error saving voice preset:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete voice preset
router.delete('/library/:presetId', async (req, res) => {
  try {
    const { presetId } = req.params;
    const voiceLibraryPath = './data/voice-library.json';

    if (!await fs.access(voiceLibraryPath).then(() => true).catch(() => false)) {
      return res.status(404).json({ error: 'Voice library not found' });
    }

    let library = JSON.parse(await fs.readFile(voiceLibraryPath, 'utf8'));
    library = library.filter(preset => preset.id !== presetId);
    await fs.writeFile(voiceLibraryPath, JSON.stringify(library, null, 2));

    res.json({ success: true, message: 'Preset deleted' });
  } catch (error) {
    console.error('Error deleting voice preset:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
