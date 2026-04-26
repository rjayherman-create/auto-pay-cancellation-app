import express from 'express';
import voiceBlendingService from '../services/voiceBlendingService.js';

const router = express.Router();

/**
 * Get available voices for blending
 * GET /api/voice-blending/voices
 */
router.get('/voices', async (req, res) => {
  try {
    const voices = await voiceBlendingService.getAvailableVoicesForBlending();
    res.json({
      success: true,
      voices: voices,
      total: voices.length
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Blend two voices
 * POST /api/voice-blending/blend
 * Body: { voice1Id, voice2Id, blendName, voice1Weight, voice2Weight, sampleText, description }
 */
router.post('/blend', async (req, res) => {
  try {
    const {
      voice1Id,
      voice2Id,
      blendName,
      voice1Weight = 0.5,
      voice2Weight = 0.5,
      sampleText = 'Hello, this is a blended voice sample.',
      description
    } = req.body;

    if (!voice1Id || !voice2Id) {
      return res.status(400).json({
        success: false,
        error: 'voice1Id and voice2Id are required'
      });
    }

    // Validate weights
    if (voice1Weight < 0 || voice1Weight > 1 || voice2Weight < 0 || voice2Weight > 1) {
      return res.status(400).json({
        success: false,
        error: 'Weights must be between 0 and 1'
      });
    }

    const blendedVoice = await voiceBlendingService.blendVoices(
      voice1Id,
      voice2Id,
      {
        blendName,
        voice1Weight,
        voice2Weight,
        sampleText,
        description: description || `Blend of ${voice1Id} and ${voice2Id}`
      }
    );

    res.json({
      success: true,
      blendedVoice: blendedVoice
    });
  } catch (error) {
    console.error('Voice blending error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all blended voices
 * GET /api/voice-blending/blended
 */
router.get('/blended', (req, res) => {
  try {
    const voices = voiceBlendingService.getBlendedVoices();
    res.json({
      success: true,
      voices: voices,
      total: voices.length
    });
  } catch (error) {
    console.error('Error fetching blended voices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get blended voice by ID
 * GET /api/voice-blending/blended/:voiceId
 */
router.get('/blended/:voiceId', (req, res) => {
  try {
    const { voiceId } = req.params;
    const voice = voiceBlendingService.getBlendedVoiceById(voiceId);

    if (!voice) {
      return res.status(404).json({
        success: false,
        error: 'Blended voice not found'
      });
    }

    res.json({
      success: true,
      voice: voice
    });
  } catch (error) {
    console.error('Error fetching voice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate audio with blended voice
 * POST /api/voice-blending/generate
 * Body: { blendedVoiceId, text, speed, pitch }
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      blendedVoiceId,
      text,
      speed = 1.0,
      pitch = 1.0
    } = req.body;

    if (!blendedVoiceId || !text) {
      return res.status(400).json({
        success: false,
        error: 'blendedVoiceId and text are required'
      });
    }

    const audio = await voiceBlendingService.generateAudioWithBlendedVoice(
      blendedVoiceId,
      text,
      { speed, pitch }
    );

    res.json({
      success: true,
      audio: audio
    });
  } catch (error) {
    console.error('Audio generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update blended voice metadata
 * PUT /api/voice-blending/blended/:voiceId
 */
router.put('/blended/:voiceId', (req, res) => {
  try {
    const { voiceId } = req.params;
    const updates = req.body;

    const updated = voiceBlendingService.updateBlendedVoice(voiceId, updates);

    res.json({
      success: true,
      voice: updated
    });
  } catch (error) {
    console.error('Error updating voice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete blended voice
 * DELETE /api/voice-blending/blended/:voiceId
 */
router.delete('/blended/:voiceId', (req, res) => {
  try {
    const { voiceId } = req.params;
    voiceBlendingService.deleteBlendedVoice(voiceId);

    res.json({
      success: true,
      message: 'Blended voice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get blended voices statistics
 * GET /api/voice-blending/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = voiceBlendingService.getBlendedVoicesStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
