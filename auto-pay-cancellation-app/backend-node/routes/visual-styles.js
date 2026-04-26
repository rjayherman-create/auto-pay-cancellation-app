const express = require('express');
const { Style, TrainingJob, Card, Batch } = require('../models');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET all styles with filtering
router.get('/', async (req, res) => {
  try {
    const { category, is_active, search, skip = 0, limit = 100 } = req.query;
    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Style.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        {
          model: TrainingJob,
          as: 'loraModel',
          attributes: ['id', 'name', 'trigger_word', 'status'],
          required: false,
        },
      ],
    });

    res.json({
      styles: rows,
      total: count,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({ error: 'Failed to fetch styles' });
  }
});

// GET single style with card count
router.get('/:id', async (req, res) => {
  try {
    const style = await Style.findByPk(req.params.id, {
      include: [
        {
          model: TrainingJob,
          as: 'loraModel',
          attributes: ['id', 'name', 'trigger_word', 'status'],
        },
      ],
    });

    if (!style) {
      return res.status(404).json({ error: 'Style not found' });
    }

    // Get statistics
    const [cardCount, batchCount] = await Promise.all([
      Card.count({ where: { style_id: req.params.id } }),
      Batch.count({ where: { style_id: req.params.id } }),
    ]);

    res.json({
      ...style.toJSON(),
      stats: {
        card_count: cardCount,
        batch_count: batchCount,
      },
    });
  } catch (error) {
    console.error('Error fetching style:', error);
    res.status(500).json({ error: 'Failed to get style' });
  }
});

// POST create style (admin only)
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
      base_prompt,
      style_keywords,
      examples,
    } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        error: 'Missing required fields: name, slug',
      });
    }

    // Check if slug exists
    const existing = await Style.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    // Verify LoRA model if provided
    if (lora_model_id) {
      const loraModel = await TrainingJob.findByPk(lora_model_id);
      if (!loraModel) {
        return res.status(404).json({ error: 'LoRA model not found' });
      }
    }

    const style = await Style.create({
      name,
      slug,
      category: category || 'general',
      description,
      emoji,
      color: color || '#6366f1',
      is_active: is_active !== false,
      lora_model_id,
      lora_trigger_word,
      base_prompt,
      style_keywords: style_keywords || [],
      examples: examples || {},
    });

    res.status(201).json({
      success: true,
      message: `Style "${name}" created successfully`,
      style,
    });
  } catch (error) {
    console.error('Error creating style:', error);
    res.status(500).json({
      error: 'Failed to create style',
      details: error.message,
    });
  }
});

// PUT update style
router.put('/:id', protect, async (req, res) => {
  try {
    const style = await Style.findByPk(req.params.id);

    if (!style) {
      return res.status(404).json({ error: 'Style not found' });
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
      base_prompt,
      style_keywords,
      examples,
    } = req.body;

    // Check if new slug is unique
    if (slug && slug !== style.slug) {
      const existing = await Style.findOne({
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
    if (lora_model_id && lora_model_id !== style.lora_model_id) {
      const loraModel = await TrainingJob.findByPk(lora_model_id);
      if (!loraModel) {
        return res.status(404).json({ error: 'LoRA model not found' });
      }
    }

    await style.update({
      name: name || style.name,
      slug: slug || style.slug,
      category: category !== undefined ? category : style.category,
      description: description !== undefined ? description : style.description,
      emoji: emoji !== undefined ? emoji : style.emoji,
      color: color || style.color,
      is_active: is_active !== undefined ? is_active : style.is_active,
      lora_model_id: lora_model_id !== undefined ? lora_model_id : style.lora_model_id,
      lora_trigger_word: lora_trigger_word !== undefined ? lora_trigger_word : style.lora_trigger_word,
      base_prompt: base_prompt !== undefined ? base_prompt : style.base_prompt,
      style_keywords: style_keywords !== undefined ? style_keywords : style.style_keywords,
      examples: examples !== undefined ? examples : style.examples,
    });

    res.json({
      success: true,
      message: 'Style updated successfully',
      style,
    });
  } catch (error) {
    console.error('Error updating style:', error);
    res.status(500).json({
      error: 'Failed to update style',
      details: error.message,
    });
  }
});

// DELETE style
router.delete('/:id', protect, async (req, res) => {
  try {
    const style = await Style.findByPk(req.params.id);

    if (!style) {
      return res.status(404).json({ error: 'Style not found' });
    }

    // Check if style is in use
    const cardCount = await Card.count({ where: { style_id: req.params.id } });
    const batchCount = await Batch.count({ where: { style_id: req.params.id } });

    if (cardCount > 0 || batchCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete style in use',
        details: {
          cards: cardCount,
          batches: batchCount,
        },
      });
    }

    await style.destroy();

    res.json({
      success: true,
      message: 'Style deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting style:', error);
    res.status(500).json({
      error: 'Failed to delete style',
      details: error.message,
    });
  }
});

// GET style statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const style = await Style.findByPk(req.params.id);

    if (!style) {
      return res.status(404).json({ error: 'Style not found' });
    }

    const [cardsByStatus, batchesByStatus, totalCards, totalBatches] = await Promise.all([
      Card.findAll({
        where: { style_id: req.params.id },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Batch.findAll({
        where: { style_id: req.params.id },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Card.count({ where: { style_id: req.params.id } }),
      Batch.count({ where: { style_id: req.params.id } }),
    ]);

    res.json({
      style_id: style.id,
      style_name: style.name,
      stats: {
        total_cards: totalCards,
        total_batches: totalBatches,
        cards_by_status: cardsByStatus,
        batches_by_status: batchesByStatus,
        usage_count: style.usage_count,
        popularity_score: style.popularity_score,
      },
    });
  } catch (error) {
    console.error('Error fetching style stats:', error);
    res.status(500).json({ error: 'Failed to fetch style stats' });
  }
});

module.exports = router;
