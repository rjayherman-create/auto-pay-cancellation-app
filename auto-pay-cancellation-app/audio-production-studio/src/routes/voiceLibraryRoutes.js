import express from 'express';
import voiceLibrary from '../services/voiceLibraryService.js';

const router = express.Router();

// ============ LIBRARY OPERATIONS ============

/**
 * Get all voices in library
 * GET /api/voice-library
 */
router.get('/', (req, res) => {
  try {
    const voices = voiceLibrary.getAllVoices();
    res.json(voices);
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add voice to library
 * POST /api/voice-library
 */
router.post('/', (req, res) => {
  try {
    const voiceData = req.body;

    if (!voiceData.voiceId || !voiceData.voiceName) {
      return res.status(400).json({ error: 'Voice ID and name are required' });
    }

    const savedVoice = voiceLibrary.addVoiceToLibrary(voiceData);
    res.status(201).json(savedVoice);
  } catch (error) {
    console.error('Error adding voice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get voice from library
 * GET /api/voice-library/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const voice = voiceLibrary.getVoice(id);

    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }

    res.json(voice);
  } catch (error) {
    console.error('Error fetching voice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update voice
 * PUT /api/voice-library/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const voice = voiceLibrary.updateVoice(id, updates);
    res.json(voice);
  } catch (error) {
    console.error('Error updating voice:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete voice from library
 * DELETE /api/voice-library/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    voiceLibrary.deleteVoice(id);
    res.json({ message: 'Voice deleted from library' });
  } catch (error) {
    console.error('Error deleting voice:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ VOICE OPERATIONS ============

/**
 * Toggle favorite
 * POST /api/voice-library/:id/favorite
 */
router.post('/:id/favorite', (req, res) => {
  try {
    const { id } = req.params;
    const voice = voiceLibrary.toggleFavorite(id);
    res.json(voice);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Record usage
 * POST /api/voice-library/:id/use
 */
router.post('/:id/use', (req, res) => {
  try {
    const { id } = req.params;
    const voice = voiceLibrary.recordUsage(id);
    res.json(voice);
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add tag
 * POST /api/voice-library/:id/tags
 */
router.post('/:id/tags', (req, res) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({ error: 'Tag is required' });
    }

    const voice = voiceLibrary.addTag(id, tag);
    res.json(voice);
  } catch (error) {
    console.error('Error adding tag:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove tag
 * DELETE /api/voice-library/:id/tags/:tag
 */
router.delete('/:id/tags/:tag', (req, res) => {
  try {
    const { id, tag } = req.params;
    const voice = voiceLibrary.removeTag(id, tag);
    res.json(voice);
  } catch (error) {
    console.error('Error removing tag:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ QUERY OPERATIONS ============

/**
 * Search voices
 * GET /api/voice-library/search?q=query
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = voiceLibrary.searchVoices(q);
    res.json(results);
  } catch (error) {
    console.error('Error searching voices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get favorite voices
 * GET /api/voice-library/favorites
 */
router.get('/favorites', (req, res) => {
  try {
    const voices = voiceLibrary.getFavoriteVoices();
    res.json(voices);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get voices by category
 * GET /api/voice-library/category/:category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const voices = voiceLibrary.getVoicesByCategory(category);
    res.json(voices);
  } catch (error) {
    console.error('Error fetching by category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recently used voices
 * GET /api/voice-library/recent
 */
router.get('/recent', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const voices = voiceLibrary.getRecentlyUsed(parseInt(limit));
    res.json(voices);
  } catch (error) {
    console.error('Error fetching recent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get statistics
 * GET /api/voice-library/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = voiceLibrary.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
