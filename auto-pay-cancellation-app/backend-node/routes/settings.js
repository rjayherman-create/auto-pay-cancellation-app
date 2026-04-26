const express = require('express');
const { Settings } = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET all settings with optional filtering
router.get('/', protect, async (req, res) => {
  try {
    const { category, skip = 0, limit = 100 } = req.query;
    const where = {};
    
    if (category) where.category = category;

    const { count, rows } = await Settings.findAndCountAll({
      where,
      order: [['key', 'ASC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
    });

    res.json({
      settings: rows,
      total: count,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// GET single setting by key
router.get('/:key', protect, async (req, res) => {
  try {
    const setting = await Settings.findOne({
      where: { key: req.params.key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to get setting' });
  }
});

// POST create new setting
router.post('/', protect, async (req, res) => {
  try {
    const { key, value, category, description } = req.body;

    // Validation
    if (!key || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: key, value',
      });
    }

    // Check if key already exists
    const existing = await Settings.findOne({ where: { key } });
    if (existing) {
      return res.status(400).json({
        error: 'Setting key already exists',
      });
    }

    const setting = await Settings.create({
      key,
      value,
      category,
      description,
    });

    res.status(201).json({
      success: true,
      message: `Setting "${key}" created successfully`,
      setting,
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({
      error: 'Failed to create setting',
      details: error.message,
    });
  }
});

// PUT update setting by key
router.put('/:key', protect, async (req, res) => {
  try {
    const setting = await Settings.findOne({
      where: { key: req.params.key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const { value, category, description } = req.body;

    await setting.update({
      value: value !== undefined ? value : setting.value,
      category: category !== undefined ? category : setting.category,
      description: description !== undefined ? description : setting.description,
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      setting,
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      error: 'Failed to update setting',
      details: error.message,
    });
  }
});

// DELETE setting by key
router.delete('/:key', protect, async (req, res) => {
  try {
    const setting = await Settings.findOne({
      where: { key: req.params.key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    await setting.destroy();

    res.json({
      success: true,
      message: `Setting "${req.params.key}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      error: 'Failed to delete setting',
      details: error.message,
    });
  }
});

module.exports = router;
