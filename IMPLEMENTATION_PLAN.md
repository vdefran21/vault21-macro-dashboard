# Private Credit Crisis Dashboard — Implementation Plan

## Project: `vault21-macro-dashboard`

**Purpose:** Real-time private credit market stress monitoring dashboard with automated data collection, scheduled refresh, and interactive visualization. Built for a single operator (vault21) running a macro regime analysis framework.

**Design Philosophy:** This is an intelligence tool, not a consumer product. Optimize for information density, data freshness, and operational reliability over polish. The dashboard should feel like a Bloomberg terminal for private credit contagion tracking.

---

## Architecture Overview

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
| Frontend | React 18 + Vite | Fast dev, you already know React from the prototype |
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
├── .env                          # API keys, config (gitignored)
├── .env.example                  # Template for env vars
├── pm2.ecosystem.config.js       # PM2 process configuration
│
├── server/
│   ├── index.js                  # Express server entry point
│   ├── config.js                 # Environment config loader
│   │
│   ├── db/
│   │   ├── schema.sql            # Database schema
│   │   ├── migrations/           # Schema migrations
│   │   ├── index.js              # Database connection + query helpers
│   │   └── seed.js               # Initial data seeding (historical events)
│   │
│   ├── routes/
│   │   ├── dashboard.js          # GET /api/dashboard — full dashboard payload
│   │   ├── events.js             # CRUD /api/events — timeline events
│   │   ├── funds.js              # CRUD /api/funds — fund redemption data
│   │   ├── metrics.js            # GET /api/metrics — aggregate statistics
│   │   ├── refresh.js            # POST /api/refresh — manual data refresh trigger
│   │   └── health.js             # GET /api/health — system status
│   │
│   ├── services/
│   │   ├── scheduler.js          # node-cron job definitions
│   │   ├── refreshPipeline.js    # Orchestrates full data refresh cycle
│   │   ├── scrapers/
│   │   │   ├── bloomberg.js      # Bloomberg headlines + data extraction
│   │   │   ├── cnbc.js           # CNBC private credit coverage
│   │   │   ├── reuters.js        # Reuters wire service
│   │   │   ├── sec.js            # SEC EDGAR BDC filings (8-K, 10-Q)
│   │   │   ├── yahoo.js          # Yahoo Finance equity prices
│   │   │   └── fred.js           # FRED API for macro indicators
│   │   │
│   │   ├── enrichment/
│   │   │   ├── claudeExtractor.js  # Anthropic API for structured extraction
│   │   │   └── eventClassifier.js  # Classify + score event severity
│   │   │
│   │   └── notifications/
│   │       └── alertEngine.js    # Optional: email/webhook alerts on threshold breaches
│   │
│   └── utils/
│       ├── logger.js             # Structured logging (pino)
│       ├── rateLimiter.js        # Rate limiting for external API calls
│       └── dateUtils.js          # Date normalization helpers
│
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   │
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Root component + routing
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx          # Dashboard header + refresh controls
│   │   │   │   ├── TabNavigation.jsx   # Tab switching
│   │   │   │   └── StatusBar.jsx       # Last refresh time, data freshness indicator
│   │   │   │
│   │   │   ├── overview/
│   │   │   │   ├── StatGrid.jsx        # Top-line stat boxes
│   │   │   │   ├── DefaultRateChart.jsx
│   │   │   │   ├── SectorExposure.jsx
│   │   │   │   ├── PIKTrend.jsx
│   │   │   │   └── MaturityWall.jsx
│   │   │   │
│   │   │   ├── redemptions/
│   │   │   │   ├── FundScorecard.jsx     # Fund-by-fund redemption cards
│   │   │   │   ├── RedemptionRateChart.jsx
│   │   │   │   ├── DollarFlowChart.jsx
│   │   │   │   └── StatusBadge.jsx
│   │   │   │
│   │   │   ├── contagion/
│   │   │   │   ├── TransmissionChain.jsx # Vertical flow diagram
│   │   │   │   ├── BankExposure.jsx
│   │   │   │   └── AltManagerEquity.jsx
│   │   │   │
│   │   │   ├── timeline/
│   │   │   │   ├── SeverityChart.jsx     # Severity over time
│   │   │   │   ├── EventLog.jsx          # Scrollable event list
│   │   │   │   └── EventForm.jsx         # Manual event entry
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── Card.jsx
│   │   │       ├── ChartTooltip.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDashboardData.js  # Primary data fetch + refresh hook
│   │   │   ├── useAutoRefresh.js    # Client-side polling interval
│   │   │   └── useWebSocket.js      # Optional: real-time push updates
│   │   │
│   │   ├── lib/
│   │   │   ├── api.js               # Fetch wrapper for backend API
│   │   │   ├── constants.js         # Color scheme, font config, thresholds
│   │   │   └── formatters.js        # Number/currency/percent formatters
│   │   │
│   │   └── styles/
│   │       └── globals.css          # Base styles, Tailwind directives
│   │
│   └── public/
│       └── favicon.ico
│
├── scripts/
│   ├── setup.sh                  # Initial setup: install deps, create db, seed
│   ├── refresh.sh                # CLI manual refresh trigger
│   └── backup-db.sh              # SQLite backup to timestamped file
│
└── data/
    ├── vault21.db                # SQLite database file (gitignored)
    └── backups/                  # Database backups (gitignored)
