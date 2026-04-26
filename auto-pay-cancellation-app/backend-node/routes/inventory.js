const express = require('express');
const { Card, Occasion } = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET inventory dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const totalCards = await Card.count();
    const draftCards = await Card.count({ where: { status: 'draft' } });
    const approvedCards = await Card.count({ where: { status: 'approved' } });
    const publishedCards = await Card.count({ where: { status: 'published' } });
    const rejectedCards = await Card.count({ where: { status: 'rejected' } });

    const occasionStats = await Occasion.findAll({
      attributes: ['id', 'name', 'emoji', 'card_count', 'draft_count', 'approved_count', 'published_count'],
      order: [['card_count', 'DESC']],
      limit: 10,
    });

    res.json({
      total: totalCards,
      by_status: {
        draft: draftCards,
        approved: approvedCards,
        published: publishedCards,
        rejected: rejectedCards,
      },
      top_occasions: occasionStats,
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ error: 'Failed to fetch inventory stats' });
  }
});

// GET approval queue (cards needing review)
router.get('/approval-queue', protect, async (req, res) => {
  try {
    const { status = 'draft', limit = 50, skip = 0 } = req.query;
    const statuses = status ? status.split(',') : ['draft', 'qc_passed'];

    const { count, rows } = await Card.findAndCountAll({
      where: { status: statuses },
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(skip),
    });

    res.json({
      cards: rows,
      total: count,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    res.status(500).json({ error: 'Failed to fetch approval queue' });
  }
});

// POST update card approval status
router.post('/:id/approve', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, quality_score } = req.body;

    const card = await Card.findByPk(id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.update({
      status: 'approved',
      reviewed_by: req.user.userId,
      reviewed_at: new Date(),
      quality_score: quality_score || 85,
      metadata: {
        ...card.metadata,
        approval_notes: notes,
      },
    });

    // Update occasion stats
    const occasion = await Occasion.findOne({ where: { name: card.occasion } });
    if (occasion) {
      const draftCount = await Card.count({
        where: { occasion: card.occasion, status: 'draft' },
      });
      const approvedCount = await Card.count({
        where: { occasion: card.occasion, status: 'approved' },
      });

      await occasion.update({
        draft_count: draftCount,
        approved_count: approvedCount,
      });
    }

    res.json({
      success: true,
      message: 'Card approved successfully',
      card,
    });
  } catch (error) {
    console.error('Error approving card:', error);
    res.status(500).json({ error: 'Failed to approve card' });
  }
});

// POST reject card
router.post('/:id/reject', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const card = await Card.findByPk(id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: req.user.userId,
      reviewed_at: new Date(),
    });

    res.json({
      success: true,
      message: 'Card rejected successfully',
      card,
    });
  } catch (error) {
    console.error('Error rejecting card:', error);
    res.status(500).json({ error: 'Failed to reject card' });
  }
});

// POST publish card
router.post('/:id/publish', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findByPk(id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved cards can be published' });
    }

    await card.update({
      status: 'published',
    });

    // Update occasion stats
    const occasion = await Occasion.findOne({ where: { name: card.occasion } });
    if (occasion) {
      const publishedCount = await Card.count({
        where: { occasion: card.occasion, status: 'published' },
      });

      await occasion.update({
        published_count: publishedCount,
        card_count: publishedCount, // Or total count
      });
    }

    res.json({
      success: true,
      message: 'Card published successfully',
      card,
    });
  } catch (error) {
    console.error('Error publishing card:', error);
    res.status(500).json({ error: 'Failed to publish card' });
  }
});

// GET inventory by occasion
router.get('/occasions/:occasionId/stats', protect, async (req, res) => {
  try {
    const { occasionId } = req.params;

    const occasion = await Occasion.findByPk(occasionId);
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    const statuses = ['draft', 'qc_passed', 'approved', 'published', 'rejected'];
    const stats = {};

    for (const status of statuses) {
      stats[status] = await Card.count({
        where: { occasion: occasion.name, status },
      });
    }

    res.json({
      occasion_id: occasionId,
      occasion_name: occasion.name,
      stats,
    });
  } catch (error) {
    console.error('Error fetching occasion stats:', error);
    res.status(500).json({ error: 'Failed to fetch occasion stats' });
  }
});

// DELETE bulk delete cards
router.post('/bulk-delete', protect, async (req, res) => {
  try {
    const { cardIds } = req.body;

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({ error: 'No card IDs provided' });
    }

    const result = await Card.destroy({
      where: { id: cardIds },
    });

    res.json({
      success: true,
      message: `Deleted ${result} cards`,
      deleted_count: result,
    });
  } catch (error) {
    console.error('Error deleting cards:', error);
    res.status(500).json({ error: 'Failed to delete cards' });
  }
});

// PUT update card status in bulk
router.post('/bulk-update-status', protect, async (req, res) => {
  try {
    const { cardIds, status } = req.body;

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({ error: 'No card IDs provided' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const [result] = await Card.update(
      { status, reviewed_by: req.user.userId, reviewed_at: new Date() },
      { where: { id: cardIds } }
    );

    res.json({
      success: true,
      message: `Updated ${result} cards to ${status}`,
      updated_count: result,
    });
  } catch (error) {
    console.error('Error updating cards:', error);
    res.status(500).json({ error: 'Failed to update cards' });
  }
});

module.exports = router;
