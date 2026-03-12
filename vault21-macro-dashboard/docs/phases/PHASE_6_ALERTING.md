# Phase 6: Alerting + Monitoring (Optional)

**Status:** NOT STARTED
**Prereqs:** Phase 3 (refresh pipeline), Phase 4 (scheduler)
**Architecture ref:** [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Goal

Proactive notifications when thresholds are breached.

---

## Tasks

1. **Define alert thresholds in config:**
   - Any fund redemption request > 5%
   - New severity 5+ event detected
   - VIX spike > 20% single day
   - New BDC gating disclosure in SEC filings
   - Alt manager equity drawdown exceeds threshold

2. **Build `alertEngine.js`** (`server/services/notifications/alertEngine.js`)
   - Evaluates thresholds after each refresh cycle
   - Compares current values against configured thresholds
   - Deduplicates alerts (don't re-fire for same condition)

3. **Implement notification channels:**
   - Webhook (Slack, Discord) — `ALERT_WEBHOOK_URL` env var
   - Email via Nodemailer (optional) — `ALERT_EMAIL` env var
   - Console/log alert (always on)

4. **Add alert history to dashboard UI**
   - New section or tab showing triggered alerts
   - Timestamp, condition, current value, threshold

---

## Verification

```bash
# Manually trigger a threshold breach (e.g., insert a sev-5 event)
curl -X POST http://localhost:3001/api/events \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-03-13","event":"Test alert trigger","severity":5,"category":"gating"}'

# Check that alert fires in logs
pm2 logs vault21-dashboard | grep ALERT
```