```

---

## Database Schema

```sql
-- schema.sql

-- Core timeline events
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,                    -- ISO 8601 date
    event TEXT NOT NULL,                   -- Event description
    severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 6),
    category TEXT NOT NULL DEFAULT 'general',
    -- Categories: redemption, gating, bankruptcy, regulatory,
    --   bank_action, market_move, analyst_warning, policy
    source TEXT,                           -- Source URL or publication
    source_name TEXT,                      -- Bloomberg, Reuters, etc.
    verified INTEGER NOT NULL DEFAULT 0,   -- Manual verification flag
    auto_generated INTEGER NOT NULL DEFAULT 0,
    notes TEXT,                            -- Analyst notes / context
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Fund redemption tracking
CREATE TABLE funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- e.g. "Blackstone BCRED"
    ticker TEXT,                           -- If publicly traded
    manager TEXT NOT NULL,                 -- Parent company
    aum_billions REAL,                     -- Assets under management
    fund_type TEXT,                        -- BDC, interval_fund, semi_liquid
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE redemption_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_id INTEGER NOT NULL REFERENCES funds(id),
    quarter TEXT NOT NULL,                 -- e.g. "Q1 2026"
    date TEXT NOT NULL,                    -- Date of disclosure
    redemption_requested_pct REAL,         -- % of shares requested
    redemption_requested_amt REAL,         -- $B requested
    redemption_paid_pct REAL,              -- % actually paid
    redemption_paid_amt REAL,              -- $B actually paid
    gate_threshold_pct REAL DEFAULT 5.0,   -- Fund's gate cap
    status TEXT NOT NULL,                  -- fulfilled, gated, liquidating, pending
    response_detail TEXT,                  -- Description of manager response
    source TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Market metrics snapshots
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    unit TEXT,                             -- percent, billions_usd, ratio, index
    source TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
-- Tracked metrics:
--   industry_aum, bank_lending_to_pc, maturity_wall_2026,
--   software_loan_share_pct, headline_default_rate, true_default_rate,
--   pik_income_pct, vix, sp500, gold_price, btc_price,
--   10yr_yield

-- Equity price tracking for alt managers
CREATE TABLE equity_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,                  -- OWL, BX, KKR, ARES, BLK, APO
    date TEXT NOT NULL,
    close_price REAL,
    change_pct REAL,                       -- Daily change
    ytd_pct REAL,                          -- YTD return
    from_high_pct REAL,                    -- Drawdown from 52-week high
    source TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(ticker, date)
);

-- Bank exposure data
CREATE TABLE bank_exposures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT NOT NULL,
    exposure_billions REAL,
    date_reported TEXT,
    detail TEXT,                           -- Context (e.g. "marking down software loans")
    source TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Contagion chain status
CREATE TABLE contagion_layers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layer_order INTEGER NOT NULL,
    layer_name TEXT NOT NULL,
    detail TEXT,
    risk_description TEXT,
    exposure_label TEXT,
    severity INTEGER CHECK(severity BETWEEN 1 AND 6),
    last_updated TEXT DEFAULT (datetime('now'))
);

