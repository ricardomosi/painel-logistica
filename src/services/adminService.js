import { supabase } from '../lib/supabaseClient';
import { materialsService } from './materialsService';

export const adminService = {
  // ---------------- DRIVERS ----------------
  async getDrivers() {
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createDriver(driver) {
    const { data, error } = await supabase
      .from('motoristas')
      .insert([{
        nome: driver.nome,
        telefone: driver.telefone || null,
        cnh: driver.cnh || null,
        ativo: driver.ativo !== undefined ? driver.ativo : true,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDriver(id, updates) {
    const payload = { ...updates };
    if (payload.telefone !== undefined) payload.telefone = payload.telefone?.trim() || null;
    if (payload.cnh !== undefined) payload.cnh = payload.cnh?.trim() || null;

    const { data, error } = await supabase
      .from('motoristas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDriver(id) {
    const { error } = await supabase
      .from('motoristas')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---------------- VEHICLES ----------------
  async getVehicles() {
    const { data, error } = await supabase
      .from('veiculos')
      .select(`
        *,
        motorista_padrao:motorista_padrao_id(id, nome)
      `)
      .order('placa', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createVehicle(vehicle) {
    const { data, error } = await supabase
      .from('veiculos')
      .insert([{
        placa: vehicle.placa.toUpperCase().trim(),
        modelo: vehicle.modelo?.trim() || null,
        motorista_padrao_id: vehicle.motorista_padrao_id || null,
        ativo: vehicle.ativo !== undefined ? vehicle.ativo : true,
      }])
      .select(`
        *,
        motorista_padrao:motorista_padrao_id(id, nome)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async updateVehicle(id, updates) {
    const payload = { ...updates };
    if (payload.placa) payload.placa = payload.placa.toUpperCase().trim();
    if (payload.modelo !== undefined) payload.modelo = payload.modelo?.trim() || null;
    if (payload.motorista_padrao_id !== undefined) payload.motorista_padrao_id = payload.motorista_padrao_id || null;
    delete payload.motorista_padrao;

    const { data, error } = await supabase
      .from('veiculos')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        motorista_padrao:motorista_padrao_id(id, nome)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteVehicle(id) {
    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---------------- MATERIALS ----------------
  async getMaterials(params) {
    if (params && (params.page || params.search || params.category)) {
      return await materialsService.getMaterials(params);
    }
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data || [];
  },

  async createMaterial(material) {
    return await materialsService.createMaterial(material);
  },

  async updateMaterial(id, updates) {
    return await materialsService.updateMaterial(id, updates);
  },

  async deleteMaterial(id) {
    return await materialsService.deleteMaterial(id);
  },

  // ---------------- USERS & PROFILES ----------------
  async getProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        motorista:motorista_id(id, nome)
      `)
      .order('nome', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async updateProfile(id, updates) {
    const payload = { ...updates };
    delete payload.motorista;
    delete payload.id;
    delete payload.created_at;

    if (payload.nome !== undefined) payload.nome = payload.nome?.trim() || '';
    if (payload.email !== undefined) payload.email = payload.email?.toLowerCase().trim() || '';
    if (payload.role !== undefined) payload.role = payload.role?.toLowerCase().trim() || 'motorista';

    // Sanitize motorista_id: must be valid UUID or null (never empty string)
    if (payload.role !== 'motorista') {
      payload.motorista_id = null;
    } else if (payload.motorista_id !== undefined) {
      const cleanId = payload.motorista_id ? String(payload.motorista_id).trim() : null;
      payload.motorista_id = cleanId || null;
    }

    if (payload.senha !== undefined) {
      payload.senha = payload.senha ? String(payload.senha).trim() : null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        motorista:motorista_id(id, nome)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async createProfile(profile) {
    const cleanMotoristaId = (profile.role === 'motorista' && profile.motorista_id) 
      ? String(profile.motorista_id).trim() 
      : null;

    const payload = {
      nome: profile.nome?.trim(),
      email: profile.email?.toLowerCase().trim(),
      role: (profile.role || 'motorista').toLowerCase().trim(),
      motorista_id: cleanMotoristaId || null,
      senha: profile.senha?.trim() || '123456',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([payload])
      .select(`
        *,
        motorista:motorista_id(id, nome)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProfile(id) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---------------- SELLERS (VENDEDORES) ----------------
  async getSellers() {
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createSeller(seller) {
    const { data, error } = await supabase
      .from('vendedores')
      .insert([{
        nome: seller.nome.trim(),
        unidade: seller.unidade || 'Matriz',
        ativo: seller.ativo !== undefined ? seller.ativo : true,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSeller(id, updates) {
    const { data, error } = await supabase
      .from('vendedores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSeller(id) {
    const { error } = await supabase
      .from('vendedores')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

export default adminService;
