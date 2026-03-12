# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vault21 macro dashboard is a real-time private credit crisis monitoring tool. Single-operator intelligence dashboard tracking the $1.8T private credit industry: fund redemptions, contagion propagation, bank exposure, and market impact. Built for information density and data freshness — think Bloomberg terminal, not consumer product.

## Tech Stack

- **Backend:** Node.js + Express (port 3001)
- **Database:** SQLite via better-sqlite3 (WAL mode, foreign keys)
- **Frontend:** React 18 + Vite + Recharts + Tailwind CSS
- **Scraping:** Cheerio + node-fetch for news/data extraction
- **Enrichment:** Anthropic API (Claude) for structured data extraction from news
- **Scheduler:** node-cron for automated refresh cycles
- **Process Mgmt:** PM2 for production
- **Logging:** Pino with pino-pretty for development

## Repository Structure

```
server/              Express backend — routes, services, DB, scrapers
  db/                SQLite schema, connection module, seed script
  routes/            API route handlers
  services/          Scrapers, enrichment, scheduler, refresh pipeline
  utils/             Logger, rate limiter, date helpers
client/              React + Vite frontend
  src/components/    Dashboard components (overview, redemptions, contagion, timeline)
  src/hooks/         Data fetching hooks
  src/lib/           API client, constants, formatters
docs/                Architecture ref, phase specs, status tracking
  ARCHITECTURE.md    Shared reference (schema, API contract, design decisions)
  PLAN_STATUS.md     Implementation progress tracker
  phases/            Per-phase implementation specs (PHASE_1 through PHASE_6)
data/                SQLite database file (gitignored)
```

## Development Commands

```bash
npm install           # Install dependencies
npm run seed          # Seed SQLite with historical data (clears and repopulates)
npm run dev           # Start Express server with nodemon (port 3001)
npm start             # Production server
npm run setup         # Install + seed in one step

# Frontend (when built)
cd client && npm run dev    # Vite dev server with /api proxy to :3001
cd client && npm run build  # Production build (served by Express)
```

## Architecture Decisions (Locked)

1. **SQLite, not Postgres.** Single-user intelligence tool. Zero-config, portable, file-based. If multi-user is needed later, migrate then.

2. **Claude API for news extraction, not regex.** Financial news is messy. Claude extraction is more robust and self-healing. Cost is ~$0.10-0.50/day at specified refresh frequencies.

3. **node-cron, not external scheduler.** Everything in-process. PM2 handles lifecycle. No systemd timers or external cron to manage.

4. **No auth layer.** Single-user, local/private server. Add API key middleware only if exposed externally.

5. **Severity 1-6 scale.** Matches the analytical framework. 1-2 = background noise, 3-4 = active stress signals, 5 = systemic, 6 = phase transition. Intentionally narrow.

6. **Docs are split for context efficiency.** `docs/ARCHITECTURE.md` + the relevant `docs/phases/PHASE_N_*.md` is the minimal context needed per phase. The full `IMPLEMENTATION_PLAN.md` at the project root is preserved as complete reference but should not be loaded when a phase-specific doc suffices.

## GENERAL DEVELOPMENT

When running in "bypass permissions" or "auto accept edits" modes, stop at reasonable intervals for user review and potential commit events.

### DO NOT
- Commit or push changes to git
- Kill processes (PIDs)
- Attempt to run the application yourself
  - If you need the application running, notify the user what needs to be running and in what capacity

## Implementation Tracking

> **THIS IS MANDATORY.** Before ending any session — whether pausing, stopping, or completing work —
> you MUST update `docs/PLAN_STATUS.md` to reflect the current state of all tasks.
> This is the single source of truth for project progress.

**File:** `docs/PLAN_STATUS.md`

**When to update:**
- **Before every stop/pause:** Mark tasks DONE, in progress, or not started. Fill in the "Notes" column with file paths or details for any task you touched.
- **After completing a task:** Immediately update the status and notes for that task.
- **After adding new code:** If the work maps to a tracked task, update it. If it doesn't map to any existing task, add a row.
- **Change Log table:** Add a row to the Change Log at the bottom of the file for every meaningful change.

