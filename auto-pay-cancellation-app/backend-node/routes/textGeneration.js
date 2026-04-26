const express = require('express');
const { protect } = require('../middleware/auth');
const {
  generateCardText,
  generateBatchText,
  refineCardText,
  getExamples
} = require('../controllers/textGenerationController');

const router = express.Router();

/**
 * POST /api/text-generation/generate
 * Generate card text variations
 * Body: { occasion, tone, audience, style_name?, quantity?, custom_prompt? }
 */
router.post('/generate', protect, async (req, res) => {
  try {
    await generateCardText(req, res);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/text-generation/batch
 * Generate batch text for multiple styles
 * Body: { occasion, tone, audience, styles: [], cards_per_style? }
 */
router.post('/batch', protect, async (req, res) => {
  try {
    await generateBatchText(req, res);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/text-generation/refine
 * Refine existing card text
 * Body: { current_headline, current_message, refinement_request, tone? }
 */
router.post('/refine', protect, async (req, res) => {
  try {
    await refineCardText(req, res);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/text-generation/examples
 * Get example text for an occasion
 * Query: { occasion?, tone? }
 */
router.get('/examples', protect, async (req, res) => {
  try {
    await getExamples(req, res);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
