const fetch = require('node-fetch');
const config = require('../../config');
const { getDb } = require('../../db');
const logger = require('../../utils/logger');
const { getStartOfUtcYear, toIsoDate } = require('../../utils/dateUtils');
const { createRateLimiter } = require('../../utils/rateLimiter');

/** @typedef {import('../../../shared/contracts.js').RefreshSourceResult} RefreshSourceResult */

/**
 * Yahoo Finance instruments tracked in the Phase 3 pipeline.
 */
const YAHOO_TICKERS = Object.freeze(['OWL', 'BX', 'KKR', 'ARES', 'BLK', 'APO', 'GLD', 'SPY', 'BTC-USD']);

const yahooLimiter = createRateLimiter({
  requests: config.rateLimits.yahooPerMin,
  perMs: 60_000,
});

/**
 * Calculate percentage change from a base value.
 *
 * @param {number} current - Ending value
 * @param {number} base - Starting value
 * @returns {number|null} Percentage change rounded to two decimals
 */
function pctChange(current, base) {
  if (!Number.isFinite(current) || !Number.isFinite(base) || base === 0) {
    return null;
  }

  return Number((((current - base) / base) * 100).toFixed(2));
}

/**
 * Normalize Yahoo chart data into a usable daily close series.
 *
 * @param {Object} payload - Yahoo Finance chart response payload
 * @param {string} ticker - Instrument symbol for error messages
 * @returns {Array<{ date: string, close: number }>} Ordered series of close prices
 * @throws {Error} When Yahoo returns malformed or empty data
 */
function parseHistory(payload, ticker) {
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];

  const series = timestamps
    .map((timestamp, index) => {
      const close = closes[index];

      if (!Number.isFinite(close)) {
        return null;
      }

      return {
        date: toIsoDate(timestamp * 1000),
        close,
      };
    })
    .filter(Boolean);

  if (!series.length) {
    throw new Error(`Yahoo returned no close history for ${ticker}`);
  }

  return series;
}

/**
 * Convert a daily close series into the dashboard snapshot shape.
 *
 * @param {string} ticker - Instrument symbol
 * @param {Array<{ date: string, close: number }>} series - Ordered close history
 * @returns {{ ticker: string, date: string, closePrice: number, changePct: number|null, ytdPct: number|null, fromHighPct: number|null, source: string }}
 */
function summarizeHistory(ticker, series) {
  const latest = series[series.length - 1];
  const previous = series.length > 1 ? series[series.length - 2] : null;
  const yearStart = getStartOfUtcYear(latest.date);
  const ytdBase = series.find((point) => new Date(point.date) >= yearStart) || series[0];
  const peak = series.reduce((currentPeak, point) => (point.close > currentPeak.close ? point : currentPeak), series[0]);

  return {
    ticker,
    date: latest.date,
    closePrice: Number(latest.close.toFixed(2)),
    changePct: pctChange(latest.close, previous?.close),
    ytdPct: pctChange(latest.close, ytdBase?.close),
    fromHighPct: pctChange(latest.close, peak?.close),
    source: 'yahoo_finance',
  };
}

/**
 * Fetch 1-year daily pricing history for a Yahoo Finance symbol.
 *
 * @param {string} ticker - Instrument symbol
 * @returns {Promise<Array<{ date: string, close: number }>>} Daily close history
 * @throws {Error} When Yahoo responds with an error or invalid payload
 */
async function fetchTickerHistory(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false&events=div%7Csplit`;

  return yahooLimiter(async () => {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vault21-dashboard/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo request failed for ${ticker}: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const remoteError = payload?.chart?.error?.description;

    if (remoteError) {
      throw new Error(`Yahoo returned an error for ${ticker}: ${remoteError}`);
    }

    return parseHistory(payload, ticker);
  });
}

/**
 * Persist the latest Yahoo Finance snapshot for each instrument.
 *
 * @param {Array<{ ticker: string, date: string, closePrice: number, changePct: number|null, ytdPct: number|null, fromHighPct: number|null, source: string }>} rows - Summaries to upsert
 * @returns {number} Number of records written
 */
function persistSnapshots(rows) {
  if (!rows.length) {
    return 0;
  }

  const db = getDb();
  const statement = db.prepare(`
    INSERT INTO equity_prices (ticker, date, close_price, change_pct, ytd_pct, from_high_pct, source)
    VALUES (@ticker, @date, @closePrice, @changePct, @ytdPct, @fromHighPct, @source)
    ON CONFLICT(ticker, date) DO UPDATE SET
      close_price = excluded.close_price,
      change_pct = excluded.change_pct,
      ytd_pct = excluded.ytd_pct,
      from_high_pct = excluded.from_high_pct,
      source = excluded.source
  `);

  const insertMany = db.transaction((batch) => {
    for (const row of batch) {
      statement.run(row);
    }
  });

  insertMany(rows);
  return rows.length;
}

/**
 * Pull current Yahoo Finance snapshots for the tracked instrument set.
 *
 * @returns {Promise<RefreshSourceResult>}
 */
async function refreshYahooPrices() {
  const settled = await Promise.allSettled(YAHOO_TICKERS.map(async (ticker) => summarizeHistory(ticker, await fetchTickerHistory(ticker))));

  const rows = [];
  const errors = [];

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      rows.push(result.value);
      return;
    }

    const ticker = YAHOO_TICKERS[index];
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    errors.push({ ticker, message });
    logger.warn({ ticker, err: message }, 'Yahoo Finance ticker refresh failed');
  });

  const recordsWritten = persistSnapshots(rows);
  const status = errors.length ? (rows.length ? 'partial' : 'failed') : 'success';

  return /** @type {RefreshSourceResult} */ ({
    source: 'yahoo_finance',
    status,
    recordsWritten,
    errors,
  });
}

module.exports = { refreshYahooPrices, YAHOO_TICKERS };
