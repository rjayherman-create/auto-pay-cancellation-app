const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cardhugs',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const testConnection = async (maxRetries = 30, retryDelay = 1000) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL connection established successfully');
      return true;
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        console.error('❌ Failed to connect to PostgreSQL after', maxRetries, 'attempts');
        console.error('Error:', error.message);
        throw error;
      }
      console.log(`⏳ Connection attempt ${attempts}/${maxRetries} failed. Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

module.exports = { sequelize, testConnection };
