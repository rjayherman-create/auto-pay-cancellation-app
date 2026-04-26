const express = require('express');
const { Card, Batch, Occasion, TrainingJob, User } = require('../models');
const CardNamingService = require('../services/cardNamingService');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');
const { generateMultiplePremiumCards } = require('../services/premiumCardService');

const router = express.Router();

// GET all cards with style filtering
router.get('/', protect, async (req, res) => {
  try {
    const { batch_id, status, style, style_id, skip = 0, limit = 50, search } = req.query;
    const where = {};
    
    if (batch_id) where.batch_id = batch_id;
    if (status) where.status = status;
    if (style) where.style = style;
    if (style_id) where.style_id = style_id;
    if (search) {
      where.occasion = { [require('sequelize').Op.iLike]: `%${search}%` };
    }
    
    const { count, rows } = await Card.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { model: Batch, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: require('../models').Style, as: 'styleInfo', attributes: ['id', 'name', 'emoji', 'color'] },
      ],
    });
    
    res.json({
      cards: rows,
      total: count,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to get cards' });
  }
});

// GET single card
router.get('/:id', protect, async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id, {
      include: [
        { model: Batch, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Failed to get card' });
  }
});

// GET - Get next sequence number and naming for an occasion
// This is what the UI calls to preview card names before saving
router.get('/naming/next/:occasionId', protect, async (req, res) => {
  try {
    const { occasionId } = req.params;
    
    const names = await CardNamingService.generateCardNames(occasionId);
    
    res.json({
      success: true,
      occasion: names.occasion,
      sequence: names.sequence,
      front: names.front,
      inside: names.inside,
      preview: `${names.front} / ${names.inside}`
    });
  } catch (err) {
    console.error('Error getting next sequence:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET - Get naming statistics for dashboard
router.get('/naming/stats', protect, async (req, res) => {
  try {
    const stats = await CardNamingService.getNamingStats();
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error getting naming stats:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET - Get all sequences for a specific occasion
router.get('/naming/occasion/:occasionId', protect, async (req, res) => {
  try {
    const { occasionId } = req.params;
    const sequences = await CardNamingService.getOccasionSequences(occasionId);
    
    res.json({
      success: true,
      sequences,
      total: sequences.length,
      nextSequence: (Math.max(...sequences.map(s => s.sequence || 0)) || 0) + 1
    });
  } catch (err) {
    console.error('Error getting occasion sequences:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT - Update card
router.put('/:id', protect, async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.update(req.body);
    res.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// DELETE - Delete card
router.delete('/:id', protect, async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.destroy();
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// PUT - Bulk update card status (approve/reject multiple)
router.put('/bulk/update-status', protect, async (req, res) => {
  try {
    const { cardIds, status } = req.body;

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({ error: 'cardIds must be a non-empty array' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Validate status
    const validStatuses = ['draft', 'approved', 'rejected', 'published', 'qc_passed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Update all cards with the specified IDs
    const [updatedCount] = await Card.update(
      { status },
      {
        where: {
          id: {
            [Op.in]: cardIds
          }
        }
      }
    );

    res.json({
      success: true,
      message: `Updated ${updatedCount} card(s) to status: ${status}`,
      updated: updatedCount,
      status
    });
  } catch (error) {
    console.error('Error bulk updating card status:', error);
    res.status(500).json({ error: 'Failed to bulk update cards', details: error.message });
  }
});

// POST - Bulk delete cards
router.post('/bulk/delete', protect, async (req, res) => {
  try {
    const { cardIds } = req.body;

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({ error: 'cardIds must be a non-empty array' });
    }

    const deletedCount = await Card.destroy({
      where: {
        id: {
          [Op.in]: cardIds
        }
      }
    });

    res.json({
      success: true,
      message: `Deleted ${deletedCount} card(s)`,
      deleted: deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting cards:', error);
    res.status(500).json({ error: 'Failed to bulk delete cards', details: error.message });
  }
});

// POST - Generate PREMIUM cards (image + text together)
// This is the main endpoint - generates high-quality cards that compete with Hallmark
router.post('/generate-complete', protect, async (req, res) => {
  try {
    const { 
      occasion, 
      tone = 'heartfelt',
      style = 'elegant',
      variations = 3,
      lora_model_id,
      recipientContext
    } = req.body;

    if (!occasion) {
      return res.status(400).json({ error: 'Occasion is required' });
    }

    // Get occasion details
    const occasionObj = await Occasion.findByPk(occasion);
    if (!occasionObj) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    // Get LoRA model if specified
    let loraModel = null;
    if (lora_model_id) {
      loraModel = await TrainingJob.findByPk(lora_model_id);
      if (!loraModel) {
        return res.status(404).json({ error: 'LoRA model not found' });
      }
    }

    // Generate PREMIUM quality cards
    console.log(`🎨 Generating ${variations} PREMIUM cards for ${occasionObj.name} (${tone}, ${style})...`);
    const result = await generateMultiplePremiumCards({
      occasion: occasionObj.name,
      tone,
      style,
      variations: Math.min(variations, 5), // Max 5 for quality
      loraModel,
      recipientContext
    });

    if (result.cards.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to generate premium cards. Please ensure OPENAI_API_KEY is configured.',
        errors: result.errors
      });
    }

    res.json({
      success: true,
      cards: result.cards,
      errors: result.errors,
      count: result.successful,
      total: result.total,
      occasion: occasionObj.name,
      style,
      tone,
      quality: 'PREMIUM' // Indicates high-quality generation
    });

  } catch (error) {
    console.error('❌ Error generating premium cards:', error);
    res.status(500).json({ 
      error: 'Failed to generate premium cards',
      message: 'To use premium card generation, set OPENAI_API_KEY environment variable',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST - Save card with automatic naming (NEW - recommended)
// This endpoint uses CardNamingService for automatic, collision-free naming
router.post('/save-with-naming', protect, async (req, res) => {
  try {
    const {
      occasion_id,
      front_text,
      inside_message,
      front_image_url,
      concept_title,
      style,
      tone,
      emotional_impact,
      uniqueness_factor,
      design_suggestions,
      lora_model_id,
      personalization,
      sequence_number // Optional: if not provided, auto-calculates
    } = req.body;

    if (!occasion_id || !front_text || !front_image_url) {
      return res.status(400).json({ error: 'Missing required fields: occasion_id, front_text, front_image_url' });
    }

    const occasion = await Occasion.findByPk(occasion_id);
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    // Generate names using CardNamingService
    const names = await CardNamingService.generateCardNames(occasion_id, sequence_number);

    // Create card with automatic naming
    const card = await Card.create({
      occasion_id,
      occasion: occasion.name,
      front_text,
      inside_text: inside_message || '',
      front_image_url,
      inside_image_url: front_image_url,
      prompt: front_text,
      style,
      status: 'draft',
      created_by: req.user.userId,
      lora_model_id,
      metadata: {
        tone,
        concept_title,
        generation_method: 'premium_multimodal',
        emotional_impact,
        uniqueness_factor,
        design_suggestions,
        personalization: personalization || {},
        quality: 'premium',
        card_name: names.front, // Front name is the primary identifier
        card_inside_name: names.inside,
        card_sequence_name: names.front, // Full name for tracking
        card_sequence_number: names.sequence,
        occasion_name: occasion.name,
      }
    });

    res.status(201).json({
      success: true,
      message: `✅ Card "${names.front}" saved!`,
      card: {
        id: card.id,
        card_name: names.front,
        card_inside_name: names.inside,
        sequence: names.sequence,
        occasion: occasion.name,
        front_text: card.front_text,
        front_image_url: card.front_image_url,
        inside_message: inside_message,
        personalization: personalization,
        style: card.style,
        quality: 'premium',
        status: card.status,
        created_at: card.created_at,
      }
    });

  } catch (error) {
    console.error('Error saving card with naming:', error);
    res.status(500).json({ 
      error: 'Failed to save card',
      details: error.message
    });
  }
});

// POST - Save card with personalization and premium metadata (LEGACY)
router.post('/save-complete', protect, async (req, res) => {
  try {
    const {
      occasion_id,
      name,
      front_text,
      inside_message,
      front_image_url,
      concept_title,
      style,
      tone,
      emotional_impact,
      uniqueness_factor,
      design_suggestions,
      lora_model_id,
      personalization
    } = req.body;

    if (!occasion_id || !front_text || !front_image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const occasion = await Occasion.findByPk(occasion_id);
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    // Create card with premium metadata including the card name
    const card = await Card.create({
      occasion_id,
      front_text,
      inside_text: inside_message || '',
      front_image_url,
      inside_image_url: front_image_url,
      prompt: name || concept_title || front_text,
      style,
      status: 'draft',
      created_by: req.user.userId,
      lora_model_id,
      metadata: {
        tone,
        concept_title,
        generation_method: 'premium_multimodal',
        emotional_impact,
        uniqueness_factor,
        design_suggestions,
        personalization: personalization || {},
        quality: 'premium',
        card_name: name
      }
    });

    res.status(201).json({
      success: true,
      message: `✅ Card "${name}" saved!`,
      card: {
        id: card.id,
        name: name,
        front_text: card.front_text,
        front_image_url: card.front_image_url,
        personalization: personalization,
        style: card.style,
        quality: 'premium',
        status: card.status
      }
    });

  } catch (error) {
    console.error('Error saving premium card:', error);
    res.status(500).json({ 
      error: 'Failed to save card',
      details: error.message
    });
  }
});

module.exports = router;
