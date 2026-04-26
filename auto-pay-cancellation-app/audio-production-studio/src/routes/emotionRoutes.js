import express from 'express';
import voiceEmotionEngine from '../services/voiceEmotionEngine.js';

const router = express.Router();

/**
 * Get all available emotions
 * GET /api/emotions/available
 */
router.get('/available', (req, res) => {
  try {
    const emotions = voiceEmotionEngine.getAvailableEmotions();
    res.json({
      success: true,
      emotions: emotions,
      total: emotions.length
    });
  } catch (error) {
    console.error('Error fetching emotions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get character profiles
 * GET /api/emotions/characters
 */
router.get('/characters', (req, res) => {
  try {
    const profiles = voiceEmotionEngine.getCharacterProfiles();
    res.json({
      success: true,
      characters: profiles,
      total: profiles.length
    });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Apply emotion to voice
 * POST /api/emotions/apply
 * Body: { emotionId, text, voiceId, intensity, blendAmount }
 */
router.post('/apply', async (req, res) => {
  try {
    const {
      emotionId,
      text,
      voiceId = 'Rachel',
      intensity = 1.0,
      blendAmount = 1.0
    } = req.body;

    if (!emotionId) {
      return res.status(400).json({
        success: false,
        error: 'emotionId is required'
      });
    }

    const emotionalVoice = await voiceEmotionEngine.applyEmotionToVoice(
      emotionId,
      { text, voiceId, intensity, blendAmount }
    );

    res.json({
      success: true,
      emotionalVoice: emotionalVoice
    });
  } catch (error) {
    console.error('Emotion application error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Blend two emotions
 * POST /api/emotions/blend
 * Body: { emotion1Id, emotion2Id, blendRatio, text }
 */
router.post('/blend', (req, res) => {
  try {
    const {
      emotion1Id,
      emotion2Id,
      blendRatio = 0.5,
      text = ''
    } = req.body;

    if (!emotion1Id || !emotion2Id) {
      return res.status(400).json({
        success: false,
        error: 'emotion1Id and emotion2Id are required'
      });
    }

    const blended = voiceEmotionEngine.blendEmotions(
      emotion1Id,
      emotion2Id,
      blendRatio,
      text
    );

    res.json({
      success: true,
      blend: blended
    });
  } catch (error) {
    console.error('Emotion blending error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate character voice
 * POST /api/emotions/character-voice
 * Body: { characterId, scene }
 */
router.post('/character-voice', (req, res) => {
  try {
    const {
      characterId,
      scene = 'normal'
    } = req.body;

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'characterId is required'
      });
    }

    const characterVoice = voiceEmotionEngine.generateCharacterVoice(
      characterId,
      scene
    );

    res.json({
      success: true,
      characterVoice: characterVoice
    });
  } catch (error) {
    console.error('Character voice generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save emotional voice
 * POST /api/emotions/save
 */
router.post('/save', (req, res) => {
  try {
    const voiceData = req.body;

    if (!voiceData.emotion) {
      return res.status(400).json({
        success: false,
        error: 'Emotion data is required'
      });
    }

    const saved = voiceEmotionEngine.saveEmotionalVoice(voiceData);

    res.json({
      success: true,
      voice: saved
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get saved emotional voices
 * GET /api/emotions/library
 */
router.get('/library', (req, res) => {
  try {
    const voices = voiceEmotionEngine.getSavedVoices();
    res.json({
      success: true,
      voices: voices,
      total: voices.length
    });
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get emotion presets
 * GET /api/emotions/presets
 */
router.get('/presets', (req, res) => {
  try {
    const presets = voiceEmotionEngine.getEmotionPresets();
    res.json({
      success: true,
      presets: presets
    });
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get vocal techniques
 * GET /api/emotions/techniques
 */
router.get('/techniques', (req, res) => {
  try {
    const techniques = voiceEmotionEngine.getVocalTechniques();
    res.json({
      success: true,
      techniques: techniques
    });
  } catch (error) {
    console.error('Error fetching techniques:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get emotion analysis
 * GET /api/emotions/analysis
 */
router.get('/analysis', (req, res) => {
  try {
    const analysis = voiceEmotionEngine.getEmotionAnalysis();
    res.json({
      success: true,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get emotion by ID with details
 * GET /api/emotions/:emotionId
 */
router.get('/:emotionId', (req, res) => {
  try {
    const { emotionId } = req.params;
    const emotions = voiceEmotionEngine.getAvailableEmotions();
    const emotion = emotions.find(e => e.id === emotionId);

    if (!emotion) {
      return res.status(404).json({
        success: false,
        error: 'Emotion not found'
      });
    }

    res.json({
      success: true,
      emotion: emotion
    });
  } catch (error) {
    console.error('Error fetching emotion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Record voice usage
 * POST /api/emotions/use/:voiceId
 */
router.post('/use/:voiceId', (req, res) => {
  try {
    const { voiceId } = req.params;
    voiceEmotionEngine.recordUsage(voiceId);

    res.json({
      success: true,
      message: 'Usage recorded'
    });
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
