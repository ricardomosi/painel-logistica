import {
  extractFirstShortMapsUrl,
  loadShortMapsCache,
  saveShortMapsCache,
} from '../lib/locationUtils';

const RESOLVER_ENDPOINT = '/api/resolve-maps-link';
const inFlightRequests = new Map();

/**
 * Resolves a single short Google Maps URL via `/api/resolve-maps-link`,
 * using localStorage caching and deduplicating concurrent requests.
 */
export async function resolveShortMapsUrlClient(rawUrl, options = {}) {
  const shortUrl = extractFirstShortMapsUrl(rawUrl) || String(rawUrl || '').trim();
  if (!shortUrl) return { ok: false, error: 'Nenhum link encurtado encontrado.' };

  const cache = loadShortMapsCache();
  if (!options.force && cache[shortUrl]?.ok) {
    return cache[shortUrl];
  }

  if (inFlightRequests.has(shortUrl)) {
    return inFlightRequests.get(shortUrl);
  }

  const promise = (async () => {
    try {
      const res = await fetch(RESOLVER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shortUrl, reverseGeocode: true }),
      });
      const json = await res.json();
      if (json && json.ok && typeof json.lat === 'number' && typeof json.lng === 'number') {
        const nextCache = { ...loadShortMapsCache(), [shortUrl]: json };
        saveShortMapsCache(nextCache);
        return json;
      }
      return json || { ok: false, shortUrl, error: 'Não foi possível expandir o link.' };
    } catch (err) {
      return { ok: false, shortUrl, error: err?.message || 'Falha de comunicação com o resolvedor.' };
    } finally {
      inFlightRequests.delete(shortUrl);
    }
  })();

  inFlightRequests.set(shortUrl, promise);
  return promise;
}

/**
 * Resolves multiple unique shortened Google Maps links in controlled batches (up to 15 per call)
 * and persists successful resolutions in localStorage cache.
 */
export async function resolveShortMapsUrlsBatch(urls = []) {
  const existingCache = loadShortMapsCache();
  const pending = Array.from(
    new Set(
      (urls || [])
        .map((u) => extractFirstShortMapsUrl(u) || String(u || '').trim())
        .filter((u) => u && !existingCache[u])
    )
  ).slice(0, 15);

  if (pending.length === 0) return existingCache;

  try {
    const res = await fetch(RESOLVER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: pending, reverseGeocode: true }),
    });
    if (!res.ok) return existingCache;
    const json = await res.json();
    const results = json?.results || {};
    const nextCache = { ...loadShortMapsCache() };
    let changed = false;

    for (const urlKey of pending) {
      const entry = results[urlKey];
      if (entry?.ok) {
        nextCache[urlKey] = entry;
        changed = true;
      }
    }

    if (changed) {
      saveShortMapsCache(nextCache);
    }
    return nextCache;
  } catch {
    return existingCache;
  }
}
