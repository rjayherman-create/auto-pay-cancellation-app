const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Occasion = sequelize.define('Occasion', {
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
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emoji: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  popularity_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  card_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  seasonal_start: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  seasonal_end: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'occasions',
  timestamps: true,
});

module.exports = Occasion;
