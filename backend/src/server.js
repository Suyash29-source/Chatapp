const http = require('http');
const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const initializeSocket = require('./sockets');

const startServer = async () => {
  await pool.query('SELECT 1');
  await connectRedis();

  const server = http.createServer(app);
  initializeSocket(server, env.corsOrigin);

  server.listen(env.port, () => {
    console.log(`Backend listening on port ${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await pool.end();
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
