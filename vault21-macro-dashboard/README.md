# vault21 macro dashboard

Real-time private credit crisis monitoring dashboard. Tracks the $1.8T private credit industry stress events, fund redemptions, contagion propagation, and market impact.

## Quick start

```bash
cd vault21-macro-dashboard
npm install
npm run seed      # populate SQLite with historical data
npm run dev       # start API server on :3001 and Vite client on :5173
```

Verify it's running:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/dashboard
```

Open the dashboard at `http://localhost:5173` during development. Port `3001` is the backend API and status page.

## Project structure

```
vault21-macro-dashboard/
├── server/
│   ├── index.js              # Express server entry point
│   ├── config.js             # Environment config loader
│   ├── db/
│   │   ├── schema.sql        # 8-table SQLite schema
│   │   ├── index.js          # Database connection (WAL mode)
│   │   └── seed.js           # Historical data seeder
│   ├── routes/
│   │   ├── dashboard.js      # /api/dashboard endpoints
│   │   └── health.js         # /api/health system status
│   ├── services/             # (Phase 2+) scrapers, enrichment, notifications
│   └── utils/
│       └── logger.js         # Pino logger
├── client/                   # (Phase 3) React frontend
├── data/
│   └── vault21.db            # SQLite database (gitignored)
├── .env                      # API keys & config (gitignored)
├── .env.example              # Template for .env
└── package.json
```

## Environment variables

Copy `.env.example` to `.env` and fill in your keys:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3001) |
| `DB_PATH` | SQLite database path |
| `ANTHROPIC_API_KEY` | Claude API key for news enrichment |
| `FRED_API_KEY` | FRED API key for macro data |
| `SEC_USER_AGENT` | Required by SEC EDGAR rate limits |

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/dashboard` | Full payload: meta + overview + redemptions + contagion + timeline |
| `GET /api/dashboard/overview` | Top-line stats, default rates, sector exposure, PIK trend, maturity wall |
| `GET /api/dashboard/redemptions` | Fund scorecard, rate charts, dollar flows |
| `GET /api/dashboard/contagion` | Transmission chain, bank exposures, alt manager equity |
| `GET /api/dashboard/timeline` | Events sorted by date/severity, severity chart data |
| `GET /api/health` | Server status, DB connection, record counts |

## Database schema

- **events** — Timeline events with severity (1-6), category, source tracking
- **funds** — Fund profiles (name, ticker, manager, AUM, type)
- **redemption_events** — Per-fund quarterly redemption data with gating status
- **metrics** — Time-series key metrics (PIK rates, default rates, sector exposure, maturity wall)
- **equity_prices** — Alt manager stock performance (YTD, from-high drawdowns)
- **bank_exposures** — Bank lending exposure to private credit
- **contagion_layers** — Six-layer contagion transmission chain
- **refresh_log** — Data refresh audit trail

## Seed data coverage

The seed script populates all tables with data from the prototype JSX dashboard:

- 15 timeline events (Nov 2024 — Mar 12, 2026)
- 4 tracked funds: BCRED ($82B), HLEND ($26B), Cliffwater ($33B), OBDC II ($1.6B)
- 35 metrics across PIK trend, default rates, sector concentration, maturity wall
- 6 alt manager equity snapshots (OWL, BX, KKR, ARES, BLK, APO)
- 4 bank exposures (JPMorgan, Deutsche Bank, Barclays, Goldman Sachs)
- 6-layer contagion chain

## Data notes

- Bank exposure figures for Barclays and Goldman are approximations based on proportional reporting. JPMorgan ($22.2B) and Deutsche Bank (€26B) are confirmed.
- Alt manager drawdown percentages for BX/KKR are directionally solid but treat specific figures with appropriate skepticism.
- "True" default rates (including selective defaults and LMEs) come from Rubric Capital and UBS analysis.

## Scripts

```bash
npm run dev       # Starts backend (:3001) and Vite frontend (:5173)
npm run dev:server # Backend only
npm run dev:client # Frontend only
npm start         # Production server
npm run seed      # Re-seed database (clears and repopulates)
npm run setup     # Install deps + seed in one step
```

## Tech stack

- **Runtime:** Node.js + Express
- **Database:** SQLite via better-sqlite3 (WAL mode, foreign keys)
- **Logging:** Pino with pino-pretty for development
- **Frontend:** React + Recharts (Phase 3)
