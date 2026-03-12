// @ts-check

const express = require('express');
const { runRefreshPipeline, REFRESH_SCOPES } = require('../services/refreshPipeline');
const logger = require('../utils/logger');

const router = express.Router();

/** @typedef {import('../../shared/contracts.js').RefreshScope} RefreshScope */

/**
 * Trigger a manual data refresh for the requested scope.
 *
 * This first Phase 3 implementation waits for the refresh to finish before
 * responding so the existing frontend button can immediately re-fetch fresh
 * data without a separate polling endpoint.
 *
 * @param {import('express').Request} req - Express request with optional scope body
 * @param {import('express').Response} res - Express JSON response
 * @returns {Promise<void>} Sends the refresh summary payload
 */
router.post('/', async (req, res) => {
  const scope = /** @type {RefreshScope} */ (req.body?.scope || 'full');

  if (!REFRESH_SCOPES.includes(scope)) {
    res.status(400).json({
      error: `Invalid scope. Expected one of: ${REFRESH_SCOPES.join(', ')}`,
    });
    return;
  }

  try {
    logger.info({ scope }, 'Manual refresh requested');
    const summary = await runRefreshPipeline('manual', { scope });
    const statusCode = summary.status === 'failed' ? 502 : 200;
    logger.info(
      {
        scope,
        refreshId: summary.refreshId,
        status: summary.status,
        sourcesAttempted: summary.sourcesAttempted,
        sourcesSucceeded: summary.sourcesSucceeded,
        eventsAdded: summary.eventsAdded,
      },
      'Manual refresh completed',
    );
    res.status(statusCode).json(summary);
  } catch (error) {
    logger.error({ scope, err: error instanceof Error ? error.message : String(error) }, 'Manual refresh failed');
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      scope,
    });
  }
});

module.exports = router;
