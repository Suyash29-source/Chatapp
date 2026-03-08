const bcrypt = require('bcrypt');
const createError = require('http-errors');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const { redisClient } = require('../config/redis');
const userModel = require('../models/userModel');
const { buildTokenPair, verifyRefreshToken } = require('../utils/tokens');

const buildRefreshKey = (userId, tokenId) => `refresh:${userId}:${tokenId}`;

const register = async (email, password) => {
  const existing = await userModel.findUserByEmail(email);
  if (existing) {
    throw createError(409, 'Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await userModel.createUser({
    id: uuidv4(),
    email,
    passwordHash
  });

  return user;
};

const login = async (email, password) => {
  const user = await userModel.findUserByEmail(email);
  if (!user) {
    throw createError(401, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw createError(401, 'Invalid credentials');
  }

  const tokenPair = buildTokenPair(user.id);
  const key = buildRefreshKey(user.id, tokenPair.tokenId);
  await redisClient.set(key, 'valid', {
    EX: env.refreshTokenTtlSeconds
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      public_key: user.public_key,
      created_at: user.created_at
    },
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken
  };
};

const refreshSession = async (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
    throw createError(401, 'Invalid refresh token');
  }

  const oldKey = buildRefreshKey(payload.sub, payload.jti);
  const existing = await redisClient.get(oldKey);
  if (!existing) {
    throw createError(401, 'Refresh token expired or revoked');
  }

  await redisClient.del(oldKey);

  const tokenPair = buildTokenPair(payload.sub);
  const newKey = buildRefreshKey(payload.sub, tokenPair.tokenId);
  await redisClient.set(newKey, 'valid', {
    EX: env.refreshTokenTtlSeconds
  });

  return {
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken
  };
};

module.exports = {
  register,
  login,
  refreshSession
};
