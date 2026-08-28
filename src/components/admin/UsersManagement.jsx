import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Edit2, Trash2, Check, X, Mail, User, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function UsersManagement() {
  const { showConfirm, addToast } = useLogistics();
  const [profiles, setProfiles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'motorista',
    motorista_id: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [profs, drvs] = await Promise.all([
        adminService.getProfiles(),
        adminService.getDrivers(),
      ]);
      setProfiles(profs);
      setDrivers(drvs);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar lista de usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (profile) => {
    setEditingId(profile.id);
    setFormData({
      nome: profile.nome,
      email: profile.email,
      role: profile.role || 'motorista',
      motorista_id: profile.motorista_id || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ nome: '', email: '', role: 'motorista', motorista_id: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.email.trim()) {
      addToast('Preencha nome e e-mail do usuário.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await adminService.updateProfile(editingId, formData);
        addToast('Perfil de usuário atualizado com sucesso!');
      } else {
        await adminService.createProfile(formData);
        addToast('Usuário cadastrado com sucesso!');
      }
      handleCancel();
      loadData();
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar usuário', 'error');
    }
  };

  const handleDelete = (profile) => {
    showConfirm({
      title: 'Excluir Perfil de Usuário',
      message: `Deseja realmente remover o usuário "${profile.nome}" (${profile.email})?`,
      confirmText: 'Excluir',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminService.deleteProfile(profile.id);
          addToast('Usuário excluído.');
          loadData();
        } catch (err) {
          console.error(err);
          addToast('Erro ao excluir usuário.', 'error');
        }
      },
    });
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 text-white shadow-xl flex flex-col gap-6 font-inter">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Controle de Acessos & Usuários (RBAC)</h3>
            <p className="text-xs text-slate-400">Atribua permissões (Admin, Gestor ou Motorista) e vincule cadastros</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
        <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          {editingId ? 'Editar Usuário / Permissões' : 'Adicionar Novo Usuário'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Nome do Usuário *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Ana Lima"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">E-mail de Acesso *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@jpatricio.com.br"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Nível de Acesso (Role) *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="px-3 py-2 rounded-xl glass-input text-xs cursor-pointer font-bold"
            >
              <option value="admin" className="bg-slate-900 text-cyan-400">👑 Administrador Geral</option>
              <option value="gestor" className="bg-slate-900 text-blue-400">📋 Gestor de Logística</option>
              <option value="motorista" className="bg-slate-900 text-emerald-400">🚚 Motorista (Restrito)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Vincular a Motorista</label>
            <select
              disabled={formData.role !== 'motorista'}
              value={formData.motorista_id}
              onChange={(e) => setFormData({ ...formData, motorista_id: e.target.value })}
              className="px-3 py-2 rounded-xl glass-input text-xs cursor-pointer disabled:opacity-40"
            >
              <option value="" className="bg-slate-900">Nenhum / Não aplicável</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl glass-btn-primary text-xs font-bold"
          >
            {editingId ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{editingId ? 'Salvar Permissões' : 'Cadastrar Usuário'}</span>
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3 text-center">Nível (Role)</th>
              <th className="p-3">Motorista Vinculado</th>
              <th className="p-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  {loading ? 'Carregando...' : 'Nenhum usuário cadastrado'}
                </td>
              </tr>
            ) : (
              profiles.map((prof) => (
                <tr key={prof.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    {prof.nome}
                  </td>
                  <td className="p-3 text-slate-300 font-mono">
                    {prof.email}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      prof.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : prof.role === 'gestor'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {prof.role === 'admin' ? '👑 Admin' : prof.role === 'gestor' ? '📋 Gestor' : '🚚 Motorista'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {prof.motorista?.nome || '-'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(prof)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prof)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
