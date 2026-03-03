const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn
  });

const signRefreshToken = (userId, tokenId) =>
  jwt.sign({ sub: userId, jti: tokenId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });

const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);

const buildTokenPair = (userId) => {
  const tokenId = uuidv4();
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId, tokenId),
    tokenId
  };
};

module.exports = {
  buildTokenPair,
  verifyAccessToken,
  verifyRefreshToken
};
