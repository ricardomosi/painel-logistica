import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, Trash2, Phone, CreditCard, Check, X, Shield } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function DriversManagement() {
  const { showConfirm, addToast } = useLogistics();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cnh: '',
    ativo: true,
  });

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDrivers();
      setDrivers(data);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar motoristas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleEdit = (driver) => {
    setEditingId(driver.id);
    setFormData({
      nome: driver.nome,
      telefone: driver.telefone || '',
      cnh: driver.cnh || '',
      ativo: driver.ativo !== false,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ nome: '', telefone: '', cnh: '', ativo: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      addToast('Informe o nome do motorista.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await adminService.updateDriver(editingId, formData);
        addToast('Motorista atualizado com sucesso!');
      } else {
        await adminService.createDriver(formData);
        addToast('Motorista cadastrado com sucesso!');
      }
      handleCancel();
      loadDrivers();
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar motorista', 'error');
    }
  };

  const handleDelete = (driver) => {
    showConfirm({
      title: 'Excluir Motorista',
      message: `Deseja realmente remover o motorista "${driver.nome}"?`,
      confirmText: 'Excluir',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminService.deleteDriver(driver.id);
          addToast('Motorista excluído.');
          loadDrivers();
        } catch (err) {
          console.error(err);
          addToast('Erro ao excluir motorista.', 'error');
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
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Gestão de Motoristas</h3>
            <p className="text-xs text-slate-400">Cadastre e configure os motoristas e condutores da frota</p>
          </div>
        </div>
      </div>

      {/* Form Inline / Card */}
      <form onSubmit={handleSave} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
        <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          {editingId ? 'Editar Motorista' : 'Adicionar Novo Motorista'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Nome Completo *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Carlos Eduardo da Silva"
              className="px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(84) 99999-9999"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Número da CNH / Categoria</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={formData.cnh}
                onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                placeholder="Ex: 01234567890 - Cat D"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="rounded bg-slate-900 border-white/20 text-cyan-500 focus:ring-0"
            />
            <span>Motorista Ativo na Escala</span>
          </label>

          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-btn-primary text-xs font-bold"
            >
              {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingId ? 'Salvar Edição' : 'Cadastrar'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Drivers Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">CNH</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  {loading ? 'Carregando...' : 'Nenhum motorista cadastrado'}
                </td>
              </tr>
            ) : (
              drivers.map((drv) => (
                <tr key={drv.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    {drv.nome}
                  </td>
                  <td className="p-3 text-slate-300">
                    {drv.telefone || '-'}
                  </td>
                  <td className="p-3 font-mono text-cyan-300">
                    {drv.cnh || '-'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      drv.ativo !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {drv.ativo !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(drv)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(drv)}
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
