const express = require('express');
const { TrainingJob, User } = require('../models');
const { protect } = require('../middleware/auth');
const { startTraining } = require('../services/falService');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { status, skip = 0, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await TrainingJob.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });
    res.json({
      jobs: rows,
      total: count,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get training jobs' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const job = await TrainingJob.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!job) {
      return res.status(404).json({ error: 'Training job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get training job' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { batch_id, model_name, training_data_url } = req.body;
    const job = await TrainingJob.create({
      batch_id,
      model_name,
      training_data_url,
      status: 'pending',
      created_by: req.user.userId,
    });
    await startTraining({ job });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start training job' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const job = await TrainingJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Training job not found' });
    }
    await job.update(req.body);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update training job' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await TrainingJob.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Training job not found' });
    }
    await job.destroy();
    res.json({ message: 'Training job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete training job' });
  }
});

module.exports = router;
