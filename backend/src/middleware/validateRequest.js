const { validationResult } = require('express-validator');

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next({
      status: 400,
      message: 'Validation failed',
      details: errors.array()
    });
  }
  return next();
};

module.exports = validateRequest;
