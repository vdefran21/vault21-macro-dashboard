#!/usr/bin/env node

const { initSchema, getDb, close } = require('../server/db');
const eventsRouter = require('../server/routes/events');
const fundsRouter = require('../server/routes/funds');
const metricsRouter = require('../server/routes/metrics');
const dashboardRouter = require('../server/routes/dashboard');

initSchema();
const db = getDb();

/**
 * @param {import('express').Router} router
 * @param {'get'|'post'|'put'|'delete'} method
 * @param {string} path
 * @returns {(req: object, res: object) => void|Promise<void>}
 */
function findHandler(router, method, path) {
  const layer = router.stack.find((entry) => entry.route && entry.route.path === path && entry.route.methods[method]);

  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[0].handle;
}

/**
 * @param {(req: object, res: object) => void|Promise<void>} handler
 * @param {{ body?: object, params?: object, query?: object }} [request]
 * @returns {Promise<{ statusCode: number, payload: any }>}
 */
function invoke(handler, request = {}) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      payload: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        resolve({ statusCode: this.statusCode, payload });
      },
    };

    try {
      const maybePromise = handler(
        {
          body: request.body || {},
          params: request.params || {},
          query: request.query || {},
        },
        res,
      );

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.catch(reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  const runId = Date.now();
  const eventText = `Codex smoke test event ${runId}`;
  const fundName = `Codex Test Fund ${runId}`;

  const createEvent = await invoke(findHandler(eventsRouter, 'post', '/'), {
    body: {
      date: '2026-03-12',
      event_time: '13:45',
      event: eventText,
      severity: 3,
      category: 'general',
      notes: 'Temporary Phase 4 smoke-test event',
    },
  });

  const eventId = createEvent.payload.id;

  const createFund = await invoke(findHandler(fundsRouter, 'post', '/'), {
    body: {
      name: fundName,
      manager: 'Codex Capital',
      ticker: 'cdfx',
      aum_billions: 12.5,
      fund_type: 'semi_liquid',
    },
  });

  const fundId = createFund.payload.id;

  const addRedemption = await invoke(findHandler(fundsRouter, 'post', '/:id/redemptions'), {
    params: { id: String(fundId) },
    body: {
      quarter: 'Q1 2026',
      date: '2026-03-12',
      redemption_requested_pct: 6.4,
      redemption_requested_amt: 0.8,
      redemption_paid_pct: 5.0,
      redemption_paid_amt: 0.62,
      gate_threshold_pct: 5.0,
      status: 'gated',
      response_detail: 'Temporary smoke-test redemption entry',
      source: 'https://example.com/fund-update',
    },
  });

  const latestMetrics = await invoke(findHandler(metricsRouter, 'get', '/latest'));
  const metricHistory = await invoke(findHandler(metricsRouter, 'get', '/:name/history'), {
    params: { name: 'pik_income_pct' },
    query: { limit: '5' },
  });
  const timelinePayload = await invoke(findHandler(dashboardRouter, 'get', '/timeline'));

  const foundEventInLog = timelinePayload.payload.events.some((event) => event.id === eventId);
  const foundEventInChart = timelinePayload.payload.severity_chart.some((event) => event.id === eventId);

  db.prepare('DELETE FROM redemption_events WHERE fund_id = ?').run(fundId);
  db.prepare('DELETE FROM funds WHERE id = ?').run(fundId);
  db.prepare('DELETE FROM events WHERE id = ?').run(eventId);

  console.log(JSON.stringify({
    createEventStatus: createEvent.statusCode,
    foundEventInLog,
    foundEventInChart,
    createFundStatus: createFund.statusCode,
    addRedemptionStatus: addRedemption.statusCode,
    redemptionStatus: addRedemption.payload.redemption.status,
    latestMetricCount: latestMetrics.payload.count,
    metricHistoryCount: metricHistory.payload.count,
    pendingReviewCount: timelinePayload.payload.review_queue.length,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    close();
  });
