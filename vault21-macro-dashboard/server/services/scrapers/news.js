// @ts-check

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const config = require('../../config');
const logger = require('../../utils/logger');
const { createRateLimiter } = require('../../utils/rateLimiter');
const { extractArticleData } = require('../enrichment/claudeExtractor');
const { insertExtractedEvents, upsertExtractedMetrics, upsertExtractedFunds } = require('../ingestion/store');

/** @typedef {import('../../../shared/contracts.js').NewsArticle} NewsArticle */
/** @typedef {import('../../../shared/contracts.js').RefreshSourceResult} RefreshSourceResult */

/**
 * @typedef {{
 *   sourceName: string,
 *   sourceDomain: string,
 * }} NewsSourceConfig
 */

const NEWS_SEARCH_TERMS = [
  '"private credit"',
  '"BDC redemptions"',
  '"private credit gating"',
  '"private credit defaults"',
];

const MAX_ARTICLES_PER_SOURCE = 2;

const newsLimiter = createRateLimiter({
  requests: config.rateLimits.newsPerMin,
  perMs: 60_000,
});

/**
 * Build the Google News RSS URL for a specific publisher domain.
 *
 * @param {NewsSourceConfig} sourceConfig - Source definition
 * @returns {string} Google News RSS search URL
 */
function buildGoogleNewsRssUrl(sourceConfig) {
  const query = `site:${sourceConfig.sourceDomain} (${NEWS_SEARCH_TERMS.join(' OR ')})`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

/**
 * Turn the HTML fragment in a Google News RSS description into readable text.
 *
 * @param {string} descriptionHtml - RSS description field
 * @returns {string} Plain-text summary
 */
function extractSnippet(descriptionHtml) {
  if (!descriptionHtml) {
    return '';
  }

  const $ = cheerio.load(descriptionHtml);
  return $('body').text().replace(/\s+/g, ' ').trim();
}

/**
 * Parse Google News RSS items into article descriptors.
 *
 * When canonical publisher URLs are not exposed, we still preserve the RSS item
 * metadata so the extraction layer can work from headlines and snippets.
 *
 * @param {string} rssXml - Raw RSS XML
 * @param {NewsSourceConfig} sourceConfig - Source definition
 * @returns {NewsArticle[]} Parsed article candidates
 */
function parseRssFeed(rssXml, sourceConfig) {
  const $ = cheerio.load(rssXml, { xmlMode: true });

  return $('item')
    .toArray()
    .slice(0, MAX_ARTICLES_PER_SOURCE)
    .map((node) => {
      const item = $(node);
      const title = item.find('title').first().text().replace(/\s+-\s+[^-]+$/, '').trim();
      const url = item.find('link').first().text().trim();
      const publishedAt = item.find('pubDate').first().text().trim() || null;
      const snippet = extractSnippet(item.find('description').first().text());

      return {
        title,
        url,
        sourceName: sourceConfig.sourceName,
        sourceDomain: sourceConfig.sourceDomain,
        publishedAt,
        snippet,
        text: [title, snippet].filter(Boolean).join('\n\n'),
      };
    })
    .filter((article) => article.title && article.url);
}

/**
 * Pull and parse the Google News RSS feed for one source.
 *
 * @param {NewsSourceConfig} sourceConfig - Source definition
 * @returns {Promise<NewsArticle[]>} Parsed articles
 */
async function fetchSourceArticles(sourceConfig) {
  const url = buildGoogleNewsRssUrl(sourceConfig);

  return newsLimiter(async () => {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vault21-dashboard/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Google News RSS request failed: ${response.status} ${response.statusText}`);
    }

    return parseRssFeed(await response.text(), sourceConfig);
  });
}

/**
 * Create a news-source refresher that fetches RSS headlines and runs Claude
 * extraction on the resulting snippets.
 *
 * @param {NewsSourceConfig} sourceConfig - Source definition
 * @returns {() => Promise<RefreshSourceResult>} Source refresh function
 */
function createNewsSourceRefresher(sourceConfig) {
  return async function refreshNewsSource() {
    const articles = await fetchSourceArticles(sourceConfig);

    if (!articles.length) {
      return {
        source: sourceConfig.sourceName.toLowerCase(),
        status: 'success',
        recordsWritten: 0,
        eventsAdded: 0,
        errors: [],
      };
    }

    if (!config.anthropic.apiKey) {
      return {
        source: sourceConfig.sourceName.toLowerCase(),
        status: 'skipped',
        recordsWritten: 0,
        eventsAdded: 0,
        errors: [{ message: 'ANTHROPIC_API_KEY is not configured' }],
      };
    }

    const settled = await Promise.allSettled(articles.map(async (article) => {
      const extracted = await extractArticleData(article);

      if (!extracted) {
        throw new Error('Claude extraction was skipped because the API key is unavailable');
      }

      const events = insertExtractedEvents(extracted.events, {
        sourceName: article.sourceName,
        sourceUrl: article.url,
        publishedAt: article.publishedAt,
        articleTitle: article.title,
      });
      const metricsWritten = upsertExtractedMetrics(
        extracted.metrics,
        `${article.sourceName} via Claude`,
        article.publishedAt ? article.publishedAt.slice(0, 10) : undefined,
      );
      const fundsWritten = upsertExtractedFunds(extracted.fund_data);

      return {
        insertedEvents: events.insertedCount,
        metricsWritten,
        fundsWritten,
      };
    }));

    let eventsAdded = 0;
    let recordsWritten = 0;
    /** @type {RefreshSourceResult['errors']} */
    const errors = [];

    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        eventsAdded += result.value.insertedEvents;
        recordsWritten += result.value.insertedEvents + result.value.metricsWritten + result.value.fundsWritten;
        return;
      }

      const article = articles[index];
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push({
        message,
        articleTitle: article?.title,
        url: article?.url,
      });
      logger.warn({ source: sourceConfig.sourceName, title: article?.title, err: message }, 'News article extraction failed');
    });

    return {
      source: sourceConfig.sourceName.toLowerCase(),
      status: errors.length ? (recordsWritten || eventsAdded ? 'partial' : 'failed') : 'success',
      recordsWritten,
      eventsAdded,
      errors,
    };
  };
}

module.exports = {
  NEWS_SEARCH_TERMS,
  buildGoogleNewsRssUrl,
  createNewsSourceRefresher,
};
