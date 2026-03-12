// @ts-check

const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

const VALID_CATEGORIES = new Set([
  'redemption',
  'gating',
  'bankruptcy',
  'regulatory',
  'bank_action',
  'market_move',
  'analyst_warning',
  'policy',
  'general',
]);

/**
 * Validate an event ID from the route params.
 *
 * @param {string} rawId - Route param value
 * @returns {number} Parsed integer ID
 * @throws {Error} When the ID is invalid
 */
function parseEventId(rawId) {
  const id = Number.parseInt(rawId, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Event ID must be a positive integer');
  }

  return id;
}

/**
 * Validate a date-only ISO string for manual event entry.
 *
 * @param {unknown} value - Candidate date string
 * @returns {string} Valid YYYY-MM-DD date
 * @throws {Error} When the date is missing or malformed
 */
function validateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('`date` must be a YYYY-MM-DD string');
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('`date` must be a valid calendar date');
  }

  return value;
}

/**
 * Validate an optional time string for manual event entry.
 *
 * @param {unknown} value - Candidate time string
 * @returns {string|null} Valid HH:mm time or null
 * @throws {Error} When the time is malformed
 */
function validateEventTime(value) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    throw new Error('`event_time` must be an HH:mm string');
  }

  const [hours, minutes] = value.split(':').map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error('`event_time` must be a valid 24-hour time');
  }

  return value;
}

/**
 * Validate and trim the event description.
 *
 * @param {unknown} value - Candidate event text
 * @returns {string} Clean event description
 * @throws {Error} When the description is missing
 */
function validateEventText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('`event` is required');
  }

  return value.trim().slice(0, 200);
}

/**
 * Validate the fixed 1-6 severity scale.
 *
 * @param {unknown} value - Candidate severity
 * @returns {number} Valid severity
 * @throws {Error} When the severity is outside the allowed range
 */
function validateSeverity(value) {
  const severity = Number.parseInt(String(value), 10);

  if (!Number.isInteger(severity) || severity < 1 || severity > 6) {
    throw new Error('`severity` must be an integer from 1 to 6');
  }

  return severity;
}

/**
 * Validate the event category taxonomy.
 *
 * @param {unknown} value - Candidate category
 * @param {string} [fallback='general'] - Default category
 * @returns {string} Supported category
 * @throws {Error} When the category is invalid
 */
function validateCategory(value, fallback = 'general') {
  if (value == null || value === '') {
    return fallback;
  }

  if (typeof value !== 'string' || !VALID_CATEGORIES.has(value)) {
    throw new Error(`\`category\` must be one of: ${Array.from(VALID_CATEGORIES).join(', ')}`);
  }

  return value;
}

/**
 * Normalize optional text fields for DB writes.
 *
 * @param {unknown} value - Candidate text
 * @param {number} [maxLength=1000] - Field-specific max length
 * @returns {string|null} Trimmed string or null
 * @throws {Error} When a non-string value is provided
 */
function optionalText(value, maxLength = 1000) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('Optional text fields must be strings');
  }

  return value.trim().slice(0, maxLength) || null;
}

/**
 * Normalize verified/auto-generated flags to SQLite integer booleans.
 *
 * @param {unknown} value - Candidate flag value
 * @param {0|1} fallback - Default flag value
 * @returns {0|1} SQLite boolean
 * @throws {Error} When the value cannot be interpreted as a boolean flag
 */
function normalizeFlag(value, fallback) {
  if (value == null || value === '') {
    return fallback;
  }

  if (value === true || value === 1 || value === '1') {
    return 1;
  }

  if (value === false || value === 0 || value === '0') {
    return 0;
  }

  throw new Error('Boolean flags must be true/false or 1/0');
}

/**
 * Fetch a single event row by ID.
 *
 * @param {number} id - Event primary key
 * @returns {Object|undefined} Event row, or undefined when not found
 */
function getEventById(id) {
  return getDb().prepare('SELECT * FROM events WHERE id = ?').get(id);
}

/**
 * Build a filterable event listing query from request query params.
 *
 * @param {import('express').Request['query']} query - Express query object
 * @returns {{ sql: string, params: Array<string|number> }} SQL and params
 */
