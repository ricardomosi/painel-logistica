import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDeliveryLocation,
  extractCoordinates,
  isShortMapsUrl,
} from '../src/lib/locationUtils.js';
import {
  PRE_SUPABASE_CUTOVER_ISO,
  parseBrDateToIso,
  parseLegacyTime,
  parseLegacyNumber,
  normalizeLegacyDeliveryRow,
  mergeHistoricalAndLiveDeliveries,
} from '../src/lib/legacyDeliveries.js';
import { buildReportAnalytics } from '../src/lib/reportAnalytics.js';
import { buildReportWorkbook } from '../src/lib/reportExportExcel.js';
import { buildReportPdfDoc } from '../src/lib/reportExportPdf.js';

function createSampleDeliveries() {
  return [
    {
      id: 101,
      data_registro: '2026-09-10',
      data_inicio: '2026-09-10T08:00:00',
      data_conclusao: '2026-09-10T12:00:00', // 4h -> On-Time
      status: 'concluido',
      como_foi_entrega: 'Sem ocorrências',
      local_carregamento: 'MATRIZ',
      vendedor: 'Carlos Silva (Matriz)',
      placa: 'ABC-1234 (João)',
      cliente: 'Construtora Horizonte Ltda',
      endereco: 'Av. Alberto Maranhão, 1500, Alto da Conceição, Mossoró',
      km_total: '42,5',
      valor_entrega: 'R$ 3.500,00',
      frete: 'R$ 250,00',
    },
    {
      id: 102,
      data_registro: '2026-09-22',
      data_inicio: '2026-09-22T07:30:00',
      data_conclusao: '2026-09-23T15:30:00', // 32h -> Late (>24h)
      status: 'concluido',
      como_foi_entrega: 'Atraso por chuva intensa',
      local_carregamento: 'FILIAL',
      vendedor: 'Ana Lima (Filial)',
      placa: 'XYZ-9988 (Pedro)',
      cliente: 'Metalúrgica Potiguar',
      endereco: 'https://maps.app.goo.gl/AbCdEf123',
      km_total: '110',
      valor_entrega: 'R$ 8.200,00',
      frete: 'R$ 480,00',
    },
    {
      id: 103,
      data_registro: '2026-10-05',
      data_inicio: '2026-10-05T09:00:00',
      data_conclusao: '2026-10-05T15:00:00', // 6h -> On-Time
      status: 'concluido',
      como_foi_entrega: 'Sem ocorrências',
      local_carregamento: 'MATRIZ',
      vendedor: 'Carlos Silva (Matriz)',
      placa: 'ABC-1234 (João)',
      cliente: 'Construtora Horizonte Ltda',
      endereco: 'https://www.google.com/maps?q=-5.0806,-37.6167',
      km_total: '75',
      valor_entrega: 'R$ 4.100,00',
      frete: 'R$ 300,00',
    },
    {
      id: 104,
      data_registro: '2026-11-12',
      data_inicio: '2026-11-12T10:00:00',
      data_conclusao: '2026-11-12T16:00:00', // 6h -> On-Time
      status: 'concluido',
      como_foi_entrega: 'Sem ocorrências',
      local_carregamento: 'MATRIZ',
      vendedor: 'Marina Souza (Matriz)',
      placa: 'DEF-5544 (Lucas)',
      cliente: 'Serralheria Oeste',
      endereco: 'Rua Deuel Vieira Diniz, Santa Júlia, Mossoró',
      km_total: '24',
      valor_entrega: 'R$ 2.150,00',
      frete: 'R$ 150,00',
    },
    {
      id: 105,
      data_registro: '2026-11-14',
      status: 'pendente',
      local_carregamento: 'FILIAL',
      vendedor: 'Ana Lima (Filial)',
      placa: 'XYZ-9988 (Pedro)',
      cliente: 'Metalúrgica Potiguar',
      endereco: 'Baraúna - RN',
      km_total: '88',
      valor_entrega: 'R$ 1.850,00',
      frete: 'R$ 200,00',
    },
  ];
}

