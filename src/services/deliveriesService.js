import { supabase } from '../lib/supabaseClient';

/**
 * Sanitizes a string: trims whitespace and returns null if empty
 */
function cleanStringOrNull(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

/**
 * Sanitizes a date string or Date object:
 * Converts empty strings, 'null', 'undefined' to null.
 * Normalizes ISO strings to 'YYYY-MM-DD'.
 */
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

/**
 * Sanitizes a time string:
 * Converts empty strings, 'null', 'undefined' to null.
 */
function cleanTimeOrNull(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '' || s === 'null' || s === 'undefined') return null;
    return s;
  }
  return null;
}

/**
 * Sanitizes a numeric value
 */
function cleanNumber(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const n = parseFloat(val);
  return isNaN(n) ? defaultVal : n;
}

/**
 * Sanitizes foreign key IDs (UUID or integer ID):
 * Converts empty strings, 0, 'null', 'undefined' to null.
 */
function cleanFkOrNull(val) {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  return val;
}

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
    const payload = {
      cliente: cleanStringOrNull(deliveryData.cliente) || 'Sem cliente',
      endereco: cleanStringOrNull(deliveryData.endereco),
      placa: cleanStringOrNull(deliveryData.placa),
      veiculo_id: cleanFkOrNull(deliveryData.veiculo_id),
      motorista_id: cleanFkOrNull(deliveryData.motorista_id),
      boleto: cleanStringOrNull(deliveryData.boleto),
      vendedor: cleanStringOrNull(deliveryData.vendedor),
      local_carregamento: cleanStringOrNull(deliveryData.local_carregamento) || 'MATRIZ',
      cadastrador_entrega: cleanStringOrNull(deliveryData.cadastrador_entrega),
      status: cleanStringOrNull(deliveryData.status) || 'pendente',
      frete: cleanNumber(deliveryData.frete, 0),
      valor_entrega: cleanNumber(deliveryData.valor_entrega, 0),
      telefone: cleanStringOrNull(deliveryData.telefone),
      coluna: cleanStringOrNull(deliveryData.coluna) || 'atualizacoes',
      urgente: !!deliveryData.urgente,
      data_registro: cleanDateOrNull(deliveryData.data_registro) || new Date().toISOString().split('T')[0],
      hora_registro: cleanTimeOrNull(deliveryData.hora_registro) || new Date().toTimeString().split(' ')[0],
      data_inicio: cleanDateOrNull(deliveryData.data_inicio),
      hora_inicio: cleanTimeOrNull(deliveryData.hora_inicio),
      km_inicial: cleanNumber(deliveryData.km_inicial, 0),
      data_conclusao: cleanDateOrNull(deliveryData.data_conclusao),
      hora_conclusao: cleanTimeOrNull(deliveryData.hora_conclusao),
      km_final: cleanNumber(deliveryData.km_final, 0),
      como_foi_entrega: cleanStringOrNull(deliveryData.como_foi_entrega),
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
    
    // Strip nested relations or generated columns that would break Supabase update
    delete payload.motorista;
    delete payload.veiculo;
    delete payload.romaneio;
    delete payload.itens;
    delete payload.id;
    delete payload.created_at;
    delete payload.km_total; // Generated column in Postgres (cannot be updated manually)

    // Sanitize dates (convert empty string or invalid to null)
    const dateFields = ['data_inicio', 'data_conclusao', 'data_registro', 'data_prometida', 'data'];
    for (const field of dateFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanDateOrNull(payload[field]);
      }
    }

    // Sanitize times (convert empty string or invalid to null)
    const timeFields = ['hora_inicio', 'hora_conclusao', 'hora_registro', 'hora'];
    for (const field of timeFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanTimeOrNull(payload[field]);
      }
    }

    // Sanitize foreign keys (convert empty strings to null)
    const fkFields = ['motorista_id', 'veiculo_id', 'motorista_padrao_id'];
    for (const field of fkFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanFkOrNull(payload[field]);
      }
    }

    // Sanitize numeric fields
    const numericFields = ['frete', 'valor_entrega', 'km_inicial', 'km_final'];
    for (const field of numericFields) {
      if (payload[field] !== undefined) {
        payload[field] = cleanNumber(payload[field], 0);
      }
    }

    // Sanitize nullable string fields (trim or set to null)
    const nullableStrings = ['placa', 'boleto', 'vendedor', 'cadastrador_entrega', 'telefone', 'como_foi_entrega', 'endereco'];
    for (const field of nullableStrings) {
      if (payload[field] !== undefined) {
        payload[field] = cleanStringOrNull(payload[field]);
      }
    }

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

  async updateColumn(id, newColumn, optionalDate = null) {
    const payload = {
      coluna: cleanStringOrNull(newColumn) || 'atualizacoes',
      updated_at: new Date().toISOString(),
    };
    if (optionalDate) {
      payload.data_registro = cleanDateOrNull(optionalDate);
    }
    const { data, error } = await supabase
      .from('entregas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async startDelivery(id, { km_inicial, data_inicio, hora_inicio } = {}) {
    const now = new Date();
    const payload = {
      status: 'em_andamento',
      km_inicial: cleanNumber(km_inicial, 0),
      data_inicio: cleanDateOrNull(data_inicio) || now.toISOString().split('T')[0],
      hora_inicio: cleanTimeOrNull(hora_inicio) || now.toTimeString().split(' ')[0],
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

  async concludeDelivery(id, { km_inicial, km_final, data_conclusao, hora_conclusao, como_foi_entrega, finalColumn } = {}) {
    const now = new Date();
    const payload = {
      status: 'concluido',
      km_inicial: cleanNumber(km_inicial, 0),
      km_final: cleanNumber(km_final, 0),
      data_conclusao: cleanDateOrNull(data_conclusao) || now.toISOString().split('T')[0],
      hora_conclusao: cleanTimeOrNull(hora_conclusao) || now.toTimeString().split(' ')[0],
      como_foi_entrega: cleanStringOrNull(como_foi_entrega) || 'Entrega realizada com sucesso.',
      coluna: cleanStringOrNull(finalColumn) || 'atualizacoes',
      updated_at: now.toISOString(),
    };
    // Omit km_total: automatically computed by PostgreSQL

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
