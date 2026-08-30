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
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex flex-col font-inter">
      
      {/* Header Controls & Info */}
      <div className="p-4 border-b border-grid-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-low/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-on-surface font-semibold text-sm">Controle de Acessos & Usuários (RBAC)</h3>
            <p className="text-on-surface-variant text-xs">Atribua permissões e vincule usuários a motoristas cadastrados</p>
          </div>
        </div>

        <div className="text-[11px] font-data-mono text-on-surface-variant px-2.5 py-1 rounded bg-surface-container-lowest border border-grid-line">
          Total: <span className="text-primary font-bold">{profiles.length}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="m-4 p-4 rounded-lg bg-surface-container-low border border-grid-line flex flex-col gap-3.5">
        <div className="text-xs font-bold uppercase tracking-wider text-primary font-label-caps">
          {editingId ? 'Editar Permissões do Usuário' : 'Cadastrar Novo Usuário'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Nome do Usuário *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Ana Lima"
                className="w-full pl-9 pr-3 py-2 bg-surface border border-grid-line text-on-surface text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">E-mail de Acesso *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@jpatricio.com.br"
                className="w-full pl-9 pr-3 py-2 bg-surface border border-grid-line text-on-surface text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 font-data-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Nível de Acesso (Role) *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="px-3 py-2 bg-surface border border-grid-line text-on-surface text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium cursor-pointer"
            >
              <option value="admin" className="bg-surface">👑 Administrador Geral</option>
              <option value="gestor" className="bg-surface">📋 Gestor de Logística</option>
              <option value="motorista" className="bg-surface">🚚 Motorista (Restrito)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Vincular a Motorista</label>
            <select
              disabled={formData.role !== 'motorista'}
              value={formData.motorista_id}
              onChange={(e) => setFormData({ ...formData, motorista_id: e.target.value })}
              className="px-3 py-2 bg-surface border border-grid-line text-on-surface text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer disabled:opacity-30"
            >
              <option value="" className="bg-surface">Nenhum / Não aplicável</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id} className="bg-surface">
                  {d.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-high border border-grid-line transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container text-xs font-bold transition-colors"
          >
            {editingId ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{editingId ? 'Salvar Permissões' : 'Cadastrar Usuário'}</span>
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="border-t border-grid-line overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-grid-line bg-surface-container-lowest/70 text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">NOME</th>
              <th className="py-2.5 px-4">E-MAIL</th>
              <th className="py-2.5 px-4 text-center">NÍVEL (ROLE)</th>
              <th className="py-2.5 px-4">MOTORISTA VINCULADO</th>
              <th className="py-2.5 px-4 text-right w-24">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line text-on-surface">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                  {loading ? 'Carregando...' : 'Nenhum usuário cadastrado'}
                </td>
              </tr>
            ) : (
              profiles.map((prof) => (
                <tr key={prof.id} className="border-b border-grid-line hover:bg-primary-container/5 transition-colors group">
                  <td className="py-2.5 px-4 font-semibold text-on-surface">
                    {prof.nome}
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant font-data-mono">
                    {prof.email}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      prof.role === 'admin'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : prof.role === 'gestor'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {prof.role === 'admin' ? 'Admin' : prof.role === 'gestor' ? 'Gestor' : 'Motorista'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">
                    {prof.motorista?.nome || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(prof)}
                        className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prof)}
                        className="p-1 rounded text-on-surface-variant hover:text-rose-400 hover:bg-surface-container-high transition-colors"
                        title="Excluir"
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
