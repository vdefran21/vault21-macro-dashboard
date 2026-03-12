/**
 * Convert a supported date-like input to an ISO calendar date.
 *
 * @param {Date|string|number} value - Date instance, timestamp, or ISO-like string
 * @returns {string} Date formatted as YYYY-MM-DD in UTC
 * @throws {Error} When the input cannot be converted to a valid date
 */
function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Return midnight UTC for the first day of the supplied year.
 *
 * @param {Date|string|number} [value=new Date()] - Date used to determine the year
 * @returns {Date} Start-of-year timestamp in UTC
 */
function getStartOfUtcYear(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

/**
 * Convert a date-like value into Unix epoch seconds.
 *
 * @param {Date|string|number} value - Date instance, timestamp, or ISO-like string
 * @returns {number} Whole Unix timestamp in seconds
 */
function toUnixSeconds(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Math.floor(date.getTime() / 1000);
}

module.exports = { toIsoDate, getStartOfUtcYear, toUnixSeconds };
