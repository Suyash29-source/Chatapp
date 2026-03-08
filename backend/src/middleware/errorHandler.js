const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error(err);
  }

  const payload = {
    error: {
      message
    }
  };

  if (err.details) {
    payload.error.details = err.details;
  }

  res.status(status).json(payload);
};

module.exports = errorHandler;
