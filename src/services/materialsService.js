import { supabase } from '../lib/supabaseClient';

export const materialsService = {
  /**
   * Fast autocomplete search for materials in the database
   * Searches by name, code or category using trigram/ilike indexes
   * @param {string} query
   * @param {object} options - { limit: 25, type: 'trazer' | 'buscar' }
   */
  async searchMaterials(query = '', { limit = 25, type = 'trazer' } = {}) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      // Return top 25 default / frequently used materials
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }

    // Search by code or name using ILIKE
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('ativo', true)
      .or(`nome.ilike.%${cleanQuery}%,codigo.ilike.%${cleanQuery}%,categoria.ilike.%${cleanQuery}%`)
      .order('nome', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro na busca de materiais:', error);
      throw error;
    }

    return (data || []).map(mat => {
      // Suggest default unit price based on operation type
      const precoSugestao = type === 'buscar'
        ? (Number(mat.preco_buscar) || Number(mat.valor_padrao) || 0)
        : (Number(mat.preco_trazer) || Number(mat.valor_padrao) || 0);

      return {
        ...mat,
        preco_sugerido: precoSugestao,
      };
    });
  },

  /**
   * Paginated materials listing for Admin
   */
  async getMaterials({ page = 1, pageSize = 20, search = '', category = '' } = {}) {
    let req = supabase
      .from('materiais')
      .select('*', { count: 'exact' });

    if (search && search.trim()) {
      const q = search.trim();
      req = req.or(`nome.ilike.%${q}%,codigo.ilike.%${q}%,categoria.ilike.%${q}%`);
    }

    if (category && category !== 'all') {
      req = req.eq('categoria', category);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await req
      .order('nome', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /**
   * Create new material in catalogue
   */
  async createMaterial(material) {
    const payload = {
      codigo: material.codigo ? material.codigo.trim() : `MAT-${Date.now().toString().slice(-4)}`,
      nome: material.nome.trim(),
      unidade: material.unidade || 'UN',
      peso_padrao_kg: parseFloat(material.peso_padrao_kg) || 0,
      preco_buscar: parseFloat(material.preco_buscar) || 0,
      preco_trazer: parseFloat(material.preco_trazer) || 0,
      valor_padrao: parseFloat(material.valor_padrao) || parseFloat(material.preco_trazer) || 0,
      categoria: material.categoria || 'DIVERSOS',
      ncm: material.ncm || '',
      filial: material.filial || 'MATRIZ',
      ativo: material.ativo !== undefined ? material.ativo : true,
    };

    const { data, error } = await supabase
      .from('materiais')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update material by ID
   */
  async updateMaterial(id, updates) {
    const payload = { ...updates };
    if (payload.peso_padrao_kg !== undefined) payload.peso_padrao_kg = parseFloat(payload.peso_padrao_kg) || 0;
    if (payload.preco_buscar !== undefined) payload.preco_buscar = parseFloat(payload.preco_buscar) || 0;
    if (payload.preco_trazer !== undefined) payload.preco_trazer = parseFloat(payload.preco_trazer) || 0;
    if (payload.valor_padrao !== undefined) payload.valor_padrao = parseFloat(payload.valor_padrao) || 0;

    const { data, error } = await supabase
      .from('materiais')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete material by ID
   */
  async deleteMaterial(id) {
    const { error } = await supabase
      .from('materiais')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

export default materialsService;
