// @ts-check

const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

const VALID_FUND_TYPES = new Set([
  'BDC',
  'interval_fund',
  'semi_liquid',
  'closed_end',
  'other',
]);

const VALID_REDEMPTION_STATUSES = new Set([
  'fulfilled',
  'extraordinary',
  'gated',
  'liquidating',
  'pending',
]);

/**
 * @param {string} rawId
 * @returns {number}
 */
function parseId(rawId) {
  const id = Number.parseInt(rawId, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('ID must be a positive integer');
  }

  return id;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {number} [maxLength=255]
 * @returns {string}
 */
function requiredText(value, fieldName, maxLength = 255) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`\`${fieldName}\` is required`);
  }

  return value.trim().slice(0, maxLength);
}

/**
 * @param {unknown} value
 * @param {number} [maxLength=255]
 * @returns {string|null}
 */
function optionalText(value, maxLength = 255) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('Optional text fields must be strings');
  }

  return value.trim().slice(0, maxLength) || null;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @returns {string}
 */
function validateDate(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`\`${fieldName}\` must be a YYYY-MM-DD string`);
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`\`${fieldName}\` must be a valid calendar date`);
  }

  return value;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {boolean} [required=false]
 * @returns {number|null}
 */
function numericField(value, fieldName, required = false) {
  if (value == null || value === '') {
    if (required) {
      throw new Error(`\`${fieldName}\` is required`);
    }

    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`\`${fieldName}\` must be a non-negative number`);
  }

  return number;
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function validateFundType(value) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !VALID_FUND_TYPES.has(value)) {
    throw new Error(`\`fund_type\` must be one of: ${Array.from(VALID_FUND_TYPES).join(', ')}`);
  }

  return value;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function validateRedemptionStatus(value) {
  if (typeof value !== 'string' || !VALID_REDEMPTION_STATUSES.has(value)) {
    throw new Error(`\`status\` must be one of: ${Array.from(VALID_REDEMPTION_STATUSES).join(', ')}`);
  }

  return value;
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeTicker(value) {
  const ticker = optionalText(value, 20);
  return ticker ? ticker.toUpperCase() : null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function validateQuarter(value) {
  return requiredText(value, 'quarter', 20);
}

/**
 * @param {number} fundId
 * @returns {object|undefined}
 */
function getFundSummaryById(fundId) {
  return getDb().prepare(`
    SELECT f.id, f.name, f.ticker, f.manager, f.aum_billions, f.fund_type,
      re.quarter, re.redemption_requested_pct, re.redemption_requested_amt,
      re.redemption_paid_pct, re.redemption_paid_amt, re.gate_threshold_pct,
      COALESCE(re.status, 'tracking') AS status,
      COALESCE(re.response_detail, 'Awaiting first redemption entry') AS response_detail
    FROM funds f
    LEFT JOIN redemption_events re ON re.id = (
      SELECT re2.id
      FROM redemption_events re2
      WHERE re2.fund_id = f.id
      ORDER BY re2.date DESC, re2.id DESC
      LIMIT 1
    )
    WHERE f.id = ?
  `).get(fundId);
}

/**
 * @param {number} fundId
 * @returns {object|undefined}
 */
function getFundById(fundId) {
  return getDb().prepare('SELECT * FROM funds WHERE id = ?').get(fundId);
}

router.get('/', (req, res) => {
  const items = getDb().prepare(`
    SELECT f.id, f.name, f.ticker, f.manager, f.aum_billions, f.fund_type,
      re.quarter, re.redemption_requested_pct, re.redemption_requested_amt,
      re.redemption_paid_pct, re.redemption_paid_amt, re.gate_threshold_pct,
      COALESCE(re.status, 'tracking') AS status,
      COALESCE(re.response_detail, 'Awaiting first redemption entry') AS response_detail
    FROM funds f
    LEFT JOIN redemption_events re ON re.id = (
      SELECT re2.id
      FROM redemption_events re2
      WHERE re2.fund_id = f.id
      ORDER BY re2.date DESC, re2.id DESC
      LIMIT 1
    )
    ORDER BY f.aum_billions DESC, f.name ASC
  `).all();

  res.json({ items, count: items.length });
});

router.post('/', (req, res) => {
  try {
    const name = requiredText(req.body?.name, 'name', 160);
    const manager = requiredText(req.body?.manager, 'manager', 120);
    const ticker = normalizeTicker(req.body?.ticker);
    const aumBillions = numericField(req.body?.aum_billions, 'aum_billions');
    const fundType = validateFundType(req.body?.fund_type);

    const result = getDb().prepare(`
      INSERT INTO funds (name, ticker, manager, aum_billions, fund_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, ticker, manager, aumBillions, fundType);

    const created = getFundSummaryById(Number(result.lastInsertRowid));
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post('/:id/redemptions', (req, res) => {
  try {
    const fundId = parseId(req.params.id);
    const fund = getFundById(fundId);

    if (!fund) {
      res.status(404).json({ error: `Fund ${fundId} not found` });
      return;
    }

    const quarter = validateQuarter(req.body?.quarter);
    const date = validateDate(req.body?.date, 'date');
    const requestedPct = numericField(req.body?.redemption_requested_pct, 'redemption_requested_pct');
    const requestedAmt = numericField(req.body?.redemption_requested_amt, 'redemption_requested_amt');
    const paidPct = numericField(req.body?.redemption_paid_pct, 'redemption_paid_pct');
    const paidAmt = numericField(req.body?.redemption_paid_amt, 'redemption_paid_amt');
    const gateThresholdPct = numericField(req.body?.gate_threshold_pct, 'gate_threshold_pct') ?? 5;
    const status = validateRedemptionStatus(req.body?.status);
    const responseDetail = optionalText(req.body?.response_detail, 500);
    const source = optionalText(req.body?.source, 1000);

    const result = getDb().prepare(`
      INSERT INTO redemption_events (
        fund_id,
        quarter,
        date,
        redemption_requested_pct,
        redemption_requested_amt,
        redemption_paid_pct,
        redemption_paid_amt,
        gate_threshold_pct,
        status,
        response_detail,
        source
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fundId,
      quarter,
      date,
      requestedPct,
      requestedAmt,
      paidPct,
      paidAmt,
      gateThresholdPct,
      status,
      responseDetail,
      source,
    );

    const redemption = getDb().prepare('SELECT * FROM redemption_events WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({
      fund: getFundSummaryById(fundId),
      redemption,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

module.exports = router;
