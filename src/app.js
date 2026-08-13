const express = require('express');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Store Locator API is running'
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
