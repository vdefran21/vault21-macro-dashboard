// @ts-check

const { getDb } = require('../../db');
const config = require('../../config');
const logger = require('../../utils/logger');
const { toIsoDate } = require('../../utils/dateUtils');

/** @typedef {import('../../../shared/contracts.js').EventCategory} EventCategory */
/** @typedef {import('../../../shared/contracts.js').ExtractedEvent} ExtractedEvent */
/** @typedef {import('../../../shared/contracts.js').ExtractedFundData} ExtractedFundData */
/** @typedef {import('../../../shared/contracts.js').ExtractedMetric} ExtractedMetric */

/**
 * @typedef {{
 *   sourceName: string,
 *   sourceUrl?: string,
 *   publishedAt?: string|null,
 *   articleTitle?: string,
 * }} IngestionContext
 */

const VALID_CATEGORIES = new Set([
  'redemption',
  'gating',
  'bankruptcy',
  'regulatory',
  'bank_action',
  'market_move',
  'analyst_warning',
  'policy',
  'general',
]);

/**
 * Normalize free-form text for fuzzy duplicate matching.
 *
 * @param {string} value - Free-form event text
 * @returns {string} Lower-cased normalized text
 */
function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Compare token overlap between two normalized strings.
 *
 * @param {string} left - Normalized string A
 * @param {string} right - Normalized string B
 * @returns {number} Ratio in the 0-1 range
 */
function tokenOverlap(left, right) {
  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  let shared = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.max(leftTokens.size, rightTokens.size);
}

/**
 * Determine whether two ISO dates are within a small matching window.
 *
 * @param {string} left - ISO calendar date
 * @param {string} right - ISO calendar date
 * @param {number} [maxDays=5] - Allowed distance in days
 * @returns {boolean} True when the dates are near each other
 */
function areDatesNear(left, right, maxDays = 5) {
  const delta = Math.abs(new Date(left).getTime() - new Date(right).getTime());
  return delta <= maxDays * 24 * 60 * 60 * 1000;
}

/**
 * Clamp severity to the dashboard's fixed 1-6 scale.
 *
 * @param {number} value - Candidate severity
 * @returns {number} Valid severity
 */
function clampSeverity(value) {
  return Math.min(6, Math.max(1, Math.round(Number(value) || 1)));
}

/**
 * Normalize a scraped category to the supported event taxonomy.
 *
 * @param {string} value - Candidate category
 * @returns {EventCategory} Supported category
 */
function normalizeCategory(value) {
  return /** @type {EventCategory} */ (VALID_CATEGORIES.has(value) ? value : 'general');
}

/**
 * Check whether a candidate event date is within the monitored timeline window.
 *
 * @param {string} isoDate - Candidate ISO date
 * @returns {boolean} True when the event date is on or after the configured minimum
 */
function isWithinTrackedWindow(isoDate) {
  return isoDate >= config.refresh.minEventDate;
}

/**
 * Build a concise event notes string from extracted context.
 *
 * @param {ExtractedEvent} event - Structured extracted event
 * @param {IngestionContext} context - Source metadata
 * @returns {string|null} Concise notes field or null when no extra context exists
 */
function buildEventNotes(event, context) {
  const parts = [];

  if (context.articleTitle) {
    parts.push(`Article: ${context.articleTitle}`);
  }

  if (event.entities?.length) {
    parts.push(`Entities: ${event.entities.join(', ')}`);
  }

  if (event.dollar_amounts?.length) {
    const amounts = event.dollar_amounts
      .map((entry) => `${entry.label}: ${entry.value} ${entry.unit}`)
      .join('; ');
    parts.push(`Amounts: ${amounts}`);
  }

  if (event.percentages?.length) {
    const percentages = event.percentages
      .map((entry) => `${entry.label}: ${entry.value}%`)
      .join('; ');
    parts.push(`Percentages: ${percentages}`);
  }

  return parts.length ? parts.join(' | ') : null;
}

/**
 * Check whether a new event is likely already present in the timeline.
 *
 * @param {{ date: string, event: string }} candidate - Event candidate
 * @param {Array<{ date: string, event: string }>} existingEvents - Recent stored events
 * @returns {boolean} True when the candidate is probably a duplicate
 */
function isDuplicateEvent(candidate, existingEvents) {
  const normalizedCandidate = normalizeText(candidate.event);

  return existingEvents.some((existing) => {
    if (!areDatesNear(candidate.date, existing.date)) {
      return false;
    }

    const normalizedExisting = normalizeText(existing.event);

    return normalizedCandidate === normalizedExisting
      || normalizedCandidate.includes(normalizedExisting)
      || normalizedExisting.includes(normalizedCandidate)
      || tokenOverlap(normalizedCandidate, normalizedExisting) >= 0.75;
  });
}

/**
 * Insert extracted events as auto-generated timeline rows with fuzzy dedupe.
 *
 * @param {ExtractedEvent[]} events - Structured extracted events
 * @param {IngestionContext} context - Source metadata
 * @returns {{ insertedCount: number, duplicateCount: number, skippedOldCount: number }} Insert summary
 */
