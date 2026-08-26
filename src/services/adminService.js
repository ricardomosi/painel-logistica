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
    const { data, error } = await supabase
      .from('motoristas')
      .update(updates)
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
        modelo: vehicle.modelo || null,
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
    if (updates.placa) updates.placa = updates.placa.toUpperCase().trim();
    const { data, error } = await supabase
      .from('veiculos')
      .update(updates)
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
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
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
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: profile.id || undefined,
        nome: profile.nome,
        email: profile.email,
        role: profile.role || 'motorista',
        motorista_id: profile.motorista_id || null,
      }])
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
