const fetch = require('node-fetch');
const config = require('../../config');
const { getDb } = require('../../db');
const logger = require('../../utils/logger');
const { toIsoDate } = require('../../utils/dateUtils');

/** @typedef {import('../../../shared/contracts.js').RefreshSourceResult} RefreshSourceResult */

/**
 * FRED series tracked by the refresh pipeline.
 */
const FRED_SERIES = Object.freeze([
  { seriesId: 'VIXCLS', metricName: 'vix', unit: 'index' },
  { seriesId: 'DGS10', metricName: '10yr_yield', unit: 'percent' },
  { seriesId: 'BAMLH0A0HYM2', metricName: 'hy_spread', unit: 'percent' },
  {
    seriesId: 'TOTRESNS',
    metricName: 'bank_reserves',
    unit: 'billions_usd',
    transform: (value) => Number((value / 1000).toFixed(2)),
  },
]);

/**
 * Build a FRED API URL for the requested series.
 *
 * @param {string} seriesId - FRED series identifier
 * @returns {string} Fully qualified API URL
 */
function buildFredUrl(seriesId) {
  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', config.fred.apiKey);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', '30');
  return url.toString();
}

/**
 * Pick the latest numeric observation from a FRED response payload.
 *
 * @param {Object} payload - FRED observations response
 * @param {string} seriesId - Series identifier for error messages
 * @returns {{ date: string, value: number }} Latest usable observation
 * @throws {Error} When the payload does not contain a numeric observation
 */
function extractLatestObservation(payload, seriesId) {
  const observation = (payload?.observations || []).find((candidate) => Number.isFinite(Number(candidate.value)));

  if (!observation) {
    throw new Error(`FRED returned no numeric observations for ${seriesId}`);
  }

  return {
    date: toIsoDate(observation.date),
    value: Number(observation.value),
  };
}

/**
 * Persist the latest macro metric values from FRED.
 *
 * Metrics are keyed by metric/date in application code because the current
 * schema intentionally keeps the table append-friendly for historical data.
 *
 * @param {Array<{ date: string, metricName: string, value: number, unit: string }>} rows - Latest metrics to write
 * @returns {number} Number of metric rows written
 */
function persistMetrics(rows) {
  if (!rows.length) {
    return 0;
  }

  const db = getDb();
  const deleteStatement = db.prepare('DELETE FROM metrics WHERE metric_name = ? AND date = ?');
  const insertStatement = db.prepare(`
    INSERT INTO metrics (date, metric_name, metric_value, unit, source)
    VALUES (?, ?, ?, ?, 'fred')
  `);

  const writeRows = db.transaction((batch) => {
    for (const row of batch) {
      deleteStatement.run(row.metricName, row.date);
      insertStatement.run(row.date, row.metricName, row.value, row.unit);
    }
  });

  writeRows(rows);
  return rows.length;
}

/**
 * Refresh the dashboard's macro indicators from FRED.
 *
 * Missing API configuration is treated as a skipped source so the rest of the
 * refresh pipeline can continue with other live inputs.
 *
 * @returns {Promise<RefreshSourceResult>}
 */
async function refreshFredMetrics() {
  if (!config.fred.apiKey) {
    return /** @type {RefreshSourceResult} */ ({
      source: 'fred',
      status: 'skipped',
      recordsWritten: 0,
      errors: [{ message: 'FRED_API_KEY is not configured' }],
    });
  }

  const settled = await Promise.allSettled(FRED_SERIES.map(async (series) => {
    const response = await fetch(buildFredUrl(series.seriesId), {
      headers: {
        'User-Agent': 'vault21-dashboard/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FRED request failed for ${series.seriesId}: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const observation = extractLatestObservation(payload, series.seriesId);
    const transformedValue = typeof series.transform === 'function'
      ? series.transform(observation.value)
      : observation.value;

    return {
      date: observation.date,
      metricName: series.metricName,
      value: transformedValue,
      unit: series.unit,
    };
  }));

  const rows = [];
  const errors = [];

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      rows.push(result.value);
      return;
    }

    const series = FRED_SERIES[index];
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    errors.push({ seriesId: series.seriesId, message });
    logger.warn({ seriesId: series.seriesId, err: message }, 'FRED series refresh failed');
  });

  const recordsWritten = persistMetrics(rows);
  const status = errors.length ? (rows.length ? 'partial' : 'failed') : 'success';

  return /** @type {RefreshSourceResult} */ ({
    source: 'fred',
    status,
    recordsWritten,
    errors,
  });
}

module.exports = { refreshFredMetrics, FRED_SERIES };