function insertExtractedEvents(events, context) {
  if (!events.length) {
    return { insertedCount: 0, duplicateCount: 0, skippedOldCount: 0 };
  }

  const db = getDb();
  const recentEvents = /** @type {Array<{ date: string, event: string }>} */ (
    db.prepare('SELECT date, event FROM events ORDER BY date DESC LIMIT 250').all()
  );

  const insertStatement = db.prepare(`
    INSERT INTO events (date, event, severity, category, source, source_name, verified, auto_generated, notes)
    VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)
  `);

  let insertedCount = 0;
  let duplicateCount = 0;
  let skippedOldCount = 0;

  const writeBatch = db.transaction((batch) => {
    for (const event of batch) {
      if (!event.description) {
        continue;
      }

      const eventDate = toIsoDate(event.date || context.publishedAt || new Date());

      if (!isWithinTrackedWindow(eventDate)) {
        skippedOldCount += 1;
        continue;
      }

      const description = event.description.slice(0, 100);
      const candidate = { date: eventDate, event: description };

      if (isDuplicateEvent(candidate, recentEvents)) {
        duplicateCount += 1;
        continue;
      }

      insertStatement.run(
        eventDate,
        description,
        clampSeverity(event.severity),
        normalizeCategory(event.category),
        context.sourceUrl || null,
        context.sourceName,
        buildEventNotes(event, context),
      );

      recentEvents.push(candidate);
      insertedCount += 1;
    }
  });

  writeBatch(events);

  if (skippedOldCount > 0) {
    logger.info(
      {
        sourceName: context.sourceName,
        articleTitle: context.articleTitle,
        skippedOldCount,
        minEventDate: config.refresh.minEventDate,
      },
      'Skipped extracted events older than the configured monitoring window',
    );
  }

  return { insertedCount, duplicateCount, skippedOldCount };
}

/**
 * Upsert extracted metric observations into the shared metrics table.
 *
 * @param {ExtractedMetric[]} metrics - Structured extracted metrics
 * @param {string} sourceName - Human-readable source label
 * @param {string} [asOfDate=toIsoDate(new Date())] - Observation date
 * @returns {number} Number of metric rows written
 */
function upsertExtractedMetrics(metrics, sourceName, asOfDate = toIsoDate(new Date())) {
  if (!metrics.length) {
    return 0;
  }

  const db = getDb();
  const deleteStatement = db.prepare('DELETE FROM metrics WHERE metric_name = ? AND date = ?');
  const insertStatement = db.prepare(`
    INSERT INTO metrics (date, metric_name, metric_value, unit, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  let recordsWritten = 0;

  const writeBatch = db.transaction((batch) => {
    for (const metric of batch) {
      if (!metric.name || !Number.isFinite(metric.value)) {
        continue;
      }

      deleteStatement.run(metric.name, asOfDate);
      insertStatement.run(asOfDate, metric.name, metric.value, metric.unit || null, sourceName);
      recordsWritten += 1;
    }
  });

  writeBatch(metrics);
  return recordsWritten;
}

/**
 * Upsert fund profiles surfaced by the extraction layer.
 *
 * The first implementation updates or creates fund profiles only. We avoid
 * writing partially inferred redemption rows until the extraction contract
 * includes paid-vs-requested detail needed by the dashboard charts.
 *
 * @param {ExtractedFundData[]} funds - Structured extracted fund records
 * @returns {number} Number of fund rows created or updated
 */
function upsertExtractedFunds(funds) {
  if (!funds.length) {
    return 0;
  }

  const db = getDb();
  const findStatement = db.prepare('SELECT id, aum_billions, manager FROM funds WHERE name = ?');
  const insertStatement = db.prepare(`
    INSERT INTO funds (name, ticker, manager, aum_billions, fund_type)
    VALUES (?, NULL, ?, ?, 'semi_liquid')
  `);
  const updateStatement = db.prepare(`
    UPDATE funds
    SET manager = ?, aum_billions = ?
    WHERE id = ?
  `);

  let recordsWritten = 0;

  const writeBatch = db.transaction((batch) => {
    for (const fund of batch) {
      if (!fund.fund_name) {
        continue;
      }

      const existing = findStatement.get(fund.fund_name);
      const manager = fund.manager || existing?.manager || 'Unknown';
      const aumBillions = Number.isFinite(fund.aum_billions) ? fund.aum_billions : existing?.aum_billions ?? null;

      if (!existing) {
        insertStatement.run(fund.fund_name, manager, aumBillions);
        recordsWritten += 1;
        continue;
      }

      if (existing.manager !== manager || existing.aum_billions !== aumBillions) {
        updateStatement.run(manager, aumBillions, existing.id);
        recordsWritten += 1;
      }
    }
  });

  writeBatch(funds);
  return recordsWritten;
}

module.exports = {
  insertExtractedEvents,
  upsertExtractedMetrics,
  upsertExtractedFunds,
};
