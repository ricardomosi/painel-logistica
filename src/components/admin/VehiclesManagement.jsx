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

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 text-white shadow-xl flex flex-col gap-6 font-inter">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Gestão de Veículos da Frota</h3>
            <p className="text-xs text-slate-400">Gerencie caminhões, utilitários e motoristas vinculados</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
        <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          {editingId ? 'Editar Veículo' : 'Adicionar Novo Veículo'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Placa do Veículo *</label>
            <input
              type="text"
              required
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
              placeholder="Ex: ABC-1D23"
              className="px-3 py-2 rounded-xl glass-input text-xs font-mono uppercase font-bold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Modelo / Tipo</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Ex: VW Constellation 24.280"
              className="px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Motorista Padrão</label>
            <select
              value={formData.motorista_padrao_id}
              onChange={(e) => setFormData({ ...formData, motorista_padrao_id: e.target.value })}
              className="px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
            >
              <option value="" className="bg-slate-900">Nenhum (Rotativo)</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.nome}
                </option>
              ))}
            </select>
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
            <span>Veículo Ativo em Operação</span>
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

      {/* Vehicles Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3">Placa</th>
              <th className="p-3">Modelo</th>
              <th className="p-3">Motorista Padrão</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  {loading ? 'Carregando...' : 'Nenhum veículo cadastrado'}
                </td>
              </tr>
            ) : (
              vehicles.map((veh) => (
                <tr key={veh.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-cyan-300">
                    {veh.placa}
                  </td>
                  <td className="p-3 text-slate-300">
                    {veh.modelo || '-'}
                  </td>
                  <td className="p-3 text-slate-300">
                    {veh.motorista_padrao?.nome || 'Rotativo'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      veh.ativo !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {veh.ativo !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(veh)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(veh)}
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
