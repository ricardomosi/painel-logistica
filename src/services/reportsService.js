import { supabase } from '../lib/supabaseClient';

const PAGE_SIZE = 1000;

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
};

export default reportsService;

