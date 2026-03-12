// @ts-check

/**
 * Fetch wrapper for the vault21 backend API.
 * All calls go through the Vite proxy in dev (/api → localhost:3001).
 */

const BASE = '/api';

/**
 * Make a GET request to the backend.
 *
 * @template T
 * @param {string} path - API path (e.g., '/dashboard')
 * @returns {Promise<T>} Parsed JSON response
 * @throws {Error} On non-OK status with status text
 */
export async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return /** @type {Promise<T>} */ (res.json());
}

/**
 * Make a POST request to the backend.
 *
 * @template T
 * @param {string} path - API path (e.g., '/refresh')
 * @param {Object} body - JSON body
 * @returns {Promise<T>} Parsed JSON response
 * @throws {Error} On non-OK status
 */
export async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return /** @type {Promise<T>} */ (res.json());
}
