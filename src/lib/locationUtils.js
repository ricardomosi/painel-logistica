function extractCoordinatesFromUrl(url) {
  if (!url) return null;
  const match = String(url).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

  const qMatch = String(url).match(/(?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  return null;
}

const GEOCODE_CACHE_KEY = 'jpatricio_geocode_cache_v1';

// Known Mossoro/RN neighborhoods, districts, industrial hubs & regional cities
// Used for fast canonical grouping and reliable fallback coordinates on the delivery map.
const KNOWN_LOCATIONS = [
  { key: 'nova-betania', label: 'Nova Betânia — Mossoró/RN', category: 'Bairro', lat: -5.1924, lng: -37.3612, patterns: ['nova betania', 'rj9g+68f'] },
  { key: 'santa-julia', label: 'Santa Júlia — Mossoró/RN', category: 'Distrito Industrial', lat: -5.2116, lng: -37.3665, patterns: ['santa julia', 'dehuel vieira diniz', 'deuel vieira', 'industrial dehuel'] },
  { key: 'alto-da-conceicao', label: 'Alto da Conceição — Mossoró/RN', category: 'Bairro', lat: -5.1972, lng: -37.3438, patterns: ['alto da conceicao', 'alberto maranhao'] },
  { key: 'bom-jesus', label: 'Bom Jesus — Mossoró/RN', category: 'Bairro', lat: -5.1748, lng: -37.3358, patterns: ['bom jesus', 'josefa xavier'] },
  { key: 'abolicao', label: 'Abolição — Mossoró/RN', category: 'Bairro', lat: -5.1823, lng: -37.3679, patterns: ['abolicao', 'abel coelho'] },
  { key: 'centro-mossoro', label: 'Centro — Mossoró/RN', category: 'Bairro', lat: -5.1879, lng: -37.3442, patterns: ['centro, mossoro', 'centro - mossoro'] },
  { key: 'passagem-de-pedras', label: 'Passagem de Pedras — Mossoró/RN', category: 'Zona Rural', lat: -5.1462, lng: -37.3921, patterns: ['passagem de pedra', 'passagem de pedras'] },
  { key: 'piquiri', label: 'Salina Piquiri — Mossoró/RN', category: 'Salina / Polo', lat: -5.0674, lng: -37.2485, patterns: ['salina piquiri', 'piquiri'] },
  { key: 'barauna', label: 'Baraúna — RN', category: 'Município', lat: -5.0806, lng: -37.6167, patterns: ['barauna', 'baraunas'] },
  { key: 'assu', label: 'Assú — RN', category: 'Município', lat: -5.5772, lng: -36.9089, patterns: ['assu', 'acu -', 'frutilandia', 'madre cistina', 'madre cristina'] },
  { key: 'tibau', label: 'Tibau — RN', category: 'Município', lat: -4.8397, lng: -37.2536, patterns: ['tibau', 'agricola famosa'] },
  { key: 'areia-branca', label: 'Areia Branca — RN', category: 'Município', lat: -4.9564, lng: -37.1369, patterns: ['areia branca'] },
  { key: 'grossos', label: 'Grossos — RN', category: 'Município', lat: -4.9794, lng: -37.1544, patterns: ['grossos'] },
  { key: 'upanema', label: 'Upanema — RN', category: 'Município', lat: -5.6422, lng: -37.2578, patterns: ['upanema'] },
  { key: 'apodi', label: 'Apodi — RN', category: 'Município', lat: -5.6642, lng: -37.7989, patterns: ['apodi'] },
  { key: 'serra-do-mel', label: 'Serra do Mel — RN', category: 'Município', lat: -5.1714, lng: -37.0281, patterns: ['serra do mel'] },
  { key: 'dix-sept', label: 'Gov. Dix-Sept Rosado — RN', category: 'Município', lat: -5.4586, lng: -37.5208, patterns: ['dix-sept', 'dix sept'] },
  { key: 'limoeiro-do-norte', label: 'Limoeiro do Norte — CE', category: 'Município', lat: -5.1456, lng: -38.0981, patterns: ['limoeiro'] },
  { key: 'russas', label: 'Russas — CE', category: 'Município', lat: -4.9403, lng: -37.9756, patterns: ['russas'] },
  { key: 'aracati', label: 'Aracati — CE', category: 'Município', lat: -4.5617, lng: -37.7697, patterns: ['aracati'] },
  { key: 'clc', label: 'CLC (Ponto Recorrente)', category: 'Cliente / Polo', lat: -5.1725, lng: -37.3595, patterns: ['clc'] },
  { key: 'ebs', label: 'EBS (Ponto Recorrente)', category: 'Cliente / Polo', lat: -5.2065, lng: -37.3515, patterns: ['ebs'] },
  { key: 'lm-serralheria', label: 'LM Serralheria', category: 'Cliente / Polo', lat: -5.1905, lng: -37.3522, patterns: ['lm serralheria'] },
  { key: 'santo-antonio', label: 'Santo Antônio — Mossoró/RN', category: 'Bairro', lat: -5.1731, lng: -37.3492, patterns: ['santo antonio'] },
  { key: 'dom-jaime', label: 'Dom Jaime Câmara — Mossoró/RN', category: 'Bairro', lat: -5.2145, lng: -37.3345, patterns: ['dom jaime', 'vinte e quatro', 'costa e silva'] },
  { key: 'sumare', label: 'Sumaré — Mossoró/RN', category: 'Bairro', lat: -5.2061, lng: -37.3195, patterns: ['sumare'] },
  { key: 'paredoes', label: 'Paredões — Mossoró/RN', category: 'Bairro', lat: -5.1842, lng: -37.3375, patterns: ['paredoes'] },
  { key: 'aeroporto', label: 'Aeroporto — Mossoró/RN', category: 'Bairro', lat: -5.1994, lng: -37.3614, patterns: ['aeroporto'] },
];

export function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function cleanTextForMatch(str) {
  return stripAccents(str)
    .toLowerCase()
    .replace(/[*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isShortMapsUrl(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s.includes('maps.app.goo.gl') || s.includes('goo.gl/maps');
}

export function isHttpUrl(val) {
  if (!val) return false;
  return /^https?:\/\//i.test(String(val).trim());
}

function parseDmsCoordinate(deg, min, sec, hemi) {
  const decimal = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
  const h = String(hemi || '').toUpperCase();
  return h === 'S' || h === 'W' || h === 'O' ? -decimal : decimal;
}

/**
 * Extracts explicit coordinates from Google Maps URLs, DMS strings, or raw "lat, lng" strings.
 */
export function extractCoordinates(val) {
  if (!val) return null;
  const str = String(val).trim();

  const fromUrl = extractCoordinatesFromUrl(str);
  if (fromUrl) return fromUrl;

  const dataParam = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataParam) {
    return { lat: parseFloat(dataParam[1]), lng: parseFloat(dataParam[2]) };
  }

  // DMS format e.g. 5°13'18.5"S 37°17'40.3"W
  const dms = str.match(
    /(\d{1,2})\s*[°º]\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([NS])\s*[,;\s]+(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([WEOLweol])/i
  );
  if (dms) {
    return {
      lat: Number(parseDmsCoordinate(dms[1], dms[2], dms[3], dms[4]).toFixed(6)),
      lng: Number(parseDmsCoordinate(dms[5], dms[6], dms[7], dms[8]).toFixed(6)),
    };
  }

  const plain = str.match(/^(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})$/);
  if (plain) {
    return { lat: parseFloat(plain[1]), lng: parseFloat(plain[2]) };
  }

  return null;
}

/**
 * Title-cases a normalized Portuguese location name cleanly.
 */
function formatLocationDisplay(raw) {
  const cleaned = String(raw || '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Endereço não informado';
  if (cleaned.length <= 4) return cleaned.toUpperCase();

  const lowercaseWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no']);
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, idx) => {
      if (idx > 0 && lowercaseWords.has(word)) return word;
      if (word === 'rn' || word === 'ce' || word === 'pb') return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Classifies and normalizes a delivery's address/location for reporting and mapping.
 */
export function normalizeDeliveryLocation(delivery) {
  const rawAddress = String(delivery?.endereco || '').trim();
  const rawClient = String(delivery?.cliente || '').trim();
  const combinedNorm = cleanTextForMatch(`${rawAddress} ${rawClient}`);

  if (!rawAddress) {
    return {
      key: 'sem-endereco',
      label: 'Endereço não informado',
      category: 'Sem Local',
      rawAddress: '',
      isEmpty: true,
      isShortUrl: false,
      explicitCoords: null,
      presetCoords: null,
      geocodeQuery: null,
    };
  }

  const explicitCoords = extractCoordinates(rawAddress);
  const shortUrl = isShortMapsUrl(rawAddress);
  const httpUrl = isHttpUrl(rawAddress);

  if (shortUrl || (httpUrl && !explicitCoords)) {
    const matchedKnown = KNOWN_LOCATIONS.find((loc) =>
      loc.patterns.some((p) => cleanTextForMatch(rawClient).includes(p))
    );
    if (matchedKnown) {
      return {
        key: matchedKnown.key,
        label: matchedKnown.label,
        category: matchedKnown.category,
        rawAddress,
        isEmpty: false,
        isShortUrl: shortUrl,
        explicitCoords: null,
        presetCoords: { lat: matchedKnown.lat, lng: matchedKnown.lng },
        geocodeQuery: null,
      };
    }

    return {
      key: 'link-maps-curto',
      label: 'Link Google Maps (URL curta)',
      category: 'Link GPS',
      rawAddress,
      isEmpty: false,
      isShortUrl: shortUrl,
      explicitCoords: null,
      presetCoords: null,
      geocodeQuery: null,
    };
  }

  // Try matching known regional hubs / neighborhoods / cities
  const addrNorm = cleanTextForMatch(rawAddress);
  const matched = KNOWN_LOCATIONS.find((loc) =>
    loc.patterns.some((p) => addrNorm.includes(p))
  );

  if (matched) {
    return {
      key: matched.key,
      label: matched.label,
      category: matched.category,
      rawAddress,
      isEmpty: false,
      isShortUrl: false,
      explicitCoords,
      presetCoords: { lat: matched.lat, lng: matched.lng },
      geocodeQuery: `${rawAddress.replace(/\n/g, ' ')}, Rio Grande do Norte, Brasil`,
    };
  }

  // Heuristic for generic operational notes vs real addresses
  if (
    addrNorm.includes('aguardando') ||
    addrNorm.includes('enviado para') ||
    addrNorm.includes('terca feira') ||
    addrNorm.includes('segunda') ||
    addrNorm.includes('retirar')
  ) {
    const fallbackClient = KNOWN_LOCATIONS.find((loc) =>
      loc.patterns.some((p) => combinedNorm.includes(p))
    );
    if (fallbackClient) {
      return {
        key: fallbackClient.key,
        label: fallbackClient.label,
        category: fallbackClient.category,
        rawAddress,
        isEmpty: false,
        isShortUrl: false,
        explicitCoords,
        presetCoords: { lat: fallbackClient.lat, lng: fallbackClient.lng },
        geocodeQuery: null,
      };
    }
    return {
      key: `obs:${addrNorm.slice(0, 32)}`,
      label: formatLocationDisplay(rawAddress),
      category: 'Observação de Rota',
      rawAddress,
      isEmpty: false,
      isShortUrl: false,
      explicitCoords,
      presetCoords: null,
      geocodeQuery: null,
    };
  }

  // Standard street / neighborhood address grouping
  const firstLine = rawAddress.split('\n').filter(Boolean)[0] || rawAddress;
  const parts = firstLine.split(',').map((p) => p.trim()).filter(Boolean);
  let canonicalText = firstLine;
  if (parts.length >= 3) {
    // Usually "Rua X, 123, Bairro" -> highlight Bairro + Cidade if present
    canonicalText = parts.slice(2).join(', ');
  } else if (parts.length === 2 && /^\d+/.test(parts[1])) {
    canonicalText = parts[0];
  }

  const key = `addr:${cleanTextForMatch(canonicalText).slice(0, 48)}`;
  const hasStreetKeywords = /\b(rua|av|avenida|travessa|rodovia|br-|rn-|estrada|sitio|fazenda|lote|quadra|bairro)\b/.test(addrNorm);

  return {
    key,
    label: formatLocationDisplay(canonicalText),
    category: hasStreetKeywords ? 'Endereço Urbano/Rodovia' : 'Local / Referência',
    rawAddress,
    isEmpty: false,
    isShortUrl: false,
    explicitCoords,
    presetCoords: null,
    geocodeQuery: `${rawAddress.replace(/\n/g, ' ')}, Mossoró - RN, Brasil`,
  };
}

export function loadGeocodeCache() {
  try {
    if (typeof localStorage === 'undefined') return {};
    return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveGeocodeCache(cache) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore quota errors
  }
}
