export const LEGACY_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycby_PUtfh2ji7maKX1yRgSk2Sd1GUFiLm7K13WyKN5AdapRqJM5Wuv-SCct8LZspZn2q/exec';

export const PRE_SUPABASE_CUTOVER_ISO = '2026-09-08';

export function parseBrDateToIso(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

export function parseLegacyTime(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) {
    // Google Apps Script often serializes time cells with epoch date prefix 1899-12-30THH:MM:SS(.000Z)
    m = s.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  }
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3] || '0', 10);
  if (h > 23 || min > 59 || sec > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function parseLegacyNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val || '').replace(/R\$\s*/gi, '').trim();
  if (!s) return 0;
  if (s.includes('.') && s.includes(',')) {
    s =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/**
 * Normalizes a historical Google Sheets row into the Supabase `entregas` shape
 * so it integrates seamlessly into Reports (pre-Sept 2026, without romaneios/map updates).
 */
export function normalizeLegacyDeliveryRow(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const boardType = String(raw.boardType || '').toLowerCase();
  if (boardType && boardType !== 'entrega') return null;
  if (!raw.cliente && raw.fornecedor) return null;

  const dataRegistroIso = parseBrDateToIso(raw.dataRegistro || raw.data_registro || raw.Data);
  if (!dataRegistroIso) return null;

  // Guard against overlap once Supabase v2 cut over on 2026-09-08
  if (dataRegistroIso >= PRE_SUPABASE_CUTOVER_ISO) return null;

  const statusLower = String(raw.status || raw.Status || 'concluido').toLowerCase().trim();
  const isConcluded =
    statusLower === 'concluido' ||
    statusLower === 'concluída' ||
    statusLower === 'concluida' ||
    statusLower === 'entregue' ||
    statusLower === 'finalizado';
  const status = isConcluded ? 'concluido' : statusLower || 'pendente';

  const kmInicial = parseLegacyNumber(raw.kmInicial || raw['Km Inicial']);
  const kmFinal = parseLegacyNumber(raw.kmFinal || raw['Km Final']);
  const kmRaw = parseLegacyNumber(raw.kmTotal || raw['Km Total']);
  const kmTotal = kmRaw > 0 ? kmRaw : Math.max(kmFinal - kmInicial, 0);

  const valorEntrega = parseLegacyNumber(raw.valorEntrega || raw.valor_entrega || raw.Valor);
  const frete = parseLegacyNumber(raw.frete || raw.Frete);

  // Skip corrupted synthetic test values if any extreme outlier appears (> R$ 100M)
  if (valorEntrega > 100_000_000) return null;

  const rawComoFoi = String(raw.comoFoiEntrega || raw.como_foi_entrega || raw['Como foi a entrega'] || '').trim();
  const comoFoiEntrega = rawComoFoi || (status === 'concluido' ? 'Sem ocorrências' : '');

  const cliente = String(raw.cliente || raw.Cliente || 'Cliente não informado').trim() || 'Cliente não informado';

  return {
    id: `legacy-${raw.id || `${dataRegistroIso}-${cliente.slice(0, 12)}`}`,
    legacy_id: String(raw.id || ''),
    isHistorical: true,
    historicalSource: 'google_sheets_pre_v2',
    data_registro: dataRegistroIso,
    hora_registro: parseLegacyTime(raw.horaRegistro || raw.hora_registro),
    cliente,
    endereco: String(raw.endereco || raw['Endereço'] || '').trim() || null,
    placa: String(raw.placa || raw.Placa || '').trim() || null,
    boleto: String(raw.boleto || raw.Boleto || '').trim() || null,
    vendedor: String(raw.vendedor || raw.Vendedor || '').trim() || null,
    local_carregamento: String(raw.localCarregamento || raw.local_carregamento || raw.Local || 'MATRIZ').toUpperCase().trim() || 'MATRIZ',
    cadastrador_entrega: String(raw.cadastradorEntrega || raw.cadastrador_entrega || '').trim() || null,
    status,
    frete,
    valor_entrega: valorEntrega,
    telefone: String(raw.telefone || raw.Telefone || '').trim() || null,
    data_inicio: parseBrDateToIso(raw.dataInicio || raw.data_inicio || raw['Data Início']),
    hora_inicio: parseLegacyTime(raw.horaInicio || raw.hora_inicio),
    km_inicial: kmInicial,
    km_final: kmFinal,
    km_total: kmTotal,
    data_conclusao: parseBrDateToIso(raw.dataConclusao || raw.data_conclusao || raw['Data Conclusão']),
    hora_conclusao: parseLegacyTime(raw.horaConclusao || raw.hora_conclusao),
    como_foi_entrega: comoFoiEntrega,
    coluna: String(raw.coluna || raw.Coluna || '').trim() || null,
    created_at: `${dataRegistroIso}T${parseLegacyTime(raw.horaRegistro) || '08:00:00'}`,
    romaneio: null,
  };
}

/**
 * Merges historical pre-cutover deliveries with live Supabase deliveries cleanly.
 */
export function mergeHistoricalAndLiveDeliveries(liveDeliveries = [], historicalDeliveries = []) {
  const seenIds = new Set();
  const merged = [];

  for (const d of Array.isArray(liveDeliveries) ? liveDeliveries : []) {
    if (!d) continue;
    const key = String(d.id);
    if (!seenIds.has(key)) {
      seenIds.add(key);
      merged.push(d);
    }
  }

  for (const h of Array.isArray(historicalDeliveries) ? historicalDeliveries : []) {
    if (!h) continue;
    const key = String(h.id);
    if (!seenIds.has(key)) {
      seenIds.add(key);
      merged.push(h);
    }
  }

  return merged;
}
