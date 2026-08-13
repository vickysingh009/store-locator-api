const express = require('express');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Store Locator API is running'
  });
});

module.exports = app;
