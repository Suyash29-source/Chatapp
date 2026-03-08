const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');
const messageService = require('../services/messageService');

const extractToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const header = socket.handshake.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  const queryToken = socket.handshake.query?.token;
  if (typeof queryToken === 'string' && queryToken.length > 0) {
    return queryToken;
  }

  return null;
};

const initializeSocket = (httpServer, corsOrigin) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  io.use((socket, next) => {
  try {
    const token = extractToken(socket);

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const payload = verifyAccessToken(token);

    if (!payload?.sub || payload.type !== 'access') {
      return next(new Error('Unauthorized'));
    }

    socket.user = { id: payload.sub };
    return next();

  } catch (_err) {
    return next(new Error('Unauthorized'));
  }
});

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    await messageService.upsertUserPresence(userId, socket.id);
    await socket.join(userId);

    socket.on('send_message', async (payload = {}, ack) => {
      try {
        const { receiverId, encryptedMessage, iv } = payload;

        if (typeof receiverId !== 'string' || typeof encryptedMessage !== 'string' || encryptedMessage.length === 0) {
          throw new Error('Invalid payload');
        }

        const message = await messageService.createOutgoingMessage({
          senderId: userId,
          receiverId,
          encryptedMessage,
          iv: typeof iv === 'string' ? iv : null
        });

        const receiverSocketId = await messageService.findUserSocket(receiverId);

        if (receiverSocketId) {
          io.to(receiverId).emit('receive_message', message);
          const deliveredMessage = await messageService.markDelivered(message.id);
          io.to(userId).emit('message_status_updated', {
            messageId: message.id,
            status: deliveredMessage.status
          });
          if (typeof ack === 'function') {
            ack({ ok: true, message: deliveredMessage });
          }
          return;
        }

        if (typeof ack === 'function') {
          ack({ ok: true, message });
        }
      } catch (err) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: err.message || 'Failed to send message' });
        }
      }
    });

    socket.on('message_seen', async (payload = {}, ack) => {
      try {
        const { messageId } = payload;
        if (typeof messageId !== 'string') {
          throw new Error('Invalid payload');
        }

        const updatedMessage = await messageService.markSeen({
          messageId,
          receiverId: userId
        });

        io.to(updatedMessage.sender_id).emit('message_seen', {
          messageId: updatedMessage.id,
          seenBy: updatedMessage.receiver_id,
          status: updatedMessage.status
        });

        if (typeof ack === 'function') {
          ack({ ok: true, messageId: updatedMessage.id });
        }
      } catch (err) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: err.message || 'Failed to mark message as seen' });
        }
      }
    });

    socket.on('disconnect', async () => {
      await messageService.removeUserPresence(userId, socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;
