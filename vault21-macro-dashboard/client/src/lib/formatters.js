/**
 * Formatting utilities for financial data display.
 */

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
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/**
 * Format a date as relative time (e.g., "2 min ago").
 * @param {Date|string} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return 'never';
  const ms = Date.now() - new Date(date).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
