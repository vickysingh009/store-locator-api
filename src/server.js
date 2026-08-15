const mongoose = require('mongoose');
const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const startServer = async () => {
  try {
    await connectDB(config.mongodbUri);

    const server = app.listen(config.port, () => {
      console.log(`Server started on port ${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}, shutting down...`);

      server.close(async () => {
        console.log('Server stopped.');

        await mongoose.connection.close();
        console.log('Disconnected from database.');

        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
};

startServer();
