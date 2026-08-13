const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const startServer = async () => {
  try {
    // Connect to MongoDB before starting the server
    await connectDB(config.mongodbUri);

    const server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed');

        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('MongoDB connection closed');

        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
