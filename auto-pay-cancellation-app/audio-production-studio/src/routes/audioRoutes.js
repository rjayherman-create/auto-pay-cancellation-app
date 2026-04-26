import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Simple audio mixer - mix 2 tracks
router.post('/mix', async (req, res) => {
  try {
    const { voiceoverPath, musicPath, voiceVolume = 1.0, musicVolume = 0.3 } = req.body;

    if (!voiceoverPath) {
      return res.status(400).json({ error: 'Voiceover path is required' });
    }

    const outputId = `mixed_${Date.now()}`;
    const outputPath = `./uploads/audio/${outputId}.mp3`;
    const publicPath = `/uploads/audio/${outputId}.mp3`;

    try {
      if (musicPath) {
        // Mix voice + music using FFmpeg
        const command = `ffmpeg -i "${voiceoverPath}" -i "${musicPath}" -filter_complex "[0]volume=${voiceVolume}[v0];[1]volume=${musicVolume}[v1];[v0][v1]amix=inputs=2:duration=first[a]" -map "[a]" -q:a 9 "${outputPath}" -y`;
        
        await execAsync(command);
      } else {
        // Just copy voice with volume adjustment
        const command = `ffmpeg -i "${voiceoverPath}" -af "volume=${voiceVolume}" -q:a 9 "${outputPath}" -y`;
        await execAsync(command);
      }

      res.json({
        success: true,
        outputUrl: publicPath,
        outputId,
        voiceVolume,
        musicVolume,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('FFmpeg error:', error.message);
      res.status(500).json({ 
        error: 'FFmpeg processing failed',
        message: error.message 
      });
    }
  } catch (error) {
    console.error('Error mixing audio:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get sound effects library
router.get('/effects', async (req, res) => {
  try {
    const effects = [
      { id: 'effect_1', name: 'Whoosh', category: 'transitions' },
      { id: 'effect_2', name: 'Pop', category: 'ui' },
      { id: 'effect_3', name: 'Bell', category: 'notifications' },
      { id: 'effect_4', name: 'Click', category: 'ui' },
      { id: 'effect_5', name: 'Ding', category: 'notifications' },
      { id: 'effect_6', name: 'Buzz', category: 'notifications' },
      { id: 'effect_7', name: 'Fade In', category: 'transitions' },
      { id: 'effect_8', name: 'Fade Out', category: 'transitions' }
    ];

    const { category } = req.query;
    const filtered = category 
      ? effects.filter(e => e.category === category)
      : effects;

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching effects:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get effect categories
router.get('/effects/categories', (req, res) => {
  try {
    const categories = [
      { id: 'transitions', label: 'Transitions' },
      { id: 'ui', label: 'UI Sounds' },
      { id: 'notifications', label: 'Notifications' }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
