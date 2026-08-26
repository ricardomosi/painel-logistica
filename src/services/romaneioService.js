import { supabase } from '../lib/supabaseClient';

export const romaneioService = {
  async getByDeliveryId(deliveryId) {
    const { data, error } = await supabase
      .from('romaneios')
      .select(`
        *,
        itens:romaneio_itens(*)
      `)
      .eq('entrega_id', deliveryId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveRomaneio(deliveryId, { observacoes, itens }) {
    // 1. Calculate totals
    const peso_total_kg = itens.reduce((sum, item) => sum + (parseFloat(item.peso_total_kg) || 0), 0);
    const valor_total = itens.reduce((sum, item) => sum + (parseFloat(item.valor_total) || 0), 0);

    // 2. Check if a romaneio already exists for this delivery
    const existing = await this.getByDeliveryId(deliveryId);

    let romaneioId;

    if (existing) {
      // Update existing romaneio
      const { data, error } = await supabase
        .from('romaneios')
        .update({
          observacoes: observacoes || '',
          peso_total_kg,
          valor_total,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      romaneioId = data.id;

      // Remove existing items to re-insert clean list
      await supabase.from('romaneio_itens').delete().eq('romaneio_id', romaneioId);
    } else {
      // Create new romaneio
      const { data, error } = await supabase
        .from('romaneios')
        .insert([{
          entrega_id: deliveryId,
          observacoes: observacoes || '',
          peso_total_kg,
          valor_total,
        }])
        .select()
        .single();

      if (error) throw error;
      romaneioId = data.id;
    }

    // 3. Insert items if any
    if (itens && itens.length > 0) {
      const itemsPayload = itens.map(item => ({
        romaneio_id: romaneioId,
        material_id: item.material_id || null,
        codigo_material: item.codigo_material || '',
        nome_material: item.nome_material || '',
        unidade: item.unidade || 'UN',
        quantidade: parseFloat(item.quantidade) || 1,
        peso_unitario_kg: parseFloat(item.peso_unitario_kg) || 0,
        peso_total_kg: parseFloat(item.peso_total_kg) || 0,
        valor_unitario: parseFloat(item.valor_unitario) || 0,
        valor_total: parseFloat(item.valor_total) || 0,
      }));

      const { error: itemsError } = await supabase
        .from('romaneio_itens')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;
    }

    // 4. Update delivery's valor_entrega if applicable
    if (valor_total > 0) {
      await supabase
        .from('entregas')
        .update({ valor_entrega: valor_total })
        .eq('id', deliveryId);
    }

    return await this.getByDeliveryId(deliveryId);
  },

  async delete(romaneioId) {
    await supabase.from('romaneio_itens').delete().eq('romaneio_id', romaneioId);
    const { error } = await supabase.from('romaneios').delete().eq('id', romaneioId);
    if (error) throw error;
    return true;
  }
};

export default romaneioService;
