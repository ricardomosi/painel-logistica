import { supabase } from '../lib/supabaseClient';

export const collectionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('coletas')
      .select(`
        *,
        motorista:motorista_id(id, nome, telefone, cnh),
        veiculo:veiculo_id(id, placa, modelo)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('coletas')
      .select(`
        *,
        motorista:motorista_id(id, nome, telefone, cnh),
        veiculo:veiculo_id(id, placa, modelo)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(collectionData) {
    const payload = {
      fornecedor: collectionData.fornecedor,
      responsavel: collectionData.responsavel,
      tipo: collectionData.tipo || 'Envio',
      placa: collectionData.placa || null,
      veiculo_id: collectionData.veiculo_id || null,
      motorista_id: collectionData.motorista_id || null,
      telefone: collectionData.telefone || null,
      status: collectionData.status || 'pendente',
      coluna_kanban: collectionData.coluna_kanban || 'atualizacoes',
      board_type: 'coleta',
      data_registro: collectionData.data_registro || new Date().toISOString().split('T')[0],
      hora_registro: collectionData.hora_registro || new Date().toTimeString().split(' ')[0],
    };

    const { data, error } = await supabase
      .from('coletas')
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

    const { data, error } = await supabase
      .from('coletas')
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
      .from('coletas')
      .update({
        coluna_kanban: newColumn,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async concludeCollection(id, { data_conclusao, hora_conclusao, finalColumn }) {
    const now = new Date();
    const payload = {
      status: 'concluido',
      data_conclusao: data_conclusao || now.toISOString().split('T')[0],
      hora_conclusao: hora_conclusao || now.toTimeString().split(' ')[0],
      coluna_kanban: finalColumn || 'atualizacoes',
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from('coletas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('coletas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export default collectionsService;
