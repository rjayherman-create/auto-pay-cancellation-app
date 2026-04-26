const express = require('express');
const { sequelize } = require('../config/database');

const router = express.Router();

// GET all tones
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;
    
    const where = {};
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const tones = await sequelize.query(
      'SELECT id, name, description, emoji, is_active FROM tones WHERE (:is_active IS NULL OR is_active = :is_active) ORDER BY name ASC',
      {
        replacements: { is_active: is_active === 'true' ? true : (is_active === 'false' ? false : null) },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({ tones });
  } catch (error) {
    console.error('Error fetching tones:', error);
    res.status(500).json({ error: 'Failed to fetch tones' });
  }
});

module.exports = router;
