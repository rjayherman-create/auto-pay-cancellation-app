const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Card = sequelize.define('Card', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  batch_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'batches',
      key: 'id',
    },
  },
  occasion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  style: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  style_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'styles',
      key: 'id',
    },
  },
  front_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  inside_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  front_image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  inside_image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'qc_passed', 'approved', 'published', 'rejected'),
    defaultValue: 'draft',
  },
  quality_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'cards',
  timestamps: true,
  indexes: [
    { fields: ['batch_id'] },
    { fields: ['style_id'] },
    { fields: ['status'] },
    { fields: ['created_by'] },
  ],
});

module.exports = Card;
