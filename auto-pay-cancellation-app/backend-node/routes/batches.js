const express = require('express');
const { Batch, Card, User, Style, TrainingJob, Occasion } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET all batches with style filtering
router.get('/', protect, async (req, res) => {
  try {
    const { status, occasion, style, style_id, skip = 0, limit = 50, search } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (occasion) where.occasion = occasion;
    if (style) where.style = style;
    if (style_id) where.style_id = style_id;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { occasion: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Batch.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Style, as: 'style', attributes: ['id', 'name', 'emoji', 'color'] },
        { model: TrainingJob, as: 'loraModel', attributes: ['id', 'name', 'status'] },
      ],
    });

    res.json({
      batches: rows,
      total: count,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to get batches' });
  }
});

// GET single batch
router.get('/:id', protect, async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Style, as: 'style', attributes: ['id', 'name', 'emoji', 'color', 'base_prompt', 'style_keywords'] },
        { model: TrainingJob, as: 'loraModel', attributes: ['id', 'name', 'trigger_word', 'status'] },
      ],
    });

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to get batch' });
  }
});

// POST create batch with style support
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      occasion,
      occasion_id,
      style,
      style_id,
      total_cards,
      lora_model_id,
      description,
    } = req.body;

    if (!name || !occasion) {
      return res.status(400).json({
        error: 'Missing required fields: name, occasion',
      });
    }

    // Verify style if provided
    if (style_id) {
      const styleObj = await Style.findByPk(style_id);
      if (!styleObj) {
        return res.status(404).json({ error: 'Style not found' });
      }
    }

    const batch = await Batch.create({
      name,
      occasion,
      occasion_id,
      style: style || 'watercolor',
      style_id,
      total_cards: total_cards || 0,
      lora_model_id,
      description,
      status: 'draft',
      created_by: req.user.userId,
    });

    // Reload with associations
    const fullBatch = await Batch.findByPk(batch.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Style, as: 'style' },
      ],
    });

    res.status(201).json({
      success: true,
      message: `Batch "${name}" created successfully`,
      batch: fullBatch,
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({
      error: 'Failed to create batch',
      details: error.message,
    });
  }
});

// PUT update batch
router.put('/:id', protect, async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const {
      name,
      occasion,
      occasion_id,
      style,
      style_id,
      total_cards,
      lora_model_id,
      status,
      description,
    } = req.body;

    // Verify style if changed
    if (style_id && style_id !== batch.style_id) {
      const styleObj = await Style.findByPk(style_id);
      if (!styleObj) {
        return res.status(404).json({ error: 'Style not found' });
      }
    }

    await batch.update({
      name: name || batch.name,
      occasion: occasion || batch.occasion,
      occasion_id: occasion_id !== undefined ? occasion_id : batch.occasion_id,
      style: style || batch.style,
      style_id: style_id !== undefined ? style_id : batch.style_id,
      total_cards: total_cards !== undefined ? total_cards : batch.total_cards,
      lora_model_id: lora_model_id !== undefined ? lora_model_id : batch.lora_model_id,
      status: status || batch.status,
      description: description !== undefined ? description : batch.description,
    });

    const updatedBatch = await Batch.findByPk(batch.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Style, as: 'style' },
      ],
    });

    res.json({
      success: true,
      message: 'Batch updated successfully',
      batch: updatedBatch,
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({
      error: 'Failed to update batch',
      details: error.message,
    });
  }
});

// DELETE batch
router.delete('/:id', protect, async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Delete associated cards
    await Card.destroy({ where: { batch_id: req.params.id } });
    await batch.destroy();

    res.json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({
      error: 'Failed to delete batch',
      details: error.message,
    });
  }
});

// GET batch statistics by style
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const [cards, styleStats] = await Promise.all([
      Card.findAll({
        where: { batch_id: batch.id },
        attributes: ['status'],
        raw: true,
      }),
      Style.findByPk(batch.style_id, {
        attributes: ['name', 'popularity_score', 'usage_count'],
      }),
    ]);

    const statusCounts = cards.reduce((acc, card) => {
      acc[card.status] = (acc[card.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      batch_id: batch.id,
      batch_name: batch.name,
      stats: {
        total: batch.total_cards,
        generated: batch.generated_count,
        approved: batch.approved_count,
        published: batch.published_count,
        byStatus: statusCounts,
      },
      style_info: styleStats,
    });
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    res.status(500).json({ error: 'Failed to get batch stats' });
  }
});

module.exports = router;