-- Data refresh log
CREATE TABLE refresh_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_type TEXT NOT NULL,            -- manual, scheduled, startup
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'running', -- running, success, partial, failed
    sources_attempted INTEGER DEFAULT 0,
    sources_succeeded INTEGER DEFAULT 0,
    events_added INTEGER DEFAULT 0,
    errors TEXT,                           -- JSON array of error messages
    duration_ms INTEGER
);

-- Indexes
CREATE INDEX idx_events_date ON events(date DESC);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_metrics_name_date ON metrics(metric_name, date DESC);
CREATE INDEX idx_equity_ticker_date ON equity_prices(ticker, date DESC);
CREATE INDEX idx_redemption_fund ON redemption_events(fund_id, date DESC);
CREATE INDEX idx_refresh_log_date ON refresh_log(started_at DESC);
```

---

## Data Pipeline Design

### Refresh Pipeline (`server/services/refreshPipeline.js`)

The refresh pipeline orchestrates all data collection in a single coordinated cycle. Each source runs independently so one failure doesn't block others.

```
refreshPipeline.run(trigger: 'manual' | 'scheduled' | 'startup')
  │
  ├── 1. Log refresh start → refresh_log
  │
  ├── 2. Parallel data collection (Promise.allSettled):
  │   ├── a. Equity prices (Yahoo Finance API)
  │   │     → equity_prices table
  │   │     → Tickers: OWL, BX, KKR, ARES, BLK, APO, GLD, SPY, BTC-USD
  │   │
  │   ├── b. News scrape (multiple sources)
  │   │     → Raw articles → Claude extraction → events table
  │   │     → Sources: Bloomberg, CNBC, Reuters, FT
  │   │     → Search terms: "private credit", "BDC redemptions",
  │   │       "private credit gating", "private credit defaults"
  │   │
  │   ├── c. SEC EDGAR (BDC filings)
  │   │     → 8-K filings for tracked BDCs
  │   │     → Auto-detect redemption disclosures, NAV changes
  │   │
  │   ├── d. FRED macro data
  │   │     → metrics table
  │   │     → Series: VIXCLS, DGS10, BAMLH0A0HYM2 (HY spread),
  │   │       TOTRESNS (bank reserves)
  │   │
  │   └── e. Manual overrides check
  │         → Apply any queued manual data entries
  │
  ├── 3. Enrichment pass:
  │   ├── a. Claude API: classify new events by severity (1-6)
  │   ├── b. Claude API: extract structured fund data from articles
  │   ├── c. Compute derived metrics (YTD returns, drawdowns)
  │   └── d. Update contagion_layers severity scores
  │
  ├── 4. Log refresh completion → refresh_log
  │
  └── 5. Emit 'refresh_complete' event (for WebSocket push)
```

### Claude Extraction Prompt (for `enrichment/claudeExtractor.js`)

When unstructured news articles are collected, use the Anthropic API to extract structured data. The prompt should instruct Claude Sonnet to return JSON with the following fields:

```javascript
const EXTRACTION_SYSTEM_PROMPT = `You are a financial data extraction system for a private credit market monitoring dashboard. Extract structured data from the provided article text.

Return ONLY valid JSON with this structure:
{
  "events": [
    {
      "date": "YYYY-MM-DD",
      "description": "Concise event description (max 100 chars)",
      "severity": 1-6,
      "category": "redemption|gating|bankruptcy|regulatory|bank_action|market_move|analyst_warning|policy",
      "entities": ["fund names", "company names", "people mentioned"],
      "dollar_amounts": [{"label": "what", "value": 1.2, "unit": "billions"}],
      "percentages": [{"label": "what", "value": 7.9}]
    }
  ],
  "fund_data": [
    {
      "fund_name": "string",
      "manager": "string",
      "aum_billions": number|null,
      "redemption_pct": number|null,
      "redemption_amt_billions": number|null,
      "status": "string",
      "detail": "string"
    }
  ],
  "metrics": [
    {"name": "metric_name", "value": number, "unit": "string"}
  ]
}

Severity scale:
1 = Minor industry news, no market impact
2 = Notable event, limited market impact
3 = Significant stress signal, moderate market reaction
4 = Major fund action (gating, large redemption), broad attention
5 = Systemic-level event, cross-market contagion, multiple funds affected
6 = Phase transition (bank leverage contraction, regulatory intervention, forced liquidation)

If no relevant data can be extracted, return {"events": [], "fund_data": [], "metrics": []}.
Do not hallucinate data. If a number is not explicitly stated, use null.`;
```

---

## Scheduler Configuration

```javascript
// server/services/scheduler.js
const cron = require('node-cron');
const { refreshPipeline } = require('./refreshPipeline');
const logger = require('../utils/logger');

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

