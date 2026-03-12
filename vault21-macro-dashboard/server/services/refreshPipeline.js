// @ts-check

const { EventEmitter } = require('events');
const config = require('../config');
const { getDb } = require('../db');
const logger = require('../utils/logger');
const { refreshYahooPrices } = require('./scrapers/yahoo');
const { refreshFredMetrics } = require('./scrapers/fred');
const { refreshSecFilings } = require('./scrapers/sec');
const { refreshBloombergNews } = require('./scrapers/bloomberg');
const { refreshCnbcNews } = require('./scrapers/cnbc');
const { refreshReutersNews } = require('./scrapers/reuters');

/** @typedef {import('../../shared/contracts.js').RefreshIssue} RefreshIssue */
/** @typedef {import('../../shared/contracts.js').RefreshScope} RefreshScope */
/** @typedef {import('../../shared/contracts.js').RefreshSourceResult} RefreshSourceResult */
/** @typedef {import('../../shared/contracts.js').RefreshSummary} RefreshSummary */

/**
 * Supported manual refresh scopes.
 */
const REFRESH_SCOPES = /** @type {readonly RefreshScope[]} */ (Object.freeze(['full', 'prices_only', 'news_only']));

/**
 * Shared event emitter for later scheduler/UI integrations.
 */
const refreshEvents = new EventEmitter();

/** @type {Promise<RefreshSummary>|null} */
let activeRefreshPromise = null;

/**
 * Promise timeout wrapper used to keep one slow source from holding the entire
 * refresh cycle open indefinitely.
 *
 * @param {Promise<RefreshSourceResult>} promise - Source task promise
 * @param {string} label - Source name for timeout messaging
 * @returns {Promise<RefreshSourceResult>} The original promise or a timeout rejection
 */
function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} exceeded ${config.refresh.timeoutMs}ms`));
    }, config.refresh.timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

/**
 * Return the implemented source tasks for the requested scope.
 *
 * Phase 3 starts with market data first; news and filing collectors are added
 * incrementally in later passes while the refresh API stays stable.
 *
 * @param {RefreshScope} scope - Requested refresh scope
 * @returns {Array<{ source: string, run: () => Promise<RefreshSourceResult> }>} Tasks to execute
 */
function getTasksForScope(scope) {
  switch (scope) {
    case 'full':
      return [
        { source: 'yahoo_finance', run: refreshYahooPrices },
        { source: 'fred', run: refreshFredMetrics },
        { source: 'sec', run: refreshSecFilings },
        { source: 'bloomberg', run: refreshBloombergNews },
        { source: 'cnbc', run: refreshCnbcNews },
        { source: 'reuters', run: refreshReutersNews },
      ];
    case 'prices_only':
      return [
        { source: 'yahoo_finance', run: refreshYahooPrices },
        { source: 'fred', run: refreshFredMetrics },
      ];
    case 'news_only':
      return [
        { source: 'sec', run: refreshSecFilings },
        { source: 'bloomberg', run: refreshBloombergNews },
        { source: 'cnbc', run: refreshCnbcNews },
        { source: 'reuters', run: refreshReutersNews },
      ];
    default:
      return [];
  }
}

/**
 * Reduce per-source results into the refresh log status fields.
 *
 * @param {RefreshSourceResult[]} results - Source summaries
 * @param {RefreshScope} scope - Requested refresh scope
 * @returns {{ status: 'success'|'partial'|'failed', sourcesAttempted: number, sourcesSucceeded: number, eventsAdded: number, issues: RefreshIssue[] }}
 */
function summarizeResults(results, scope) {
  /** @type {RefreshIssue[]} */
  const issues = [];
  let sourcesAttempted = 0;
  let sourcesSucceeded = 0;
  let eventsAdded = 0;

  for (const result of results) {
    if (result.status !== 'skipped') {
      sourcesAttempted += 1;
    }

    if (result.status === 'success' || result.status === 'partial') {
      sourcesSucceeded += 1;
    }

    eventsAdded += result.eventsAdded || 0;

    if (Array.isArray(result.errors) && result.errors.length) {
      issues.push({
        source: result.source,
        details: result.errors,
      });
    }
  }

  if (!results.length) {
    issues.push({
      source: scope,
      details: [{ message: `No refresh collectors are implemented for scope "${scope}" yet` }],
    });
  }

  const hasFailure = results.some((result) => result.status === 'failed');
  const hasPartial = results.some((result) => result.status === 'partial');
  const hasSkipped = results.some((result) => result.status === 'skipped');
  const allSuccess = results.length > 0 && results.every((result) => result.status === 'success');

  /** @type {'success'|'partial'|'failed'} */
  let status = 'success';

  if (!results.length) {
    status = 'partial';
  } else if (hasFailure && sourcesSucceeded === 0) {
    status = 'failed';
  } else if (!allSuccess || hasPartial || hasSkipped) {
    status = 'partial';
  }

  return { status, sourcesAttempted, sourcesSucceeded, eventsAdded, issues };
}

/**
 * Insert a running refresh log row and return its identifier.
 *
 * @param {import('../../shared/contracts.js').RefreshTriggerType} triggerType - Refresh origin (manual, scheduled, startup)
 * @returns {{ id: number, startedAt: string }} Created log metadata
 */
function createRefreshLog(triggerType) {
  const db = getDb();
  const startedAt = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO refresh_log (trigger_type, started_at, status)
    VALUES (?, ?, 'running')
  `).run(triggerType, startedAt);

  return { id: result.lastInsertRowid, startedAt };
}

