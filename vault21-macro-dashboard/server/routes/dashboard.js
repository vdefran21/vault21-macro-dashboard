// @ts-check

const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

/** @typedef {import('better-sqlite3').Database} Database */
/** @typedef {import('../../shared/contracts.js').DashboardContagion} DashboardContagion */
/** @typedef {import('../../shared/contracts.js').DashboardMeta} DashboardMeta */
/** @typedef {import('../../shared/contracts.js').DashboardOverview} DashboardOverview */
/** @typedef {import('../../shared/contracts.js').DashboardPayload} DashboardPayload */
/** @typedef {import('../../shared/contracts.js').DashboardRedemptions} DashboardRedemptions */
/** @typedef {import('../../shared/contracts.js').DashboardTimeline} DashboardTimeline */

const ALT_MANAGER_TICKERS = ['OWL', 'BX', 'KKR', 'ARES', 'BLK', 'APO'];

/**
 * Fetch the latest metric row for a named metric.
 *
 * @param {Database} db - SQLite connection
 * @param {string} metricName - Metric identifier
 * @returns {{ metric_value: number, date?: string }|undefined} Latest metric row
 */
function getLatestMetric(db, metricName) {
  return db.prepare('SELECT metric_value, date FROM metrics WHERE metric_name = ? ORDER BY date DESC LIMIT 1').get(metricName);
}

/**
 * Build the overview tab payload from the metrics table.
 *
 * @param {Database} db - SQLite connection
 * @returns {DashboardOverview} Overview payload
 */
function buildOverview(db) {
  // Top-line stats from latest metrics
  const stats = {
    industry_aum: { value: getLatestMetric(db, 'industry_aum')?.metric_value || 1800, unit: 'T', as_of: getLatestMetric(db, 'industry_aum')?.date },
    bank_lending: { value: getLatestMetric(db, 'bank_lending_to_pc')?.metric_value || 300, unit: 'B', as_of: getLatestMetric(db, 'bank_lending_to_pc')?.date },
    q1_redemptions: { value: getLatestMetric(db, 'q1_redemptions_total')?.metric_value || 10, unit: 'B+', as_of: getLatestMetric(db, 'q1_redemptions_total')?.date },
    maturity_wall_2026: { value: getLatestMetric(db, 'maturity_wall_2026')?.metric_value || 162, unit: 'B', as_of: getLatestMetric(db, 'maturity_wall_2026')?.date },
    software_share: { value: getLatestMetric(db, 'software_loan_share_pct')?.metric_value || 40, unit: '%', as_of: getLatestMetric(db, 'software_loan_share_pct')?.date },
    true_default_rate: { value: getLatestMetric(db, 'true_default_rate')?.metric_value || 5.0, unit: '%', as_of: getLatestMetric(db, 'true_default_rate')?.date },
  };

  // Default rate comparison
  const default_rates = [
    {
      year: '2016-2025 Avg',
      headline: getLatestMetric(db, 'default_rate_historical_headline')?.metric_value || 1.8,
      true: getLatestMetric(db, 'default_rate_historical_true')?.metric_value || 2.6,
      label: 'Historical',
    },
    {
      year: 'Current (Rubric/UBS)',
      headline: getLatestMetric(db, 'default_rate_current_headline')?.metric_value || 2.0,
      true: getLatestMetric(db, 'default_rate_current_true')?.metric_value || 5.0,
      label: 'Now',
    },
    {
      year: 'UBS Worst Case',
      headline: null,
      true: getLatestMetric(db, 'default_rate_ubs_worst')?.metric_value || 15.0,
      label: 'Worst Case',
    },
    {
      year: 'Partners Group Forecast',
      headline: null,
      true: getLatestMetric(db, 'default_rate_pg_forecast')?.metric_value || 5.2,
      label: 'Forecast',
    },
  ];

  // Sector exposure
  const sectorMetrics = db.prepare(
    "SELECT metric_name, metric_value FROM metrics WHERE metric_name LIKE 'sector_%' ORDER BY metric_value DESC"
  ).all();

  const sectorNameMap = {
    sector_software_saas: 'Software/SaaS',
    sector_healthcare: 'Healthcare',
    sector_business_services: 'Business Services',
    sector_financial_services: 'Financial Services',
    sector_industrial: 'Industrial',
    sector_other: 'Other',
  };

  const sector_exposure = sectorMetrics.map((m) => ({
    name: sectorNameMap[m.metric_name] || m.metric_name,
    value: m.metric_value,
  }));

  // PIK trend
  const pikRows = db.prepare(
    "SELECT date, metric_value FROM metrics WHERE metric_name = 'pik_income_pct' ORDER BY date ASC"
  ).all();

  const quarterLabel = (dateStr) => {
    const d = new Date(dateStr);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    return `Q${q} ${d.getFullYear()}`;
  };

  const pik_trend = pikRows.map((r) => ({
    quarter: quarterLabel(r.date),
    pik: r.metric_value,
  }));

  // Maturity wall
  const maturityMetrics = db.prepare(
    "SELECT metric_name, metric_value FROM metrics WHERE metric_name LIKE 'maturity_wall_%' ORDER BY metric_name ASC"
  ).all();

  const maturity_wall = maturityMetrics.map((m) => {
    const year = m.metric_name.replace('maturity_wall_', '');
    return { year, amount: m.metric_value };
  });

  return { stats, default_rates, sector_exposure, pik_trend, maturity_wall };
}

