/**
 * CardNameSequence Model
 * 
 * Tracks the next available sequence number for each occasion
 * This is the source of truth for naming to prevent collisions
 * 
 * Example:
 * {
 *   occasion: 'Birthday',
 *   next_sequence: 42,
 *   last_updated: 2024-02-15T...
 * }
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CardNameSequence = sequelize.define('CardNameSequence', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  occasion_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'occasions',
      key: 'id',
    },
  },
  occasion_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  next_sequence: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  last_published_sequence: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  total_cards_generated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  total_cards_published: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {
      created_reason: 'system',
      notes: '',
    },
  },
}, {
  tableName: 'card_name_sequences',
  timestamps: true,
  indexes: [
    { fields: ['occasion_id'] },
    { fields: ['occasion_name'] },
  ],
});

module.exports = CardNameSequence;
