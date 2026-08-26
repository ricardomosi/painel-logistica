import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Truck, 
  Receipt, 
  User, 
  Calendar, 
  Clock, 
  Gauge, 
  Save, 
  Trash2, 
  CheckCircle, 
  Printer, 
  Download, 
  Plus, 
  FileSpreadsheet, 
  Scale, 
  DollarSign, 
  Package, 
  Layers,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';
import MapPickerModal from '../common/MapPickerModal';
import { romaneioService } from '../../services/romaneioService';
import { printRomaneioPdf, downloadRomaneioPdf } from '../romaneio/RomaneioPdfDocument';
import MaterialSearchInput from './MaterialSearchInput';
import QuickCreateMaterialModal from './QuickCreateMaterialModal';

const VENDEDORES_OPTIONS = [
  { name: 'BEBEZINHO (Filial)', colorClass: 'text-orange-600 font-bold' },
  { name: 'BRUNO (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'CARLOS (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'DANIEL HELIO (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'DARLAN (Filial)', colorClass: 'text-orange-600 font-bold' },
  { name: 'JORGE (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'LEONARDO (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'MANOEL (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'MARCOS (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'PLASMA (Matriz)', colorClass: 'text-blue-600 font-bold' },
  { name: 'RODOLFO (Filial)', colorClass: 'text-orange-600 font-bold' },
];

const PLACAS_OPTIONS = [
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

const CADASTRADORES_ENTREGA = [
  'SAC FILIAL',
  'SAC MATRIZ',
  'DANIEL',
  'ANDRE',
  'RODOLFO',
];

const OCORRENCIAS_OPTIONS = [
  { value: 'Sem ocorrências', label: 'Sem ocorrências', color: 'text-green-600 font-bold' },
  { value: 'Produto Divergente do Pedido', label: 'Produto Divergente do Pedido', color: 'text-red-600 font-bold' },
  { value: 'Produto Entregue Parcial', label: 'Produto Entregue Parcial', color: 'text-red-600 font-bold' },
  { value: 'Atraso na Produção', label: 'Atraso na Produção', color: 'text-red-600 font-bold' },
  { value: 'Erro de Conferência', label: 'Erro de Conferência', color: 'text-red-600 font-bold' },
];

export default function DeliveryModal() {
  const { isMotorista } = useAuth();
  const { 
    deliveryModalOpen, 
    setDeliveryModalOpen, 
    selectedDelivery, 
    createDelivery, 
    updateDelivery, 
    deleteDelivery,
    materials,
    showConfirm,
    showAlert,
    addToast
  } = useLogistics();

  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('geral'); // 'geral' | 'romaneio' | 'rota'
  const [saving, setSaving] = useState(false);
  const [loadingRomaneio, setLoadingRomaneio] = useState(false);
  const [quickMaterialModalOpen, setQuickMaterialModalOpen] = useState(false);
  const [quickMaterialInitialName, setQuickMaterialInitialName] = useState('');
  const [targetItemIndexForNewMaterial, setTargetItemIndexForNewMaterial] = useState(null);
  const isEditing = !!selectedDelivery?.id;

  const [formData, setFormData] = useState({
    cliente: '',
    endereco: '',
    frete: '',
    valor_entrega: '',
    placa: '',
    boleto: '',
    vendedor: '',
    local_carregamento: 'MATRIZ',
    cadastrador_entrega: '',
    telefone: '',
    coluna: 'atualizacoes',
    status: 'pendente',
    // Início
    data_inicio: '',
    hora_inicio: '',
    km_inicial: '',
    // Conclusão
    data_conclusao: '',
    hora_conclusao: '',
    km_final: '',
    km_total: 0,
    como_foi_entrega: '',
  });

  // Romaneio Embedded State
  const [romaneioItens, setRomaneioItens] = useState([]);
  const [romaneioObs, setRomaneioObs] = useState('');
  const [romaneioNumero, setRomaneioNumero] = useState(null);

  // Load delivery and associated romaneio data
  useEffect(() => {
    if (!deliveryModalOpen) return;

    if (selectedDelivery) {
      setFormData({
        cliente: selectedDelivery.cliente || '',
        endereco: selectedDelivery.endereco || '',
        frete: selectedDelivery.frete ? String(selectedDelivery.frete) : '',
        valor_entrega: selectedDelivery.valor_entrega ? String(selectedDelivery.valor_entrega) : '',
        placa: selectedDelivery.placa || '',
        boleto: selectedDelivery.boleto || '',
        vendedor: selectedDelivery.vendedor || '',
        local_carregamento: selectedDelivery.local_carregamento || 'MATRIZ',
        cadastrador_entrega: selectedDelivery.cadastrador_entrega || '',
        telefone: selectedDelivery.telefone || '',
        coluna: selectedDelivery.coluna?.split('|')[0] || 'atualizacoes',
        status: selectedDelivery.status || 'pendente',
        data_inicio: selectedDelivery.data_inicio || '',
        hora_inicio: selectedDelivery.hora_inicio || '',
        km_inicial: selectedDelivery.km_inicial ?? '',
        data_conclusao: selectedDelivery.data_conclusao || '',
        hora_conclusao: selectedDelivery.hora_conclusao || '',
        km_final: selectedDelivery.km_final ?? '',
        km_total: selectedDelivery.km_total ?? 0,
        como_foi_entrega: selectedDelivery.como_foi_entrega || '',
      });

      // Fetch existing romaneio items for this delivery
      async function fetchRomaneio() {
        try {
          setLoadingRomaneio(true);
          const romData = await romaneioService.getByDeliveryId(selectedDelivery.id);
          if (romData) {
            setRomaneioNumero(romData.numero_romaneio);
            setRomaneioObs(romData.observacoes || '');
            setRomaneioItens(romData.itens || []);
          } else {
            setRomaneioNumero(selectedDelivery.id);
            setRomaneioObs('');
            setRomaneioItens([]);
          }
        } catch (err) {
          console.warn('Erro ao carregar romaneio da entrega:', err);
          setRomaneioItens([]);
        } finally {
          setLoadingRomaneio(false);
        }
      }
      fetchRomaneio();

    } else {
      // Clean form for new delivery
      setFormData({
        cliente: '',
        endereco: '',
        frete: '',
        valor_entrega: '',
        placa: '',
        boleto: '',
        vendedor: '',
        local_carregamento: 'MATRIZ',
        cadastrador_entrega: '',
        telefone: '',
        coluna: 'atualizacoes',
        status: 'pendente',
        data_inicio: '',
        hora_inicio: '',
        km_inicial: '',
        data_conclusao: '',
        hora_conclusao: '',
        km_final: '',
        km_total: 0,
        como_foi_entrega: '',
      });
      setRomaneioNumero(null);
      setRomaneioObs('');
      setRomaneioItens([
        {
          id: 'temp-' + Date.now(),
          material_id: '',
          codigo_material: '',
          nome_material: '',
          unidade: 'UN',
          quantidade: 1,
          peso_unitario_kg: 0,
          peso_total_kg: 0,
          valor_unitario: 0,
          valor_total: 0,
        }
      ]);
    }
  }, [selectedDelivery, deliveryModalOpen]);

  if (!deliveryModalOpen) return null;

  // Romaneio calculation helpers
  const handleAddItem = () => {
    setRomaneioItens(prev => [
      ...prev,
      {
        id: 'temp-' + Date.now() + Math.random().toString(36).substring(2, 6),
        material_id: '',
        codigo_material: '',
        nome_material: '',
        unidade: 'UN',
        quantidade: 1,
        peso_unitario_kg: 0,
        peso_total_kg: 0,
        valor_unitario: 0,
        valor_total: 0,
      }
    ]);
  };

  const handleRemoveItem = (idx) => {
    setRomaneioItens(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSelectMaterialRow = (idx, material) => {
    setRomaneioItens(prev => {
      const updated = [...prev];
      const row = { ...updated[idx] };
      const qtd = parseFloat(row.quantidade) || 1;

      row.material_id = material.id || null;
      row.codigo_material = material.codigo || '';
      row.nome_material = material.nome || '';
      row.unidade = material.unidade || 'UN';
      row.peso_unitario_kg = Number(material.peso_padrao_kg) || 0;
      row.valor_unitario = Number(material.preco_trazer) || Number(material.preco_sugerido) || Number(material.valor_padrao) || 0;

      row.peso_total_kg = Number((qtd * row.peso_unitario_kg).toFixed(2));
      row.valor_total = Number((qtd * row.valor_unitario).toFixed(2));

      updated[idx] = row;
      return updated;
    });
  };

  const handleItemChange = (idx, field, val) => {
    setRomaneioItens(prev => {
      const updated = [...prev];
      const row = { ...updated[idx], [field]: val };

      // Calculations
      const qtd = parseFloat(row.quantidade) || 0;
      const pUnit = parseFloat(row.peso_unitario_kg) || 0;
      const vUnit = parseFloat(row.valor_unitario) || 0;

      row.peso_total_kg = Number((qtd * pUnit).toFixed(2));
      row.valor_total = Number((qtd * vUnit).toFixed(2));

      updated[idx] = row;
      return updated;
    });
  };

  const handleQuickMaterialCreated = (newMaterial) => {
    if (targetItemIndexForNewMaterial !== null && targetItemIndexForNewMaterial >= 0) {
      handleSelectMaterialRow(targetItemIndexForNewMaterial, newMaterial);
    }
    setTargetItemIndexForNewMaterial(null);
  };

  // Grand totals of Romaneio
  const romaneioTotalQtd = romaneioItens.reduce((sum, it) => sum + (Number(it.quantidade) || 0), 0);
  const romaneioTotalPeso = romaneioItens.reduce((sum, it) => sum + (Number(it.peso_total_kg) || (Number(it.quantidade) * Number(it.peso_unitario_kg)) || 0), 0);
  const romaneioTotalValor = romaneioItens.reduce((sum, it) => sum + (Number(it.valor_total) || (Number(it.quantidade) * Number(it.valor_unitario)) || 0), 0);

  // Print & Download PDF handlers
  const handlePrintRomaneio = () => {
    if (!formData.cliente) {
      showAlert({ title: 'Atenção', message: 'Preencha ao menos o nome do Cliente para gerar o Romaneio.' });
      return;
    }
    printRomaneioPdf({
      delivery: {
        ...formData,
        id: selectedDelivery?.id || 1,
      },
      romaneio: {
        numero_romaneio: romaneioNumero || selectedDelivery?.id || '0001',
        observacoes: romaneioObs,
      },
      items: romaneioItens,
    });
  };

  const handleDownloadRomaneio = () => {
    if (!formData.cliente) {
      showAlert({ title: 'Atenção', message: 'Preencha ao menos o nome do Cliente para gerar o Romaneio.' });
      return;
    }
    downloadRomaneioPdf({
      delivery: {
        ...formData,
        id: selectedDelivery?.id || 1,
      },
      romaneio: {
        numero_romaneio: romaneioNumero || selectedDelivery?.id || '0001',
        observacoes: romaneioObs,
      },
      items: romaneioItens,
    });
  };

  const marcarInicioAgora = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      data_inicio: `${year}-${month}-${day}`,
      hora_inicio: `${hours}:${minutes}`,
    }));
  };

  const marcarConclusaoAgora = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      data_conclusao: `${year}-${month}-${day}`,
      hora_conclusao: `${hours}:${minutes}`,
      status: 'concluido',
    }));
  };

  const handleKmChange = (field, val) => {
    const nextForm = { ...formData, [field]: val };
    const kmI = parseFloat(nextForm.km_inicial) || 0;
    const kmF = parseFloat(nextForm.km_final) || 0;
    if (kmF >= kmI && kmI > 0) {
      nextForm.km_total = kmF - kmI;
    } else {
      nextForm.km_total = 0;
    }
    setFormData(nextForm);
  };

  const toggleConcluir = () => {
    if (formData.status === 'concluido') {
      setFormData(prev => ({
        ...prev,
        status: 'pendente',
        data_conclusao: '',
        hora_conclusao: '',
        km_final: '',
        km_total: 0,
      }));
    } else {
      marcarConclusaoAgora();
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Excluir Entrega',
      message: `Tem certeza que deseja excluir a entrega de ${formData.cliente || 'Sem cliente'}?`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDelivery(selectedDelivery.id);
          setDeliveryModalOpen(false);
        } catch (e) {
          // Toast handles it
        }
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente.trim()) {
      showAlert({ title: 'Campo obrigatório', message: 'O nome do cliente é obrigatório.' });
      return;
    }

    try {
      setSaving(true);

      // Sincroniza o valor_entrega com o total do romaneio caso existam itens
      const finalValorEntrega = romaneioTotalValor > 0 
        ? romaneioTotalValor 
        : (parseFloat(formData.valor_entrega) || 0);

      const payload = {
        ...formData,
        valor_entrega: finalValorEntrega,
      };

      let savedDelivery;
      if (isEditing) {
        savedDelivery = await updateDelivery(selectedDelivery.id, payload);
      } else {
        savedDelivery = await createDelivery(payload);
      }

      // Salva itens do Romaneio vinculado
      if (savedDelivery?.id) {
        await romaneioService.saveRomaneio(savedDelivery.id, {
          observacoes: romaneioObs,
          itens: romaneioItens,
        });
      }

      addToast(isEditing ? 'Entrega e Romaneio atualizados!' : 'Entrega e Romaneio cadastrados com sucesso!', 'success');
      setDeliveryModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar entrega com romaneio:', err);
      showAlert({ title: 'Erro', message: `Erro ao salvar entrega: ${err.message || ''}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const isConcluido = formData.status === 'concluido';

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-2 sm:p-4 font-inter animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    {isEditing ? `Entrega #${String(selectedDelivery.id).padStart(4, '0')} - ${formData.cliente}` : 'Nova Entrega com Romaneio'}
                  </h3>
                  {isConcluido && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-300">
                      Concluída
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Gerencie os dados de transporte e os itens oficiais do Romaneio de Carga
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setDeliveryModalOpen(false)} 
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtabs Selector */}
          <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 bg-slate-50/80 border-b border-slate-200/60 shrink-0 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveSubTab('geral')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeSubTab === 'geral'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>1. Dados da Entrega</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('romaneio')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all relative shrink-0 ${
                activeSubTab === 'romaneio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>2. Romaneio & Carga</span>
              {romaneioItens.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeSubTab === 'romaneio' ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
                }`}>
                  {romaneioItens.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('rota')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeSubTab === 'rota'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Gauge className="w-4 h-4 shrink-0" />
              <span>3. Rota & Execução</span>
            </button>

            {/* Quick Print Romaneio Button inside Subtab Bar */}
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handlePrintRomaneio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                title="Imprimir Romaneio de Carga em PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimir Romaneio</span>
              </button>
            </div>
          </div>

          {/* Form / Content Area */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 custom-scrollbar">
            
            {/* ======================================================== */}
            {/* TAB 1: DADOS GERAIS DA ENTREGA                          */}
            {/* ======================================================== */}
            {activeSubTab === 'geral' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Cliente */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cliente / Destinatário *
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={isMotorista}
                      value={formData.cliente}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                      placeholder="Nome do cliente ou empresa" 
                      className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold ${isMotorista ? 'bg-slate-50 text-slate-800' : ''}`}
                    />
                  </div>

                  {/* Telefone com link para chamada */}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000" 
                      className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs ${isMotorista ? 'bg-slate-50 text-slate-800' : ''}`}
                    />
                  </div>

                  {/* Endereço com botão mapa e rota */}
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Endereço de Entrega
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
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Buscar no Mapa
                          </button>
                        )}
                      </div>
                    </div>
                    <input 
                      type="text" 
                      disabled={isMotorista}
                      value={formData.endereco}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Rua, Número, Bairro, Cidade - UF" 
                      className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs ${isMotorista ? 'bg-slate-50 text-slate-800 font-medium' : ''}`}
                    />
                  </div>

                  {/* Placa / Motorista */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Placa do Veículo / Motorista
                    </label>
                    {isMotorista ? (
                      <input 
                        type="text"
                        disabled
                        value={formData.placa || 'Sem placa definida'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    ) : (
                      <select 
                        value={formData.placa}
                        onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold cursor-pointer"
                      >
                        <option value="">Selecione o veículo...</option>
                        {PLACAS_OPTIONS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Boleto / NF */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Número do Boleto / NF / Pedido
                    </label>
                    <input 
                      type="text" 
                      disabled={isMotorista}
                      value={formData.boleto}
                      onChange={(e) => setFormData(prev => ({ ...prev, boleto: e.target.value }))}
                      placeholder="Ex: BOL-12345" 
                      className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono ${isMotorista ? 'bg-slate-50 text-slate-800 font-bold' : ''}`}
                    />
                  </div>

                  {/* Vendedor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Vendedor Responsável
                    </label>
                    {isMotorista ? (
                      <input 
                        type="text"
                        disabled
                        value={formData.vendedor || 'Vendedor N/D'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold"
                      />
                    ) : (
                      <select 
                        value={formData.vendedor}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendedor: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold cursor-pointer"
                      >
                        <option value="">Selecione o vendedor...</option>
                        {VENDEDORES_OPTIONS.map(v => (
                          <option key={v.name} value={v.name} className={v.colorClass}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Local de Saída */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Local de Carregamento
                    </label>
                    {isMotorista ? (
                      <input 
                        type="text"
                        disabled
                        value={formData.local_carregamento || 'MATRIZ'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold"
                      />
                    ) : (
                      <select 
                        value={formData.local_carregamento}
                        onChange={(e) => setFormData(prev => ({ ...prev, local_carregamento: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold cursor-pointer"
                      >
                        <option value="MATRIZ">MATRIZ</option>
                        <option value="FILIAL">FILIAL</option>
                      </select>
                    )}
                  </div>

                  {/* Admin-only fields: Quem Cadastrou e Frete */}
                  {!isMotorista && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quem Cadastrou (Gestor)
                        </label>
                        <select 
                          value={formData.cadastrador_entrega}
                          onChange={(e) => setFormData(prev => ({ ...prev, cadastrador_entrega: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold cursor-pointer"
                        >
                          <option value="">Selecione o responsável...</option>
                          {CADASTRADORES_ENTREGA.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Valor do Frete (R$)
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formData.frete}
                          onChange={(e) => setFormData(prev => ({ ...prev, frete: e.target.value }))}
                          placeholder="0,00" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono font-bold" 
                        />
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: ROMANEIO DE CARGA EMBEDDED                       */}
            {/* ======================================================== */}
            {activeSubTab === 'romaneio' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Banner Header do Romaneio */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-950">
                        {isMotorista ? 'Conferência de Carga do Romaneio' : 'Romaneio de Carga & Itens Transportados'}
                      </h4>
                      <p className="text-xs text-indigo-700/80">
                        {isMotorista 
                          ? 'Confira os materiais físicos e quantidades a serem entregues ao cliente' 
                          : 'Adicione os materiais que compõem a carga desta entrega para conferência e emissão do PDF'}
                      </p>
                    </div>
                  </div>

                  {!isMotorista && (
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Material</span>
                    </button>
                  )}
                </div>

                {/* Tabela de Itens */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 min-w-[220px]">Material / Descrição (Catálogo SAGI)</th>
                        <th className="p-3 w-20 text-center">Qtd</th>
                        <th className="p-3 w-16 text-center">Unid</th>
                        <th className="p-3 w-24 text-right">Peso Total</th>
                        {!isMotorista && <th className="p-3 w-24 text-right">Peso Unit</th>}
                        {!isMotorista && <th className="p-3 w-24 text-right">Vlr Unit</th>}
                        {!isMotorista && <th className="p-3 w-24 text-right">Vlr Total</th>}
                        {!isMotorista && <th className="p-3 w-12 text-center"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {romaneioItens.length === 0 ? (
                        <tr>
                          <td colSpan={isMotorista ? 5 : 9} className="p-6 text-center text-slate-400">
                            {isMotorista ? 'Nenhum item discriminado no romaneio desta entrega.' : 'Nenhum item adicionado ao romaneio. Clique em "+ Adicionar Material".'}
                          </td>
                        </tr>
                      ) : (
                        romaneioItens.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-center text-slate-400 font-mono font-bold">
                              {idx + 1}
                            </td>

                            <td className="p-3">
                              {isMotorista ? (
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 text-xs">
                                    {item.nome_material || item.codigo_material || 'Material sem descrição'}
                                  </span>
                                  {item.codigo_material && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      Cód: {item.codigo_material}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <MaterialSearchInput
                                  value={item.nome_material || ''}
                                  selectedMaterialId={item.material_id}
                                  codigoMaterial={item.codigo_material}
                                  unidade={item.unidade}
                                  type="trazer"
                                  onSelect={(mat) => handleSelectMaterialRow(idx, mat)}
                                  onChangeText={(text) => handleItemChange(idx, 'nome_material', text)}
                                  onAddNewMaterial={(initialText) => {
                                    setTargetItemIndexForNewMaterial(idx);
                                    setQuickMaterialInitialName(initialText);
                                    setQuickMaterialModalOpen(true);
                                  }}
                                  placeholder="Digite o código ou nome do material..."
                                />
                              )}
                            </td>

                            {/* Quantidade */}
                            <td className="p-3 text-center">
                              {isMotorista ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-extrabold text-xs border border-blue-200">
                                  {item.quantidade}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={item.quantidade}
                                  onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                              )}
                            </td>

                            {/* Unidade */}
                            <td className="p-3 text-center">
                              {isMotorista ? (
                                <span className="font-bold text-[11px] text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                                  {item.unidade || 'UN'}
                                </span>
                              ) : (
                                <select
                                  value={item.unidade || 'UN'}
                                  onChange={(e) => handleItemChange(idx, 'unidade', e.target.value)}
                                  className="w-16 px-1.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                  <option value="UN">UN</option>
                                  <option value="KG">KG</option>
                                  <option value="MT">MT</option>
                                  <option value="TN">TN</option>
                                  <option value="LT">LT</option>
                                  <option value="PR">PR</option>
                                  <option value="M2">M²</option>
                                  <option value="M3">M³</option>
                                  <option value="PCT">PCT</option>
                                  <option value="CX">CX</option>
                                </select>
                              )}
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-slate-700">
                              {(Number(item.peso_total_kg) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                            </td>

                            {!isMotorista && (
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.peso_unitario_kg}
                                  onChange={(e) => handleItemChange(idx, 'peso_unitario_kg', e.target.value)}
                                  className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-right font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                              </td>
                            )}

                            {!isMotorista && (
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.valor_unitario}
                                  onChange={(e) => handleItemChange(idx, 'valor_unitario', e.target.value)}
                                  className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-right font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                              </td>
                            )}

                            {!isMotorista && (
                              <td className="p-3 text-right font-mono font-bold text-indigo-700">
                                R$ {(Number(item.valor_total) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            )}

                            {!isMotorista && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Remover item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Resumo de Totais do Romaneio */}
                <div className={`grid grid-cols-1 ${isMotorista ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3 p-4 rounded-2xl bg-slate-900 text-white shadow-md`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-cyan-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Volume Total
                      </span>
                      <span className="text-base font-bold font-mono text-white">
                        {romaneioTotalQtd.toLocaleString('pt-BR')} itens
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Peso Bruto Total
                      </span>
                      <span className="text-base font-bold font-mono text-amber-300">
                        {romaneioTotalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                      </span>
                    </div>
                  </div>

                  {!isMotorista && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Valor Total da Carga
                        </span>
                        <span className="text-base font-bold font-mono text-emerald-400">
                          R$ {romaneioTotalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações do Romaneio */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Observações do Romaneio (Impressas no Documento)
                  </label>
                  {isMotorista ? (
                    <div className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 min-h-[44px]">
                      {romaneioObs || 'Nenhuma observação informada.'}
                    </div>
                  ) : (
                    <textarea
                      rows={2}
                      value={romaneioObs}
                      onChange={(e) => setRomaneioObs(e.target.value)}
                      placeholder="Ex: Entregar com nota fiscal anexa; descarregar no portão 2..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  )}
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: ROTA & EXECUÇÃO                                  */}
            {/* ======================================================== */}
            {activeSubTab === 'rota' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Início de Rota */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Início do Deslocamento
                    </h4>
                    <button
                      type="button"
                      onClick={marcarInicioAgora}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Marcar Agora
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Início</label>
                      <input
                        type="date"
                        value={formData.data_inicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Início</label>
                      <input
                        type="time"
                        value={formData.hora_inicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">KM Inicial</label>
                      <input
                        type="number"
                        value={formData.km_inicial}
                        onChange={(e) => handleKmChange('km_inicial', e.target.value)}
                        placeholder="Ex: 50200"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Conclusão de Entrega */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Conclusão da Entrega
                    </h4>
                    <button
                      type="button"
                      onClick={marcarConclusaoAgora}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Finalizar Agora
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Conclusão</label>
                      <input
                        type="date"
                        value={formData.data_conclusao}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_conclusao: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Conclusão</label>
                      <input
                        type="time"
                        value={formData.hora_conclusao}
                        onChange={(e) => setFormData(prev => ({ ...prev, hora_conclusao: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">KM Final</label>
                      <input
                        type="number"
                        value={formData.km_final}
                        onChange={(e) => handleKmChange('km_final', e.target.value)}
                        placeholder="Ex: 50245"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">KM Total Rodado</label>
                      <input
                        type="number"
                        disabled
                        value={formData.km_total}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ocorrências / Como foi a Entrega
                    </label>
                    <select
                      value={formData.como_foi_entrega}
                      onChange={(e) => setFormData(prev => ({ ...prev, como_foi_entrega: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {OCORRENCIAS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} className={o.color}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-4 mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
              
              {/* Left Actions: Print & Delete */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrintRomaneio}
                  className="px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 flex-1 sm:flex-none cursor-pointer"
                  title="Imprimir Romaneio de Carga Oficial"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Romaneio</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadRomaneio}
                  className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer"
                  title="Baixar Romaneio em PDF"
                >
                  <Download className="w-4 h-4" />
                </button>

                {isEditing && !isMotorista && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors text-center flex items-center justify-center shadow-xs cursor-pointer" 
                    title="Excluir Entrega"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right Actions: Concluir & Salvar */}
              <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={toggleConcluir}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      isConcluido 
                        ? 'text-green-800 bg-green-100 hover:bg-green-200 border border-green-300' 
                        : 'text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isConcluido ? 'Entrega Concluída' : 'Marcar Concluída'}</span>
                  </button>
                )}

                <button 
                  type="button" 
                  onClick={() => setDeliveryModalOpen(false)} 
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Cancelar
                </button>
                
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Entrega'}</span>
                </button>
              </div>

            </div>

          </form>
        </div>
      </div>

      {/* Map Picker Modal */}
      <MapPickerModal
        isOpen={mapPickerOpen}
        initialAddress={formData.endereco}
        onConfirmAddress={(addr) => setFormData(prev => ({ ...prev, endereco: addr }))}
        onClose={() => setMapPickerOpen(false)}
      />

      {/* Quick Create Material Modal */}
      <QuickCreateMaterialModal
        isOpen={quickMaterialModalOpen}
        initialName={quickMaterialInitialName}
        onClose={() => {
          setQuickMaterialModalOpen(false);
          setTargetItemIndexForNewMaterial(null);
        }}
        onMaterialCreated={handleQuickMaterialCreated}
      />
    </>
  );
}
