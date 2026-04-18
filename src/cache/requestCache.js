/**
 * Centralized API cache (in-memory + optional sessionStorage for full page reloads).
 *
 * - Deduplication: concurrent getOrFetch for the same key share one Promise.
 * - Stale-while-revalidate (SWR): optional `swr` + `freshMs` / `staleMs` — return cached
 *   data past `freshMs` but before `staleMs` immediately, refresh in background.
 * - Epoch invalidation: mutations bump epoch so late in-flight writes are ignored.
 * - Tags / prefix: granular invalidation without clearing the whole cache.
 * - writeThroughSet: patch cache after a successful mutation without refetch.
 * - persistSession: when true, entries are mirrored to sessionStorage until stale/invalidated.
 */

const STORAGE_PREFIX = 'rqc:v1:';
const MAX_PERSIST_BYTES = 450_000;

const entries = new Map();
const inflight = new Map();
const inflightEpoch = new Map();
const bgInflight = new Map();
const epochs = new Map();
/** key -> Set<(meta?: object) => void> */
const listeners = new Map();

function bumpEpoch(key) {
  epochs.set(key, (epochs.get(key) || 0) + 1);
}

function getEpoch(key) {
  return epochs.get(key) || 0;
}

function persistStorageKey(cacheKey) {
  return `${STORAGE_PREFIX}${encodeURIComponent(cacheKey)}`;
}

export function unpersistSessionKey(cacheKey) {
  try {
    sessionStorage.removeItem(persistStorageKey(cacheKey));
  } catch {
    /* ignore */
  }
}

function persistEntryToSession(cacheKey, row) {
  if (!row?.persistSession) return;
  try {
    const payload = JSON.stringify({
      value: row.value,
      freshUntil: row.freshUntil,
      staleUntil: row.staleUntil,
      tags: row.tags,
    });
    if (payload.length > MAX_PERSIST_BYTES) return;
    sessionStorage.setItem(persistStorageKey(cacheKey), payload);
  } catch {
    /* quota / private mode */
  }
}

function clearAllPersistedSession() {
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

function hydrateFromSessionStorage() {
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    for (const sk of keys) {
      const raw = sessionStorage.getItem(sk);
      if (!raw) continue;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        sessionStorage.removeItem(sk);
        continue;
      }
      const { value, freshUntil, staleUntil, tags } = parsed;
      if (typeof staleUntil !== 'number' || Date.now() >= staleUntil) {
        sessionStorage.removeItem(sk);
        continue;
      }
      const cacheKey = decodeURIComponent(sk.slice(STORAGE_PREFIX.length));
      entries.set(cacheKey, {
        value,
        freshUntil,
        staleUntil,
        tags: Array.isArray(tags) ? tags : [],
        persistSession: true,
      });
    }
  } catch {
    /* ignore */
  }
}

hydrateFromSessionStorage();

/**
 * @param {object} [meta] — e.g. { type: 'revalidate-start' }
 */
