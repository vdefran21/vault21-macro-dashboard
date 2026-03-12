# vault21 macro dashboard — Architecture Reference

Shared reference for all implementation phases. Read this first, then the relevant phase doc.

Full plan: [../IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
Status tracking: [PLAN_STATUS.md](./PLAN_STATUS.md)
Prototype: [../private_credit_crisis_dashboard.jsx](../../private_credit_crisis_dashboard.jsx)

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Overview  │ │Redemption│ │Contagion │ │  Timeline    │   │
│  │  Panel    │ │ Tracker  │ │  Chain   │ │   + Events   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                         ▲                                   │
│                         │ REST API / WebSocket               │
├─────────────────────────┼───────────────────────────────────┤
│                   Backend (Node/Express)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  API     │ │ Scheduler│ │  Data    │ │   Scraper    │   │
│  │ Routes   │ │ (cron)   │ │ Pipeline │ │   Engine     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                         │                                   │
│                         ▼                                   │
│              ┌─────────────────────┐                        │
│              │   SQLite Database   │                        │
│              │  (local, portable)  │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite | Fast dev, prototype already in React/JSX |
| Charts | Recharts | Already used in prototype, solid for financial data |
| Styling | Tailwind CSS | Utility-first, fast iteration on dense data layouts |
| Backend | Node.js + Express | Single runtime with frontend, simple deployment |
| Scheduler | node-cron | In-process scheduling, no external dependencies |
| Database | SQLite via better-sqlite3 | Zero-config, portable, file-based, perfect for single-user |
| Scraping | Cheerio + node-fetch | Lightweight HTML parsing for news/data extraction |
| API Data | Anthropic API (Claude) | Structured data extraction from unstructured news sources |
| Process Mgmt | PM2 | Keeps backend alive, handles restarts, log management |

---

## Directory Structure

```
vault21-macro-dashboard/
├── package.json
├── shared/
│   └── contracts.js             # Shared JSDoc API contracts for checkJs
├── .env                          # API keys, config (gitignored)
├── .env.example                  # Template for env vars
├── pm2.ecosystem.config.js       # PM2 process configuration (Phase 5)
├── tsconfig.typecheck.server.json # Incremental server-side JS type checking
├── tsconfig.typecheck.client.json # Incremental client-side JS type checking
│
├── docs/
│   ├── ARCHITECTURE.md           # This file
│   ├── PLAN_STATUS.md            # Progress tracking
│   └── phases/                   # Per-phase implementation specs
│       ├── PHASE_1_FOUNDATION.md
│       ├── PHASE_2_FRONTEND.md
│       ├── PHASE_3_PIPELINE.md
│       ├── PHASE_4_MANUAL_ENTRY.md
│       ├── PHASE_5_SCHEDULER.md
│       └── PHASE_6_ALERTING.md
│
├── server/
│   ├── index.js                  # Express server entry point
│   ├── config.js                 # Environment config loader
│   ├── db/
│   │   ├── schema.sql            # Database schema
│   │   ├── migrations/           # Schema migrations
│   │   ├── index.js              # Database connection + query helpers
│   │   └── seed.js               # Initial data seeding (historical events)
│   ├── routes/
│   │   ├── dashboard.js          # GET /api/dashboard — full dashboard payload
│   │   ├── events.js             # CRUD /api/events — timeline events (Phase 4)
│   │   ├── funds.js              # CRUD /api/funds — fund redemption data (Phase 4)
│   │   ├── metrics.js            # GET /api/metrics — aggregate statistics (Phase 4)
│   │   ├── refresh.js            # POST /api/refresh — manual data refresh (Phase 3)
│   │   └── health.js             # GET /api/health — system status
│   ├── services/
│   │   ├── scheduler.js          # node-cron job definitions (Phase 5)
│   │   ├── refreshPipeline.js    # Orchestrates full data refresh cycle (Phase 3)
│   │   ├── scrapers/             # (Phase 3)
│   │   │   ├── yahoo.js          # Yahoo Finance equity prices
│   │   │   ├── fred.js           # FRED API for macro indicators
│   │   │   ├── sec.js            # SEC EDGAR BDC filings
│   │   │   ├── bloomberg.js      # Bloomberg headlines
│   │   │   ├── cnbc.js           # CNBC coverage
│   │   │   └── reuters.js        # Reuters wire service
│   │   ├── enrichment/           # (Phase 3)
│   │   │   ├── claudeExtractor.js
│   │   │   └── eventClassifier.js
│   │   ├── ingestion/            # (Phase 3)
│   │   │   └── store.js          # Deduping + persistence for extracted events/metrics
│   │   └── notifications/        # (Phase 6)
│   │       └── alertEngine.js
│   └── utils/
│       ├── logger.js             # Structured logging (pino)
│       ├── rateLimiter.js        # Rate limiting for external API calls (Phase 3)
│       └── dateUtils.js          # Date normalization helpers (Phase 3)
│
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── layout/           # Header, TabNavigation, StatusBar
│       │   ├── overview/         # StatGrid, DefaultRateChart, SectorExposure, PIKTrend, MaturityWall
│       │   ├── redemptions/      # FundScorecard, FundManagementPanel, RedemptionRateChart, DollarFlowChart, StatusBadge
│       │   ├── contagion/        # TransmissionChain, BankExposure, AltManagerEquity
│       │   ├── timeline/         # ReviewQueue, SeverityChart, EventLog, EventForm
│       │   └── shared/           # Card, ChartTooltip, LoadingSpinner
│       ├── hooks/                # useDashboardData, useAutoRefresh, useWebSocket
│       ├── lib/                  # api.js, constants.js, formatters.js
│       └── styles/               # globals.css
│
├── scripts/
│   ├── setup.sh                  # (Phase 5)
│   ├── refresh.sh                # (Phase 5)
│   └── backup-db.sh              # (Phase 5)
│
└── data/
    ├── vault21.db                # SQLite database (gitignored)
    └── backups/                  # (gitignored)
```

---

## Database Schema

8 tables with 6 indexes. WAL mode, foreign keys enabled.

### Tables

**events** — Core timeline events
- `id`, `date` (ISO 8601), `event_time` (optional `HH:mm`), `event`, `severity` (1-6), `category`, `source`, `source_name`, `verified`, `auto_generated`, `notes`, `created_at`, `updated_at`
- Categories: `redemption`, `gating`, `bankruptcy`, `regulatory`, `bank_action`, `market_move`, `analyst_warning`, `policy`

**funds** — Fund profiles
- `id`, `name`, `ticker`, `manager`, `aum_billions`, `fund_type` (BDC, interval_fund, semi_liquid), `created_at`

**redemption_events** — Per-fund quarterly redemption data
- `id`, `fund_id` (FK → funds), `quarter`, `date`, `redemption_requested_pct`, `redemption_requested_amt`, `redemption_paid_pct`, `redemption_paid_amt`, `gate_threshold_pct` (default 5.0), `status` (fulfilled/extraordinary/gated/liquidating/pending), `response_detail`, `source`, `created_at`
- **Status taxonomy:**
  - `fulfilled` — Met all requests within normal operating parameters
  - `extraordinary` — Technically met requests but required emergency measures (raised tender caps, firm capital injection, etc.) — not repeatable at scale. This is itself a severity signal.
  - `gated` — Invoked quarterly redemption cap, partial fulfillment only
  - `liquidating` — Permanently gated, entering wind-down
  - `pending` — Quarter not yet complete

**metrics** — Time-series key metrics
- `id`, `date`, `metric_name`, `metric_value`, `unit` (percent, billions_usd, ratio, index), `source`, `created_at`
- Tracked: `industry_aum`, `bank_lending_to_pc`, `maturity_wall_*`, `software_loan_share_pct`, `headline_default_rate`, `true_default_rate`, `pik_income_pct`, `sector_*`, `default_rate_*`, `vix`, `sp500`, `10yr_yield`

**equity_prices** — Alt manager stock performance
- `id`, `ticker`, `date`, `close_price`, `change_pct`, `ytd_pct`, `from_high_pct`, `source`, `created_at`
- UNIQUE(ticker, date)

**bank_exposures** — Bank lending exposure
- `id`, `bank_name`, `exposure_billions`, `date_reported`, `detail`, `source`, `created_at`

**contagion_layers** — Six-layer transmission chain
- `id`, `layer_order`, `layer_name`, `detail`, `risk_description`, `exposure_label`, `severity` (1-6), `last_updated`

**refresh_log** — Data refresh audit trail
- `id`, `trigger_type` (manual/scheduled/startup), `started_at`, `completed_at`, `status` (running/success/partial/failed), `sources_attempted`, `sources_succeeded`, `events_added`, `errors` (JSON), `duration_ms`

### Indexes
```sql
idx_events_date          ON events(date DESC)
idx_events_category      ON events(category)
idx_metrics_name_date    ON metrics(metric_name, date DESC)
idx_equity_ticker_date   ON equity_prices(ticker, date DESC)
idx_redemption_fund      ON redemption_events(fund_id, date DESC)
idx_refresh_log_date     ON refresh_log(started_at DESC)
```

Full SQL: `server/db/schema.sql`

---

## API Contract

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard` | Full dashboard payload (all tabs) |
| `GET` | `/api/dashboard/overview` | Overview tab data only |
| `GET` | `/api/dashboard/redemptions` | Redemption tab data only |
| `GET` | `/api/dashboard/contagion` | Contagion tab data only |
| `GET` | `/api/dashboard/timeline` | Timeline tab data only |
| `POST` | `/api/refresh` | Trigger manual refresh (Phase 3) |
| `GET` | `/api/refresh/status` | Refresh status + history (Phase 5) |
| `GET` | `/api/health` | System health check |

### Data Management Endpoints (Phase 4)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | List events (filterable) |
| `POST` | `/api/events` | Add manual event |
| `PUT` | `/api/events/:id` | Update event |
| `DELETE` | `/api/events/:id` | Remove event |
| `GET` | `/api/funds` | List tracked funds |
| `POST` | `/api/funds` | Add fund |
| `POST` | `/api/funds/:id/redemptions` | Add redemption event |
| `GET` | `/api/metrics/latest` | Latest value per metric |
| `GET` | `/api/metrics/:name/history` | Historical series |

### Dashboard Payload Shape (`GET /api/dashboard`)

```json
{
  "meta": {
    "last_refresh": "ISO timestamp",
    "refresh_status": "success|partial|seed",
    "data_freshness": { "prices": "...", "news": "...", "sec_filings": "..." }
  },
  "overview": {
    "stats": { "industry_aum": { "value": 1800, "unit": "T", "as_of": "..." }, ... },
    "default_rates": [{ "year": "...", "headline": 1.8, "true": 2.6, "label": "..." }],
    "sector_exposure": [{ "name": "Software/SaaS", "value": 40 }],
    "pik_trend": [{ "quarter": "Q1 2024", "pik": 5.2 }],
    "maturity_wall": [{ "year": "2026", "amount": 162 }]
  },
  "redemptions": {
    "funds": [{ "name": "...", "aum_billions": 82, "status": "extraordinary", ... }],
    "rate_chart": [{ "fund": "BCRED", "requested": 7.9, "paid": 7.9 }],
    "dollar_flows": [{ "fund": "...", "requested": 3.8, "returned": 3.8 }]
  },
  "contagion": {
    "chain": [{ "layer_order": 1, "layer_name": "Borrowers", "severity": 3, ... }],
    "bank_exposures": [{ "bank_name": "JPMorgan", "exposure_billions": 22.2, ... }],
    "alt_manager_equity": [{ "ticker": "OWL", "ytd_pct": -27, "from_high_pct": -60 }]
  },
  "timeline": {
    "events": [{ "date": "...", "event_time": "09:15", "event": "...", "severity": 6, "category": "...", "verified": 1 }],
    "review_queue": [{ "date": "...", "event": "...", "severity": 4, "auto_generated": 1, "verified": 0 }],
    "severity_chart": [{ "chart_key": "2026-03-12__09:15__88", "date": "...", "event_time": "09:15", "event": "...", "severity": 6 }]
  }
}
```

`timeline.events` and `timeline.severity_chart` contain the official chronology (manual events plus approved auto-generated events). `timeline.review_queue` contains pending auto-generated candidates that still require manual review.

---

## Severity Scale

| Level | Meaning | Examples |
|-------|---------|---------|
| 1 | Minor industry news, no market impact | Tricolor funding strains |
| 2 | Notable event, limited market impact | First Brands collateral fraud |
| 3 | Significant stress signal, moderate reaction | Rubric "Enron" letter, Deutsche Bank disclosure |
| 4 | Major fund action, broad attention | Blue Owl gates OBDC II, MFS collapse |
| 5 | Systemic event, cross-market contagion | BCRED 7.9% redemptions, HLEND gating, VIX +32% |
| 6 | Phase transition | JPMorgan marks down software loan collateral |

---

## Design Decisions

- **SQLite over Postgres** — Single-user tool. Zero-config, file-based, easy backup.
- **Claude API over regex** — Financial news is messy. Claude extraction is more robust and self-healing. ~$0.10-0.50/day.
- **node-cron over external scheduler** — Everything in-process. PM2 handles lifecycle.
- **No auth layer** — Single-user, local/private server. Add API key middleware if exposed later.
- **Severity 1-6 scale** — Matches analytical framework. Intentionally narrow to force differentiation.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `DB_PATH` | No | SQLite path (default: ./data/vault21.db) |
| `ANTHROPIC_API_KEY` | Phase 3+ | Claude API for news extraction |
| `FRED_API_KEY` | Phase 3+ | FRED macro data |
| `SEC_USER_AGENT` | Phase 3+ | Required by SEC EDGAR |
| `CLAUDE_MODEL` | No | Default: claude-sonnet-4-20250514 |
| `REFRESH_TIMEOUT_MS` | No | Default: 120000 |
| `MAX_SCRAPE_CONCURRENT` | No | Default: 3 |

Full template: `.env.example`

---

## Deployment

**Development:**
```bash
npm run dev              # Backend (nodemon, port 3001)
cd client && npm run dev # Frontend (Vite, proxies /api to 3001)
```

**Production:**
```bash
cd client && npm run build
NODE_ENV=production pm2 start pm2.ecosystem.config.js
```

Express serves the Vite build as static files in production.
