import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedMapsHost,
  extractCoordsAndPlaceFromMapsPayload,
} from '../src/lib/mapsLinkResolverCore.js';
import {
  extractCoordinates,
  extractFirstShortMapsUrl,
  formatResolvedAddressForForm,
  buildGoogleMapsDirectionsUrl,
  normalizeDeliveryLocation,
} from '../src/lib/locationUtils.js';
import {
  parseBoardDate,
  formatIsoBoardDate,
  getColumnKeyFromDate,
  getWeekDayDateStr,
  buildScheduledColumnValue,
  extractScheduledDateFromItem,
  groupItemsByWeekColumns,
} from '../src/lib/kanbanWeekUtils.js';

test('mapsLinkResolverCore: validates allowed Google Maps domains and extracts exact !3d/!4d + DMS coordinates', () => {
  assert.equal(isAllowedMapsHost('https://maps.app.goo.gl/z1pJHdj7ZtYU5QWP6'), true);
  assert.equal(isAllowedMapsHost('https://goo.gl/maps/abc123'), true);
  assert.equal(isAllowedMapsHost('https://www.google.com/maps/place/Test'), true);
  assert.equal(isAllowedMapsHost('https://evil.example.com/maps.app.goo.gl'), false);
  assert.equal(isAllowedMapsHost('http://127.0.0.1:8080/internal'), false);

  const sampleFinalUrl =
    "https://www.google.com/maps/place/5%C2%B010'22.7%22S+37%C2%B019'59.3%22W/@-5.1729276,-37.3350349,17z/data=!3m1!1e3!4m4!3d-5.1729597!4d-37.3331252";
  const parsed = extractCoordsAndPlaceFromMapsPayload(sampleFinalUrl, '');
  assert.equal(parsed.lat, -5.17296);
  assert.equal(parsed.lng, -37.333125);
});

test('locationUtils: parses short links, formats readable GPS addresses, builds accurate directions and normalizes resolved hubs', () => {
  const mixedInput = 'Sítio Tiradentes\nhttps://maps.app.goo.gl/ddWfUfcr2YxwMhW36';
  assert.equal(extractFirstShortMapsUrl(mixedInput), 'https://maps.app.goo.gl/ddWfUfcr2YxwMhW36');

  const resolvedStub = {
    ok: true,
    lat: -5.17296,
    lng: -37.333125,
    formattedAddress: 'Avenida Alberto Maranhão, Barrocas, Mossoró - RN',
    neighborhood: 'Barrocas',
    city: 'Mossoró',
    state: 'RN',
  };
  const converted = formatResolvedAddressForForm(mixedInput, resolvedStub);
  assert.ok(converted.includes('Avenida Alberto Maranhão'));
  assert.ok(converted.includes('(GPS: -5.172960, -37.333125)'));
  assert.ok(converted.includes('Obs: Sítio Tiradentes'));

  const coordsFromTag = extractCoordinates(converted);
  assert.deepEqual(coordsFromTag, { lat: -5.17296, lng: -37.333125 });

  const dirUrl = buildGoogleMapsDirectionsUrl(converted);
  assert.equal(dirUrl, 'https://www.google.com/maps/dir/?api=1&destination=-5.17296,-37.333125');

  const shortCache = {
    'https://maps.app.goo.gl/z1pJHdj7ZtYU5QWP6': {
      ok: true,
      lat: -5.17296,
      lng: -37.333125,
      formattedAddress: 'Avenida Alberto Maranhão, Alto da Conceição, Mossoró - RN',
      neighborhood: 'Alto da Conceição',
      city: 'Mossoró',
      state: 'RN',
    },
  };
  const loc = normalizeDeliveryLocation(
    { endereco: 'https://maps.app.goo.gl/z1pJHdj7ZtYU5QWP6', cliente: 'Queiroz' },
    shortCache
  );
  assert.equal(loc.isShortUrl, false);
  assert.equal(loc.key, 'alto-da-conceicao');
  assert.deepEqual(loc.explicitCoords, { lat: -5.17296, lng: -37.333125 });
});

test('kanbanWeekUtils: accurately separates past weeks, current week rollover, and future scheduled dates', () => {
  const refToday = parseBoardDate('2026-11-18'); // Wednesday of week 2026-11-16..2026-11-21
  assert.equal(getColumnKeyFromDate('2026-11-26'), 'quinta');
  assert.equal(getColumnKeyFromDate('2026-11-22'), 'atualizacoes'); // Sunday maps to atualizacoes

  assert.equal(getWeekDayDateStr('quinta', parseBoardDate('2026-11-23')), '2026-11-26');
  assert.equal(buildScheduledColumnValue('quinta', '2026-11-26'), 'quinta|2026-11-26');
  assert.equal(extractScheduledDateFromItem({ coluna: 'quinta|2026-11-26' }, 'entrega'), '2026-11-26');

  const sampleItems = [
    // Past week concluded (week 2026-11-09..14)
    { id: 1, status: 'concluido', coluna: 'terca', data_registro: '2026-11-10', data_conclusao: '2026-11-10', cliente: 'Passada Concluída' },
    // Past week still pending -> rolls over to Atualizações in current week
    { id: 2, status: 'pendente', coluna: 'sexta', data_registro: '2026-11-13', cliente: 'Passada Pendente' },
    // Current week item (Wednesday 2026-11-18)
    { id: 3, status: 'pendente', coluna: 'quarta', data_registro: '2026-11-18', cliente: 'Atual Quarta' },
    // Future scheduled delivery (Thursday next week 2026-11-26)
    { id: 4, status: 'pendente', coluna: 'quinta|2026-11-26', data_registro: '2026-11-26', cliente: 'Futura Agendada' },
  ];

  // 1. Current week view (2026-11-16..21): hides concluded past (#1) AND hides future scheduled (#4), rolls over #2 to Atualizações
  const currentGrouped = groupItemsByWeekColumns({
    items: sampleItems,
    type: 'entrega',
    weekStart: parseBoardDate('2026-11-16'),
    weekEnd: parseBoardDate('2026-11-21'),
    referenceToday: refToday,
  });
  assert.deepEqual(currentGrouped.atualizacoes.map((x) => x.id), [2]);
  assert.deepEqual(currentGrouped.quarta.map((x) => x.id), [3]);
  assert.deepEqual(currentGrouped.quinta.map((x) => x.id), []);

  // 2. Past week view (2026-11-09..14): shows historical items (#1 in terca, #2 in sexta) cleanly
  const pastGrouped = groupItemsByWeekColumns({
    items: sampleItems,
    type: 'entrega',
    weekStart: parseBoardDate('2026-11-09'),
    weekEnd: parseBoardDate('2026-11-14'),
    referenceToday: refToday,
  });
  assert.deepEqual(pastGrouped.terca.map((x) => x.id), [1]);
  assert.deepEqual(pastGrouped.sexta.map((x) => x.id), [2]);
  assert.deepEqual(pastGrouped.atualizacoes.map((x) => x.id), []);

  // 3. Future week view (2026-11-23..28): shows future scheduled item (#4) inside Quinta
  const futureGrouped = groupItemsByWeekColumns({
    items: sampleItems,
    type: 'entrega',
    weekStart: parseBoardDate('2026-11-23'),
    weekEnd: parseBoardDate('2026-11-28'),
    referenceToday: refToday,
  });
  assert.deepEqual(futureGrouped.quinta.map((x) => x.id), [4]);
  assert.deepEqual(futureGrouped.quarta.map((x) => x.id), []);
  assert.equal(formatIsoBoardDate(parseBoardDate('2026-11-26')), '2026-11-26');
});
