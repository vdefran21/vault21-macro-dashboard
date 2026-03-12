// @ts-check

const { createNewsSourceRefresher } = require('./news');

/**
 * Bloomberg Google News RSS refresh task.
 */
const refreshBloombergNews = createNewsSourceRefresher({
  sourceName: 'Bloomberg',
  sourceDomain: 'bloomberg.com',
});

module.exports = { refreshBloombergNews };