function initScheduler() {
  cron.schedule(SCHEDULES.marketHours, () => {
    logger.info('Scheduled full refresh (market hours)');
    refreshPipeline.run('scheduled', { scope: 'full' });
  });

  cron.schedule(SCHEDULES.priceCheck, () => {
    logger.info('Scheduled price check');
    refreshPipeline.run('scheduled', { scope: 'prices_only' });
  });

  cron.schedule(SCHEDULES.weekends, () => {
    logger.info('Scheduled weekend refresh');
    refreshPipeline.run('scheduled', { scope: 'full' });
  });

  cron.schedule(SCHEDULES.newsSweep, () => {
    logger.info('Scheduled news sweep');
    refreshPipeline.run('scheduled', { scope: 'news_only' });
  });

  logger.info('Scheduler initialized with schedules:', Object.keys(SCHEDULES));
}

module.exports = { initScheduler, SCHEDULES };
```

---

## API Routes

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard` | Full dashboard payload (all tabs) |
| `GET` | `/api/dashboard/overview` | Overview tab data only |
| `GET` | `/api/dashboard/redemptions` | Redemption tab data only |
| `GET` | `/api/dashboard/contagion` | Contagion tab data only |
| `GET` | `/api/dashboard/timeline` | Timeline tab data only |
| `POST` | `/api/refresh` | Trigger manual refresh |
| `GET` | `/api/refresh/status` | Current refresh status + history |
| `GET` | `/api/health` | System health check |

### Data Management Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | List events (filterable by date, category, severity) |
| `POST` | `/api/events` | Add manual event |
| `PUT` | `/api/events/:id` | Update event (e.g., verify, adjust severity) |
| `DELETE` | `/api/events/:id` | Remove event |
| `GET` | `/api/funds` | List tracked funds |
| `POST` | `/api/funds` | Add fund to tracking |
| `POST` | `/api/funds/:id/redemptions` | Add redemption event |
| `GET` | `/api/metrics/latest` | Latest value for each tracked metric |
| `GET` | `/api/metrics/:name/history` | Historical series for a metric |

### Dashboard Payload Structure

```javascript
// GET /api/dashboard response shape
{
  "meta": {
    "last_refresh": "2026-03-12T15:30:00Z",
    "refresh_status": "success",
    "data_freshness": {
      "prices": "2026-03-12T15:30:00Z",
      "news": "2026-03-12T14:00:00Z",
      "sec_filings": "2026-03-12T09:00:00Z"
    }
  },
  "overview": {
    "stats": {
      "industry_aum": { "value": 1.8, "unit": "T", "as_of": "..." },
      "bank_lending": { "value": 300, "unit": "B", "as_of": "..." },
      "q1_redemptions": { "value": 10, "unit": "B+", "as_of": "..." },
      "maturity_wall_2026": { "value": 162, "unit": "B", "as_of": "..." },
      "software_share": { "value": 40, "unit": "%", "as_of": "..." },
      "true_default_rate": { "value": 5.0, "unit": "%", "as_of": "..." }
    },
    "default_rates": [...],
    "sector_exposure": [...],
    "pik_trend": [...],
    "maturity_wall": [...]
  },
  "redemptions": {
    "funds": [...],
    "rate_chart": [...],
    "dollar_flows": [...]
  },
  "contagion": {
    "chain": [...],
    "bank_exposures": [...],
    "alt_manager_equity": [...]
  },
  "timeline": {
    "events": [...],
    "severity_chart": [...]
  }
}
```

---

## Frontend Data Flow

```javascript
// hooks/useDashboardData.js — primary data hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min client-side poll

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh: triggers backend pipeline then re-fetches
  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.post('/refresh', { scope: 'full' });
      // Poll for completion
      let status = 'running';
      while (status === 'running') {
        await new Promise(r => setTimeout(r, 2000));
        const res = await api.get('/refresh/status');
        status = res.latest?.status;
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // Initial fetch + auto-refresh polling
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  return { data, loading, refreshing, lastRefresh, error, triggerRefresh };
}
```

