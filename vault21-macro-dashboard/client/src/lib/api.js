// @ts-check

/**
 * Fetch wrapper for the vault21 backend API.
 * All calls go through the Vite proxy in dev (/api → localhost:3001).
 */

const BASE = '/api';

/**
 * Perform a request against the backend and surface JSON error messages when
 * the API provides them.
 *
 * @template T
 * @param {string} path - API path (e.g., '/dashboard')
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<T>} Parsed response payload
 */
async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;

    if (isJson) {
      const payload = await res.json().catch(() => null);

      if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
        message = payload.error;
      }
    }

    throw new Error(message);
  }

  if (!isJson) {
    return /** @type {Promise<T>} */ (res.text());
  }

  return /** @type {Promise<T>} */ (res.json());
}

/**
 * Make a GET request to the backend.
 *
 * @template T
 * @param {string} path - API path (e.g., '/dashboard')
 * @returns {Promise<T>} Parsed JSON response
 */
export async function get(path) {
  return request(path);
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
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Make a PUT request to the backend.
 *
 * @template T
 * @param {string} path - API path (e.g., '/events/1')
 * @param {Object} body - JSON body
 * @returns {Promise<T>} Parsed JSON response
 */
export async function put(path, body) {
  return request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Make a DELETE request to the backend.
 *
 * @template T
 * @param {string} path - API path (e.g., '/events/1')
 * @returns {Promise<T>} Parsed JSON response
 */
export async function del(path) {
  return request(path, { method: 'DELETE' });
}