function createSampleRomaneiosMap() {
  const map = new Map();
  map.set('101', {
    id: 1,
    entrega_id: 101,
    numero_romaneio: 'ROM-001',
    itens: [
      { codigo_material: 'M01', nome_material: 'PERFIL U 100X50X3.0MM', unidade: 'BR', quantidade: 10, peso_total_kg: 180, valor_total: 1800 },
      { codigo_material: 'M02', nome_material: 'CHAPA #14 ZINCADA 2X1M', unidade: 'CH', quantidade: 5, peso_total_kg: 120, valor_total: 1700 },
    ],
  });
  map.set('103', {
    id: 2,
    entrega_id: 103,
    numero_romaneio: 'ROM-002',
    itens: [
      { codigo_material: 'M01', nome_material: 'PERFIL U 100X50X3.0MM', unidade: 'BR', quantidade: 12, peso_total_kg: 216, valor_total: 2400 },
    ],
  });
  map.set('104', {
    id: 3,
    entrega_id: 104,
    numero_romaneio: 'ROM-003',
    itens: [
      { codigo_material: 'M01', nome_material: 'PERFIL U 100X50X3.0MM', unidade: 'BR', quantidade: 8, peso_total_kg: 144, valor_total: 1600 },
      { codigo_material: 'M03', nome_material: 'TUBO REDONDO 2" CH14', unidade: 'BR', quantidade: 4, peso_total_kg: 72, valor_total: 550 },
    ],
  });
  return map;
}

test('locationUtils: extracts coordinates, identifies short links and normalizes RN hubs', () => {
  assert.equal(isShortMapsUrl('https://maps.app.goo.gl/xyz'), true);
  assert.equal(isShortMapsUrl('Rua Centro, Mossoró'), false);

  const coords = extractCoordinates('https://www.google.com/maps?q=-5.0806,-37.6167');
  assert.deepEqual(coords, { lat: -5.0806, lng: -37.6167 });

  const dmsCoords = extractCoordinates(`5°13'18.5"S 37°17'40.3"W`);
  assert.ok(dmsCoords);
  assert.ok(Math.abs(dmsCoords.lat - (-5.221806)) < 0.0001);
  assert.ok(Math.abs(dmsCoords.lng - (-37.294528)) < 0.0001);

  const santaJulia = normalizeDeliveryLocation({ endereco: 'Distrito Industrial Dehuel Vieira Diniz' });
  assert.equal(santaJulia.key, 'santa-julia');
  assert.ok(santaJulia.presetCoords);

  const shortUrl = normalizeDeliveryLocation({ endereco: 'https://maps.app.goo.gl/abc' });
  assert.equal(shortUrl.isShortUrl, true);

  const empty = normalizeDeliveryLocation({ endereco: '' });
  assert.equal(empty.isEmpty, true);
});

