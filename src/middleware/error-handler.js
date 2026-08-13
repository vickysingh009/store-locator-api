const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  // Zod validation errors (attached by validate middleware)
  if (err.zodErrors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.zodErrors.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose cast errors (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern).join(', ');
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${field}`
    });
  }

  // Operational errors (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', err.message);
  const message = config.nodeEnv === 'production' ? 'Internal server error' : err.message;
  res.status(500).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