---

## Environment Configuration

```bash
# .env.example

# Server
PORT=3001
NODE_ENV=development

# Database
DB_PATH=./data/vault21.db

# Anthropic API (for Claude extraction)
ANTHROPIC_API_KEY=sk-ant-...

# FRED API (free, register at https://fred.stlouisfed.org/docs/api/api_key.html)
FRED_API_KEY=...

# Yahoo Finance (no key needed, uses public endpoints)

# SEC EDGAR (no key, but requires User-Agent header)
SEC_USER_AGENT=vault21-dashboard admin@vault21.com

# Optional: Alert notifications
# ALERT_WEBHOOK_URL=https://hooks.slack.com/...
# ALERT_EMAIL=...

# Refresh settings
REFRESH_TIMEOUT_MS=120000
MAX_SCRAPE_CONCURRENT=3
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=2000

# Rate limiting
YAHOO_REQUESTS_PER_MIN=30
NEWS_REQUESTS_PER_MIN=10
SEC_REQUESTS_PER_SEC=10
```

---

## Implementation Phases

Execute these phases in order. Each phase produces a working system you can test before proceeding.

### Phase 1: Foundation (Backend + Database)

**Goal:** Express server with SQLite, seeded with current historical data, serving static JSON.

Tasks:
1. Initialize project: `npm init`, install dependencies
2. Create SQLite database with full schema from above
3. Write `seed.js` that populates:
   - All 13 timeline events from the prototype
   - 4 tracked funds (BCRED, HLEND, Cliffwater, OBDC II) with redemption data
   - Current metrics snapshot (industry AUM, default rates, PIK, etc.)
   - Bank exposure data (JPM, Deutsche, Barclays, Goldman)
   - Contagion chain layers
4. Build Express server with `/api/dashboard` endpoint returning seeded data
5. Build `/api/health` endpoint
6. Add pino logger
7. Test: `curl localhost:3001/api/dashboard` returns full payload

**Dependencies to install:**
```bash
npm install express better-sqlite3 cors dotenv pino pino-pretty
npm install -D nodemon
```

### Phase 2: Frontend Migration

**Goal:** Port the prototype JSX into a proper Vite + React app consuming the API.

Tasks:
1. Scaffold Vite React project in `client/`
2. Install Tailwind CSS, Recharts
3. Decompose prototype into component tree per directory structure
4. Replace hardcoded data with `useDashboardData` hook
5. Add loading states, error handling
6. Add manual refresh button in header with visual feedback
7. Add `StatusBar` showing last refresh time + data freshness
8. Add Vite proxy config pointing `/api` to Express backend
9. Port the dark theme color system from prototype to Tailwind config
10. Test: full dashboard renders from API data

**Dependencies to install:**
```bash
cd client
npm install react react-dom recharts
npm install -D vite @vitejs/plugin-react tailwindcss autoprefixer postcss
```

### Phase 3: Data Collection Pipeline

**Goal:** Automated data collection from real sources.

Tasks:
1. Build Yahoo Finance scraper for equity prices
   - Endpoint: `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}`
   - Tickers: OWL, BX, KKR, ARES, BLK, APO, GLD, SPY, BTC-USD
   - Parse: close price, daily change %, compute YTD and from-high
2. Build FRED API client for macro indicators
   - Series: VIXCLS, DGS10, BAMLH0A0HYM2
   - Simple REST calls with API key
3. Build SEC EDGAR scraper for BDC filings
   - Full-text search API: `https://efts.sec.gov/LATEST/search-index?q="private+credit"+AND+"redemption"&dateRange=custom&startdt=2026-01-01`
   - Parse 8-K filings for redemption disclosures
4. Build news scraper framework
   - Fetch headlines from Google News RSS for target search terms
   - Extract article text via readability-style parsing (Cheerio)
   - Deduplicate against existing events by fuzzy matching
5. Build Claude extraction service
   - Send article text to Anthropic API with extraction prompt
   - Parse structured response into events/fund_data/metrics
   - Insert new data into appropriate tables
   - Flag auto_generated events for manual review
