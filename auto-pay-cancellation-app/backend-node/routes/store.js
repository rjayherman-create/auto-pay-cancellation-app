const express = require('express');
const { Card, Occasion } = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET store inventory
router.get('/inventory', protect, async (req, res) => {
  try {
    const { status = 'published', skip = 0, limit = 50 } = req.query;
    const where = { status };

    const { count, rows } = await Card.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
    });

    res.json({
      cards: rows,
      total: count,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching store inventory:', error);
    res.status(500).json({ error: 'Failed to fetch store inventory' });
  }
});

// POST publish card to store
router.post('/cards/:id/publish', protect, async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.status !== 'approved') {
      return res.status(400).json({
        error: 'Only approved cards can be published',
        current_status: card.status,
      });
    }

    await card.update({
      status: 'published',
      published_at: new Date(),
    });

    res.json({
      success: true,
      message: 'Card published to store successfully',
      card,
    });
  } catch (error) {
    console.error('Error publishing card:', error);
    res.status(500).json({
      error: 'Failed to publish card',
      message: error.message,
    });
  }
});

// POST unpublish card from store
router.post('/cards/:id/unpublish', protect, async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.status !== 'published') {
      return res.status(400).json({
        error: 'Only published cards can be unpublished',
        current_status: card.status,
      });
    }

    await card.update({
      status: 'approved',
      published_at: null,
    });

    res.json({
      success: true,
      message: 'Card unpublished from store successfully',
      card,
    });
  } catch (error) {
    console.error('Error unpublishing card:', error);
    res.status(500).json({
      error: 'Failed to unpublish card',
      message: error.message,
    });
  }
});

module.exports = router;
