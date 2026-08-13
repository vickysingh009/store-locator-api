const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Validate required environment variables
if (!config.mongodbUri) {
  console.error('Error: MONGODB_URI environment variable is required');
  process.exit(1);
}

module.exports = config;
