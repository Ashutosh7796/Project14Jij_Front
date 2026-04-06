import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch — data-fetching hook with stable function identity support.
 *
 * Problem solved: callers often write:
 *   useFetch(() => api.getX())   ← new arrow fn every render
 *
 * We store the latest apiFunc in a ref so the effect only re-runs when
 * the deps array changes, not on every render.
 *
 * @param {Function} apiFunc  - async function that returns data
 * @param {Array}    deps     - re-fetch when these values change (default: [])
 * @returns {{ data, loading, error, refetch, setData }}
 */
export const useFetch = (apiFunc, deps = []) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Keep a stable ref to the latest apiFunc so the effect closure is always fresh
  const apiFuncRef = useRef(apiFunc);
  useEffect(() => { apiFuncRef.current = apiFunc; });

  // Stable fetch function — recreated only when deps change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const execute = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFuncRef.current();
      if (!signal?.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err.message ?? 'An error occurred');
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  // deps spread intentionally — callers control re-fetch triggers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const controller = new AbortController();
    execute(controller.signal);
    return () => controller.abort();
  }, [execute]);

  // Expose refetch so callers can manually trigger a reload
  const refetch = useCallback(() => {
    const controller = new AbortController();
    execute(controller.signal);
  }, [execute]);

  return { data, loading, error, refetch, setData };
};
