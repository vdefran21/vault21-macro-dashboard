const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const { initSchema, close } = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, url: req.url, status: res.statusCode, ms: Date.now() - start });
  });
  next();
});

// Initialize database schema
initSchema();

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/health', require('./routes/health'));

// Root — serve status page in dev, static frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');

app.get('/', (req, res) => {
  // If built frontend exists, serve it
  const indexPath = path.join(clientDist, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // Otherwise serve a dev status page
  const { getDb } = require('./db');
  const db = getDb();
  const eventCount = db.prepare('SELECT COUNT(*) as c FROM events').get().c;
  const fundCount = db.prepare('SELECT COUNT(*) as c FROM funds').get().c;
  const latestEvent = db.prepare('SELECT date, event, severity FROM events ORDER BY date DESC, severity DESC LIMIT 1').get();

  res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>vault21 macro dashboard</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0e17;color:#f1f5f9;font-family:'Courier New',monospace;padding:40px 24px}
  h1{color:#ef4444;font-size:20px;letter-spacing:2px;margin-bottom:4px}
  .sub{color:#334155;font-size:11px;letter-spacing:1px;margin-bottom:24px}
  .banner{color:#f59e0b;font-size:11px;letter-spacing:.5px;margin-bottom:32px;padding:8px 12px;background:rgba(245,158,11,.08);border:1px solid #92400e;border-radius:4px}
  .card{background:#111827;border:1px solid #1e293b;border-radius:6px;padding:20px 24px;margin-bottom:16px}
  .card h2{color:#f59e0b;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
  .stat{display:inline-block;text-align:center;padding:12px 16px;background:rgba(255,255,255,.02);border:1px solid #1e293b;border-radius:4px;margin:4px 8px 4px 0;min-width:120px}
  .stat .val{font-size:22px;font-weight:700;line-height:1.1}
  .stat .lbl{font-size:10px;color:#64748b;margin-top:4px}
  .green{color:#10b981}.red{color:#ef4444}.amber{color:#f59e0b}.cyan{color:#06b6d4}.white{color:#f1f5f9}
  a{color:#3b82f6;text-decoration:none}a:hover{text-decoration:underline}
  .endpoints{list-style:none;padding:0}
  .endpoints li{padding:6px 0;border-bottom:1px solid #1e293b;font-size:13px}
  .endpoints li:last-child{border:none}
  .method{color:#10b981;font-weight:700;margin-right:8px}
  .path{color:#06b6d4}
  .desc{color:#64748b;margin-left:8px;font-size:11px}
  .event{padding:8px 12px;background:rgba(239,68,68,.06);border:1px solid #991b1b;border-radius:4px;margin-top:8px;font-size:12px}
  .event .date{color:#06b6d4}.event .sev{color:#ef4444;float:right}
</style>
</head><body>
<h1>PRIVATE CREDIT CRISIS</h1>
<div class="sub">VAULT21 MACRO INTELLIGENCE — SERVER STATUS</div>
<div class="banner">$1.8T INDUSTRY UNDER STRESS — GATING CASCADE ACTIVE — BANK LEVERAGE CONTRACTING</div>

<div class="card">
  <h2>Database Status</h2>
  <div class="stat"><div class="val green">ONLINE</div><div class="lbl">STATUS</div></div>
  <div class="stat"><div class="val white">${eventCount}</div><div class="lbl">EVENTS</div></div>
  <div class="stat"><div class="val white">${fundCount}</div><div class="lbl">FUNDS</div></div>
  <div class="stat"><div class="val amber">${Math.floor(process.uptime())}s</div><div class="lbl">UPTIME</div></div>
  ${latestEvent ? `<div class="event"><span class="date">${latestEvent.date}</span> — ${latestEvent.event} <span class="sev">SEV ${latestEvent.severity}/6</span></div>` : ''}
</div>

<div class="card">
  <h2>API Endpoints</h2>
  <ul class="endpoints">
    <li><span class="method">GET</span><a class="path" href="/api/dashboard">/api/dashboard</a><span class="desc">Full payload</span></li>
    <li><span class="method">GET</span><a class="path" href="/api/dashboard/overview">/api/dashboard/overview</a><span class="desc">Stats, rates, PIK, maturity</span></li>
    <li><span class="method">GET</span><a class="path" href="/api/dashboard/redemptions">/api/dashboard/redemptions</a><span class="desc">Fund scorecard, flows</span></li>
    <li><span class="method">GET</span><a class="path" href="/api/dashboard/contagion">/api/dashboard/contagion</a><span class="desc">Chain, banks, equities</span></li>
    <li><span class="method">GET</span><a class="path" href="/api/dashboard/timeline">/api/dashboard/timeline</a><span class="desc">Events, severity chart</span></li>
    <li><span class="method">GET</span><a class="path" href="/api/health">/api/health</a><span class="desc">Health check</span></li>
  </ul>
</div>

<div class="card">
  <h2>Next Steps</h2>
  <p style="font-size:12px;color:#64748b;line-height:1.6">
    Phase 1 complete — API server + SQLite with seed data.<br>
    Phase 2: Live data scrapers (Yahoo Finance, FRED, SEC EDGAR, news RSS).<br>
    Phase 3: React frontend replicating the prototype dashboard.
  </p>
</div>
</body></html>`);
});

// Serve static assets if frontend is built
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Start server
const server = app.listen(config.port, () => {
  logger.info(`vault21 dashboard server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  server.close(() => {
    close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
