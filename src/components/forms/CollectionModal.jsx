import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';
import MapPickerModal from '../common/MapPickerModal';

const RESPONSAVEIS_COLETA = [
  'SAC FILIAL',
  'SAC MATRIZ',
  'DANIEL',
  'ANDRE',
  'RODOLFO',
];

const PLACAS_COLETA = [
  'RGF9F21 (Jefferson)',
  'GVQ9436 (Jailson)',
  'QGT4I78 (Leandro)',
  'RGK9D89 (Fabio)',
  'RGK8J70 (Jucier)',
  'QGO-5D66 (Laercio)',
  'QGO-5D76 (Otoniel)',
  'RGF-9F11 (Ronys)',
  'OJW-0A50 (Genilson)',
  'TSW-3I57',
  'TSW-2F58 (Caninde)',
  'NOC-7041',
  'QGT-5D69 (Francinildo)',
  'TSW-7G98',
];

const DAY_OFFSETS = {
  segunda: 0,
  terca: 1,
  quarta: 2,
  quinta: 3,
  sexta: 4,
  sabado: 5,
};

const getWeekDayDateStr = (colKey) => {
  if (!colKey || DAY_OFFSETS[colKey] === undefined) return null;
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + DAY_OFFSETS[colKey]);

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CollectionModal() {
  const { isMotorista } = useAuth();
  const { 
    collectionModalOpen, 
    setCollectionModalOpen, 
    selectedCollection, 
    createCollection, 
    updateCollection,
    deleteCollection,
    showConfirm,
    showAlert,
    addToast,
    drivers,
    vehicles,
    profiles
  } = useLogistics();

  const isEditing = !!selectedCollection?.id;
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dynamic Vehicles from Database (Admin -> Veículos & Motoristas)
  const availablePlacas = React.useMemo(() => {
    if (Array.isArray(vehicles) && vehicles.length > 0) {
      const active = vehicles
        .filter(v => v.ativo !== false)
        .map(v => `${v.placa}${v.motorista_padrao?.nome ? ` (${v.motorista_padrao.nome})` : ''}`);
      if (selectedCollection?.placa && !active.includes(selectedCollection.placa)) {
        active.unshift(selectedCollection.placa);
      }
      return active;
    }
    return PLACAS_COLETA;
  }, [vehicles, selectedCollection?.placa]);

  // Dynamic Responsáveis from Database (Admin -> Usuários/Perfis)
  const availableResponsaveis = React.useMemo(() => {
    if (Array.isArray(profiles) && profiles.length > 0) {
      const active = profiles
        .filter(p => p.role === 'admin' || p.role === 'gestor')
        .map(p => p.nome.toUpperCase());
      if (selectedCollection?.responsavel && !active.includes(selectedCollection.responsavel.toUpperCase())) {
        active.unshift(selectedCollection.responsavel);
      }
      return active;
    }
    return RESPONSAVEIS_COLETA;
  }, [profiles, selectedCollection?.responsavel]);

  const [formData, setFormData] = useState({
    fornecedor: '',
    endereco: '',
    responsavel: '',
    tipo: 'Envio',
    placa: '',
    telefone: '',
    coluna_kanban: 'atualizacoes',
    status: 'pendente',
    urgente: false,
    data_conclusao: '',
    hora_conclusao: '',
  });

  useEffect(() => {
    if (selectedCollection) {
      setFormData({
        fornecedor: selectedCollection.fornecedor || '',
        endereco: selectedCollection.endereco || '',
        responsavel: selectedCollection.responsavel || '',
        tipo: selectedCollection.tipo || 'Envio',
        placa: selectedCollection.placa || '',
        telefone: selectedCollection.telefone || '',
        coluna_kanban: selectedCollection.coluna_kanban?.split('|')[0] || 'atualizacoes',
        status: selectedCollection.status || 'pendente',
        urgente: !!selectedCollection.urgente,
        data_conclusao: selectedCollection.data_conclusao || '',
        hora_conclusao: selectedCollection.hora_conclusao || '',
      });
    } else {
      setFormData({
        fornecedor: '',
        endereco: '',
        responsavel: '',
        tipo: 'Envio',
        placa: '',
        telefone: '',
        coluna_kanban: 'atualizacoes',
        status: 'pendente',
        urgente: false,
        data_conclusao: '',
        hora_conclusao: '',
      });
    }
  }, [selectedCollection, collectionModalOpen]);

  if (!collectionModalOpen) return null;

  const handlePlacaChange = (val) => {
    let matchedDriverId = null;
    let matchedVehId = null;
    if (val) {
      const normVal = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (Array.isArray(drivers)) {
        const d = drivers.find(drv => {
          const dName = (drv.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return dName.length >= 3 && normVal.includes(dName);
        });
        if (d) matchedDriverId = d.id;
      }
      if (Array.isArray(vehicles)) {
        const v = vehicles.find(veh => {
          const vPlaca = (veh.placa || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return vPlaca.length >= 4 && normVal.includes(vPlaca);
        });
        if (v) matchedVehId = v.id;
      }
    }
    setFormData(prev => ({
      ...prev,
      placa: val,
      motorista_id: matchedDriverId || prev.motorista_id,
      veiculo_id: matchedVehId || prev.veiculo_id,
    }));
  };

  const toggleConcluir = () => {
    setFormData(prev => {
      if (prev.status === 'concluido') {
        return { ...prev, status: 'pendente' };
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return {
          ...prev,
          status: 'concluido',
          data_conclusao: prev.data_conclusao || `${year}-${month}-${day}`,
          hora_conclusao: prev.hora_conclusao || `${hours}:${minutes}`,
        };
      }
    });
  };

  const handleDelete = () => {
    if (!selectedCollection?.id) return;
    showConfirm({
      title: 'Excluir',
      message: 'Tem certeza que deseja excluir esta coleta permanentemente?',
      confirmText: 'Sim, Excluir',
      isDestructive: true,
      onConfirm: async () => {
        await deleteCollection(selectedCollection.id);
        setCollectionModalOpen(false);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fornecedor || !formData.fornecedor.trim()) {
      showAlert({ title: 'Campo obrigatório', message: 'O nome do fornecedor/cliente é obrigatório.' });
      return;
    }

    try {
      setSaving(true);
      const targetDayDate = getWeekDayDateStr(formData.coluna_kanban);

      const cleanPayload = {
        ...formData,
        fornecedor: formData.fornecedor?.trim() || '',
        endereco: formData.endereco?.trim() || null,
        responsavel: formData.responsavel?.trim() || null,
        placa: formData.placa?.trim() || null,
        telefone: formData.telefone?.trim() || null,
        coluna_kanban: formData.coluna_kanban || 'atualizacoes',
        data_registro: targetDayDate || formData.data_registro || null,
        motorista_id: formData.motorista_id || null,
        veiculo_id: formData.veiculo_id || null,
        data_conclusao: formData.data_conclusao?.trim() || null,
        hora_conclusao: formData.hora_conclusao?.trim() || null,
      };

      if (isEditing) {
        await updateCollection(selectedCollection.id, cleanPayload);
        addToast('Coleta atualizada com sucesso!', 'success');
      } else {
        await createCollection(cleanPayload);
        addToast('Coleta cadastrada com sucesso!', 'success');
      }
      setCollectionModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar coleta:', err);
      showAlert({
        title: 'Erro',
        message: `Erro ao salvar coleta: ${err?.message || 'Verifique sua conexão e tente novamente'}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const isConcluido = formData.status === 'concluido';

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-3 sm:p-4 overflow-y-auto font-inter">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto my-auto transform transition-all flex flex-col border border-slate-100 overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200/80 flex justify-between items-center bg-gradient-to-r from-slate-50 to-emerald-50/40">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">
                {isEditing ? 'edit_note' : 'add_box'}
              </span>
              <span>{isEditing ? 'Editar Coleta / Atualização' : 'Nova Coleta / Atualização'}</span>
            </h3>

            <div className="flex items-center gap-2">
              {!isMotorista && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgente: !prev.urgente }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                    formData.urgente 
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs' 
                      : 'bg-white text-slate-600 border-slate-300 hover:border-red-300 hover:text-red-600'
                  }`}
                  title="Marcar coleta como urgente para ficar no topo do painel"
                >
                  <span className={`material-symbols-outlined text-sm ${formData.urgente ? 'text-white' : 'text-red-500'}`}>
                    local_fire_department
                  </span>
                  <span>{formData.urgente ? 'URGENTE' : 'Marcar Urgente'}</span>
                </button>
              )}

              <button 
                type="button" 
                onClick={() => setCollectionModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none p-1.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 font-inter space-y-4">
            {/* Fornecedor / Logística */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Fornecedor / Logística *
              </label>
              <input 
                type="text" 
                required
                disabled={isMotorista}
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                placeholder="Ex: Fornecedor Alpha / Gerdau" 
                className={`w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 text-xs font-semibold ${isMotorista ? 'bg-slate-50 text-slate-800' : ''}`}
              />
            </div>

            {/* Endereço da Coleta com Mapa e Traçar Rota */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Endereço da Coleta / Fornecedor
                </label>
                <div className="flex items-center gap-2">
                  {formData.endereco && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formData.endereco)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">directions</span>
                      Traçar Rota
                    </a>
                  )}
                  {!isMotorista && (
                    <button 
                      type="button" 
                      onClick={() => setMapPickerOpen(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      Buscar no Mapa
                    </button>
                  )}
                </div>
              </div>
              <textarea 
                rows={2}
                disabled={isMotorista}
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, Número, Bairro, Cidade - UF" 
                className={`w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-xs ${isMotorista ? 'bg-slate-50 text-slate-800 font-medium' : ''}`}
              />
            </div>

            {/* Quem cadastrou a coleta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quem cadastrou a coleta *
              </label>
              <select 
                required
                disabled={isMotorista}
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className={`w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-xs font-semibold text-slate-700 cursor-pointer ${isMotorista ? 'bg-slate-50' : ''}`}
              >
                <option value="" disabled>Selecione o responsável...</option>
                {availableResponsaveis.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Placa do Veículo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Placa do Veículo
              </label>
              <select 
                value={formData.placa}
                disabled={isMotorista}
                onChange={(e) => handlePlacaChange(e.target.value)}
                className={`w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-xs font-semibold text-slate-700 cursor-pointer ${isMotorista ? 'bg-slate-50' : ''}`}
              >
                <option value="">Selecione o veículo...</option>
                {availablePlacas.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Tipo e Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo *
                </label>
                <select 
                  required
                  disabled={isMotorista}
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className={`w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-xs font-bold text-slate-700 cursor-pointer ${isMotorista ? 'bg-slate-50' : ''}`}
                >
                  <option value="Envio">Envio</option>
                  <option value="Troca">Troca</option>
                  <option value="Retirada">Retirada</option>
                  <option value="Busca">Busca</option>
                  <option value="Coleta">Coleta</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Telefone / Contato
                  </label>
                  {formData.telefone && (
                    <a 
                      href={`tel:${formData.telefone.replace(/\D/g, '')}`}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">call</span>
                      Ligar
                    </a>
                  )}
                </div>
                <input 
                  type="text" 
                  disabled={isMotorista}
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000" 
                  className={`w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-xs ${isMotorista ? 'bg-slate-50 text-slate-800' : ''}`}
                />
              </div>
            </div>

            {/* Dia da Semana (Coluna Kanban) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dia da Semana (Coluna do Quadro)
              </label>
              <select 
                value={formData.coluna_kanban}
                disabled={isMotorista}
                onChange={(e) => setFormData({ ...formData, coluna_kanban: e.target.value })}
                className={`w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-xs font-semibold text-slate-700 cursor-pointer ${isMotorista ? 'bg-slate-50' : ''}`}
              >
                <option value="atualizacoes">Inbox (Pendente / Atualizações)</option>
                <option value="segunda">Segunda-feira</option>
                <option value="terca">Terça-feira</option>
                <option value="quarta">Quarta-feira</option>
                <option value="quinta">Quinta-feira</option>
                <option value="sexta">Sexta-feira</option>
                <option value="sabado">Sábado</option>
              </select>
            </div>

            {/* Detalhes da Conclusão */}
            {isConcluido && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl shadow-inner">
                <h4 className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">event_available</span> Detalhes da Conclusão
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-800 mb-1">Data Conclusão</label>
                    <input 
                      type="date" 
                      value={formData.data_conclusao}
                      onChange={(e) => setFormData({ ...formData, data_conclusao: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-800 mb-1">Hora Conclusão</label>
                    <input 
                      type="time" 
                      value={formData.hora_conclusao}
                      onChange={(e) => setFormData({ ...formData, hora_conclusao: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white text-emerald-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-100">
              <div className="flex gap-2 w-full sm:w-auto order-last sm:order-first">
                {isEditing && !isMotorista && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="p-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors text-center flex items-center justify-center shadow-xs cursor-pointer" 
                    title="Excluir Coleta"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                )}

                {isEditing && (
                  <button 
                    type="button" 
                    onClick={toggleConcluir}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-xs cursor-pointer ${
                      isConcluido 
                        ? 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300' 
                        : 'text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isConcluido ? 'check_circle' : 'task_alt'}
                    </span>
                    <span>{isConcluido ? 'Concluída' : 'Marcar Concluída'}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2 justify-end w-full sm:w-auto">
                <button 
                  type="button" 
                  onClick={() => setCollectionModalOpen(false)} 
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Cancelar
                </button>
                
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">
                    {saving ? 'hourglass_top' : 'save'}
                  </span>
                  <span>{saving ? 'Salvando...' : 'Salvar Coleta'}</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Map Picker Modal for Collection */}
      <MapPickerModal
        isOpen={mapPickerOpen}
        initialAddress={formData.endereco}
        onConfirmAddress={(addr) => setFormData(prev => ({ ...prev, endereco: addr }))}
        onClose={() => setMapPickerOpen(false)}
      />
    </>
  );
}
