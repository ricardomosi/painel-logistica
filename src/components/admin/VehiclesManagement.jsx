import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, Check, X, User } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function VehiclesManagement() {
  const { showConfirm, addToast } = useLogistics();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    motorista_padrao_id: '',
    ativo: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehs, drvs] = await Promise.all([
        adminService.getVehicles(),
        adminService.getDrivers(),
      ]);
      setVehicles(vehs);
      setDrivers(drvs);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar dados de veículos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      placa: vehicle.placa,
      modelo: vehicle.modelo || '',
      motorista_padrao_id: vehicle.motorista_padrao_id || '',
      ativo: vehicle.ativo !== false,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ placa: '', modelo: '', motorista_padrao_id: '', ativo: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.placa.trim()) {
      addToast('Informe a placa do veículo.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await adminService.updateVehicle(editingId, formData);
        addToast('Veículo atualizado com sucesso!');
      } else {
        await adminService.createVehicle(formData);
        addToast('Veículo cadastrado com sucesso!');
      }
      handleCancel();
      loadData();
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar veículo', 'error');
    }
  };

  const handleDelete = (vehicle) => {
    showConfirm({
      title: 'Excluir Veículo',
      message: `Deseja realmente remover o veículo com placa "${vehicle.placa}"?`,
      confirmText: 'Excluir',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminService.deleteVehicle(vehicle.id);
          addToast('Veículo excluído.');
          loadData();
        } catch (err) {
          console.error(err);
          addToast('Erro ao excluir veículo.', 'error');
        }
      },
    });
  };

  const activeCount = vehicles.filter(v => v.ativo !== false).length;

  return (
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex-1 flex flex-col font-inter">
      
      {/* Header Controls & Info */}
      <div className="p-4 border-b border-grid-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-low/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-on-surface font-semibold text-sm">Gestão de Veículos da Frota</h3>
            <p className="text-on-surface-variant text-xs">{activeCount} veículos operacionais cadastrados</p>
          </div>
        </div>

        <div className="text-[11px] font-data-mono text-on-surface-variant px-2.5 py-1 rounded bg-surface-container-lowest border border-grid-line">
          Total: <span className="text-primary font-bold">{vehicles.length}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="p-4 border-b border-grid-line bg-surface-container-lowest/30 shrink-0">
        <div className="text-xs font-bold uppercase tracking-wider text-primary font-label-caps mb-3 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>{editingId ? 'Editar Dados do Veículo' : 'Cadastrar Novo Veículo'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1 font-label-caps uppercase">Placa do Veículo *</label>
            <input
              type="text"
              required
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
              placeholder="Ex: ABC-1D23"
              className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-grid-line text-primary font-data-mono font-bold text-xs focus:border-primary outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1 font-label-caps uppercase">Modelo / Tipo</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Ex: VW Constellation 24.280"
              className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-grid-line text-on-surface text-xs focus:border-primary outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1 font-label-caps uppercase">Motorista Padrão</label>
            <select
              value={formData.motorista_padrao_id}
              onChange={(e) => setFormData({ ...formData, motorista_padrao_id: e.target.value })}
              className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-grid-line text-on-surface text-xs focus:border-primary outline-none cursor-pointer"
            >
              <option value="" className="bg-surface">Nenhum (Rotativo)</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id} className="bg-surface">
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-1.5 rounded bg-primary text-on-primary hover:bg-primary/90 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingId ? 'Salvar' : 'Adicionar'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Vehicles Table */}
      <div className="border-t border-grid-line flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-grid-line bg-surface-container-lowest/90 backdrop-blur-xs text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">PLACA</th>
              <th className="py-2.5 px-4">MODELO / TIPO</th>
              <th className="py-2.5 px-4">CONDUTOR VINCULADO</th>
              <th className="py-2.5 px-4 text-center">STATUS</th>
              <th className="py-2.5 px-4 text-right w-24">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line text-on-surface">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                  {loading ? 'Carregando veículos...' : 'Nenhum veículo cadastrado'}
                </td>
              </tr>
            ) : (
              vehicles.map((veh) => (
                <tr key={veh.id} className="border-b border-grid-line hover:bg-primary-container/5 transition-colors group">
                  <td className="py-2.5 px-4 font-data-mono font-bold text-primary">
                    {veh.placa}
                  </td>
                  <td className="py-2.5 px-4 text-on-surface">
                    {veh.modelo || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant">
                    {veh.motorista_padrao?.nome || 'Rotativo'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      veh.ativo !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {veh.ativo !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(veh)}
                        className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(veh)}
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
