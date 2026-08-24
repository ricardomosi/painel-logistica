import { supabase } from '../lib/supabaseClient';

export const deliveriesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('entregas')
      .select(`
        *,
        motorista:motorista_id(id, nome, telefone, cnh),
        veiculo:veiculo_id(id, placa, modelo),
        romaneio:romaneios(id, numero_romaneio, peso_total_kg, valor_total, observacoes)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('entregas')
      .select(`
        *,
        motorista:motorista_id(id, nome, telefone, cnh),
        veiculo:veiculo_id(id, placa, modelo),
        romaneio:romaneios(
          id, 
          numero_romaneio, 
          peso_total_kg, 
          valor_total, 
          observacoes,
          itens:romaneio_itens(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(deliveryData) {
    // Sanitize numeric fields
    const payload = {
      cliente: deliveryData.cliente,
      endereco: deliveryData.endereco,
      placa: deliveryData.placa || null,
      veiculo_id: deliveryData.veiculo_id || null,
      motorista_id: deliveryData.motorista_id || null,
      boleto: deliveryData.boleto || null,
      vendedor: deliveryData.vendedor || null,
      local_carregamento: deliveryData.local_carregamento || 'MATRIZ',
      cadastrador_entrega: deliveryData.cadastrador_entrega || null,
      status: deliveryData.status || 'pendente',
      frete: deliveryData.frete ? parseFloat(deliveryData.frete) : 0,
      valor_entrega: deliveryData.valor_entrega ? parseFloat(deliveryData.valor_entrega) : 0,
      telefone: deliveryData.telefone || null,
      coluna: deliveryData.coluna || 'atualizacoes',
      data_registro: deliveryData.data_registro || new Date().toISOString().split('T')[0],
      hora_registro: deliveryData.hora_registro || new Date().toTimeString().split(' ')[0],
    };

    const { data, error } = await supabase
      .from('entregas')
      .insert([payload])
      .select(`
        *,
        motorista:motorista_id(id, nome, telefone, cnh),
        veiculo:veiculo_id(id, placa, modelo)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    
    // Convert numeric fields if provided
    if (payload.frete !== undefined) payload.frete = parseFloat(payload.frete) || 0;
    if (payload.valor_entrega !== undefined) payload.valor_entrega = parseFloat(payload.valor_entrega) || 0;
    if (payload.km_inicial !== undefined) payload.km_inicial = parseFloat(payload.km_inicial) || 0;
    if (payload.km_final !== undefined) payload.km_final = parseFloat(payload.km_final) || 0;
    if (payload.km_total !== undefined) payload.km_total = parseFloat(payload.km_total) || 0;

    const { data, error } = await supabase
      .from('entregas')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        motorista:motorista_id(id, nome, telefone, cnh),
        veiculo:veiculo_id(id, placa, modelo)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateColumn(id, newColumn) {
    const { data, error } = await supabase
      .from('entregas')
      .update({
        coluna: newColumn,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async startDelivery(id, { km_inicial, data_inicio, hora_inicio }) {
    const now = new Date();
    const payload = {
      status: 'em_andamento',
      km_inicial: parseFloat(km_inicial) || 0,
      data_inicio: data_inicio || now.toISOString().split('T')[0],
      hora_inicio: hora_inicio || now.toTimeString().split(' ')[0],
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('entregas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async concludeDelivery(id, { km_inicial, km_final, data_conclusao, hora_conclusao, como_foi_entrega, finalColumn }) {
    const now = new Date();
    const kmStart = parseFloat(km_inicial) || 0;
    const kmEnd = parseFloat(km_final) || 0;
    const kmTotal = kmEnd >= kmStart ? kmEnd - kmStart : 0;

    const payload = {
      status: 'concluido',
      km_final: kmEnd,
      km_total: kmTotal,
      data_conclusao: data_conclusao || now.toISOString().split('T')[0],
      hora_conclusao: hora_conclusao || now.toTimeString().split(' ')[0],
      como_foi_entrega: como_foi_entrega || 'Entrega realizada com sucesso.',
      coluna: finalColumn || 'atualizacoes',
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('entregas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    // First delete associated romaneios if any
    await supabase.from('romaneios').delete().eq('entrega_id', id);

    const { error } = await supabase
      .from('entregas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export default deliveriesService;
