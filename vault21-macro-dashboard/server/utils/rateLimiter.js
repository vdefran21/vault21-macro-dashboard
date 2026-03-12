/**
 * Delay helper for rate-limited network requests.
 *
 * @param {number} ms - Milliseconds to wait before resolving
 * @returns {Promise<void>} Resolves after the requested delay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a simple spacing-based limiter for outbound requests.
 *
 * The phase 3 scrapers make a small number of calls per refresh cycle, so a
 * serialized queue with evenly spaced starts is enough to stay under source
 * limits without adding a heavier dependency.
 *
 * @param {{ requests: number, perMs: number }} options - Allowed request count
 *   across the given time window
 * @returns {(task: Function) => Promise<*>} Schedules a task under the limit
 */
function createRateLimiter({ requests, perMs }) {
  const safeRequests = Math.max(Number(requests) || 1, 1);
  const intervalMs = Math.ceil(perMs / safeRequests);

  let nextAvailableAt = 0;
  let tail = Promise.resolve();

  return function schedule(task) {
    const scheduled = tail.then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, nextAvailableAt - now);

      if (waitMs > 0) {
        await sleep(waitMs);
      }

      nextAvailableAt = Math.max(Date.now(), nextAvailableAt) + intervalMs;
      return task();
    });

    tail = scheduled.then(() => undefined, () => undefined);
    return scheduled;
  };
}

module.exports = { createRateLimiter, sleep };
