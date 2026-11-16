/**
 * Pure server/Node helper to safely expand shortened Google Maps URLs
 * (`maps.app.goo.gl`, `goo.gl/maps`, `g.co/maps`) into exact coordinates
 * and readable Brazilian street/neighborhood addresses.
 */

const ALLOWED_MAPS_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'g.co',
  'maps.google.com',
  'maps.google.com.br',
  'www.google.com',
  'google.com',
  'www.google.com.br',
  'google.com.br',
]);

export function isAllowedMapsHost(rawUrl) {
  try {
    const u = new URL(String(rawUrl || '').trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.toLowerCase();
    if (!ALLOWED_MAPS_HOSTS.has(host)) return false;
    if ((host === 'www.google.com' || host === 'google.com' || host === 'www.google.com.br' || host === 'google.com.br') && !u.pathname.startsWith('/maps')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function parseDmsTuple(deg, min, sec, hemi) {
  const val = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
  const h = String(hemi || '').toUpperCase();
  return h === 'S' || h === 'W' || h === 'O' ? -val : val;
}

function decodeSafe(str) {
  try {
    return decodeURIComponent(String(str || '').replace(/\+/g, ' '));
  } catch {
    return String(str || '').replace(/\+/g, ' ');
  }
}

function isDmsText(text) {
  return /\d{1,2}\s*[°º]\s*\d{1,2}\s*['′]/.test(String(text || ''));
}

export function extractCoordsAndPlaceFromMapsPayload(finalUrl = '', htmlBody = '') {
  const urlStr = String(finalUrl || '');
  const bodyStr = String(htmlBody || '');

  // Priority 1: Exact pinpoint !3d<lat>!4d<lng>
  const exactPin =
    urlStr.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    bodyStr.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  // Priority 2: URL viewport @lat,lng or q=/ll=
  const atPin = urlStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const queryPin = urlStr.match(/(?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const metaCenter =
    bodyStr.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i) ||
    bodyStr.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/i);

  let lat = null;
  let lng = null;

  const chosen = exactPin || queryPin || atPin || metaCenter;
  if (chosen) {
    lat = Number(parseFloat(chosen[1]).toFixed(6));
    lng = Number(parseFloat(chosen[2]).toFixed(6));
  }

  // Extract place/street segment from /maps/place/<segment>
  let urlPlaceText = '';
  const placeSeg = urlStr.match(/\/maps\/place\/([^/@?]+)/);
  if (placeSeg && placeSeg[1]) {
    urlPlaceText = decodeSafe(placeSeg[1]).trim();
  }

  // Fallback DMS inside /maps/place/ if coords were not matched directly
  if ((lat === null || lng === null) && urlPlaceText) {
    const dms = urlPlaceText.match(
      /(\d{1,2})\s*[°º]\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([NS])\s*[,;\s]+(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([WEOLweol])/i
    );
    if (dms) {
      lat = Number(parseDmsTuple(dms[1], dms[2], dms[3], dms[4]).toFixed(6));
      lng = Number(parseDmsTuple(dms[5], dms[6], dms[7], dms[8]).toFixed(6));
    }
  }

  // Extract og:title when Google actually exposes place name (non-generic)
  const ogTitleRaw =
    bodyStr.match(/property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
    bodyStr.match(/content=["']([^"']+)["'][^>]+property=["']og:title/i)?.[1] ||
    '';
  const ogTitle =
    ogTitleRaw && !/^google\s*maps$/i.test(ogTitleRaw.trim()) ? ogTitleRaw.trim() : '';

  const readablePlace = urlPlaceText && !isDmsText(urlPlaceText) ? urlPlaceText : ogTitle;

  return {
    lat: lat !== null && isFinite(lat) ? lat : null,
    lng: lng !== null && isFinite(lng) ? lng : null,
    readablePlace: readablePlace || '',
    dmsLabel: isDmsText(urlPlaceText) ? urlPlaceText : '',
  };
}

function buildCompactPtBrAddress(nominatimJson) {
  if (!nominatimJson || typeof nominatimJson !== 'object') return null;
  const a = nominatimJson.address || {};
  const road = [a.road, a.house_number].filter(Boolean).join(', ');
  const neighborhood = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
  const city = a.city || a.town || a.village || a.municipality || '';
  const iso = String(a['ISO3166-2-lvl4'] || '');
  const stateAbbr = iso.startsWith('BR-') ? iso.slice(3) : a.state || '';

  const parts = [];
  if (road) parts.push(road);
  if (neighborhood && !road.toLowerCase().includes(neighborhood.toLowerCase())) {
    parts.push(neighborhood);
  }
  if (city && !neighborhood.toLowerCase().includes(city.toLowerCase())) {
    parts.push(stateAbbr ? `${city} - ${stateAbbr}` : city);
  } else if (city && parts.length === 0) {
    parts.push(stateAbbr ? `${city} - ${stateAbbr}` : city);
  } else if (!city && stateAbbr) {
    parts.push(stateAbbr);
  }

  const compact = parts.filter(Boolean).join(', ') || nominatimJson.display_name || '';
  return {
    formattedAddress: compact,
    road: road || '',
    neighborhood: neighborhood || '',
    city: city || '',
    state: stateAbbr || '',
  };
}

export async function reverseGeocodeCoords(lat, lng, timeoutMs = 4500) {
  if (lat === null || lng === null || !isFinite(lat) || !isFinite(lng)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&accept-language=pt-BR&zoom=17`;
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'JPatricioLogistica/2.0 (logistica@jpatriciometais.com.br)',
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return buildCompactPtBrAddress(json);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveSingleMapsUrl(rawUrl, options = {}) {
  const { reverseGeocode = true, timeoutMs = 7000 } = options;
  const url = String(rawUrl || '').trim();
  if (!url || !isAllowedMapsHost(url)) {
    return {
      ok: false,
      shortUrl: url,
      error: 'URL de mapa não reconhecida ou fora dos domínios Google Maps.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const finalUrl = res.url || url;
    const body = await res.text();
    const extracted = extractCoordsAndPlaceFromMapsPayload(finalUrl, body);

    if (extracted.lat === null || extracted.lng === null) {
      return {
        ok: false,
        shortUrl: url,
        finalUrl,
        error: 'Não foi possível extrair coordenadas deste link.',
      };
    }

    let geoInfo = null;
    if (reverseGeocode) {
      geoInfo = await reverseGeocodeCoords(extracted.lat, extracted.lng);
    }

    const formattedAddress =
      (extracted.readablePlace && geoInfo?.city && !extracted.readablePlace.includes(geoInfo.city)
        ? `${extracted.readablePlace}, ${geoInfo.city}${geoInfo.state ? ` - ${geoInfo.state}` : ''}`
        : extracted.readablePlace || geoInfo?.formattedAddress) ||
      `${extracted.lat.toFixed(6)}, ${extracted.lng.toFixed(6)}`;

    return {
      ok: true,
      shortUrl: url,
      finalUrl,
      lat: extracted.lat,
      lng: extracted.lng,
      formattedAddress,
      road: geoInfo?.road || '',
      neighborhood: geoInfo?.neighborhood || '',
      city: geoInfo?.city || '',
      state: geoInfo?.state || '',
    };
  } catch (err) {
    return {
      ok: false,
      shortUrl: url,
      error: err?.name === 'AbortError' ? 'Tempo limite esgotado ao expandir link.' : err?.message || 'Erro ao resolver link.',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleResolveMapsRequest({ url, urls, reverseGeocode = true }) {
  if (Array.isArray(urls)) {
    const unique = Array.from(new Set(urls.map((u) => String(u || '').trim()).filter(Boolean))).slice(0, 15);
    const results = {};
    // Process sequentially in small slices when reverseGeocode is active to respect Nominatim rate policy
    for (let i = 0; i < unique.length; i += 1) {
      const item = unique[i];
      results[item] = await resolveSingleMapsUrl(item, { reverseGeocode });
      if (reverseGeocode && i < unique.length - 1) {
        await new Promise((r) => setTimeout(r, 180));
      }
    }
    return { ok: true, results };
  }

  return resolveSingleMapsUrl(url, { reverseGeocode });
}