export function notify(key, meta) {
  listeners.get(key)?.forEach((fn) => {
    try {
      fn(meta);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeCacheKey(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => {
    listeners.get(key)?.delete(callback);
    if (listeners.get(key)?.size === 0) listeners.delete(key);
  };
}

/**
 * Normalize cache options. If `swr` is false/omitted and only `ttlMs` is set,
 * fresh and stale windows match (previous hard-TTL behaviour).
 */
export function normalizeCacheOptions(options = {}) {
  const tags = options.tags ?? [];
  const swr = options.swr === true;
  const ttlMs = options.ttlMs ?? 60_000;
  let freshMs = options.freshMs;
  let staleMs = options.staleMs;

  if (freshMs == null && staleMs == null) {
    freshMs = ttlMs;
    staleMs = ttlMs;
  } else {
    freshMs = freshMs ?? ttlMs;
    staleMs = staleMs ?? Math.max(freshMs, ttlMs * 5);
  }
  if (staleMs < freshMs) staleMs = freshMs;

  const persistSession = options.persistSession === true;

  return { freshMs, staleMs, tags, swr, persistSession };
}

function setEntry(key, value, norm) {
  const now = Date.now();
  const row = {
    value,
    freshUntil: now + norm.freshMs,
    staleUntil: now + norm.staleMs,
    tags: [...norm.tags],
    persistSession: norm.persistSession === true,
  };
  entries.set(key, row);
  if (row.persistSession) persistEntryToSession(key, row);
}

/**
 * Synchronous read if entry exists and is within stale window (may be "stale" for SWR).
 */
export function peekForDisplay(key) {
  const row = entries.get(key);
  if (!row) return undefined;
  if (Date.now() >= row.staleUntil) {
    entries.delete(key);
    unpersistSessionKey(key);
    return undefined;
  }
  return row.value;
}

/** @deprecated use peekForDisplay */
export const peekValid = peekForDisplay;

export function isEntryStale(key) {
  const row = entries.get(key);
  if (!row || Date.now() >= row.staleUntil) return true;
  return Date.now() >= row.freshUntil;
}

function scheduleBackgroundRevalidate(key, fetcher, norm) {
  if (!norm.swr) return;
  const row = entries.get(key);
  if (!row || Date.now() >= row.staleUntil) return;
  if (Date.now() < row.freshUntil) return;
  if (bgInflight.has(key)) return;

  const epochWanted = getEpoch(key);
  notify(key, { type: 'revalidate-start' });

  const p = (async () => {
    try {
      const value = await fetcher();
      if (getEpoch(key) !== epochWanted) return;
      setEntry(key, value, norm);
      notify(key, { type: 'revalidate-end' });
      notify(key);
    } catch {
      notify(key, { type: 'revalidate-end' });
    } finally {
      bgInflight.delete(key);
    }
  })();

  bgInflight.set(key, p);
}

/**
 * @param {string} key
 * @param {() => Promise<any>} fetcher
 * @param {{
 *   ttlMs?: number,
 *   freshMs?: number,
 *   staleMs?: number,
 *   swr?: boolean,
 *   tags?: string[],
 *   persistSession?: boolean
 * }} [options]
 */
export async function getOrFetch(key, fetcher, options = {}) {
  const norm = normalizeCacheOptions(options);
  const now = Date.now();
  const row = entries.get(key);

  if (row && now < row.staleUntil) {
    if (now < row.freshUntil) {
      return row.value;
    }
    if (norm.swr) {
      scheduleBackgroundRevalidate(key, fetcher, norm);
      return row.value;
    }
    return row.value;
  }

  const epochWanted = getEpoch(key);

  const existing = inflight.get(key);
  const meta = inflightEpoch.get(key);
  if (existing && meta && meta.epoch === epochWanted) {
    return existing;
  }

  const p = (async () => {
    try {
      const value = await fetcher();
      if (getEpoch(key) !== epochWanted) {
        return value;
      }
      setEntry(key, value, norm);
      notify(key);
      return value;
    } finally {
      inflight.delete(key);
      inflightEpoch.delete(key);
    }
  })();

  inflight.set(key, p);
  inflightEpoch.set(key, { epoch: epochWanted });
  return p;
}

/**
 * Update cache after a successful mutation (write-through). Does not bump epoch.
 */
export function writeThroughSet(key, value, options = {}) {
  const norm = normalizeCacheOptions(options);
  setEntry(key, value, norm);
  notify(key);
}

export function invalidateKey(key) {
  entries.delete(key);
  unpersistSessionKey(key);
  bumpEpoch(key);
  notify(key);
}

export function invalidateTags(tagList) {
  if (!tagList?.length) return;
  const want = new Set(tagList);
  for (const [key, row] of [...entries.entries()]) {
    if (row.tags?.some((t) => want.has(t))) {
      entries.delete(key);
      unpersistSessionKey(key);
      bumpEpoch(key);
      notify(key);
    }
  }
}

export function invalidatePrefix(prefix) {
  if (!prefix) return;
  for (const key of [...entries.keys()]) {
    if (key.startsWith(prefix)) {
      entries.delete(key);
      unpersistSessionKey(key);
      bumpEpoch(key);
      notify(key);
    }
  }
}

export function clearAllRequestCache() {
  const allKeys = new Set([...entries.keys(), ...inflight.keys(), ...bgInflight.keys()]);
  for (const key of allKeys) {
    bumpEpoch(key);
    notify(key);
  }
  entries.clear();
  inflight.clear();
  inflightEpoch.clear();
  bgInflight.clear();
  clearAllPersistedSession();
}

export function refreshKey(key, fetcher, options) {
  invalidateKey(key);
  return getOrFetch(key, fetcher, options);
}
