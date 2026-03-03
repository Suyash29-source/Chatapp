const createError = require('http-errors');
const { verifyAccessToken } = require('../utils/tokens');

const authMiddleware = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(createError(401, 'Authorization token missing'));
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access' || !payload.sub) {
      return next(createError(401, 'Invalid token'));
    }
    req.user = { id: payload.sub };
    return next();
  } catch (_err) {
    return next(createError(401, 'Invalid or expired token'));
  }
};

module.exports = authMiddleware;
