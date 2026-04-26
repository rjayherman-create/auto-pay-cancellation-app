const express = require('express');
const { protect } = require('../middleware/auth');
const { OpenAI } = require('openai');
const titleGenerationService = require('../services/titleGenerationService');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST get AI suggestion for text
router.post('/suggest', protect, async (req, res) => {
  try {
    const { prompt, occasion } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Set OPENAI_API_KEY environment variable',
      });
    }

    const systemPrompt = `You are a professional greeting card copywriter. Provide creative and heartfelt suggestions for greeting card text.
${occasion ? `Occasion: ${occasion}` : ''}

Requirements:
- Suggestions should be personalized and emotional
- Keep to 1-2 sentences max
- Provide 3 alternatives
- Avoid clichés`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Provide 3 unique alternatives for this greeting card message: "${prompt}"`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.8,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    const alternatives = content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    res.json({
      success: true,
      prompt,
      occasion: occasion || 'general',
      text: content,
      alternatives,
      total_tokens: response.usage.total_tokens,
    });
  } catch (error) {
    console.error('Error getting AI suggestion:', error);
    res.status(500).json({
      error: 'Failed to get AI suggestion',
      message: error.message,
    });
  }
});

// POST - Generate multiple title variations with duplicate prevention
router.post('/generate-titles', protect, async (req, res) => {
  try {
    const {
      occasion,
      frontText,
      insideText,
      style = 'general',
      tone = 'heartfelt',
      variations = 5
    } = req.body;

    if (!occasion) {
      return res.status(400).json({ error: 'Occasion is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Set OPENAI_API_KEY environment variable',
      });
    }

    const result = await titleGenerationService.generateTitles({
      occasion,
      frontText,
      insideText,
      style,
      tone,
      variations: Math.min(variations, 10),
      userId: req.user.userId
    });

    res.json({
      success: true,
      titles: result.titles,
      occasion: result.occasion,
      style: result.style,
      tone: result.tone,
      count: result.titles.length,
      total_tokens: result.total_tokens,
    });
  } catch (error) {
    console.error('Error generating titles:', error);
    res.status(500).json({
      error: 'Failed to generate titles',
      message: error.message,
    });
  }
});

// POST - Generate single best title (with duplicate prevention)
router.post('/generate-title', protect, async (req, res) => {
  try {
    const {
      occasion,
      frontText,
      insideText,
      style = 'general',
      tone = 'heartfelt'
    } = req.body;

    if (!occasion) {
      return res.status(400).json({ error: 'Occasion is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Set OPENAI_API_KEY environment variable',
      });
    }

    const title = await titleGenerationService.generateBestTitle({
      occasion,
      frontText,
      insideText,
      style,
      tone,
      userId: req.user.userId
    });

    // Get alternative suggestions
    const suggestions = await titleGenerationService.generateTitles({
      occasion,
      frontText,
      insideText,
      style,
      tone,
      variations: 3,
      userId: req.user.userId
    });

    res.json({
      success: true,
      title,
      occasion,
      style,
      tone,
      suggestions: suggestions.titles,
      duplicatesPrevented: suggestions.titles.length < 3
    });
  } catch (error) {
    console.error('Error generating title:', error);
    res.status(500).json({
      error: 'Failed to generate title',
      message: error.message,
    });
  }
});

// POST - Check if title already exists (duplicate prevention)
router.post('/check-title', protect, async (req, res) => {
  try {
    const { title, occasion } = req.body;

    if (!title || !occasion) {
      return res.status(400).json({ error: 'Title and occasion are required' });
    }

    const exists = await titleGenerationService.titleExists(
      title,
      req.user.userId,
      occasion
    );

    res.json({
      success: true,
      title,
      occasion,
      exists,
      message: exists ? 'Title already exists' : 'Title is unique'
    });
  } catch (error) {
    console.error('Error checking title:', error);
    res.status(500).json({
      error: 'Failed to check title',
      message: error.message,
    });
  }
});

// GET - Get title statistics for user
router.get('/title-stats', protect, async (req, res) => {
  try {
    const stats = await titleGenerationService.getTitleStats(req.user.userId);

    if (!stats) {
      return res.status(500).json({ error: 'Failed to get statistics' });
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting title stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message,
    });
  }
});

module.exports = router;
