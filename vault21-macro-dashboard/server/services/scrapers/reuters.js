// @ts-check

const { createNewsSourceRefresher } = require('./news');

/**
 * Reuters Google News RSS refresh task.
 */
const refreshReutersNews = createNewsSourceRefresher({
  sourceName: 'Reuters',
  sourceDomain: 'reuters.com',
});

module.exports = { refreshReutersNews };
