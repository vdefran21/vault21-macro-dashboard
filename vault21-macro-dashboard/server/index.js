const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const { initSchema, close } = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, url: req.url, status: res.statusCode, ms: Date.now() - start });
  });
  next();
});

// Initialize database schema
initSchema();

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/health', require('./routes/health'));

// Serve static frontend in production
if (config.nodeEnv === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Start server
const server = app.listen(config.port, () => {
  logger.info(`vault21 dashboard server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  server.close(() => {
    close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