/**
 * Build the redemptions tab payload using the latest redemption row per fund.
 *
 * @param {Database} db - SQLite connection
 * @returns {DashboardRedemptions} Redemptions payload
 */
function buildRedemptions(db) {
  const funds = db.prepare(`
    SELECT f.id, f.name, f.ticker, f.manager, f.aum_billions, f.fund_type,
      re.quarter, re.redemption_requested_pct, re.redemption_requested_amt,
      re.redemption_paid_pct, re.redemption_paid_amt, re.gate_threshold_pct,
      re.status, re.response_detail
    FROM funds f
    LEFT JOIN redemption_events re ON re.id = (
      SELECT re2.id
      FROM redemption_events re2
      WHERE re2.fund_id = f.id
      ORDER BY re2.date DESC, re2.id DESC
      LIMIT 1
    )
    ORDER BY f.aum_billions DESC
  `).all();

  const rate_chart = funds.map((f) => ({
    fund: f.name.replace(/^(Blackstone |BlackRock |Cliffwater |Blue Owl )/, ''),
    requested: (f.redemption_requested_pct || 0) > 100 ? 25 : f.redemption_requested_pct,
    paid: f.redemption_paid_pct ?? null,
  }));

  const dollar_flows = funds
    .filter((f) => Number.isFinite(f.redemption_requested_amt))
    .map((f) => ({
      fund: `${f.name.replace(/^(Blackstone |BlackRock |Cliffwater |Blue Owl )/, '')} ($${f.aum_billions}B)`,
      requested: f.redemption_requested_amt,
      returned: f.redemption_paid_amt ?? null,
    }));

  return { funds, rate_chart, dollar_flows };
}

/**
 * Build the contagion tab payload.
 *
 * @param {Database} db - SQLite connection
 * @returns {DashboardContagion} Contagion payload
 */
function buildContagion(db) {
  const chain = db.prepare('SELECT * FROM contagion_layers ORDER BY layer_order ASC').all();

  const bank_exposures = db.prepare('SELECT * FROM bank_exposures ORDER BY exposure_billions DESC').all();

  const alt_manager_equity = db.prepare(
    `
      SELECT ep.ticker, ep.date, ep.ytd_pct, ep.from_high_pct
      FROM equity_prices ep
      INNER JOIN (
        SELECT ticker, MAX(date) AS latest_date
        FROM equity_prices
        WHERE ticker IN (${ALT_MANAGER_TICKERS.map(() => '?').join(', ')})
        GROUP BY ticker
      ) latest
        ON latest.ticker = ep.ticker
       AND latest.latest_date = ep.date
      ORDER BY ep.ytd_pct ASC
    `
  ).all(...ALT_MANAGER_TICKERS);

  return { chain, bank_exposures, alt_manager_equity };
}

/**
 * Build the timeline tab payload.
 *
 * @param {Database} db - SQLite connection
 * @returns {DashboardTimeline} Timeline payload
 */
function buildTimeline(db) {
  const events = db.prepare(
    "SELECT * FROM events ORDER BY date DESC, COALESCE(event_time, '00:00') DESC, severity DESC, id DESC"
  ).all();

  const severity_chart = db.prepare(
    "SELECT * FROM events ORDER BY date ASC, COALESCE(event_time, '00:00') ASC, id ASC"
  ).all().map((e) => ({
    id: e.id,
    chart_key: `${e.date}__${e.event_time || 'notime'}__${e.id}`,
    date: e.date,
    event_time: e.event_time || null,
    event: e.event,
    severity: e.severity,
  }));

  return { events, severity_chart };
}

/**
 * Build the dashboard meta freshness block.
 *
 * @param {Database} db - SQLite connection
 * @returns {DashboardMeta} Meta payload
 */
function getRefreshMeta(db) {
  const latest = db.prepare(
    "SELECT * FROM refresh_log ORDER BY started_at DESC LIMIT 1"
  ).get();

  return {
    last_refresh: latest?.completed_at || new Date().toISOString(),
    refresh_status: latest?.status || 'seed',
    data_freshness: {
      prices: latest?.completed_at || '2026-03-12T00:00:00Z',
      news: latest?.completed_at || '2026-03-12T00:00:00Z',
      sec_filings: latest?.completed_at || '2026-03-12T00:00:00Z',
    },
  };
}

/**
 * Build the full dashboard payload in one place so backend and frontend can
 * share the same typed contract.
 *
 * @param {Database} db - SQLite connection
 * @returns {DashboardPayload} Full dashboard payload
 */
function buildDashboardPayload(db) {
  return {
    meta: getRefreshMeta(db),
    overview: buildOverview(db),
    redemptions: buildRedemptions(db),
    contagion: buildContagion(db),
    timeline: buildTimeline(db),
  };
}

// GET /api/dashboard — full payload
router.get('/', (req, res) => {
  res.json(buildDashboardPayload(getDb()));
});

// Tab-specific endpoints
router.get('/overview', (req, res) => {
  res.json(buildOverview(getDb()));
});

router.get('/redemptions', (req, res) => {
  res.json(buildRedemptions(getDb()));
});

router.get('/contagion', (req, res) => {
  res.json(buildContagion(getDb()));
});

router.get('/timeline', (req, res) => {
  res.json(buildTimeline(getDb()));
});

module.exports = router;
