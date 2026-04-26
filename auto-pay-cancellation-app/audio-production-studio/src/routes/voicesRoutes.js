import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// In-memory storage (in production, use database)
let savedVoices = [];

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Get all voices from ElevenLabs
router.get('/', async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.json({
        success: true,
        voices: [
          {
            voice_id: 'EXAVITQu4vr4xnSDxMaL',
            name: 'Bella (Female - Warm)',
            accent: 'American',
            age: '20-30',
            description: 'Warm and friendly female voice, perfect for narration and commercials',
            preview_url: 'https://cdn.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
            labels: { accent: 'american', age: 'young-adult', gender: 'female' }
          },
          {
            voice_id: 'EXAVITQu4vr4xnSDxMaL',
            name: 'Adam (Male - Deep)',
            accent: 'British',
            age: '30-40',
            description: 'Deep, authoritative male voice with British accent',
            preview_url: 'https://cdn.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
            labels: { accent: 'british', age: 'adult', gender: 'male' }
          },
          {
            voice_id: 'EXAVITQu4vr4xnSDxMaL',
            name: 'Rachel (Female - Clear)',
            accent: 'American',
            age: '25-35',
            description: 'Clear, professional female voice ideal for announcements',
            preview_url: 'https://cdn.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
            labels: { accent: 'american', age: 'adult', gender: 'female' }
          },
          {
            voice_id: 'EXAVITQu4vr4xnSDxMaL',
            name: 'Arnold (Male - Energetic)',
            accent: 'Australian',
            age: '30-40',
            description: 'Energetic male voice with Australian accent, great for entertainment',
            preview_url: 'https://cdn.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
            labels: { accent: 'australian', age: 'adult', gender: 'male' }
          }
        ],
        message: 'Using demo voices (configure ELEVENLABS_API_KEY to use real voices)'
      });
    }

    // Fetch from ElevenLabs API
    const response = await axios.get(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    res.json({
      success: true,
      voices: response.data.voices || []
    });
  } catch (error) {
    console.error('Error fetching voices:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voices from ElevenLabs',
      message: error.message
    });
  }
});

// Generate voice preview
router.post('/preview', async (req, res) => {
  try {
    const { voiceId, text } = req.body;

    if (!voiceId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing voiceId or text'
      });
    }

    if (!ELEVENLABS_API_KEY) {
      // Return demo audio URL
      return res.json({
        success: true,
        audioUrl: '/uploads/demo-preview.mp3',
        message: 'Using demo audio (configure ELEVENLABS_API_KEY for real audio)'
      });
    }

    // Call ElevenLabs API for TTS
    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        text: text,
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
    const filename = `preview-${uuidv4()}.mp3`;
    const filepath = path.join(__dirname, '../uploads/audio', filename);
    fs.writeFileSync(filepath, response.data);

    res.json({
      success: true,
      audioUrl: `/uploads/audio/${filename}`,
      message: 'Preview generated successfully'
    });
  } catch (error) {
    console.error('Error generating preview:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate voice preview',
      message: error.message
    });
  }
});

// Save voice to library
router.post('/save', (req, res) => {
  try {
    const { voiceId, voiceName, provider, voiceData } = req.body;

    if (!voiceId || !voiceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing voiceId or voiceName'
      });
    }

    const savedVoice = {
      id: uuidv4(),
      voiceId,
      customName: voiceName,
      provider: provider || 'elevenlabs',
      voiceData: voiceData || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    savedVoices.push(savedVoice);

    res.json({
      success: true,
      voice: savedVoice,
      message: `Voice "${voiceName}" saved successfully`
    });
  } catch (error) {
    console.error('Error saving voice:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to save voice',
      message: error.message
    });
  }
});

// Get all saved voices
router.get('/saved', (req, res) => {
  try {
    res.json({
      success: true,
      voices: savedVoices,
      count: savedVoices.length
    });
  } catch (error) {
    console.error('Error fetching saved voices:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved voices',
      message: error.message
    });
  }
});

// Get saved voice by ID
router.get('/saved/:id', (req, res) => {
  try {
    const { id } = req.params;
    const voice = savedVoices.find(v => v.id === id);

    if (!voice) {
      return res.status(404).json({
        success: false,
        error: 'Voice not found'
      });
    }

    res.json({
      success: true,
      voice
    });
  } catch (error) {
    console.error('Error fetching saved voice:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved voice',
      message: error.message
    });
  }
});

// Delete saved voice
router.delete('/saved/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = savedVoices.findIndex(v => v.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Voice not found'
      });
    }

    const deletedVoice = savedVoices.splice(index, 1);

    res.json({
      success: true,
      voice: deletedVoice[0],
      message: 'Voice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved voice:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete voice',
      message: error.message
    });
  }
});

// Update saved voice
router.put('/saved/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { customName, voiceData } = req.body;

    const voice = savedVoices.find(v => v.id === id);

    if (!voice) {
      return res.status(404).json({
        success: false,
        error: 'Voice not found'
      });
    }

    if (customName) voice.customName = customName;
    if (voiceData) voice.voiceData = { ...voice.voiceData, ...voiceData };
    voice.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      voice,
      message: 'Voice updated successfully'
    });
  } catch (error) {
    console.error('Error updating saved voice:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update voice',
      message: error.message
    });
  }
});

// Generate speech from saved voice
router.post('/generate', async (req, res) => {
  try {
    const { voiceId, text, savedVoiceId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing text'
      });
    }

    const id = voiceId || savedVoiceId;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing voiceId or savedVoiceId'
      });
    }

    if (!ELEVENLABS_API_KEY) {
      // Return demo audio
      return res.json({
        success: true,
        audioUrl: '/uploads/demo-audio.mp3',
        duration: 5,
        message: 'Using demo audio (configure ELEVENLABS_API_KEY for real audio)'
      });
    }

    // Generate audio using ElevenLabs
    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${id}`,
      {
        text: text,
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
    const filename = `voice-${uuidv4()}.mp3`;
    const filepath = path.join(__dirname, '../uploads/audio', filename);
    fs.writeFileSync(filepath, response.data);

    res.json({
      success: true,
      audioUrl: `/uploads/audio/${filename}`,
      duration: Math.ceil(text.split(' ').length / 150), // Rough estimate
      message: 'Audio generated successfully'
    });
  } catch (error) {
    console.error('Error generating audio:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate audio',
      message: error.message
    });
  }
});

export default router;
