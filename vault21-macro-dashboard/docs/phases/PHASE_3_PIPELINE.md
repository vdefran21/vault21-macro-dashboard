# Phase 3: Data Collection Pipeline

**Status:** NOT STARTED
**Prereqs:** Phase 1 (database + API), Phase 2 recommended (frontend to visualize results)
**Architecture ref:** [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Goal

Automated data collection from real sources. Manual refresh via `POST /api/refresh` pulls live data and updates the database.

---

## Tasks

1. **Yahoo Finance scraper** (`server/services/scrapers/yahoo.js`)
   - Endpoint: `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}`
   - Tickers: OWL, BX, KKR, ARES, BLK, APO, GLD, SPY, BTC-USD
   - Parse: close price, daily change %, compute YTD and from-high
   - Write to: `equity_prices` table

2. **FRED API client** (`server/services/scrapers/fred.js`)
   - Series: VIXCLS (VIX), DGS10 (10yr yield), BAMLH0A0HYM2 (HY spread), TOTRESNS (bank reserves)
   - Simple REST calls with API key: `https://api.stlouisfed.org/fred/series/observations`
   - Write to: `metrics` table

3. **SEC EDGAR scraper** (`server/services/scrapers/sec.js`)
   - Full-text search: `https://efts.sec.gov/LATEST/search-index?q="private+credit"+AND+"redemption"&dateRange=custom&startdt=2026-01-01`
   - Parse 8-K filings for redemption disclosures, NAV changes
   - Requires `SEC_USER_AGENT` header
   - Write to: `events` table (auto_generated=1)

4. **News scraper framework** (`server/services/scrapers/bloomberg.js`, `cnbc.js`, `reuters.js`)
   - Fetch headlines from Google News RSS for target search terms:
     - "private credit", "BDC redemptions", "private credit gating", "private credit defaults"
   - Extract article text via readability-style parsing (Cheerio)
   - Deduplicate against existing events by fuzzy matching
   - Pass to Claude extraction service

5. **Claude extraction service** (`server/services/enrichment/claudeExtractor.js`)
   - Send article text to Anthropic API with extraction prompt (below)
   - Parse structured response into events/fund_data/metrics
   - Insert new data into appropriate tables
   - Flag `auto_generated = 1` for manual review
   - Model: `claude-sonnet-4-20250514`, max_tokens: 2000

6. **Refresh pipeline orchestrator** (`server/services/refreshPipeline.js`)
   - Parallel execution with `Promise.allSettled`
   - Scoped refresh support: `full`, `prices_only`, `news_only`
   - Error isolation per source (one failure doesn't block others)
   - Refresh logging to `refresh_log` table
   - Emit 'refresh_complete' event

7. **Wire up `POST /api/refresh` endpoint** (`server/routes/refresh.js`)
   - Accept `{ scope: 'full' | 'prices_only' | 'news_only' }`
   - Return refresh_log ID for status polling

8. **Test:** manual refresh pulls real current data

---

## Dependencies

```bash
npm install node-fetch cheerio @anthropic-ai/sdk
```

---

## Refresh Pipeline Flow

```
refreshPipeline.run(trigger, { scope })
  │
  ├── 1. Log refresh start → refresh_log
  │
  ├── 2. Parallel data collection (Promise.allSettled):
  │   ├── a. Equity prices (Yahoo Finance)  → equity_prices
  │   ├── b. News scrape (multiple sources) → Claude extraction → events
  │   ├── c. SEC EDGAR (BDC filings)        → events
  │   ├── d. FRED macro data                → metrics
  │   └── e. Manual overrides check
  │
  ├── 3. Enrichment pass:
  │   ├── a. Claude API: classify new events by severity (1-6)
  │   ├── b. Claude API: extract structured fund data from articles
  │   ├── c. Compute derived metrics (YTD returns, drawdowns)
  │   └── d. Update contagion_layers severity scores
  │
  ├── 4. Log refresh completion → refresh_log
  │
  └── 5. Emit 'refresh_complete' event
```

---

## Claude Extraction Prompt

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

## Rate Limits

| Source | Limit | Config var |
|--------|-------|-----------|
| Yahoo Finance | 30 req/min | `YAHOO_REQUESTS_PER_MIN` |
| News sources | 10 req/min | `NEWS_REQUESTS_PER_MIN` |
| SEC EDGAR | 10 req/sec | `SEC_REQUESTS_PER_SEC` |
| FRED | No hard limit | — |
| Anthropic API | Per plan limits | — |

Build `server/utils/rateLimiter.js` to enforce these.

---

## Verification

```bash
# Start server
npm run dev

# Trigger manual refresh
curl -X POST http://localhost:3001/api/refresh -H 'Content-Type: application/json' -d '{"scope":"full"}'

# Check refresh status
curl http://localhost:3001/api/refresh/status

# Verify new data in dashboard
curl http://localhost:3001/api/dashboard | python3 -m json.tool | head -30
```