function buildListQuery(query) {
  const clauses = [];
  /** @type {Array<string|number>} */
  const params = [];

  if (query.category) {
    clauses.push('category = ?');
    params.push(validateCategory(query.category));
  }

  if (query.severity) {
    clauses.push('severity = ?');
    params.push(validateSeverity(query.severity));
  }

  if (query.auto_generated != null) {
    clauses.push('auto_generated = ?');
    params.push(normalizeFlag(query.auto_generated, 0));
  }

  if (query.verified != null) {
    clauses.push('verified = ?');
    params.push(normalizeFlag(query.verified, 1));
  }

  if (query.date_from) {
    clauses.push('substr(date, 1, 10) >= ?');
    params.push(validateDate(query.date_from));
  }

  if (query.date_to) {
    clauses.push('substr(date, 1, 10) <= ?');
    params.push(validateDate(query.date_to));
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = Math.min(Math.max(Number.parseInt(String(query.limit || '250'), 10) || 250, 1), 1000);

  return {
    sql: `SELECT * FROM events ${where} ORDER BY date DESC, COALESCE(event_time, '00:00') DESC, severity DESC, id DESC LIMIT ?`,
    params: [...params, limit],
  };
}

/**
 * Normalize the payload for manual event creation.
 *
 * @param {Record<string, unknown>} body - Request body
 * @returns {{ date: string, event_time: string|null, event: string, severity: number, category: string, source: string|null, source_name: string, verified: 0|1, auto_generated: 0|1, notes: string|null }}
 */
function normalizeCreatePayload(body) {
  return {
    date: validateDate(body.date),
    event_time: validateEventTime(body.event_time),
    event: validateEventText(body.event),
    severity: validateSeverity(body.severity),
    category: validateCategory(body.category),
    source: optionalText(body.source, 1000),
    source_name: optionalText(body.source_name, 120) || 'Manual Entry',
    verified: normalizeFlag(body.verified, 1),
    auto_generated: normalizeFlag(body.auto_generated, 0),
    notes: optionalText(body.notes, 2000),
  };
}

/**
 * Merge a partial update into an existing event row.
 *
 * @param {Object} existing - Current DB row
 * @param {Record<string, unknown>} body - Partial update payload
 * @returns {{ date: string, event_time: string|null, event: string, severity: number, category: string, source: string|null, source_name: string|null, verified: 0|1, auto_generated: 0|1, notes: string|null }}
 */
function normalizeUpdatePayload(existing, body) {
  return {
    date: body.date != null ? validateDate(body.date) : existing.date,
    event_time: body.event_time !== undefined ? validateEventTime(body.event_time) : existing.event_time,
    event: body.event != null ? validateEventText(body.event) : existing.event,
    severity: body.severity != null ? validateSeverity(body.severity) : existing.severity,
    category: body.category != null ? validateCategory(body.category) : existing.category,
    source: body.source !== undefined ? optionalText(body.source, 1000) : existing.source,
    source_name: body.source_name !== undefined ? optionalText(body.source_name, 120) : existing.source_name,
    verified: body.verified !== undefined ? normalizeFlag(body.verified, existing.verified) : existing.verified,
    auto_generated: body.auto_generated !== undefined ? normalizeFlag(body.auto_generated, existing.auto_generated) : existing.auto_generated,
    notes: body.notes !== undefined ? optionalText(body.notes, 2000) : existing.notes,
  };
}

/**
 * List events with optional filters for manual review workflows.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {void}
 */
router.get('/', (req, res) => {
  try {
    const { sql, params } = buildListQuery(req.query);
    const items = getDb().prepare(sql).all(...params);
    res.json({ items, count: items.length });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Create a manual timeline event.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {void}
 */
router.post('/', (req, res) => {
  try {
    const payload = normalizeCreatePayload(req.body || {});
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO events (date, event_time, event, severity, category, source, source_name, verified, auto_generated, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.date,
      payload.event_time,
      payload.event,
      payload.severity,
      payload.category,
      payload.source,
      payload.source_name,
      payload.verified,
      payload.auto_generated,
      payload.notes,
    );

    const created = getEventById(Number(result.lastInsertRowid));
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Update an existing event row for manual correction/review.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {void}
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseEventId(req.params.id);
    const existing = getEventById(id);

    if (!existing) {
      res.status(404).json({ error: `Event ${id} not found` });
      return;
    }

    const payload = normalizeUpdatePayload(existing, req.body || {});

    getDb().prepare(`
      UPDATE events
      SET date = ?,
          event_time = ?,
          event = ?,
          severity = ?,
          category = ?,
          source = ?,
          source_name = ?,
          verified = ?,
          auto_generated = ?,
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      payload.date,
      payload.event_time,
      payload.event,
      payload.severity,
      payload.category,
      payload.source,
      payload.source_name,
      payload.verified,
      payload.auto_generated,
      payload.notes,
      id,
    );

    res.json(getEventById(id));
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Delete an event row from the manual review timeline.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {void}
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseEventId(req.params.id);
    const existing = getEventById(id);

    if (!existing) {
      res.status(404).json({ error: `Event ${id} not found` });
      return;
    }

    getDb().prepare('DELETE FROM events WHERE id = ?').run(id);
    res.json({ ok: true, id });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

module.exports = router;
