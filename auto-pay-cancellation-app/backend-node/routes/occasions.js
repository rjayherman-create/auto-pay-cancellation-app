const express = require('express');
const { Occasion, TrainingJob } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET all occasions with filtering
router.get('/', protect, async (req, res) => {
  try {
    const { category, is_active, skip = 0, limit = 100, search } = req.query;
    const where = {};
    
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Occasion.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        {
          model: TrainingJob,
          as: 'loraModel',
          attributes: ['id', 'name', 'trigger_word'],
          required: false,
        },
      ],
    });

    res.json({
      occasions: rows,
      total: count,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching occasions:', error);
    res.status(500).json({ error: 'Failed to get occasions' });
  }
});

// GET single occasion
router.get('/:id', protect, async (req, res) => {
  try {
    const occasion = await Occasion.findByPk(req.params.id, {
      include: [
        {
          model: TrainingJob,
          as: 'loraModel',
          attributes: ['id', 'name', 'trigger_word'],
          required: false,
        },
      ],
    });

    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    res.json(occasion);
  } catch (error) {
    console.error('Error fetching occasion:', error);
    res.status(500).json({ error: 'Failed to get occasion' });
  }
});

// POST create occasion
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      description,
      emoji,
      color,
      is_active,
      lora_model_id,
      lora_trigger_word,
      seasonal_start,
      seasonal_end,
    } = req.body;

    // Validation
    if (!name || !slug || !category) {
      return res.status(400).json({
        error: 'Missing required fields: name, slug, category',
      });
    }

    // Check if slug already exists
    const existing = await Occasion.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    // Verify LoRA model exists if provided
    if (lora_model_id) {
      const loraModel = await TrainingJob.findByPk(lora_model_id);
      if (!loraModel) {
        return res.status(404).json({ error: 'LoRA model not found' });
      }
    }

    const occasion = await Occasion.create({
      name,
      slug,
      category,
      description,
      emoji,
      color: color || '#6366f1',
      is_active: is_active !== false,
      lora_model_id,
      lora_trigger_word,
      seasonal_start,
      seasonal_end,
    });

    res.status(201).json({
      success: true,
      message: `Occasion "${name}" created successfully`,
      occasion,
    });
  } catch (error) {
    console.error('Error creating occasion:', error);
    res.status(500).json({
      error: 'Failed to create occasion',
      details: error.message,
    });
  }
});

// PUT update occasion
router.put('/:id', protect, async (req, res) => {
  try {
    const occasion = await Occasion.findByPk(req.params.id);

    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    const {
      name,
      slug,
      category,
      description,
      emoji,
      color,
      is_active,
      lora_model_id,
      lora_trigger_word,
      seasonal_start,
      seasonal_end,
    } = req.body;

    // Check if new slug is unique (excluding self)
    if (slug && slug !== occasion.slug) {
      const existing = await Occasion.findOne({
        where: {
          slug,
          id: { [Op.ne]: req.params.id },
        },
      });
      if (existing) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    // Verify LoRA model if provided
    if (lora_model_id && lora_model_id !== occasion.lora_model_id) {
      const loraModel = await TrainingJob.findByPk(lora_model_id);
      if (!loraModel) {
        return res.status(404).json({ error: 'LoRA model not found' });
      }
    }

    await occasion.update({
      name: name || occasion.name,
      slug: slug || occasion.slug,
      category: category || occasion.category,
      description: description !== undefined ? description : occasion.description,
      emoji: emoji !== undefined ? emoji : occasion.emoji,
      color: color || occasion.color,
      is_active: is_active !== undefined ? is_active : occasion.is_active,
      lora_model_id: lora_model_id !== undefined ? lora_model_id : occasion.lora_model_id,
      lora_trigger_word: lora_trigger_word !== undefined ? lora_trigger_word : occasion.lora_trigger_word,
      seasonal_start: seasonal_start !== undefined ? seasonal_start : occasion.seasonal_start,
      seasonal_end: seasonal_end !== undefined ? seasonal_end : occasion.seasonal_end,
    });

    res.json({
      success: true,
      message: 'Occasion updated successfully',
      occasion,
    });
  } catch (error) {
    console.error('Error updating occasion:', error);
    res.status(500).json({
      error: 'Failed to update occasion',
      details: error.message,
    });
  }
});

// DELETE occasion
router.delete('/:id', protect, async (req, res) => {
  try {
    const occasion = await Occasion.findByPk(req.params.id);

    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    await occasion.destroy();

    res.json({
      success: true,
      message: 'Occasion deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting occasion:', error);
    res.status(500).json({
      error: 'Failed to delete occasion',
      details: error.message,
    });
  }
});

// GET occasion statistics
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const occasion = await Occasion.findByPk(req.params.id);

    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    res.json({
      occasion_id: occasion.id,
      occasion_name: occasion.name,
      stats: {
        total_cards: occasion.card_count,
        draft: occasion.draft_count,
        approved: occasion.approved_count,
        published: occasion.published_count,
      },
      popularity_score: occasion.popularity_score,
    });
  } catch (error) {
    console.error('Error fetching occasion stats:', error);
    res.status(500).json({ error: 'Failed to fetch occasion stats' });
  }
});

module.exports = router;