test('reportAnalytics: aggregates monthly and total KPIs, OTIF, sellers, fleet, romaneio materials, clients and locations', () => {
  const analytics = buildReportAnalytics({
    deliveries: createSampleDeliveries(),
    romaneioItemsByEntregaId: createSampleRomaneiosMap(),
    dateStart: '2026-09-01',
    dateEnd: '2026-11-30',
    selectedPlaca: 'TODAS',
    selectedVendedor: 'TODAS',
    selectedLocalCarregamento: 'TODOS',
    custoKm: 5.0,
  });

  // Summary checks
  assert.equal(analytics.summary.totalEntregas, 5);
  assert.equal(analytics.summary.concluidas, 4);
  assert.equal(analytics.summary.pendentes, 1);
  assert.equal(analytics.summary.matrizCount, 3);
  assert.equal(analytics.summary.filialCount, 2);

  // KM & cost (42.5 + 110 + 75 + 24 + 88 = 339.5 km)
  assert.equal(analytics.summary.totalKm, 339.5);
  assert.equal(analytics.summary.totalCost, 339.5 * 5.0);

  // Monetary sums: carga 19800 + frete 1380 = 21180
  assert.equal(analytics.summary.totalValorCarga, 19800);
  assert.equal(analytics.summary.totalFrete, 1380);
  assert.equal(analytics.summary.totalValorGeral, 21180);

  // Time & OTIF: 4 completed with times [4h, 32h, 6h, 6h] -> avg = 12h; 3/4 on-time = 75%; 3/4 in-full = 75%
  assert.equal(analytics.summary.avgTimeH, 12);
  assert.equal(analytics.summary.otif.onTimePct, 75);
  assert.equal(analytics.summary.otif.inFullPct, 75);
  assert.equal(analytics.summary.otif.ocorrenciasCount, 1);
  assert.equal(analytics.summary.otif.ofensorName, 'XYZ-9988 (Pedro)');

  // Monthly chronological separation
  assert.equal(analytics.monthlySeries.length, 3);
  assert.deepEqual(
    analytics.monthlySeries.map((m) => m.monthKey),
    ['2026-09', '2026-10', '2026-11']
  );
  const sumMonthlyDeliveries = analytics.monthlySeries.reduce((s, m) => s + m.entregas, 0);
  assert.equal(sumMonthlyDeliveries, 5);

  // Sellers ranking + monthly
  assert.equal(analytics.sellers.ranking.length, 3);
  const ana = analytics.sellers.ranking.find((s) => s.name.includes('Ana Lima'));
  assert.equal(ana.entregas, 2);
  assert.equal(ana.byMonth['2026-09'].entregas, 1);
  assert.equal(ana.byMonth['2026-11'].entregas, 1);

  // Vehicles ranking + monthly
  assert.equal(analytics.vehicles.ranking.length, 3);
  const abc = analytics.vehicles.ranking.find((v) => v.placaCurta === 'ABC-1234');
  assert.equal(abc.entregas, 2);
  assert.equal(abc.avgTimeH, 5); // (4h + 6h)/2

  // Materials ranking from romaneios
  assert.equal(analytics.materials.totals.entregasComRomaneio, 3);
  assert.equal(analytics.materials.totals.itensDistintos, 3);
  assert.equal(analytics.materials.ranking[0].codigo, 'M01');
  assert.equal(analytics.materials.ranking[0].entregasDistintas, 3);
  assert.equal(analytics.materials.ranking[0].quantidadeTotal, 30);
  assert.equal(analytics.materials.ranking[0].byMonth['2026-09'].quantidade, 10);
  assert.equal(analytics.materials.ranking[0].byMonth['2026-10'].quantidade, 12);
  assert.equal(analytics.materials.ranking[0].byMonth['2026-11'].quantidade, 8);

  // Clients ranking
  assert.equal(analytics.clients.ranking[0].entregas, 2);

  // Locations & map coverage stats
  assert.equal(analytics.locations.mapStats.shortUrlCount, 1);
  assert.equal(analytics.locations.mapStats.explicitCoordsCount, 1);
  assert.equal(analytics.locations.mapStats.presetResolvedCount, 3);
});

test('reportAnalytics: honors unit filter and date window boundaries', () => {
  const analytics = buildReportAnalytics({
    deliveries: createSampleDeliveries(),
    romaneioItemsByEntregaId: createSampleRomaneiosMap(),
    dateStart: '2026-10-01',
    dateEnd: '2026-11-30',
    selectedPlaca: 'TODAS',
    selectedVendedor: 'TODAS',
    selectedLocalCarregamento: 'MATRIZ',
    custoKm: 5.24,
  });

  assert.equal(analytics.summary.totalEntregas, 2);
  assert.equal(analytics.monthlySeries.length, 2);
  assert.equal(analytics.summary.otif.otifPct, 100);
});

