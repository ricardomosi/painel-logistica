import {
  extractFirstShortMapsUrl,
  loadShortMapsCache,
  saveShortMapsCache,
} from '../lib/locationUtils';

const RESOLVER_ENDPOINT = '/api/resolve-maps-link';
const inFlightRequests = new Map();

function hasGoogleMapsGeocoder() {
  return typeof window !== 'undefined' && Boolean(window.google?.maps?.Geocoder);
}

function extractGoogleAddressParts(result) {
  if (!result) return null;
  const comps = Array.isArray(result.address_components) ? result.address_components : [];
  const getComp = (types) =>
    comps.find((c) => types.some((t) => Array.isArray(c.types) && c.types.includes(t)));

  const route = getComp(['route'])?.long_name || '';
  const streetNumber = getComp(['street_number'])?.long_name || '';
  const road = [route, streetNumber && streetNumber !== 'S/N' ? streetNumber : '']
    .filter(Boolean)
    .join(', ');
  const neighborhood =
    getComp(['sublocality_level_1', 'sublocality', 'neighborhood'])?.long_name || '';
  const city =
    getComp(['administrative_area_level_2', 'locality'])?.long_name || '';
  const state = getComp(['administrative_area_level_1'])?.short_name || '';

  const compactParts = [];
  if (road) compactParts.push(road);
  if (neighborhood && !road.toLowerCase().includes(neighborhood.toLowerCase())) {
    compactParts.push(neighborhood);
  }
  if (city) {
    compactParts.push(state ? `${city} - ${state}` : city);
  } else if (state) {
    compactParts.push(state);
  }

  const formattedAddress =
    compactParts.join(', ') ||
    String(result.formatted_address || '')
      .replace(/, Brasil$/i, '')
      .trim();

  return {
    formattedAddress,
    road,
    neighborhood,
    city,
    state,
  };
}

export async function reverseGeocodeWithGoogleMaps(lat, lng, timeoutMs = 2500) {
  if (!hasGoogleMapsGeocoder() || typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (status === 'OK' && Array.isArray(results) && results.length > 0) {
          // Prefer street/premise result over generic plus-code or country result
          const best =
            results.find((r) => !Array.isArray(r.types) || !r.types.includes('plus_code')) ||
            results[0];
          resolve(extractGoogleAddressParts(best));
        } else {
          resolve(null);
        }
      });
    } catch {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    }
  });
}

async function enrichEntryWithBrowserGeocoder(entry) {
  if (!entry || !entry.ok || typeof entry.lat !== 'number' || typeof entry.lng !== 'number') {
    return entry;
  }
  const needsAddress =
    !entry.city ||
    !entry.formattedAddress ||
    /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(String(entry.formattedAddress).trim());

  if (!needsAddress || !hasGoogleMapsGeocoder()) return entry;

  const googleInfo = await reverseGeocodeWithGoogleMaps(entry.lat, entry.lng);
  if (!googleInfo || !googleInfo.formattedAddress) return entry;

  return {
    ...entry,
    formattedAddress: googleInfo.formattedAddress,
    road: googleInfo.road || entry.road || '',
    neighborhood: googleInfo.neighborhood || entry.neighborhood || '',
    city: googleInfo.city || entry.city || '',
    state: googleInfo.state || entry.state || '',
  };
}

/**
 * Resolves a single short Google Maps URL via `/api/resolve-maps-link`,
 * enriches street/neighborhood/city via Google Maps Geocoder when in browser,
 * and caches cleanly in localStorage.
 */
export async function resolveShortMapsUrlClient(rawUrl, options = {}) {
  const shortUrl = extractFirstShortMapsUrl(rawUrl) || String(rawUrl || '').trim();
  if (!shortUrl) return { ok: false, error: 'Nenhum link encurtado encontrado.' };

  const cache = loadShortMapsCache();
  const cached = cache[shortUrl];
  if (!options.force && cached?.ok) {
    if (!cached.city && hasGoogleMapsGeocoder()) {
      const upgraded = await enrichEntryWithBrowserGeocoder(cached);
      if (upgraded.formattedAddress !== cached.formattedAddress || upgraded.city !== cached.city) {
        saveShortMapsCache({ ...loadShortMapsCache(), [shortUrl]: upgraded });
      }
      return upgraded;
    }
    return cached;
  }

  if (inFlightRequests.has(shortUrl)) {
    return inFlightRequests.get(shortUrl);
  }

  const promise = (async () => {
    try {
      const useServerReverse = !hasGoogleMapsGeocoder();
      const res = await fetch(RESOLVER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shortUrl, reverseGeocode: useServerReverse }),
      });
      const json = await res.json();
      if (json && json.ok && typeof json.lat === 'number' && typeof json.lng === 'number') {
        const enriched = await enrichEntryWithBrowserGeocoder(json);
        const nextCache = { ...loadShortMapsCache(), [shortUrl]: enriched };
        saveShortMapsCache(nextCache);
        return enriched;
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
 * Fast batch resolution for multiple unique shortened Google Maps links.
 * Redirect resolution runs in fast concurrent groups on backend (`reverseGeocode: false`),
 * and browser enriches missing street/city names via Google Maps Geocoder smoothly without rate-limiting.
 */
export async function resolveShortMapsUrlsBatch(urls = []) {
  const existingCache = loadShortMapsCache();
  const uniqueUrls = Array.from(
    new Set(
      (urls || [])
        .map((u) => extractFirstShortMapsUrl(u) || String(u || '').trim())
        .filter(Boolean)
    )
  );

  const pendingRedirect = uniqueUrls.filter((u) => !existingCache[u]).slice(0, 15);
  const nextCache = { ...existingCache };
  let changed = false;

  if (pendingRedirect.length > 0) {
    try {
      const res = await fetch(RESOLVER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: pendingRedirect, reverseGeocode: false }),
      });
      if (res.ok) {
        const json = await res.json();
        const results = json?.results || {};
        for (const urlKey of pendingRedirect) {
          const entry = results[urlKey];
          if (entry?.ok) {
            nextCache[urlKey] = entry;
            changed = true;
          }
        }
      }
    } catch {
      // Ignore transient network failure
    }
  }

  // Enrich coordinates missing city/street labels using Google Maps Geocoder in browser
  if (hasGoogleMapsGeocoder()) {
    const needEnrich = uniqueUrls
      .filter((u) => nextCache[u]?.ok && !nextCache[u]?.city)
      .slice(0, 10);

    for (let i = 0; i < needEnrich.length; i += 1) {
      const u = needEnrich[i];
      const upgraded = await enrichEntryWithBrowserGeocoder(nextCache[u]);
      if (upgraded && (upgraded.formattedAddress !== nextCache[u].formattedAddress || upgraded.city !== nextCache[u].city)) {
        nextCache[u] = upgraded;
        changed = true;
      }
      if (i < needEnrich.length - 1) {
        await new Promise((r) => setTimeout(r, 80));
      }
    }
  }

  if (changed) {
    saveShortMapsCache(nextCache);
  }
  return nextCache;
}
