import express from 'express';
import cartoonSoundEffectsService from '../services/cartoonSoundEffectsService.js';

const router = express.Router();

/**
 * Get all available sound effect templates
 * GET /api/sound-effects/available
 */
router.get('/available', (req, res) => {
  try {
    const effects = cartoonSoundEffectsService.getAvailableEffects();
    res.json({
      success: true,
      effects: effects,
      total: effects.length
    });
  } catch (error) {
    console.error('Error fetching available effects:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get effects by category
 * GET /api/sound-effects/category/:category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const effects = cartoonSoundEffectsService.getEffectsByCategory(category);
    res.json({
      success: true,
      category: category,
      effects: effects,
      total: effects.length
    });
  } catch (error) {
    console.error('Error fetching effects by category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search sound effects
 * GET /api/sound-effects/search?q=jump
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    const results = cartoonSoundEffectsService.searchEffects(q);
    res.json({
      success: true,
      query: q,
      results: results,
      total: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate a sound effect
 * POST /api/sound-effects/generate
 * Body: { effectId, duration, pitch, intensity, reverb, speed }
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      effectId,
      duration,
      pitch = 1.0,
      intensity = 1.0,
      reverb = 0.2,
      speed = 1.0,
      save = false
    } = req.body;

    if (!effectId) {
      return res.status(400).json({
        success: false,
        error: 'effectId is required'
      });
    }

    const generatedEffect = await cartoonSoundEffectsService.generateSoundEffect(
      effectId,
      {
        duration,
        pitch,
        intensity,
        reverb,
        speed
      }
    );

    // Save to library if requested
    if (save) {
      cartoonSoundEffectsService.saveEffect(generatedEffect);
    }

    res.json({
      success: true,
      effect: generatedEffect
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save generated effect to library
 * POST /api/sound-effects/save
 */
router.post('/save', async (req, res) => {
  try {
    const effectData = req.body;

    if (!effectData.id || !effectData.name) {
      return res.status(400).json({
        success: false,
        error: 'Effect id and name are required'
      });
    }

    const saved = cartoonSoundEffectsService.saveEffect(effectData);

    res.json({
      success: true,
      effect: saved
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
 * Get saved effects library
 * GET /api/sound-effects/library
 */
router.get('/library', (req, res) => {
  try {
    const effects = cartoonSoundEffectsService.getSavedEffects();
    res.json({
      success: true,
      effects: effects,
      total: effects.length
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
 * Get specific saved effect
 * GET /api/sound-effects/library/:effectId
 */
router.get('/library/:effectId', (req, res) => {
  try {
    const { effectId } = req.params;
    const effect = cartoonSoundEffectsService.getSavedEffect(effectId);

    if (!effect) {
      return res.status(404).json({
        success: false,
        error: 'Effect not found'
      });
    }

    res.json({
      success: true,
      effect: effect
    });
  } catch (error) {
    console.error('Error fetching effect:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update saved effect
 * PUT /api/sound-effects/library/:effectId
 */
router.put('/library/:effectId', (req, res) => {
  try {
    const { effectId } = req.params;
    const updates = req.body;

    const updated = cartoonSoundEffectsService.updateSavedEffect(effectId, updates);

    res.json({
      success: true,
      effect: updated
    });
  } catch (error) {
    console.error('Error updating effect:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete saved effect
 * DELETE /api/sound-effects/library/:effectId
 */
router.delete('/library/:effectId', (req, res) => {
  try {
    const { effectId } = req.params;
    cartoonSoundEffectsService.deleteSavedEffect(effectId);

    res.json({
      success: true,
      message: 'Effect deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting effect:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Layer multiple effects
 * POST /api/sound-effects/layer
 * Body: { effectIds, customizations }
 */
router.post('/layer', async (req, res) => {
  try {
    const { effectIds, customizations = [] } = req.body;

    if (!effectIds || !Array.isArray(effectIds) || effectIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 effectIds are required'
      });
    }

    const layered = await cartoonSoundEffectsService.layerEffects(effectIds, customizations);

    res.json({
      success: true,
      layer: layered
    });
  } catch (error) {
    console.error('Layering error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get statistics
 * GET /api/sound-effects/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = cartoonSoundEffectsService.getStatistics();
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

/**
 * Record effect usage
 * POST /api/sound-effects/library/:effectId/use
 */
router.post('/library/:effectId/use', (req, res) => {
  try {
    const { effectId } = req.params;
    cartoonSoundEffectsService.recordUsage(effectId);

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
