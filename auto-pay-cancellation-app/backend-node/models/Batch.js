const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  occasion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  occasion_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'occasions',
      key: 'id',
    },
  },
  style: {
    type: DataTypes.STRING,
    defaultValue: 'watercolor',
  },
  style_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'styles',
      key: 'id',
    },
  },
  total_cards: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  generated_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  approved_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  published_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'generating', 'review', 'completed', 'failed'),
    defaultValue: 'draft',
  },
  lora_model_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'training_jobs',
      key: 'id',
    },
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'batches',
  timestamps: true,
  indexes: [
    { fields: ['style_id'] },
    { fields: ['occasion_id'] },
    { fields: ['created_by'] },
    { fields: ['status'] },
  ],
});

module.exports = Batch;
