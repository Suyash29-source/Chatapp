const { createClient } = require('redis');
const env = require('./env');

const redisClient = createClient({
  url: env.redisUrl,
  socket: {
    tls: true,
    rejectUnauthorized: false,
    reconnectStrategy(retries) {
      return Math.min(retries * 50, 1000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
};

module.exports = { redisClient, connectRedis };
