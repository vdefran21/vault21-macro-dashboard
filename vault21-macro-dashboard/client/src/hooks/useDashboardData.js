import { useState, useEffect, useCallback, useRef } from 'react';
import { get } from '../lib/api';
import { AUTO_REFRESH_INTERVAL } from '../lib/constants';

/**
 * Primary data hook for the dashboard.
 * Fetches the full payload from /api/dashboard, auto-refreshes on interval,
 * and exposes a manual refresh trigger.
 *
 * @returns {{ data: Object|null, loading: boolean, refreshing: boolean, lastRefresh: Date|null, error: string|null, triggerRefresh: Function }}
 */
export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await get('/dashboard');
      setData(response);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Manual refresh — re-fetches data from backend */
  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  // Initial fetch + auto-refresh polling
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  return { data, loading, refreshing, lastRefresh, error, triggerRefresh };
}
