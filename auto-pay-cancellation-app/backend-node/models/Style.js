const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Style = sequelize.define('Style', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emoji: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // LoRA model for this style
  lora_model_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'training_jobs',
      key: 'id',
    },
  },
  lora_trigger_word: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Analytics
  card_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  batch_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  popularity_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Prompt guidance
  base_prompt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  style_keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  examples: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'styles',
  timestamps: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['is_active'] },
    { fields: ['category'] },
    { fields: ['lora_model_id'] },
  ],
});

module.exports = Style;
