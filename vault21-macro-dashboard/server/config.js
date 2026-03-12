const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: path.resolve(__dirname, '..', process.env.DB_PATH || './data/vault21.db'),
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '2000', 10),
  },
  fred: {
    apiKey: process.env.FRED_API_KEY,
  },
  sec: {
    userAgent: process.env.SEC_USER_AGENT || 'vault21-dashboard',
  },
  refresh: {
    timeoutMs: parseInt(process.env.REFRESH_TIMEOUT_MS || '120000', 10),
    maxScrapeConcurrent: parseInt(process.env.MAX_SCRAPE_CONCURRENT || '3', 10),
  },
  rateLimits: {
    yahooPerMin: parseInt(process.env.YAHOO_REQUESTS_PER_MIN || '30', 10),
    newsPerMin: parseInt(process.env.NEWS_REQUESTS_PER_MIN || '10', 10),
    secPerSec: parseInt(process.env.SEC_REQUESTS_PER_SEC || '10', 10),
  },
};
