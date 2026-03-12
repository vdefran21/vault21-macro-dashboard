// @ts-check

const { createNewsSourceRefresher } = require('./news');

/**
 * CNBC Google News RSS refresh task.
 */
const refreshCnbcNews = createNewsSourceRefresher({
  sourceName: 'CNBC',
  sourceDomain: 'cnbc.com',
});

module.exports = { refreshCnbcNews };
