import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOrFetch,
  peekForDisplay,
  subscribeCacheKey,
  invalidateKey,
  refreshKey,
} from '../cache/requestCache';

/**
 * Cached data fetch: TTL / SWR, single-flight deduplication, reactive invalidation.
 *
 * @param {string|null|undefined} cacheKey - null/undefined disables fetch
 * @param {() => Promise<any>} fetcher - stabilize with useCallback when it closes over ids
 * @param {{
 *   ttlMs?: number,
 *   freshMs?: number,
 *   staleMs?: number,
 *   swr?: boolean,
 *   tags?: string[],
 *   persistSession?: boolean
 * }} [options]
 */
export function useCachedFetch(cacheKey, fetcher, options = {}) {
  const { ttlMs, tags, swr, freshMs, staleMs, persistSession } = options;
  const disabled = cacheKey == null || cacheKey === '';

  const fetcherRef = useRef(fetcher);
  const optsRef = useRef({ ttlMs, tags, swr, freshMs, staleMs, persistSession });
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);
  useEffect(() => {
    optsRef.current = { ttlMs, tags, swr, freshMs, staleMs, persistSession };
  }, [ttlMs, tags, swr, freshMs, staleMs, persistSession]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  useEffect(() => {
    if (disabled) {
      setData(null);
      setLoading(false);
      setError(null);
      setIsRevalidating(false);
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      const snap = peekForDisplay(cacheKey);
      if (snap !== undefined) {
        if (!cancelled) {
          setData(snap);
          setLoading(false);
          setError(null);
        }
      } else if (!cancelled) {
        setLoading(true);
      }

      try {
        const result = await getOrFetch(cacheKey, () => fetcherRef.current(), optsRef.current);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Request failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    const unsub = subscribeCacheKey(cacheKey, (meta) => {
      if (meta?.type === 'revalidate-start') {
        setIsRevalidating(true);
        return;
      }
      if (meta?.type === 'revalidate-end') {
        setIsRevalidating(false);
        return;
      }
      const v = peekForDisplay(cacheKey);
      if (v !== undefined) {
        setData(v);
        setLoading(false);
        setError(null);
      } else {
        run();
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [cacheKey, disabled]);

  const refetch = useCallback(() => {
    if (disabled) return Promise.resolve(null);
    return refreshKey(cacheKey, () => fetcherRef.current(), optsRef.current).then((r) => {
      setData(r);
      setError(null);
      return r;
    });
  }, [cacheKey, disabled]);

  const setDataOptimistic = useCallback((updater) => {
    setData((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const bust = useCallback(() => {
    if (disabled) return;
    invalidateKey(cacheKey);
  }, [cacheKey, disabled]);

  if (disabled) {
    return {
      data: null,
      loading: false,
      error: null,
      isRevalidating: false,
      refetch: async () => null,
      setData: () => {},
      bust: () => {},
    };
  }

  return {
    data,
    loading,
    error,
    isRevalidating,
    refetch,
    setData: setDataOptimistic,
    bust,
  };
}
