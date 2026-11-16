import { supabase } from '../lib/supabaseClient';
import {
  LEGACY_SHEETS_WEBHOOK_URL,
  normalizeLegacyDeliveryRow,
} from '../lib/legacyDeliveries';

const PAGE_SIZE = 1000;
const LEGACY_CACHE_KEY = 'jpatricio_legacy_entregas_pre_v2_v1';
let memoryLegacyCache = null;

/**
 * Fetches legacy pre-September 2026 deliveries from Google Sheets archive
 * so multi-month reports include Mar-Sep 2026 even without romaneios/map pins.
 */
export async function fetchAllHistoricalDeliveries(forceRefresh = false) {
  if (!forceRefresh && Array.isArray(memoryLegacyCache)) {
    return memoryLegacyCache;
  }

  if (!forceRefresh && typeof sessionStorage !== 'undefined') {
    try {
      const cachedRaw = sessionStorage.getItem(LEGACY_CACHE_KEY);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryLegacyCache = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore storage error
    }
  }

  const res = await fetch(LEGACY_SHEETS_WEBHOOK_URL, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Falha ao consultar histórico legado (${res.status})`);
  }

  const payload = await res.json();
  const rawRows = Array.isArray(payload)
    ? payload
    : payload?.deliveries || payload?.data || payload?.rows || [];
  if (!Array.isArray(rawRows)) return [];

  const normalized = [];
  for (const row of rawRows) {
    const item = normalizeLegacyDeliveryRow(row);
    if (item) normalized.push(item);
  }

  memoryLegacyCache = normalized;
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(LEGACY_CACHE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore sessionStorage quota limits
    }
  }

  return normalized;
}

/**
 * Fetches all romaneios and their nested romaneio_itens in pages.
 * Used by the Reports module so Kanban list queries stay lightweight.
 */
export async function fetchAllRomaneioItemsMap() {
  const byEntregaId = new Map();
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('romaneios')
      .select(`
        id,
        entrega_id,
        numero_romaneio,
        peso_total_kg,
        valor_total,
        observacoes,
        itens:romaneio_itens(
          id,
          romaneio_id,
          material_id,
          codigo_material,
          nome_material,
          unidade,
          quantidade,
          peso_unitario_kg,
          peso_total_kg,
          valor_unitario,
          valor_total
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = data || [];
    for (const rom of rows) {
      if (rom?.entrega_id !== undefined && rom?.entrega_id !== null) {
        const key = String(rom.entrega_id);
        const existing = byEntregaId.get(key);
        if (existing) {
          existing.itens = [...existing.itens, ...(rom.itens || [])];
        } else {
          byEntregaId.set(key, {
            ...rom,
            itens: Array.isArray(rom.itens) ? rom.itens : [],
          });
        }
      }
    }

    hasMore = rows.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return byEntregaId;
}

export const reportsService = {
  fetchAllRomaneioItemsMap,
  fetchAllHistoricalDeliveries,
};

export default reportsService;

