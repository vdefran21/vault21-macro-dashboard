# AGENTS.md

This repository already maintains its main agent guidance in `CLAUDE.md`.

`CLAUDE.md` is the source of truth for agent behavior in this project. Read and follow it before making changes. If this file and `CLAUDE.md` ever diverge, follow `CLAUDE.md`.

## Primary Reference

- Source of truth: `./CLAUDE.md`
- Project tracking source of truth: `./docs/PLAN_STATUS.md`
- Architecture source of truth: `./docs/ARCHITECTURE.md`

## Required Operating Rules

- Do not commit or push changes.
- Do not kill processes by PID.
- Do not attempt to run the application unless the user explicitly asks; if runtime is needed, tell the user what must be running.
- Before ending a work session, update `docs/PLAN_STATUS.md` with statuses, touched files, verification, blockers, and a change-log entry.
- When changing `/api/dashboard` response shape, update the route handler, `docs/ARCHITECTURE.md`, and all affected frontend consumers in the same change.
- Treat the docs in `docs/ARCHITECTURE.md` and `docs/phases/` as the source of truth when tests and implementation disagree.
- Use JSDoc for exported functions, classes, route handlers, service modules, database helpers, and significant constants.
- Add new environment variables through `server/config.js`, not scattered `process.env` reads.
- Respect rate limits defined in `server/config.js` for all external API calls.
- Mark scraper-generated events with `auto_generated = 1`.
- Keep the fixed severity scale at 1-6.

## Development Context

- Backend: Node.js + Express on port 3001
- Frontend: React + Vite on port 5173
- Database: SQLite via better-sqlite3
- Root `npm run dev` starts both backend and frontend
- Production `npm start` serves the built frontend from `client/dist`

## Practical Guidance

- For project structure, conventions, testing philosophy, documentation standards, and implementation tracking requirements, read `CLAUDE.md` directly.
- Use this file as a pointer and compact guardrail set, not as a second competing instruction document.