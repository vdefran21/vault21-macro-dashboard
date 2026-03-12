# vault21 macro dashboard — Plan Status & Tracking

**Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
**Full plan:** [../IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
**Phase specs:** [phases/](./phases/)
**Last Updated:** 2026-03-12

---

## Phase Overview

| Phase | Name | Spec | Status | Started | Completed |
|-------|------|------|--------|---------|-----------|
| 1 | Foundation (Backend + Database) | [PHASE_1](./phases/PHASE_1_FOUNDATION.md) | COMPLETE | 2026-03-12 | 2026-03-12 |
| 2 | Frontend Migration | [PHASE_2](./phases/PHASE_2_FRONTEND.md) | COMPLETE | 2026-03-12 | 2026-03-12 |
| 3 | Data Collection Pipeline | [PHASE_3](./phases/PHASE_3_PIPELINE.md) | NOT STARTED | — | — |
| 4 | Scheduler + Process Management | [PHASE_4](./phases/PHASE_4_SCHEDULER.md) | NOT STARTED | — | — |
| 5 | Manual Data Entry + Event Management | [PHASE_5](./phases/PHASE_5_MANUAL_ENTRY.md) | NOT STARTED | — | — |
| 6 | Alerting + Monitoring (Optional) | [PHASE_6](./phases/PHASE_6_ALERTING.md) | NOT STARTED | — | — |

---

## Phase 1: Foundation (Backend + Database) — COMPLETE

Ref: [PHASE_1_FOUNDATION.md](./phases/PHASE_1_FOUNDATION.md)

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
├── client/               (see Phase 2 file listing)
├── data/vault21.db       (gitignored)
└── README.md
```

---

## Phase 2: Frontend Migration — COMPLETE

Ref: [PHASE_2_FRONTEND.md](./phases/PHASE_2_FRONTEND.md)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Scaffold Vite React project in `client/` | DONE | Vite 6 + React 18, `client/package.json` |
| 2 | Install Tailwind CSS, Recharts | DONE | Tailwind v3 + PostCSS + autoprefixer, recharts 2.x |
| 3 | Decompose prototype into component tree | DONE | 17 components across 6 dirs (shared, layout, overview, redemptions, contagion, timeline) |
| 4 | Replace hardcoded data with `useDashboardData` hook | DONE | `hooks/useDashboardData.js` — auto-polls every 5 min |
| 5 | Add loading states, error handling | DONE | `LoadingSpinner.jsx`, error state with retry in `App.jsx` |
| 6 | Add manual refresh button in header | DONE | `Header.jsx` — shows spinning indicator during refresh |
| 7 | Add `StatusBar` showing last refresh time | DONE | `StatusBar.jsx` — data source + relative time |
| 8 | Add Vite proxy config for `/api` → Express | DONE | `vite.config.js` proxy to localhost:3001 |
| 9 | Port dark theme color system to Tailwind config | DONE | `tailwind.config.js` — `vault` color palette matching prototype COLORS |
| 10 | Test: full dashboard renders from API data | DONE | All 4 tabs visually verified via preview: Overview, Redemptions, Contagion, Timeline |

**Files created:**
```
client/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/globals.css
│   ├── lib/
│   │   ├── api.js
│   │   ├── constants.js
│   │   └── formatters.js
│   ├── hooks/
│   │   └── useDashboardData.js
│   └── components/
│       ├── shared/
│       │   ├── Card.jsx
│       │   ├── ChartTooltip.jsx
│       │   ├── LoadingSpinner.jsx
│       │   └── StatusBadge.jsx
│       ├── layout/
│       │   ├── Header.jsx
│       │   ├── TabNavigation.jsx
│       │   └── StatusBar.jsx
│       ├── overview/
│       │   ├── StatGrid.jsx
│       │   ├── DefaultRateChart.jsx
│       │   ├── SectorExposure.jsx
│       │   ├── PIKTrend.jsx
│       │   └── MaturityWall.jsx
│       ├── redemptions/
│       │   ├── FundScorecard.jsx
│       │   ├── RedemptionRateChart.jsx
│       │   └── DollarFlowChart.jsx
│       ├── contagion/
│       │   ├── TransmissionChain.jsx
│       │   ├── BankExposure.jsx
│       │   └── AltManagerEquity.jsx
│       └── timeline/
│           ├── SeverityChart.jsx
│           └── EventLog.jsx
```

**Notes:**
- Tailwind v4 / `@tailwindcss/vite` had peer dep conflict with Vite 6 — used Tailwind v3 + PostCSS instead
- `preview_click` CSS selectors don't reliably trigger React synthetic events — used `dispatchEvent` via eval for tab navigation testing
- Build compiles cleanly: 597 modules, ~596KB bundle

---

## Phase 3: Data Collection Pipeline — NOT STARTED

Ref: [PHASE_3_PIPELINE.md](./phases/PHASE_3_PIPELINE.md)

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

Ref: [PHASE_4_SCHEDULER.md](./phases/PHASE_4_SCHEDULER.md)

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

Ref: [PHASE_5_MANUAL_ENTRY.md](./phases/PHASE_5_MANUAL_ENTRY.md)

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

Ref: [PHASE_6_ALERTING.md](./phases/PHASE_6_ALERTING.md)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Define alert thresholds in config | — | |
| 2 | Build `alertEngine.js` | — | |
| 3 | Implement notification channels | — | Webhook, email, console |
| 4 | Add alert history to dashboard UI | — | |

---

## Seed Data Inventory

Cross-ref: [PHASE_1_FOUNDATION.md](./phases/PHASE_1_FOUNDATION.md) → Seed Data Reference

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
| 2026-03-12 | Docs split: ARCHITECTURE.md + 6 phase files created, PLAN_STATUS.md moved to docs/ | — |
| 2026-03-12 | CLAUDE.md created: project guidance, conventions, testing philosophy, doc standards | — |
| 2026-03-12 | Phase 2 complete: Vite + React + Tailwind + Recharts, 17 components, all 4 tabs verified | 2 |
| 2026-03-12 | Chart legend fix: DefaultRateChart + RedemptionRateChart — custom legends with heat-map color scale swatches | 2 |
| 2026-03-12 | RedemptionRateChart Cell coloring changed from hardcoded index to data-driven (based on requested rate vs gate) | 2 |
| 2026-03-12 | Status taxonomy expanded: added `extraordinary` status for funds that met requests via unsustainable emergency measures (e.g., BCRED $400M backstop). Updated StatusBadge, seed data, ARCHITECTURE.md | 1,2 |
| 2026-03-12 | Dev workflow fix: `npm run dev` now starts both Express (:3001) + Vite (:5173) via `concurrently`. Express no longer serves `client/dist` in dev mode — prevents stale builds from masking frontend changes. Added `concurrently` devDep. Updated CLAUDE.md dev commands. | 1,2 |
