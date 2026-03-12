const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

function buildOverview(db) {
  // Top-line stats from latest metrics
  const latestMetric = db.prepare('SELECT metric_value, date FROM metrics WHERE metric_name = ? ORDER BY date DESC LIMIT 1');

  const stats = {
    industry_aum: { value: latestMetric.get('industry_aum')?.metric_value || 1800, unit: 'T', as_of: latestMetric.get('industry_aum')?.date },
    bank_lending: { value: latestMetric.get('bank_lending_to_pc')?.metric_value || 300, unit: 'B', as_of: latestMetric.get('bank_lending_to_pc')?.date },
    q1_redemptions: { value: latestMetric.get('q1_redemptions_total')?.metric_value || 10, unit: 'B+', as_of: latestMetric.get('q1_redemptions_total')?.date },
    maturity_wall_2026: { value: latestMetric.get('maturity_wall_2026')?.metric_value || 162, unit: 'B', as_of: latestMetric.get('maturity_wall_2026')?.date },
    software_share: { value: latestMetric.get('software_loan_share_pct')?.metric_value || 40, unit: '%', as_of: latestMetric.get('software_loan_share_pct')?.date },
    true_default_rate: { value: latestMetric.get('true_default_rate')?.metric_value || 5.0, unit: '%', as_of: latestMetric.get('true_default_rate')?.date },
  };

  // Default rate comparison
  const defaultRateMetric = db.prepare('SELECT metric_value FROM metrics WHERE metric_name = ? ORDER BY date DESC LIMIT 1');
  const default_rates = [
    {
      year: '2016-2025 Avg',
      headline: defaultRateMetric.get('default_rate_historical_headline')?.metric_value || 1.8,
      true: defaultRateMetric.get('default_rate_historical_true')?.metric_value || 2.6,
      label: 'Historical',
    },
    {
      year: 'Current (Rubric/UBS)',
      headline: defaultRateMetric.get('default_rate_current_headline')?.metric_value || 2.0,
      true: defaultRateMetric.get('default_rate_current_true')?.metric_value || 5.0,
      label: 'Now',
    },
    {
      year: 'UBS Worst Case',
      headline: null,
      true: defaultRateMetric.get('default_rate_ubs_worst')?.metric_value || 15.0,
      label: 'Worst Case',
    },
    {
      year: 'Partners Group Forecast',
      headline: null,
      true: defaultRateMetric.get('default_rate_pg_forecast')?.metric_value || 5.2,
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

  const sector_exposure = sectorMetrics.map(m => ({
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

  const pik_trend = pikRows.map(r => ({
    quarter: quarterLabel(r.date),
    pik: r.metric_value,
  }));

  // Maturity wall
  const maturityMetrics = db.prepare(
    "SELECT metric_name, metric_value FROM metrics WHERE metric_name LIKE 'maturity_wall_%' ORDER BY metric_name ASC"
  ).all();

  const maturity_wall = maturityMetrics.map(m => {
    const year = m.metric_name.replace('maturity_wall_', '');
    return { year, amount: m.metric_value };
  });

  return { stats, default_rates, sector_exposure, pik_trend, maturity_wall };
}

function buildRedemptions(db) {
  const funds = db.prepare(`
    SELECT f.id, f.name, f.ticker, f.manager, f.aum_billions, f.fund_type,
      re.quarter, re.redemption_requested_pct, re.redemption_requested_amt,
      re.redemption_paid_pct, re.redemption_paid_amt, re.gate_threshold_pct,
      re.status, re.response_detail
    FROM funds f
    LEFT JOIN redemption_events re ON f.id = re.fund_id
    ORDER BY f.aum_billions DESC
  `).all();

  const rate_chart = funds.map(f => ({
    fund: f.name.replace(/^(Blackstone |BlackRock |Cliffwater |Blue Owl )/, ''),
    requested: f.redemption_requested_pct > 100 ? 25 : f.redemption_requested_pct,
    paid: f.redemption_paid_pct,
  }));

  const dollar_flows = funds
    .filter(f => f.redemption_requested_amt)
    .map(f => ({
      fund: `${f.name.replace(/^(Blackstone |BlackRock |Cliffwater |Blue Owl )/, '')} ($${f.aum_billions}B)`,
      requested: f.redemption_requested_amt,
      returned: f.redemption_paid_amt,
    }));

  return { funds, rate_chart, dollar_flows };
}

function buildContagion(db) {
  const chain = db.prepare('SELECT * FROM contagion_layers ORDER BY layer_order ASC').all();

  const bank_exposures = db.prepare('SELECT * FROM bank_exposures ORDER BY exposure_billions DESC').all();

  const alt_manager_equity = db.prepare(
    "SELECT ticker, date, ytd_pct, from_high_pct FROM equity_prices ORDER BY ytd_pct ASC"
  ).all();

  return { chain, bank_exposures, alt_manager_equity };
}

function buildTimeline(db) {
  const events = db.prepare('SELECT * FROM events ORDER BY date DESC, severity DESC').all();

  const severity_chart = db.prepare('SELECT * FROM events ORDER BY date ASC, id ASC').all().map(e => ({
    date: e.date,
    event: e.event,
    severity: e.severity,
  }));

  return { events, severity_chart };
}

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

// GET /api/dashboard — full payload
router.get('/', (req, res) => {
  const db = getDb();
  res.json({
    meta: getRefreshMeta(db),
    overview: buildOverview(db),
    redemptions: buildRedemptions(db),
    contagion: buildContagion(db),
    timeline: buildTimeline(db),
  });
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
