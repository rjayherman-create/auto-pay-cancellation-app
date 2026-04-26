const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TrainingJob = sequelize.define('TrainingJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  style_pack_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  images_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  epochs: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  learning_rate: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0001,
  },
  status: {
    type: DataTypes.ENUM('queued', 'training', 'completed', 'failed'),
    defaultValue: 'queued',
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  current_epoch: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lora_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  config_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  trigger_word: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estimated_time_remaining: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'training_jobs',
  timestamps: true,
});

module.exports = TrainingJob;
