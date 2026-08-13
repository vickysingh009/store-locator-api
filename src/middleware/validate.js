const AppError = require('../utils/app-error');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    const error = new AppError('Validation failed', 400);
    error.zodErrors = result.error.issues;
    return next(error);
  }

  req.validated = result.data;
  next();
};

module.exports = validate;
