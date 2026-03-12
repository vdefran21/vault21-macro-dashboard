// @ts-check

import { useState, useEffect, useCallback, useRef } from 'react';
import { get, post } from '../lib/api';
import { AUTO_REFRESH_INTERVAL } from '../lib/constants';

/** @typedef {import('../../../shared/contracts.js').DashboardDataHookResult} DashboardDataHookResult */
/** @typedef {import('../../../shared/contracts.js').DashboardPayload} DashboardPayload */
/** @typedef {import('../../../shared/contracts.js').RefreshSummary} RefreshSummary */

/**
 * Primary data hook for the dashboard.
 * Fetches the full payload from /api/dashboard, auto-refreshes on interval,
 * and exposes a manual refresh trigger.
 *
 * @returns {DashboardDataHookResult}
 */
export function useDashboardData() {
  const [data, setData] = useState(/** @type {DashboardPayload|null} */ (null));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(/** @type {Date|null} */ (null));
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const intervalRef = useRef(/** @type {ReturnType<typeof setInterval>|null} */ (null));

  const fetchData = useCallback(async () => {
    try {
      const response = /** @type {DashboardPayload} */ (await get('/dashboard'));
      setData(response);
      setLastRefresh(response.meta?.last_refresh ? new Date(response.meta.last_refresh) : new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Manual refresh — re-fetches data from backend */
  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      /** @type {RefreshSummary} */
      const _summary = await post('/refresh', { scope: 'full' });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // Initial fetch + auto-refresh polling
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  return { data, loading, refreshing, lastRefresh, error, triggerRefresh };
}
