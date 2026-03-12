const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { getDb, initSchema, close } = require('./index');

function seed() {
  const db = getDb();
  initSchema();

  // Clear existing data for clean re-seed
  // Delete in FK-safe order (children before parents), then reset autoincrement counters
  // so hardcoded fund_id references in redemption seeds remain valid across re-seeds.
  db.exec(`
    DELETE FROM redemption_events;
    DELETE FROM funds;
    DELETE FROM events;
    DELETE FROM metrics;
    DELETE FROM equity_prices;
    DELETE FROM bank_exposures;
    DELETE FROM contagion_layers;
    DELETE FROM refresh_log;
    DELETE FROM sqlite_sequence;
  `);

  // --- Timeline Events ---
  const insertEvent = db.prepare(`
    INSERT INTO events (date, event, severity, category, source_name, verified)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const events = [
    ['2024-11-15', 'Tricolor funding strains emerge', 1, 'general', 'Bloomberg'],
    ['2025-01-20', 'First Brands collateral fraud exposed', 2, 'bankruptcy', 'Reuters'],
    ['2025-04-07', 'Liberation Day crash — broad market selloff', 3, 'market_move', 'CNBC'],
    ['2025-10-01', 'BDC bankruptcies accelerate across sector', 3, 'bankruptcy', 'PitchBook'],
    ['2026-02-01', 'Blue Owl gates OBDC II — 200%+ redemption surge', 4, 'gating', 'Bloomberg'],
    ['2026-02-18', 'Rubric Capital publishes "Enron of private credit" letter', 3, 'analyst_warning', 'Rubric Capital'],
    ['2026-02-27', 'UK lender MFS collapses — Barclays exposure flagged', 4, 'bankruptcy', 'FT'],
    ['2026-03-03', 'Blackstone BCRED: 7.9% redemptions met via emergency $400M firm backstop + raised tender cap', 5, 'redemption', 'Bloomberg'],
    ['2026-03-06', 'BlackRock HLEND gated at 5% — $1.2B requested, $620M paid', 5, 'gating', 'Reuters'],
    ['2026-03-06', 'Alt manager selloff: OWL -12%, BX -8% / VIX +32%', 5, 'market_move', 'Bloomberg'],
    ['2026-03-10', 'Cliffwater $33B fund reports >7% redemption requests', 5, 'redemption', 'CNBC'],
    ['2026-03-11', 'JPMorgan marks down software loan collateral — first major bank', 6, 'bank_action', 'Bloomberg'],
    ['2026-03-12', 'Partners Group warns defaults may double to ~5.2%', 5, 'analyst_warning', 'Reuters'],
    ['2026-03-12', 'Deutsche Bank discloses \u20AC26B private credit portfolio', 3, 'bank_action', 'FT'],
    ['2026-03-12', 'Whalen Global Advisors flags bank contagion risk', 3, 'analyst_warning', 'Whalen Global'],
  ];

  const insertEvents = db.transaction(() => {
    for (const e of events) {
      insertEvent.run(...e);
    }
  });
  insertEvents();

  // --- Funds ---
  const insertFund = db.prepare(`
    INSERT INTO funds (name, ticker, manager, aum_billions, fund_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const fundsData = [
    ['Blackstone BCRED', 'BCRED', 'Blackstone', 82, 'semi_liquid'],
    ['BlackRock HLEND', null, 'BlackRock', 26, 'semi_liquid'],
    ['Cliffwater CLF', null, 'Cliffwater', 33, 'interval_fund'],
    ['Blue Owl OBDC II', 'OBDC', 'Blue Owl Capital', 1.6, 'BDC'],
  ];

  const insertFunds = db.transaction(() => {
    for (const f of fundsData) {
      insertFund.run(...f);
    }
  });
  insertFunds();

  // --- Redemption Events ---
  const insertRedemption = db.prepare(`
    INSERT INTO redemption_events (fund_id, quarter, date, redemption_requested_pct, redemption_requested_amt,
      redemption_paid_pct, redemption_paid_amt, gate_threshold_pct, status, response_detail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const redemptions = [
    [1, 'Q1 2026', '2026-03-03', 7.9, 3.8, 7.9, 3.8, 5.0, 'extraordinary', 'Met 7.9% via increased tender offer (5%→7%) + $400M firm/employee capital injection. Standard cap is 5%. Not repeatable at scale.'],
    [2, 'Q1 2026', '2026-03-06', 9.3, 1.2, 5.0, 0.62, 5.0, 'gated', 'Gated at 5% quarterly cap — $620M of $1.2B paid'],
    [3, 'Q1 2026', '2026-03-10', 7.0, 2.31, 5.0, 1.65, 5.0, 'gated', 'Expected >7% requests, 5% cap applied'],
    [4, 'Q1 2026', '2026-02-01', 200.0, null, 0, 0, 5.0, 'liquidating', 'Permanently gated — 200%+ redemption surge — entering liquidation'],
  ];

  const insertRedemptions = db.transaction(() => {
    for (const r of redemptions) {
      insertRedemption.run(...r);
    }
  });
  insertRedemptions();

  // --- Metrics ---
  const insertMetric = db.prepare(`
    INSERT INTO metrics (date, metric_name, metric_value, unit, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  const metricsData = [
    ['2026-03-12', 'industry_aum', 1800, 'billions_usd', 'PitchBook'],
    ['2026-03-12', 'bank_lending_to_pc', 300, 'billions_usd', 'Fed data'],
    ['2026-03-12', 'maturity_wall_2026', 162, 'billions_usd', 'PitchBook'],
    ['2026-03-12', 'software_loan_share_pct', 40, 'percent', 'Industry analysis'],
    ['2026-03-12', 'headline_default_rate', 1.8, 'percent', 'Moody\'s'],
    ['2026-03-12', 'true_default_rate', 5.0, 'percent', 'Rubric/UBS analysis'],
    ['2026-03-12', 'ubs_worst_case_default', 15.0, 'percent', 'UBS'],
    ['2026-03-12', 'partners_group_forecast', 5.2, 'percent', 'Partners Group'],
    ['2026-03-12', 'pik_income_pct', 8.4, 'percent', 'BDC filings'],
    ['2026-03-12', 'historical_default_avg', 2.6, 'percent', 'Partners Group 10yr'],
    ['2026-03-12', 'q1_redemptions_total', 10, 'billions_usd', 'Aggregated'],
  ];

  // PIK trend historical
  const pikTrend = [
    ['2024-03-31', 'pik_income_pct', 5.2, 'percent', 'BDC filings'],
    ['2024-06-30', 'pik_income_pct', 5.8, 'percent', 'BDC filings'],
    ['2024-09-30', 'pik_income_pct', 6.3, 'percent', 'BDC filings'],
    ['2024-12-31', 'pik_income_pct', 6.9, 'percent', 'BDC filings'],
    ['2025-03-31', 'pik_income_pct', 7.2, 'percent', 'BDC filings'],
    ['2025-06-30', 'pik_income_pct', 7.5, 'percent', 'BDC filings'],
    ['2025-09-30', 'pik_income_pct', 7.8, 'percent', 'BDC filings'],
    ['2025-12-31', 'pik_income_pct', 8.0, 'percent', 'BDC filings'],
  ];

  // Default rate comparison data
  const defaultRates = [
    ['2026-03-12', 'default_rate_historical_headline', 1.8, 'percent', 'Moody\'s'],
    ['2026-03-12', 'default_rate_historical_true', 2.6, 'percent', 'Partners Group'],
    ['2026-03-12', 'default_rate_current_headline', 2.0, 'percent', 'Rubric/UBS'],
    ['2026-03-12', 'default_rate_current_true', 5.0, 'percent', 'Rubric/UBS'],
    ['2026-03-12', 'default_rate_ubs_worst', 15.0, 'percent', 'UBS'],
    ['2026-03-12', 'default_rate_pg_forecast', 5.2, 'percent', 'Partners Group'],
  ];

  // Sector exposure data
  const sectorExposure = [
    ['2026-03-12', 'sector_software_saas', 40, 'percent', 'Industry analysis'],
    ['2026-03-12', 'sector_healthcare', 15, 'percent', 'Industry analysis'],
    ['2026-03-12', 'sector_business_services', 12, 'percent', 'Industry analysis'],
    ['2026-03-12', 'sector_financial_services', 10, 'percent', 'Industry analysis'],
    ['2026-03-12', 'sector_industrial', 8, 'percent', 'Industry analysis'],
    ['2026-03-12', 'sector_other', 15, 'percent', 'Industry analysis'],
  ];

  // Maturity wall data
  const maturityWall = [
    ['2026-03-12', 'maturity_wall_2026', 162, 'billions_usd', 'PitchBook'],
    ['2026-03-12', 'maturity_wall_2027', 134, 'billions_usd', 'PitchBook'],
    ['2026-03-12', 'maturity_wall_2028', 98, 'billions_usd', 'PitchBook'],
    ['2026-03-12', 'maturity_wall_2029', 67, 'billions_usd', 'PitchBook'],
  ];

  const insertMetrics = db.transaction(() => {
    for (const m of [...metricsData, ...pikTrend, ...defaultRates, ...sectorExposure, ...maturityWall]) {
      insertMetric.run(...m);
    }
  });
  insertMetrics();

  // --- Equity Prices (seed snapshot) ---
  const insertEquity = db.prepare(`
    INSERT INTO equity_prices (ticker, date, close_price, change_pct, ytd_pct, from_high_pct, source)
    VALUES (?, ?, ?, ?, ?, ?, 'seed')
  `);

  const equityData = [
    ['OWL', '2026-03-12', null, null, -27, -60],
    ['BX', '2026-03-12', null, null, -18, -40],
    ['KKR', '2026-03-12', null, null, -15, -35],
    ['ARES', '2026-03-12', null, null, -12, -28],
    ['BLK', '2026-03-12', null, null, -10, -22],
    ['APO', '2026-03-12', null, null, -8, -20],
  ];

  const insertEquities = db.transaction(() => {
    for (const e of equityData) {
      insertEquity.run(...e);
    }
  });
  insertEquities();

  // --- Bank Exposures ---
  const insertBank = db.prepare(`
    INSERT INTO bank_exposures (bank_name, exposure_billions, date_reported, detail, source)
    VALUES (?, ?, ?, ?, ?)
  `);

  const bankData = [
    ['JPMorgan', 22.2, '2026-03-11', 'Actively marking down software loan collateral — first major bank to do so', 'Bloomberg'],
    ['Deutsche Bank', 30, '2026-03-12', 'Disclosed \u20AC26B (~$30B) private credit portfolio', 'FT'],
    ['Barclays', 18, '2026-02-27', 'MFS exposure flagged after UK lender collapse', 'Reuters'],
    ['Goldman Sachs', 15, '2026-03-12', '3.5% Q4 redemption rate, below peers', 'Bloomberg'],
  ];

  const insertBanks = db.transaction(() => {
    for (const b of bankData) {
      insertBank.run(...b);
    }
  });
  insertBanks();

  // --- Contagion Layers ---
  const insertLayer = db.prepare(`
    INSERT INTO contagion_layers (layer_order, layer_name, detail, risk_description, exposure_label, severity)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const layers = [
    [1, 'Borrowers', 'Software/SaaS companies', 'AI disruption erodes business models', '$680B+ in sponsor-backed loans', 3],
    [2, 'Private Credit Funds', 'BDCs & semi-liquid vehicles', 'PIK at post-pandemic highs, defaults rising', '$1.8T industry AUM', 4],
    [3, 'Retail Investors', 'Redemption wave', 'Liquidity mismatch \u2192 gating', '$10B+ in redemption requests Q1', 5],
    [4, 'Bank Leverage', 'Back-leverage providers', 'JPM marking down collateral', '$300B bank lending to PC funds', 6],
    [5, 'Alt Manager Equities', 'BX, OWL, ARES, KKR, BLK', 'Share price contagion', 'OWL -60%, BX -40% from highs', 5],
    [6, 'Broad Markets', 'VIX, S&P, financials', 'Sentiment + forced selling', 'VIX +32% single session', 4],
  ];

  const insertLayers = db.transaction(() => {
    for (const l of layers) {
      insertLayer.run(...l);
    }
  });
  insertLayers();

  console.log('Seed complete:');
  console.log(`  Events: ${db.prepare('SELECT COUNT(*) as c FROM events').get().c}`);
  console.log(`  Funds: ${db.prepare('SELECT COUNT(*) as c FROM funds').get().c}`);
  console.log(`  Redemptions: ${db.prepare('SELECT COUNT(*) as c FROM redemption_events').get().c}`);
  console.log(`  Metrics: ${db.prepare('SELECT COUNT(*) as c FROM metrics').get().c}`);
  console.log(`  Equity prices: ${db.prepare('SELECT COUNT(*) as c FROM equity_prices').get().c}`);
  console.log(`  Bank exposures: ${db.prepare('SELECT COUNT(*) as c FROM bank_exposures').get().c}`);
  console.log(`  Contagion layers: ${db.prepare('SELECT COUNT(*) as c FROM contagion_layers').get().c}`);

  close();
}

seed();
