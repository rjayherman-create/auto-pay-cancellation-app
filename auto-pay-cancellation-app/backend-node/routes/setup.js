const express = require('express');
const { User, sequelize } = require('../models');

const router = express.Router();

/**
 * Sync database models
 * This endpoint creates tables if they don't exist
 */
router.post('/sync-db', async (req, res) => {
  try {
    await sequelize.sync({ alter: false });
    res.json({
      message: 'Database synchronized successfully',
      status: 'synced',
    });
  } catch (error) {
    console.error('Sync DB error:', error);
    res.status(500).json({ error: 'Database sync failed', details: error.message });
  }
});

/**
 * Initialize the system with demo data
 * This endpoint creates demo users if they don't exist
 */
router.post('/init', async (req, res) => {
  try {
    const demoUsers = [
      {
        email: 'admin@cardhugs.com',
        password: 'password123',
        name: 'Admin User',
        role: 'admin',
      },
      {
        email: 'designer@cardhugs.com',
        password: 'password123',
        name: 'Designer User',
        role: 'designer',
      },
      {
        email: 'reviewer@cardhugs.com',
        password: 'password123',
        name: 'Reviewer User',
        role: 'reviewer',
      },
    ];

    const createdUsers = [];
    const existingUsers = [];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ where: { email: userData.email } });

      if (existingUser) {
        existingUsers.push({
          email: userData.email,
          name: userData.name,
          role: userData.role,
        });
      } else {
        const newUser = await User.create(userData);
        createdUsers.push({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        });
      }
    }

    res.json({
      message: 'System initialized successfully',
      created: createdUsers,
      existing: existingUsers,
      total: createdUsers.length + existingUsers.length,
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: 'Initialization failed', details: error.message });
  }
});

/**
 * Get system status
 */
router.get('/status', async (req, res) => {
  try {
    const userCount = await User.count();
    res.json({
      status: 'ok',
      database: 'connected',
      users: userCount,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});

module.exports = router;
