const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const createError = require('http-errors');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { standardRateLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(standardRateLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

app.use((_req, _res, next) => {
  next(createError(404, 'Route not found'));
});

app.use(errorHandler);

module.exports = app;
