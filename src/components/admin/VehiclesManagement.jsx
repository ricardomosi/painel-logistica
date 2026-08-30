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
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex flex-col font-inter">
      
      {/* Header Controls & Info */}
      <div className="p-4 border-b border-grid-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-low/50">
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
      <form onSubmit={handleSave} className="m-4 p-4 rounded-lg bg-surface-container-low border border-grid-line flex flex-col gap-3.5">
        <div className="text-xs font-bold uppercase tracking-wider text-primary font-label-caps">
          {editingId ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Placa do Veículo *</label>
            <input
              type="text"
              required
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
              placeholder="Ex: ABC-1D23"
              className="bg-surface border border-grid-line text-primary font-data-mono font-bold text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Modelo / Tipo</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Ex: VW Constellation 24.280"
              className="bg-surface border border-grid-line text-on-surface text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Motorista Padrão</label>
            <select
              value={formData.motorista_padrao_id}
              onChange={(e) => setFormData({ ...formData, motorista_padrao_id: e.target.value })}
              className="bg-surface border border-grid-line text-on-surface text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
            >
              <option value="" className="bg-surface">Nenhum (Rotativo)</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id} className="bg-surface">
                  {d.nome}
                </option>
              ))}
            </select>
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
            <span>Veículo Ativo em Operação</span>
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
              <span>{editingId ? 'Salvar Edição' : 'Cadastrar Veículo'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Vehicles Table */}
      <div className="border-t border-grid-line overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-grid-line bg-surface-container-lowest/70 text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
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
