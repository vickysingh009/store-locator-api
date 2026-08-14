const express = require('express');
const cors = require('cors');
const storeRoutes = require('./routes/store.routes');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Store Locator API is running'
  });
});

app.use('/api/stores', storeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