6. Build `refreshPipeline.js` orchestrator
   - Parallel execution with `Promise.allSettled`
   - Scoped refresh support (full, prices_only, news_only)
   - Error isolation per source
   - Refresh logging to `refresh_log` table
7. Wire up `POST /api/refresh` endpoint
8. Test: manual refresh pulls real current data

**Additional dependencies:**
```bash
npm install node-fetch cheerio @anthropic-ai/sdk
```

### Phase 4: Scheduler + Process Management

**Goal:** Automated refresh on schedule, resilient to crashes.

Tasks:
1. Implement `scheduler.js` with node-cron schedules
2. Initialize scheduler on server startup
3. Add `GET /api/refresh/status` endpoint (latest + history)
4. Create PM2 ecosystem config:
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
5. Create `scripts/setup.sh` for first-time setup
6. Create `scripts/backup-db.sh` for SQLite backup
7. Add graceful shutdown handling (close DB, stop scheduler)
8. Test: verify scheduled refreshes fire correctly over a 4-hour window

**Additional dependencies:**
```bash
npm install node-cron pm2
```

### Phase 5: Manual Data Entry + Event Management

**Goal:** Ability to manually add/edit events and fund data through the dashboard UI.

Tasks:
1. Build `EventForm.jsx` component — modal for adding timeline events
   - Fields: date, description, severity (1-6 dropdown), category, source URL, notes
   - Submit to `POST /api/events`
2. Add inline edit capability to `EventLog.jsx`
   - Click to edit severity, add notes, toggle verified flag
3. Build fund management panel (accessible from Redemptions tab)
   - Add new fund to tracking
   - Add redemption event to existing fund
4. Add "quick add" from news: when scraper finds unverified events, show them in a review queue with approve/reject/edit actions
5. Wire up all CRUD endpoints (events, funds, redemptions)
6. Test: add a manual event, see it appear in timeline

### Phase 6: Alerting + Monitoring (Optional)

**Goal:** Proactive notifications when thresholds are breached.

Tasks:
1. Define alert thresholds in config:
   - Any fund redemption request > 5%
   - New severity 5+ event detected
   - VIX spike > 20% single day
   - New BDC gating disclosure in SEC filings
   - Alt manager equity drawdown exceeds threshold
2. Build `alertEngine.js` that evaluates thresholds after each refresh
3. Implement notification channels:
   - Webhook (Slack, Discord)
   - Email via Nodemailer (optional)
   - Console/log alert (always on)
4. Add alert history to dashboard UI

---

## Seed Data Script Reference

The seed script should populate the database with all data from our analysis sessions. Key data points to include:

