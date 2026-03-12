# Phase 1: Foundation (Backend + Database)

**Status:** COMPLETE
**Prereqs:** None
**Architecture ref:** [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Goal

Express server with SQLite, seeded with current historical data, serving structured JSON via REST API.

---

## Tasks

1. Initialize project: `npm init`, install dependencies
2. Create SQLite database with full schema (see ARCHITECTURE.md → Database Schema)
3. Write `seed.js` that populates:
   - All 13+ timeline events from the prototype
   - 4 tracked funds (BCRED, HLEND, Cliffwater, OBDC II) with redemption data
   - Current metrics snapshot (industry AUM, default rates, PIK trend, sector exposure, maturity wall)
   - Bank exposure data (JPM, Deutsche, Barclays, Goldman)
   - Contagion chain layers (6 layers)
4. Build Express server with `/api/dashboard` endpoint returning seeded data
5. Build `/api/health` endpoint
6. Add pino logger
7. Test: `curl localhost:3001/api/dashboard` returns full payload

---

## Dependencies

```bash
npm install express better-sqlite3 cors dotenv pino pino-pretty
npm install -D nodemon
```

---

## Verification

```bash
npm run seed
npm run dev
curl http://localhost:3001/api/health     # → { status: "ok", database: { events: 15, funds: 4 } }
curl http://localhost:3001/api/dashboard  # → full payload with meta, overview, redemptions, contagion, timeline
```

---

## Seed Data Reference

**Timeline Events (15):**
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

**Metrics (35 records):** Industry AUM $1.8T, bank lending $300B, maturity wall $162B, software share 40%, true default rate 5.0%, PIK trend Q1 2024-Q1 2026, sector concentration, maturity wall 2026-2029

**Bank Exposures:** JPMorgan $22.2B, Deutsche Bank ~$30B, Barclays ~$18B, Goldman ~$15B

**Contagion Chain:** Borrowers → Private Credit Funds → Retail Investors → Bank Leverage → Alt Manager Equities → Broad Markets