**What to record in "Notes":**
- File paths created or modified
- Test results or verification commands run
- Blockers or issues encountered
- Anything the next session needs to know to pick up where you left off

**Do not skip this.** Stale tracking is worse than no tracking.

## Testing Philosophy

When tests fail, **never modify backend code just to make a test pass**. Always:
1. Consult the phase spec in `docs/phases/` and `docs/ARCHITECTURE.md` to determine expected behavior.
2. Confirm whether the test expectation matches the spec before changing anything.
3. If the backend behavior matches the docs, fix the test.
4. If the backend behavior contradicts the docs, fix the backend.
5. If the docs are ambiguous, flag it for user review before making changes.

The docs are the source of truth for expected behavior — not the tests, and not the current code.

## Database

- Schema defined in `server/db/schema.sql` — 8 tables, 6 indexes
- WAL mode and foreign keys enabled at connection time (`server/db/index.js`)
- All schema changes should be additive (new tables/columns) or handled via migration scripts in `server/db/migrations/`
- `seed.js` is destructive — it clears all tables before repopulating. Never run in production against live data.
- Database file lives at `data/vault21.db` (gitignored)

## API Contract

The dashboard payload structure (`GET /api/dashboard`) is defined in `docs/ARCHITECTURE.md` → "Dashboard Payload Shape". All frontend components consume this shape. If you change the API response, update:
1. The route handler in `server/routes/dashboard.js`
2. The payload shape documentation in `docs/ARCHITECTURE.md`
3. Any frontend components or hooks that consume the changed fields

## Documentation Standards

Use JSDoc for all JavaScript across the repository. Hold every file to the same bar:

- **JavaScript:** JSDoc on all exported functions, classes, and non-trivial internal helpers
- **SQL:** Header comments on schema files plus inline design notes for non-obvious constraints
- **Config files:** Concise explanatory comments

### What Must Be Documented

Every exported function, route handler, service module, database helper, and significant constant must have a JSDoc comment. This includes:
- Route handlers (explain request/response contract, query params)
- Service modules (explain what data sources they touch, side effects, error behavior)
- Database helpers (explain query semantics, what gets returned)
- Scraper modules (explain target source, rate limits, data written)
- Utility functions (explain params, return values, edge cases)

### JSDoc Format

```javascript
/**
 * Brief one-line summary of what this function does.
 *
 * More detailed explanation including:
 * - WHY this exists (business context)
 * - Key behavior or side effects (DB writes, API calls, etc.)
 * - Important constraints (rate limits, required env vars)
 *
 * @param {string} paramName - Description including valid values
 * @returns {Object} Description of return value, including null semantics
 * @throws {Error} When and why this throws
 */
```

### Anti-Patterns to Avoid

- **Parrot docs:** `/** Gets the name. */ function getName()` — useless. Explain what name, whose name, why.
- **Implementation narration:** Don't describe how the code works line-by-line. Describe what it achieves and why.
- **Missing error docs:** If a function throws or can fail, document it.
- **Stale docs:** If you change a function's behavior, update the JSDoc in the same change. Period.

### SQL Documentation

Schema files and migration scripts must include:
- A header comment explaining what the table/migration does and why
- Inline comments for non-obvious constraints, indexes, or design decisions
- Reference to the relevant phase spec if applicable

## Important Conventions

- When changing the `/api/dashboard` response shape, update `docs/ARCHITECTURE.md` in the same change
- Environment variables are loaded via `server/config.js` — add new vars there, not inline `process.env` reads
- All external API calls must respect rate limits defined in `server/config.js` → `rateLimits`
- Scraper-generated events must set `auto_generated = 1` in the events table for manual review
- The severity 1-6 scale is fixed. See `docs/ARCHITECTURE.md` → "Severity Scale" for definitions.
- Never store API keys or secrets in code. All secrets go in `.env` (gitignored).