test('reportExportExcel: builds valid 8-sheet workbook covering Total and Monthly data', () => {
  const analytics = buildReportAnalytics({
    deliveries: createSampleDeliveries(),
    romaneioItemsByEntregaId: createSampleRomaneiosMap(),
    dateStart: '2026-09-01',
    dateEnd: '2026-11-30',
    custoKm: 5.24,
  });

  const wb = buildReportWorkbook(analytics);
  assert.deepEqual(wb.SheetNames, [
    'Resumo Executivo',
    'Indicadores por Mes',
    'OTIF e Ocorrencias',
    'Vendedores',
    'Veiculos',
    'Materiais Romaneio',
    'Clientes',
    'Locais e Mapa',
  ]);

  const sheetResumo = wb.Sheets['Resumo Executivo'];
  assert.ok(sheetResumo['A1'].v.includes('J PATRÍCIO METAIS'));

  const sheetMes = wb.Sheets['Indicadores por Mes'];
  assert.equal(sheetMes['A5'].v, 'TOTAL PERÍODO');
  assert.equal(sheetMes['B5'].v, 5);
});

test('reportExportPdf: builds non-empty multi-page A4 executive PDF document', async () => {
  const analytics = buildReportAnalytics({
    deliveries: createSampleDeliveries(),
    romaneioItemsByEntregaId: createSampleRomaneiosMap(),
    dateStart: '2026-09-01',
    dateEnd: '2026-11-30',
    custoKm: 5.24,
  });

  const doc = await buildReportPdfDoc(analytics, {});
  assert.ok(doc.getNumberOfPages() >= 2);
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  assert.ok(bytes.length > 5000);
  // Check PDF magic header "%PDF"
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  assert.equal(header, '%PDF');
});

test('legacyDeliveries: normalizes pre-Sept sheets rows, skips coletas, deduplicates and preserves historical months', () => {
  assert.equal(parseBrDateToIso('10/03/2026'), '2026-03-10');
  assert.equal(parseLegacyTime('1899-12-30T14:25:00'), '14:25:00');
  assert.equal(parseLegacyTime('08:15'), '08:15:00');
  assert.equal(parseLegacyNumber('R$ 3.500,50'), 3500.5);

  const skippedColeta = normalizeLegacyDeliveryRow({ boardType: 'coleta', tipo: 'Busca', id: 1, dataRegistro: '10/03/2026' });
  assert.equal(skippedColeta, null);

  const marchLegacy = normalizeLegacyDeliveryRow({
    boardType: 'entrega',
    id: 1,
    dataRegistro: '10/03/2026',
    horaRegistro: '08:00',
    dataConclusao: '10/03/2026',
    horaConclusao: '13:00',
    status: 'entregue',
    cliente: 'CLIENTE MARCO',
    vendedor: 'Carlos Silva (Matriz)',
    placa: 'ABC-1234',
    localCarregamento: 'MATRIZ',
    kmTotal: '35,5',
    valorEntrega: 'R$ 2.500,00',
    frete: 'R$ 180,00',
    comoFoiEntrega: 'Sem ocorrências',
  });
  assert.ok(marchLegacy);
  assert.equal(marchLegacy.isHistorical, true);
  assert.equal(marchLegacy.data_registro, '2026-03-10');
  assert.equal(marchLegacy.status, 'concluido');
  assert.equal(marchLegacy.km_total, 35.5);

  const postCutoverRow = normalizeLegacyDeliveryRow({
    boardType: 'entrega',
    id: 17,
    dataRegistro: PRE_SUPABASE_CUTOVER_ISO,
    cliente: 'JA NO SUPABASE',
  });

  const merged = mergeHistoricalAndLiveDeliveries(createSampleDeliveries(), [marchLegacy, postCutoverRow]);
  assert.equal(merged.length, 6);
  assert.ok(merged.some((d) => d.data_registro === '2026-03-10'));
  assert.ok(!merged.some((d) => d.cliente === 'JA NO SUPABASE'));

  const analytics = buildReportAnalytics({
    deliveries: merged,
    romaneioItemsByEntregaId: createSampleRomaneiosMap(),
    dateStart: '2026-03-01',
    dateEnd: '2026-11-30',
    custoKm: 5.24,
  });

  assert.equal(analytics.summary.totalEntregas, 6);
  assert.equal(analytics.summary.legacyCount, 1);
  assert.equal(analytics.summary.liveCount, 5);
  assert.deepEqual(
    analytics.monthlySeries.map((m) => m.monthKey),
    ['2026-03', '2026-09', '2026-10', '2026-11']
  );
  // 5 completed deliveries with times: [5h (march fallback via data_registro+hora_registro), 4h, 32h, 6h, 6h] -> avg = 53/5 = 10.6h
  assert.equal(analytics.summary.completedCountForTime, 5);
  assert.ok(Math.abs(analytics.summary.avgTimeH - 10.6) < 0.01);
});

