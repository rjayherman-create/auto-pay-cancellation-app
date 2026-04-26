const { sequelize, Sequelize } = require('../config/database');
const User = require('./User');
const Batch = require('./Batch');
const Card = require('./Card');
const Occasion = require('./Occasion');
const TrainingJob = require('./TrainingJob');
const Settings = require('./Settings');
const Style = require('./Style');
const CardComment = require('./CardComment');

// Card associations
Card.belongsTo(Batch, { foreignKey: 'batch_id', as: 'batch' });
Card.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Card.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
Card.belongsTo(TrainingJob, { foreignKey: 'lora_model_id', as: 'loraModel' });
Card.belongsTo(Style, { foreignKey: 'style_id', as: 'styleInfo' });

// Batch associations
Batch.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Batch.belongsTo(Style, { foreignKey: 'style_id', as: 'style' });
Batch.hasMany(Card, { foreignKey: 'batch_id', as: 'cards' });

// Training Job associations
TrainingJob.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Occasion associations
Occasion.belongsTo(TrainingJob, { foreignKey: 'lora_model_id', as: 'loraModel' });

// Style associations
Style.hasMany(Card, { foreignKey: 'style_id', as: 'cards' });
Style.hasMany(Batch, { foreignKey: 'style_id', as: 'batches' });
Style.belongsTo(TrainingJob, { foreignKey: 'lora_model_id', as: 'loraModel' });

// CardComment associations
CardComment.belongsTo(Card, { foreignKey: 'card_id' });
CardComment.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Batch,
  Card,
  Occasion,
  TrainingJob,
  Settings,
  Style,
  CardComment,
};
