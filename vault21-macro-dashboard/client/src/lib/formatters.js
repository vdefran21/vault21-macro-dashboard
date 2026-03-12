/**
 * Formatting utilities for financial data display.
 */

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a date-like input without shifting plain YYYY-MM-DD values across
 * timezones.
 *
 * JavaScript treats `new Date('2026-03-12')` as UTC midnight, which renders as
 * the prior calendar day in US timezones. For dashboard event dates we want the
 * stored calendar date, not a timezone-adjusted instant.
 *
 * @param {Date|string} value
 * @returns {Date|null}
 */
function parseDisplayDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (DATE_ONLY_RE.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format a number as currency with appropriate suffix.
 * @param {number} value
 * @param {string} unit - 'T', 'B', 'M', or '%'
 * @returns {string} Formatted string (e.g., "$1.8T", "$300B", "5.0%")
 */
export function formatStat(value, unit) {
  if (unit === '%') return `${value}%`;
  if (unit === 'B+') return `$${value}B+`;
  return `$${value}${unit}`;
}

/**
 * Format a number to one decimal place.
 * @param {number} val
 * @returns {string}
 */
export function fmtPct(val) {
  if (val == null) return '—';
  return `${val.toFixed(1)}%`;
}

/**
 * Format a number as billions.
 * @param {number} val
 * @returns {string}
 */
export function fmtB(val) {
  if (val == null) return '—';
  return `$${val}B`;
}

/**
 * Format an ISO date string as a short display date.
 * @param {string} isoDate
 * @returns {string} e.g., "Mar 12, 2026"
 */
export function fmtDate(isoDate) {
  if (!isoDate) return '—';
  const parsed = parseDisplayDate(isoDate);
  if (!parsed) return '—';
  return parsed.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/**
 * Format an ISO date string as a compact chart tick label.
 * @param {string} isoDate
 * @returns {string}
 */
export function fmtShortDate(isoDate) {
  if (!isoDate) return '—';
  const parsed = parseDisplayDate(isoDate);
  if (!parsed) return '—';
  return parsed.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

/**
 * Format a date as relative time (e.g., "2 min ago").
 * @param {Date|string} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return 'never';
  const parsed = parseDisplayDate(date);
  if (!parsed) return 'never';
  const ms = Date.now() - parsed.getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
