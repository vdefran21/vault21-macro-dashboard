# vault21 macro dashboard — Plan Status & Tracking

**Implementation Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
**Last Updated:** 2026-03-12

---

## Phase Overview

| Phase | Name | Status | Started | Completed |
|-------|------|--------|---------|-----------|
| 1 | Foundation (Backend + Database) | COMPLETE | 2026-03-12 | 2026-03-12 |
| 2 | Frontend Migration | NOT STARTED | — | — |
| 3 | Data Collection Pipeline | NOT STARTED | — | — |
| 4 | Scheduler + Process Management | NOT STARTED | — | — |
| 5 | Manual Data Entry + Event Management | NOT STARTED | — | — |
| 6 | Alerting + Monitoring (Optional) | NOT STARTED | — | — |

---

## Phase 1: Foundation (Backend + Database) — COMPLETE

Ref: `IMPLEMENTATION_PLAN.md` → "Phase 1: Foundation (Backend + Database)"

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Initialize project: `npm init`, install dependencies | DONE | express, better-sqlite3, cors, dotenv, pino, pino-pretty, nodemon |
| 2 | Create SQLite database with full schema | DONE | 8 tables, 6 indexes, WAL mode, foreign keys |
| 3 | Write `seed.js` with all historical data | DONE | 15 events, 4 funds, 4 redemptions, 35 metrics, 6 equity snapshots, 4 bank exposures, 6 contagion layers |
| 4 | Build Express server with `/api/dashboard` endpoint | DONE | Full payload + per-tab sub-endpoints (overview, redemptions, contagion, timeline) |
| 5 | Build `/api/health` endpoint | DONE | Returns status, uptime, record counts, last refresh |
| 6 | Add pino logger | DONE | Pretty-printing in dev, structured JSON in production |
| 7 | Test: `curl localhost:3001/api/dashboard` returns full payload | DONE | All sections verified: meta, overview, redemptions, contagion, timeline |

**Additional work beyond plan scope:**
- Root route (`/`) serves a styled dev status page with clickable API links when no frontend build exists
- README.md created with quick start, project structure, API docs, and data notes

**Files created:**
```
vault21-macro-dashboard/
├── package.json
├── .env
├── .env.example
├── .gitignore
├── server/
│   ├── index.js
│   ├── config.js
│   ├── db/
│   │   ├── schema.sql
│   │   ├── index.js
│   │   └── seed.js
│   ├── routes/
│   │   ├── dashboard.js
│   │   └── health.js
│   └── utils/
│       └── logger.js
├── client/src/           (empty, Phase 2)
├── data/vault21.db       (gitignored)
└── README.md
```

---

## Phase 2: Frontend Migration — NOT STARTED

Ref: `IMPLEMENTATION_PLAN.md` → "Phase 2: Frontend Migration"

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Scaffold Vite React project in `client/` | — | |
| 2 | Install Tailwind CSS, Recharts | — | |
| 3 | Decompose prototype into component tree | — | Source: `private_credit_crisis_dashboard.jsx` |
| 4 | Replace hardcoded data with `useDashboardData` hook | — | |
| 5 | Add loading states, error handling | — | |
| 6 | Add manual refresh button in header | — | |
| 7 | Add `StatusBar` showing last refresh time | — | |
| 8 | Add Vite proxy config for `/api` → Express | — | |
| 9 | Port dark theme color system to Tailwind config | — | |
| 10 | Test: full dashboard renders from API data | — | |

---

## Phase 3: Data Collection Pipeline — NOT STARTED

Ref: `IMPLEMENTATION_PLAN.md` → "Phase 3: Data Collection Pipeline"

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Yahoo Finance scraper (equity prices) | — | Tickers: OWL, BX, KKR, ARES, BLK, APO, GLD, SPY, BTC-USD |
| 2 | FRED API client (macro indicators) | — | Series: VIXCLS, DGS10, BAMLH0A0HYM2 |
| 3 | SEC EDGAR scraper (BDC filings) | — | 8-K filings, redemption disclosures |
| 4 | News scraper framework | — | Google News RSS, Cheerio extraction, deduplication |
| 5 | Claude extraction service | — | Anthropic API structured extraction |
| 6 | `refreshPipeline.js` orchestrator | — | Promise.allSettled, scoped refresh, error isolation |
| 7 | Wire up `POST /api/refresh` endpoint | — | |
| 8 | Test: manual refresh pulls real data | — | |