/**
 * Finalize a refresh log row with the aggregate pipeline outcome.
 *
 * @param {number} logId - Refresh log identifier
 * @param {{ status: 'success'|'partial'|'failed', sourcesAttempted: number, sourcesSucceeded: number, eventsAdded: number, issues: RefreshIssue[], startedAt: string }} summary - Final log values
 * @returns {Omit<RefreshSummary, 'scope'|'triggerType'|'results'|'startedAt'> & { startedAt: string }} Summary with completion metadata included
 */
function finalizeRefreshLog(logId, summary) {
  const db = getDb();
  const completedAt = new Date().toISOString();
  const durationMs = new Date(completedAt).getTime() - new Date(summary.startedAt).getTime();
  const errorsJson = summary.issues.length ? JSON.stringify(summary.issues) : null;

  db.prepare(`
    UPDATE refresh_log
    SET completed_at = ?,
        status = ?,
        sources_attempted = ?,
        sources_succeeded = ?,
        events_added = ?,
        errors = ?,
        duration_ms = ?
    WHERE id = ?
  `).run(
    completedAt,
    summary.status,
    summary.sourcesAttempted,
    summary.sourcesSucceeded,
    summary.eventsAdded,
    errorsJson,
    durationMs,
    logId,
  );

  return {
    ...summary,
    refreshId: logId,
    completedAt,
    durationMs,
    errors: summary.issues,
  };
}

/**
 * Execute the Phase 3 refresh pipeline for the requested scope.
 *
 * The first implementation pass focuses on live market data. The route and log
 * contract are kept stable so SEC/news ingestion can plug into the same
 * orchestrator in follow-up work.
 *
 * @param {'manual'|'scheduled'|'startup'} triggerType - Refresh origin
 * @param {{ scope?: string }} [options={}] - Refresh options
 * @returns {Promise<RefreshSummary>} Final refresh summary
 * @throws {Error} When the scope is invalid or every source fails
 */
async function runRefreshPipeline(triggerType, options = {}) {
  if (activeRefreshPromise) {
    logger.info({ triggerType, scope: options.scope || 'full' }, 'Refresh already in progress; reusing active refresh promise');
    return activeRefreshPromise;
  }

  const scope = /** @type {RefreshScope} */ (options.scope || 'full');

  if (!REFRESH_SCOPES.includes(scope)) {
    throw new Error(`Invalid refresh scope: ${scope}`);
  }

  activeRefreshPromise = (async () => {
    const { id, startedAt } = createRefreshLog(triggerType);
    const tasks = getTasksForScope(scope);

    logger.info({ refreshId: id, scope, triggerType, tasks: tasks.map((task) => task.source) }, 'Refresh pipeline started');

    const settled = await Promise.allSettled(tasks.map((task) => withTimeout(task.run(), task.source)));
    const results = settled.map((result, index) => {
      const source = tasks[index]?.source || 'unknown';

      if (result.status === 'fulfilled') {
        return result.value;
      }

      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      logger.error({ refreshId: id, scope, source, err: message }, 'Refresh source failed');

      return /** @type {RefreshSourceResult} */ ({
        source,
        status: 'failed',
        recordsWritten: 0,
        errors: [{ message }],
      });
    });

    for (const result of results) {
      logger.info(
        {
          refreshId: id,
          scope,
          source: result.source,
          status: result.status,
          recordsWritten: result.recordsWritten,
          eventsAdded: result.eventsAdded || 0,
          errors: result.errors.length,
        },
        'Refresh source completed',
      );
    }

    const aggregate = summarizeResults(results, scope);
    const summary = finalizeRefreshLog(id, {
      ...aggregate,
      startedAt,
    });

    const payload = /** @type {RefreshSummary} */ ({
      ...summary,
      scope,
      triggerType,
      results,
      startedAt,
    });

    refreshEvents.emit('refresh_complete', payload);
    logger.info(
      {
        refreshId: id,
        scope,
        status: payload.status,
        sourcesAttempted: payload.sourcesAttempted,
        sourcesSucceeded: payload.sourcesSucceeded,
        durationMs: payload.durationMs,
      },
      'Refresh pipeline completed',
    );

    return payload;
  })();

  try {
    return await activeRefreshPromise;
  } finally {
    activeRefreshPromise = null;
  }
}

module.exports = { runRefreshPipeline, refreshEvents, REFRESH_SCOPES };
