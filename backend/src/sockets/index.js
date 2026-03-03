const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');

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
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub };
      return next();
    } catch (_err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('chat:ping', () => {
      socket.emit('chat:pong', { timestamp: new Date().toISOString() });
    });
  });

  return io;
};

module.exports = initializeSocket;
