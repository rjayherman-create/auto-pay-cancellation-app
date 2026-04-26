import express from 'express';
import audioMixingService from '../services/audioMixingService.js';

const router = express.Router();

/**
 * Mix audio tracks
 * POST /api/mixing/mix
 */
router.post('/mix', async (req, res) => {
  try {
    const mixConfig = req.body;

    const result = await audioMixingService.mixAudio(mixConfig);

    res.json(result);
  } catch (error) {
    console.error('Mixing error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Adjust audio properties
 * POST /api/mixing/adjust
 */
router.post('/adjust', async (req, res) => {
  try {
    const { inputPath, volume, speed, pitch, output } = req.body;

    if (!inputPath) {
      return res.status(400).json({ error: 'Input path is required' });
    }

    const result = await audioMixingService.adjustAudioProperties(inputPath, {
      volume,
      speed,
      pitch,
      output
    });

    res.json(result);
  } catch (error) {
    console.error('Adjustment error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get audio metadata
 * GET /api/mixing/metadata/:filename
 */
router.get('/metadata/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = `/uploads/audio/${filename}`;

    const metadata = await audioMixingService.getAudioMetadata(filePath);

    res.json(metadata);
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
