// @ts-check

const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

/**
 * @param {unknown} value
 * @returns {number}
 */
function parseLimit(value) {
  const parsed = Number.parseInt(String(value || '500'), 10);
  return Math.min(Math.max(parsed || 500, 1), 5000);
}

router.get('/latest', (req, res) => {
  const items = getDb().prepare(`
    SELECT m.*
    FROM metrics m
    WHERE m.id = (
      SELECT m2.id
      FROM metrics m2
      WHERE m2.metric_name = m.metric_name
      ORDER BY m2.date DESC, m2.id DESC
      LIMIT 1
    )
    ORDER BY m.metric_name ASC
  `).all();

  res.json({ items, count: items.length });
});

router.get('/:name/history', (req, res) => {
  const metricName = typeof req.params.name === 'string' ? req.params.name.trim() : '';

  if (!metricName) {
    res.status(400).json({ error: 'Metric name is required' });
    return;
  }

  const limit = parseLimit(req.query.limit);
  const items = getDb().prepare(`
    SELECT *
    FROM metrics
    WHERE metric_name = ?
    ORDER BY date ASC, id ASC
    LIMIT ?
  `).all(metricName, limit);

  res.json({
    metric_name: metricName,
    items,
    count: items.length,
  });
});

module.exports = router;
