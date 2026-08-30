import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, Trash2, Phone, CreditCard, Check, X, BadgePercent } from 'lucide-react';
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

  const activeCount = drivers.filter(d => d.ativo !== false).length;

  return (
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex flex-col font-inter">
      
      {/* Header Controls & Info */}
      <div className="p-4 border-b border-grid-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-low/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-on-surface font-semibold text-sm">Gestão de Motoristas & Operadores</h3>
            <p className="text-on-surface-variant text-xs">{activeCount} condutores ativos na frota logística</p>
          </div>
        </div>

        <div className="text-[11px] font-data-mono text-on-surface-variant px-2.5 py-1 rounded bg-surface-container-lowest border border-grid-line">
          Total: <span className="text-primary font-bold">{drivers.length}</span>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="m-4 p-4 rounded-lg bg-surface-container-low border border-grid-line flex flex-col gap-3.5">
        <div className="text-xs font-bold uppercase tracking-wider text-primary font-label-caps">
          {editingId ? 'Editar Condutor' : 'Cadastrar Novo Motorista'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Nome Completo *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Carlos Eduardo da Silva"
              className="bg-surface border border-grid-line text-on-surface text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(84) 99999-9999"
                className="w-full pl-9 pr-3 py-2 bg-surface border border-grid-line text-on-surface text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 font-data-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Número da CNH / Categoria</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
              <input
                type="text"
                value={formData.cnh}
                onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                placeholder="Ex: 01234567890 - Cat D"
                className="w-full pl-9 pr-3 py-2 bg-surface border border-grid-line text-on-surface text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 font-data-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            <input
              type="checkbox"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="rounded bg-surface border-grid-line text-primary focus:ring-0"
            />
            <span>Motorista Ativo na Escala</span>
          </label>

          <div className="flex items-center gap-2">
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
              {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingId ? 'Salvar Edição' : 'Cadastrar Motorista'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Drivers Table */}
      <div className="border-t border-grid-line overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-grid-line bg-surface-container-lowest/70 text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">NOME DO CONDUTOR</th>
              <th className="py-2.5 px-4">TELEFONE / CONTATO</th>
              <th className="py-2.5 px-4">DOCUMENTO (CNH)</th>
              <th className="py-2.5 px-4 text-center">STATUS</th>
              <th className="py-2.5 px-4 text-right w-24">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line text-on-surface">
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                  {loading ? 'Carregando motoristas...' : 'Nenhum motorista cadastrado'}
                </td>
              </tr>
            ) : (
              drivers.map((drv) => (
                <tr key={drv.id} className="border-b border-grid-line hover:bg-primary-container/5 transition-colors group">
                  <td className="py-2.5 px-4 font-semibold text-on-surface">
                    {drv.nome}
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant font-data-mono">
                    {drv.telefone || '-'}
                  </td>
                  <td className="py-2.5 px-4 font-data-mono text-primary font-medium">
                    {drv.cnh || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      drv.ativo !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {drv.ativo !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(drv)}
                        className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(drv)}
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
