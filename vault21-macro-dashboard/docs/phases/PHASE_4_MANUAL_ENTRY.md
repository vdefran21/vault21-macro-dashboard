# Phase 4: Manual Data Entry + Event Management

**Status:** IN PROGRESS
**Prereqs:** Phase 2 (frontend), Phase 3 (CRUD endpoints referenced)
**Architecture ref:** [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Goal

Ability to manually add/edit events and fund data through the dashboard UI.

## Current Progress

- `server/routes/events.js` now provides `GET/POST/PUT/DELETE /api/events` for timeline event management
- `client/src/components/timeline/EventForm.jsx` is live for manual event entry, with current date/time defaults
- `client/src/components/timeline/EventLog.jsx` now supports inline date/time edit/delete for event review workflows
- Fund management, redemption entry, and dedicated news review queue UI are still pending

---

## Tasks

1. **Build `EventForm.jsx` component** — modal for adding timeline events
   - Fields: date, time, description, severity (1-6 dropdown), category (dropdown), source URL, notes
   - Submit to `POST /api/events`

2. **Add inline edit capability to `EventLog.jsx`**
   - Click to edit severity, add notes, toggle verified flag
   - Submit via `PUT /api/events/:id`

3. **Build fund management panel** (accessible from Redemptions tab)
   - Add new fund to tracking (`POST /api/funds`)
   - Add redemption event to existing fund (`POST /api/funds/:id/redemptions`)

4. **Add "quick add" from news** — when scraper finds unverified events (`auto_generated=1`), show them in a review queue with approve/reject/edit actions

5. **Wire up all CRUD endpoints:**
   - `GET /api/events` — list events (filterable by date, category, severity)
   - `POST /api/events` — add manual event
   - `PUT /api/events/:id` — update event
   - `DELETE /api/events/:id` — remove event
   - `GET /api/funds` — list tracked funds
   - `POST /api/funds` — add fund
   - `POST /api/funds/:id/redemptions` — add redemption event
   - `GET /api/metrics/latest` — latest value per metric
   - `GET /api/metrics/:name/history` — historical series

6. **Test:** add a manual event, see it appear in timeline

---

## Verification

```bash
# Add event via API
curl -X POST http://localhost:3001/api/events \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-03-13","event":"Test manual event","severity":3,"category":"general"}'

# Verify in dashboard
curl http://localhost:3001/api/dashboard/timeline | python3 -m json.tool | head -20
```