test('reportExportPdf: builds crisp multi-month vector PDF across 9 months without canvas PNG stretching', async () => {
  const nineMonthSamples = [
    { id: 1, isHistorical: true, data_registro: '2026-03-12', hora_registro: '08:00', data_conclusao: '2026-03-12', hora_conclusao: '11:00', status: 'concluido', local_carregamento: 'MATRIZ', vendedor: 'Carlos Silva', placa: 'RGF9F21', cliente: 'Cliente A', endereco: 'Mossoro', km_total: 40, valor_entrega: 5000, frete: 200 },
    { id: 2, isHistorical: true, data_registro: '2026-04-14', hora_registro: '09:00', data_conclusao: '2026-04-14', hora_conclusao: '14:00', status: 'concluido', local_carregamento: 'MATRIZ', vendedor: 'Carlos Silva', placa: 'RGF9F21', cliente: 'Cliente B', endereco: 'Barauna', km_total: 70, valor_entrega: 7500, frete: 350 },
    { id: 3, isHistorical: true, data_registro: '2026-05-18', hora_registro: '08:30', data_conclusao: '2026-05-18', hora_conclusao: '12:30', status: 'concluido', local_carregamento: 'FILIAL', vendedor: 'Ana Lima', placa: 'TSW-7G98', cliente: 'Cliente C', endereco: 'Santa Julia', km_total: 30, valor_entrega: 4200, frete: 180 },
    { id: 4, isHistorical: true, data_registro: '2026-06-20', hora_registro: '07:00', data_conclusao: '2026-06-20', hora_conclusao: '11:00', status: 'concluido', local_carregamento: 'MATRIZ', vendedor: 'Carlos Silva', placa: 'QGT-4I78', cliente: 'Cliente D', endereco: 'Mossoro', km_total: 55, valor_entrega: 6100, frete: 260 },
    { id: 5, isHistorical: true, data_registro: '2026-07-09', hora_registro: '10:00', data_conclusao: '2026-07-09', hora_conclusao: '16:00', status: 'concluido', local_carregamento: 'MATRIZ', vendedor: 'Marina Souza', placa: 'RGF9F21', cliente: 'Cliente E', endereco: 'Mossoro', km_total: 60, valor_entrega: 9100, frete: 400 },
    { id: 6, isHistorical: true, data_registro: '2026-08-19', hora_registro: '08:00', data_conclusao: '2026-08-19', hora_conclusao: '10:00', status: 'concluido', local_carregamento: 'FILIAL', vendedor: 'Ana Lima', placa: 'TSW-7G98', cliente: 'Cliente F', endereco: 'Assu', km_total: 95, valor_entrega: 11200, frete: 520 },
    ...createSampleDeliveries(),
  ];

  const analytics = buildReportAnalytics({
    deliveries: nineMonthSamples,
    romaneioItemsByEntregaId: createSampleRomaneiosMap(),
    dateStart: '2026-03-01',
    dateEnd: '2026-11-30',
    custoKm: 5.24,
  });

  assert.equal(analytics.monthlySeries.length, 9);
  const doc = await buildReportPdfDoc(analytics, {});
  assert.ok(doc.getNumberOfPages() >= 3);
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  assert.ok(bytes.length > 8000);
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  assert.equal(header, '%PDF');
});