---

## Phase 4: Scheduler + Process Management — NOT STARTED

Ref: `IMPLEMENTATION_PLAN.md` → "Phase 4: Scheduler + Process Management"

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Implement `scheduler.js` with node-cron | — | Market hours, price check, weekends, news sweep |
| 2 | Initialize scheduler on server startup | — | |
| 3 | Add `GET /api/refresh/status` endpoint | — | |
| 4 | Create PM2 ecosystem config | — | |
| 5 | Create `scripts/setup.sh` | — | |
| 6 | Create `scripts/backup-db.sh` | — | |
| 7 | Add graceful shutdown handling | — | Already partially done in Phase 1 (SIGTERM/SIGINT) |
| 8 | Test: scheduled refreshes fire over 4-hour window | — | |

---

## Phase 5: Manual Data Entry + Event Management — NOT STARTED

Ref: `IMPLEMENTATION_PLAN.md` → "Phase 5: Manual Data Entry + Event Management"

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Build `EventForm.jsx` modal | — | |
| 2 | Add inline edit to `EventLog.jsx` | — | |
| 3 | Build fund management panel | — | |
| 4 | "Quick add" from news review queue | — | |
| 5 | Wire up all CRUD endpoints | — | |
| 6 | Test: manual event appears in timeline | — | |

---

## Phase 6: Alerting + Monitoring (Optional) — NOT STARTED

Ref: `IMPLEMENTATION_PLAN.md` → "Phase 6: Alerting + Monitoring (Optional)"

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Define alert thresholds in config | — | |
| 2 | Build `alertEngine.js` | — | |
| 3 | Implement notification channels | — | Webhook, email, console |
| 4 | Add alert history to dashboard UI | — | |

---

## Seed Data Inventory

Cross-ref: `IMPLEMENTATION_PLAN.md` → "Seed Data Script Reference"

| Table | Records | Coverage |
|-------|---------|----------|
| events | 15 | Nov 2024 — Mar 12, 2026 (plan specified 13 + 2 additional from Mar 12 session) |
| funds | 4 | BCRED ($82B), HLEND ($26B), Cliffwater ($33B), OBDC II ($1.6B) |
| redemption_events | 4 | Q1 2026 data for all 4 funds |
| metrics | 35 | PIK trend (9 quarters), default rates (6), sector exposure (6), maturity wall (4), top-line stats (11) |
| equity_prices | 6 | OWL, BX, KKR, ARES, BLK, APO — YTD and from-high snapshots |
| bank_exposures | 4 | JPMorgan ($22.2B), Deutsche Bank ($30B), Barclays ($18B), Goldman ($15B) |
| contagion_layers | 6 | Borrowers → Funds → Retail → Banks → Equities → Broad Markets |

---

## Known Issues & Deviations

- **Barclays/Goldman exposure figures** are estimates based on proportional reporting (noted in README)
- **Alt manager drawdowns** (BX -40%, KKR -35%) are directional — will be replaced with live data in Phase 3
- **Schema includes `refresh_log` table** but refresh pipeline not yet built (Phase 3)
- **Graceful shutdown** partially implemented in Phase 1; full PM2 integration deferred to Phase 4
- **Plan specified `claude-sonnet-4-20250514`** as default model — set in `.env`

---

## Change Log

| Date | Change | Phase |
|------|--------|-------|
| 2026-03-12 | Phase 1 complete: Express server, SQLite schema, seed data, dashboard + health API | 1 |
| 2026-03-12 | Root route dev status page added (not in original plan) | 1 |
| 2026-03-12 | README.md created with project docs | — |
| 2026-03-12 | PLAN_STATUS.md created | — |
