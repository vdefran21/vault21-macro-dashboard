// @ts-check

const fetch = require('node-fetch');
const config = require('../../config');
const logger = require('../../utils/logger');
const { createRateLimiter } = require('../../utils/rateLimiter');
const { toIsoDate } = require('../../utils/dateUtils');
const { insertExtractedEvents } = require('../ingestion/store');

/** @typedef {import('../../../shared/contracts.js').ExtractedEvent} ExtractedEvent */
/** @typedef {import('../../../shared/contracts.js').RefreshSourceResult} RefreshSourceResult */

const secLimiter = createRateLimiter({
  requests: config.rateLimits.secPerSec,
  perMs: 1_000,
});

/**
 * Build the SEC full-text search URL used for redemption-related BDC filings.
 *
 * @returns {string} Fully qualified SEC search URL
 */
function buildSecSearchUrl() {
  const url = new URL('https://efts.sec.gov/LATEST/search-index');
  url.searchParams.set('q', '"private credit" AND "redemption"');
  url.searchParams.set('dateRange', 'custom');
  url.searchParams.set('startdt', config.refresh.minEventDate);
  url.searchParams.set('forms', '8-K');
  url.searchParams.set('from', '0');
  url.searchParams.set('size', '10');
  url.searchParams.set('sort', 'recent');
  return url.toString();
}

/**
 * Turn SEC search hits into coarse event candidates for manual review.
 *
 * @param {any} payload - Raw SEC search payload
 * @returns {Array<{ filingId: string, sourceUrl: string, event: ExtractedEvent }>} Event candidates
 */
function parseSecHits(payload) {
  const hits = Array.isArray(payload?.hits?.hits) ? payload.hits.hits : [];

  return hits
    .map((hit) => {
      const source = hit?._source || {};
      const displayName = source.display_names?.[0] || source.file_description || 'Private credit filer';
      const fileDate = toIsoDate(source.file_date || source.period_ending || new Date().toISOString().slice(0, 10));
      const filingId = hit?._id || source.adsh || 'unknown-filing';
      const sourceUrl = `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(filingId)}`;

      return {
        filingId,
        sourceUrl,
        event: {
          date: fileDate,
          description: `${displayName} files ${source.form || '8-K'} tied to private credit redemption activity`.slice(0, 100),
          severity: 3,
          category: 'regulatory',
          entities: [displayName],
          dollar_amounts: [],
          percentages: [],
        },
      };
    })
    .filter((hit) => hit.event.date >= config.refresh.minEventDate);
}

/**
 * Refresh SEC filing events for redemption-related private credit disclosures.
 *
 * @returns {Promise<RefreshSourceResult>} Source refresh summary
 */
async function refreshSecFilings() {
  const url = buildSecSearchUrl();

  return secLimiter(async () => {
    const response = await fetch(url, {
      headers: {
        'User-Agent': config.sec.userAgent,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SEC search request failed: ${response.status} ${response.statusText}`);
    }

    const hits = parseSecHits(await response.json());

    logger.info({ source: 'sec', candidates: hits.length, minEventDate: config.refresh.minEventDate }, 'SEC filing candidates after date filter');

    if (!hits.length) {
      return {
        source: 'sec',
        status: 'success',
        recordsWritten: 0,
        eventsAdded: 0,
        errors: [],
      };
    }

    let eventsAdded = 0;

    for (const hit of hits) {
      const inserted = insertExtractedEvents([hit.event], {
        sourceName: 'SEC EDGAR',
        sourceUrl: hit.sourceUrl,
        publishedAt: hit.event.date,
        articleTitle: hit.event.description,
      });

      eventsAdded += inserted.insertedCount;
    }

    logger.info({ source: 'sec', eventsAdded, minEventDate: config.refresh.minEventDate }, 'SEC refresh finished');

    return {
      source: 'sec',
      status: 'success',
      recordsWritten: eventsAdded,
      eventsAdded,
      errors: [],
    };
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn({ err: message }, 'SEC refresh failed');

    return {
      source: 'sec',
      status: 'failed',
      recordsWritten: 0,
      eventsAdded: 0,
      errors: [{ message }],
    };
  });
}

module.exports = { refreshSecFilings };
