const createError = require('http-errors');
const { validate: isUuid, v4: uuidv4 } = require('uuid');
const { redisClient } = require('../config/redis');
const messageModel = require('../models/messageModel');
const userModel = require('../models/userModel');

const PRESENCE_KEY_PREFIX = 'presence:user:';

const getPresenceKey = (userId) => `${PRESENCE_KEY_PREFIX}${userId}`;


// ---------------- USER PRESENCE ----------------

const upsertUserPresence = async (userId, socketId) => {
  await redisClient.set(getPresenceKey(userId), socketId);
};

const removeUserPresence = async (userId, socketId) => {
  const key = getPresenceKey(userId);
  const activeSocketId = await redisClient.get(key);

  if (activeSocketId === socketId) {
    await redisClient.del(key);
  }
};

const findUserSocket = async (userId) => {
  return redisClient.get(getPresenceKey(userId));
};


// ---------------- MESSAGES ----------------

const createOutgoingMessage = async ({
  senderId,
  receiverId,
  encryptedMessage,
  iv
}) => {

  if (senderId === receiverId) {
    throw createError(400, 'Cannot send message to self');
  }

  if (!isUuid(receiverId)) {
    throw createError(400, 'receiverId must be a valid UUID');
  }

  const receiver = await userModel.findUserById(receiverId);

  if (!receiver) {
    throw createError(404, 'Receiver not found');
  }

  return messageModel.createMessage({
    id: uuidv4(),
    senderId,
    receiverId,
    encryptedMessage,
    iv,
    status: 'sent'
  });
};


const markDelivered = async (messageId) => {
  return messageModel.updateMessageStatus({
    messageId,
    status: 'delivered'
  });
};


const markSeen = async ({ messageId, receiverId }) => {

  const updated = await messageModel.updateMessageStatusForReceiver({
    messageId,
    receiverId,
    status: 'seen'
  });

  if (!updated) {
    throw createError(404, 'Message not found for current user');
  }

  return updated;
};


// ---------------- CURSOR PAGINATION ----------------

const parseCursor = (cursor) => {

  if (!cursor) {
    return { cursorCreatedAt: null, cursorId: null };
  }

  const [createdAt, id] = cursor.split('|');

  if (!createdAt || !id || !isUuid(id)) {
    throw createError(400, 'Invalid cursor format');
  }

  if (Number.isNaN(Date.parse(createdAt))) {
    throw createError(400, 'Invalid cursor date');
  }

  return {
    cursorCreatedAt: createdAt,
    cursorId: id
  };
};


// ---------------- CONVERSATION ----------------

const getConversation = async ({
  userId,
  peerUserId,
  limit,
  cursor
}) => {

  if (!isUuid(peerUserId)) {
    throw createError(400, 'peerUserId must be a valid UUID');
  }

  if (userId === peerUserId) {
    throw createError(400, 'Conversation with self is not supported');
  }

  const peer = await userModel.findUserById(peerUserId);

  if (!peer) {
    throw createError(404, 'Conversation user not found');
  }

  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const { cursorCreatedAt, cursorId } = parseCursor(cursor);

  return messageModel.listConversation({
    userId,
    peerUserId,
    limit: normalizedLimit,
    cursorCreatedAt,
    cursorId
  });
};


module.exports = {
  upsertUserPresence,
  removeUserPresence,
  findUserSocket,
  createOutgoingMessage,
  markDelivered,
  markSeen,
  getConversation
};    return { cursorCreatedAt: null, cursorId: null };
  }

  const [createdAt, id] = cursor.split('|');
  if (!createdAt || !id || !isUuid(id)) {
    throw createError(400, 'Invalid cursor format');
  }

  if (Number.isNaN(Date.parse(createdAt))) {
  if (!createdAt || !id) {
    throw createError(400, 'Invalid cursor format');
  }

  return { cursorCreatedAt: createdAt, cursorId: id };
};

const getConversation = async ({ userId, peerUserId, limit, cursor }) => {
  if (!isUuid(peerUserId)) {
    throw createError(400, 'userId must be a valid UUID');
  }

  if (userId === peerUserId) {
    throw createError(400, 'Conversation with self is not supported');
  }

  const peer = await userModel.findUserById(peerUserId);
  if (!peer) {
    throw createError(404, 'Conversation user not found');
  }

  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const { cursorCreatedAt, cursorId } = parseCursor(cursor);

  return messageModel.listConversation({
    userId,
    peerUserId,
    limit: normalizedLimit,
    cursorCreatedAt,
    cursorId
  });
};

module.exports = {
  upsertUserPresence,
  removeUserPresence,
  findUserSocket,
  createOutgoingMessage,
  markDelivered,
  markSeen,
  getConversation
};
