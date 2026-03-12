# Phase 4: Scheduler + Process Management

**Status:** NOT STARTED
**Prereqs:** Phase 3 (refresh pipeline must be working)
**Architecture ref:** [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Goal

Automated refresh on schedule, resilient to crashes. PM2 for process management.

---

## Tasks

1. **Implement `scheduler.js`** (`server/services/scheduler.js`) with node-cron schedules
2. **Initialize scheduler on server startup** (call from `server/index.js`)
3. **Add `GET /api/refresh/status` endpoint** — latest + history of refresh runs
4. **Create PM2 ecosystem config:**
   ```javascript
   // pm2.ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'vault21-dashboard',
       script: './server/index.js',
       env: { NODE_ENV: 'production' },
       log_date_format: 'YYYY-MM-DD HH:mm:ss',
       max_memory_restart: '500M',
       cron_restart: '0 3 * * *',  // Daily 3am restart for clean state
     }]
   };
   ```
5. **Create `scripts/setup.sh`** — first-time setup (install deps, create db, seed)
6. **Create `scripts/backup-db.sh`** — SQLite backup to timestamped file in `data/backups/`
7. **Add graceful shutdown handling** — close DB, stop scheduler (partially done in Phase 1)
8. **Test:** verify scheduled refreshes fire correctly over a 4-hour window

---

## Dependencies

```bash
npm install node-cron pm2
```

---

## Cron Schedules

```javascript
const SCHEDULES = {
  // Full refresh every 2 hours during market hours (Mon-Fri 8am-7pm ET)
  marketHours: '0 */2 8-19 * * 1-5',

  // Light refresh (equity prices only) every 30 min during market hours
  priceCheck: '*/30 * 9-16 * * 1-5',

  // Full refresh twice daily on weekends (catch overnight/intl developments)
  weekends: '0 9,18 * * 0,6',

  // News-only sweep every 4 hours 24/7
  newsSweep: '0 */4 * * *',
};
```

---

## Verification

```bash
# Start with PM2
pm2 start pm2.ecosystem.config.js
pm2 status
pm2 logs vault21-dashboard

# Verify scheduled refresh fires
# Wait for next cron trigger, then check:
curl http://localhost:3001/api/refresh/status
```
