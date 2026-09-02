import { supabase } from '../lib/supabaseClient';

function cleanStringOrNull(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

function cleanDateOrNull(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '' || s === 'null' || s === 'undefined') return null;
    if (s.includes('T')) return s.split('T')[0];
    return s;
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  return null;
}

function cleanTimeOrNull(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '' || s === 'null' || s === 'undefined') return null;
    return s;
  }
  return null;
}

function cleanFkOrNull(val) {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  return val;
}

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
      fornecedor: cleanStringOrNull(collectionData.fornecedor) || 'Sem fornecedor',
      endereco: cleanStringOrNull(collectionData.endereco),
      responsavel: cleanStringOrNull(collectionData.responsavel),
      tipo: collectionData.tipo || 'Envio',
      placa: cleanStringOrNull(collectionData.placa),
      veiculo_id: cleanFkOrNull(collectionData.veiculo_id),
      motorista_id: cleanFkOrNull(collectionData.motorista_id),
      telefone: cleanStringOrNull(collectionData.telefone),
      status: cleanStringOrNull(collectionData.status) || 'pendente',
      coluna_kanban: cleanStringOrNull(collectionData.coluna_kanban) || 'atualizacoes',
      board_type: 'coleta',
      urgente: !!collectionData.urgente,
      data_registro: cleanDateOrNull(collectionData.data_registro) || new Date().toISOString().split('T')[0],
      hora_registro: cleanTimeOrNull(collectionData.hora_registro) || new Date().toTimeString().split(' ')[0],
      data_conclusao: cleanDateOrNull(collectionData.data_conclusao),
      hora_conclusao: cleanTimeOrNull(collectionData.hora_conclusao),
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
    
    // Strip nested relations or non-column fields
    delete payload.motorista;
    delete payload.veiculo;
    delete payload.id;
    delete payload.created_at;

    // Clean dates (convert empty string or invalid to null)
    const dateFields = ['data_conclusao', 'data_registro', 'data'];
    for (const field of dateFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanDateOrNull(payload[field]);
      }
    }

    // Clean times (convert empty string or invalid to null)
    const timeFields = ['hora_conclusao', 'hora_registro', 'hora'];
    for (const field of timeFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanTimeOrNull(payload[field]);
      }
    }

    // Clean FKs
    const fkFields = ['motorista_id', 'veiculo_id'];
    for (const field of fkFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanFkOrNull(payload[field]);
      }
    }

    // Clean nullable strings
    const strFields = ['fornecedor', 'endereco', 'responsavel', 'placa', 'telefone'];
    for (const field of strFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanStringOrNull(payload[field]);
      }
    }

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

  async updateColumn(id, newColumn, optionalDate = null) {
    const payload = {
      coluna_kanban: cleanStringOrNull(newColumn) || 'atualizacoes',
      updated_at: new Date().toISOString(),
    };
    if (optionalDate) {
      payload.data_registro = cleanDateOrNull(optionalDate);
    }
    const { data, error } = await supabase
      .from('coletas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async concludeCollection(id, { data_conclusao, hora_conclusao, finalColumn } = {}) {
    const now = new Date();
    const payload = {
      status: 'concluido',
      data_conclusao: cleanDateOrNull(data_conclusao) || now.toISOString().split('T')[0],
      hora_conclusao: cleanTimeOrNull(hora_conclusao) || now.toTimeString().split(' ')[0],
      coluna_kanban: cleanStringOrNull(finalColumn) || 'atualizacoes',
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
