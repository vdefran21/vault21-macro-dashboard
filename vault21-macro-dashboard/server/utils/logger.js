const pino = require('pino');
const config = require('../config');

const logger = pino({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  transport: config.nodeEnv === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    : undefined,
});

module.exports = logger;