**Timeline Events (13 historical + today's):**
- Nov 2024: Tricolor funding strains (sev 1)
- Jan 2025: First Brands collateral fraud (sev 2)
- Apr 2025: Liberation Day crash (sev 3)
- Late 2025: BDC bankruptcies accelerate (sev 3)
- Feb 2026: Blue Owl gates OBDC II (sev 4)
- Feb 18: Rubric Capital "Enron" letter (sev 3)
- Feb 27: UK lender MFS collapses (sev 4)
- Mar 3: Blackstone BCRED 7.9% redemptions / $3.8B (sev 5)
- Mar 6: BlackRock HLEND gated at 5% / $1.2B requested / $620M paid (sev 5)
- Mar 6: Alt manager selloff / VIX +32% (sev 5)
- Mar 10: Cliffwater $33B fund >7% redemptions (sev 5)
- Mar 11: JPMorgan marks down software loan collateral (sev 6)
- Mar 12: Partners Group warns defaults may double (sev 5)
- Mar 12: Deutsche Bank discloses €26B PC portfolio (sev 3)
- Mar 12: Whalen Global Advisors flags bank contagion (sev 3)

**Fund Data:**
- Blackstone BCRED: $82B AUM, 7.9% requested, 7.9% paid, status=fulfilled
- BlackRock HLEND: $26B AUM, 9.3% requested, 5.0% paid ($620M of $1.2B), status=gated
- Cliffwater CLF: $33B AUM, >7% requested, 5% cap, status=gated
- Blue Owl OBDC II: $1.6B AUM, 200%+ surge, permanently gated, status=liquidating

**Metrics:**
- Industry AUM: $1.8T
- Bank lending to PC: $300B
- Maturity wall 2026: $162B
- Software loan share: ~40%
- Headline default rate: ~1.8%
- True default rate: ~5.0%
- UBS worst-case default: 15%
- Partners Group forecast: ~5.2%
- PIK income %: 8.4% (Q1 2026)
- Historical default avg: 2.6% (Partners Group 10yr)

**Bank Exposures:**
- JPMorgan: $22.2B (actively marking down software collateral)
- Deutsche Bank: €26B / ~$30B (disclosed Mar 12)
- Barclays: est. ~$18B (MFS exposure flagged)
- Goldman Sachs: est. ~$15B (3.5% Q4 redemption rate, below peers)

---

## Deployment Notes

**Local development:**
```bash
# Terminal 1: Backend
npm run dev    # nodemon server/index.js

# Terminal 2: Frontend
cd client && npm run dev    # Vite dev server with API proxy
```

**Production (single machine):**
```bash
# Build frontend
cd client && npm run build

# Express serves static build + API
NODE_ENV=production pm2 start pm2.ecosystem.config.js

# Verify
pm2 status
pm2 logs vault21-dashboard
```

The Express server should serve the Vite build output as static files in production, eliminating the need for a separate frontend server.

---

## Key Design Decisions + Rationale

**SQLite over Postgres:** Single-user intelligence tool. SQLite gives you zero-config, file-based portability, easy backup (just copy the file), and more than enough performance for this data volume. If you ever need multi-user access, migrate to Postgres later.

**Claude API for extraction over regex:** Financial news is messy. Regex-based extraction breaks constantly as article formats change. Using Claude Sonnet for structured extraction is more robust and self-healing. Cost is negligible at the refresh frequencies specified (~$0.10-0.50/day).

**node-cron over external scheduler:** Keeps everything in-process. No systemd timers, no external cron jobs to manage. PM2 handles the process lifecycle. If the server restarts, the scheduler reinitializes automatically.

**No auth layer:** Single-user tool running locally or on a private server. Adding auth adds complexity without security benefit in this context. If you expose it externally later, add a simple API key middleware.

**Severity 1-6 scale:** Matches the analytical framework from our sessions. 1-2 = background noise, 3-4 = active stress signals, 5 = systemic, 6 = phase transition. The scale is intentionally narrow to force meaningful differentiation.

---

## Claude Code Usage Notes

When working with Claude Code on this project, use these commands at each phase:

```bash
# Phase 1
claude "Read the implementation plan at IMPLEMENTATION_PLAN.md. Execute Phase 1: set up the Express server with SQLite database, create the full schema, write the seed script with all historical data, and build the /api/dashboard and /api/health endpoints. Use better-sqlite3 for the database. Test that curl localhost:3001/api/dashboard returns the full seeded payload."

# Phase 2
claude "Read IMPLEMENTATION_PLAN.md Phase 2. Scaffold the Vite React frontend in client/, install Tailwind and Recharts, decompose the existing prototype (reference: private_credit_crisis_dashboard.jsx) into the component tree specified in the plan. Wire up the useDashboardData hook to fetch from the Express API. Add the manual refresh button and status bar. Verify the full dashboard renders correctly."

# Phase 3
claude "Read IMPLEMENTATION_PLAN.md Phase 3. Build the data collection pipeline: Yahoo Finance price scraper, FRED API client, news scraper with Cheerio, and Claude extraction service using the Anthropic SDK. Build the refreshPipeline.js orchestrator with parallel execution and error isolation. Wire up POST /api/refresh. Test with a manual refresh that pulls real current data."

# Phase 4
claude "Read IMPLEMENTATION_PLAN.md Phase 4. Implement the node-cron scheduler with the specified schedules. Create the PM2 ecosystem config. Add the refresh status API endpoint. Create the setup.sh and backup-db.sh scripts. Add graceful shutdown handling."

# Phase 5
claude "Read IMPLEMENTATION_PLAN.md Phase 5. Build the manual event entry form as a modal component. Add inline editing to the event log. Build the fund management panel. Wire up all CRUD endpoints for events, funds, and redemptions."
```

Each phase should be testable independently before moving to the next.
