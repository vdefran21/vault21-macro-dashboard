const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const eventCount = db.prepare('SELECT COUNT(*) as c FROM events').get().c;
    const fundCount = db.prepare('SELECT COUNT(*) as c FROM funds').get().c;
    const lastRefresh = db.prepare('SELECT completed_at FROM refresh_log ORDER BY started_at DESC LIMIT 1').get();

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      database: {
        connected: true,
        events: eventCount,
        funds: fundCount,
      },
      last_refresh: lastRefresh?.completed_at || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
