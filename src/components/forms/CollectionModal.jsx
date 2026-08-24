import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';

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

export default function CollectionModal() {
  const { isMotorista } = useAuth();
  const { 
    collectionModalOpen, 
    setCollectionModalOpen, 
    selectedCollection, 
    createCollection, 
    updateCollection,
    deleteCollection,
    showConfirm
  } = useLogistics();

  const isEditing = !!selectedCollection?.id;

  const [formData, setFormData] = useState({
    fornecedor: '',
    responsavel: '',
    tipo: 'Envio',
    placa: '',
    telefone: '',
    coluna_kanban: 'atualizacoes',
    status: 'pendente',
    data_conclusao: '',
    hora_conclusao: '',
  });

  useEffect(() => {
    if (selectedCollection) {
      setFormData({
        fornecedor: selectedCollection.fornecedor || '',
        responsavel: selectedCollection.responsavel || '',
        tipo: selectedCollection.tipo || 'Envio',
        placa: selectedCollection.placa || '',
        telefone: selectedCollection.telefone || '',
        coluna_kanban: selectedCollection.coluna_kanban?.split('|')[0] || 'atualizacoes',
        status: selectedCollection.status || 'pendente',
        data_conclusao: selectedCollection.data_conclusao || '',
        hora_conclusao: selectedCollection.hora_conclusao || '',
      });
    } else {
      setFormData({
        fornecedor: '',
        responsavel: '',
        tipo: 'Envio',
        placa: '',
        telefone: '',
        coluna_kanban: 'atualizacoes',
        status: 'pendente',
        data_conclusao: '',
        hora_conclusao: '',
      });
    }
  }, [selectedCollection, collectionModalOpen]);

  if (!collectionModalOpen) return null;

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
    if (isEditing) {
      await updateCollection(selectedCollection.id, formData);
    } else {
      await createCollection(formData);
    }
    setCollectionModalOpen(false);
  };

  const isConcluido = formData.status === 'concluido';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-4 overflow-y-auto font-inter">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto my-auto transform transition-all scale-100 flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              {isEditing ? 'edit_note' : 'add_box'}
            </span>
            <span>{isEditing ? 'Editar Atualização' : 'Nova Atualização'}</span>
          </h3>
          <button 
            type="button" 
            onClick={() => setCollectionModalOpen(false)} 
            className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none bg-white p-1 rounded-md border shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 font-inter">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Fornecedor / Logística</label>
              <input 
                type="text" 
                required
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                placeholder="Ex: Fornecedor Alpha" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Quem cadastrou a coleta</label>
              <select 
                required
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm text-slate-700"
              >
                <option value="" disabled>Selecione o responsável...</option>
                {RESPONSAVEIS_COLETA.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Placa do Veículo</label>
              <select 
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm text-slate-700"
              >
                <option value="">Selecione...</option>
                {PLACAS_COLETA.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo</label>
                <select 
                  required
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm text-slate-700"
                >
                  <option value="Envio">Envio</option>
                  <option value="Troca">Troca</option>
                  <option value="Retirada">Retirada</option>
                  <option value="Busca">Busca</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone / Celular</label>
                <input 
                  type="text" 
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="Ex: (00) 00000-0000" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Dia da Semana</label>
              <select 
                value={formData.coluna_kanban}
                onChange={(e) => setFormData({ ...formData, coluna_kanban: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm text-slate-700"
              >
                <option value="atualizacoes">Inbox (Pendente)</option>
                <option value="segunda">Segunda</option>
                <option value="terca">Terça</option>
                <option value="quarta">Quarta</option>
                <option value="quinta">Quinta</option>
                <option value="sexta">Sexta</option>
                <option value="sabado">Sábado</option>
              </select>
            </div>

            {/* Detalhes da Conclusão */}
            {isConcluido && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg shadow-inner">
                <h4 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">event_available</span> Detalhes da Conclusão
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-green-700 mb-1">Data Conclusão</label>
                    <input 
                      type="date" 
                      value={formData.data_conclusao}
                      onChange={(e) => setFormData({ ...formData, data_conclusao: e.target.value })}
                      className="w-full px-2 py-1.5 border border-green-300 rounded text-sm focus:outline-none focus:border-green-500 bg-white text-green-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-green-700 mb-1">Hora Conclusão</label>
                    <input 
                      type="time" 
                      value={formData.hora_conclusao}
                      onChange={(e) => setFormData({ ...formData, hora_conclusao: e.target.value })}
                      className="w-full px-2 py-1.5 border border-green-300 rounded text-sm focus:outline-none focus:border-green-500 bg-white text-green-900"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Actions */}
          <div className="pt-4 mt-4 flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-100">
            <div className="flex gap-2 w-full sm:w-auto order-last sm:order-first">
              {isEditing && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="px-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-center flex items-center justify-center shadow-sm" 
                  title="Excluir Card"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              )}

              {isEditing && (
                <button 
                  type="button" 
                  onClick={toggleConcluir}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors text-center flex items-center justify-center gap-1 w-full sm:w-auto shadow-sm ${
                    isConcluido 
                      ? 'text-green-800 bg-green-200 hover:bg-green-300 border border-green-400' 
                      : 'text-slate-600 bg-slate-100 hover:bg-green-100 hover:text-green-700 hover:border-green-300 border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {isConcluido ? 'check_circle' : 'task_alt'}
                  </span>
                  <span>{isConcluido ? 'Concluído' : 'Concluir'}</span>
                </button>
              )}
            </div>

            <div className="flex gap-2 justify-end w-full sm:w-auto">
              <button 
                type="button" 
                onClick={() => setCollectionModalOpen(false)} 
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
              >
                Cancelar
              </button>
              
              <button 
                type="submit" 
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Salvar
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
