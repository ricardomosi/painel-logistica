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
  AlertCircle,
  Phone,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Info,
  Check,
  Flame
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

const UNIDADES_MEDIDA = [
  { value: 'UN', label: 'UN (Unidade)' },
  { value: 'MT', label: 'MT (Metro Linear)' },
  { value: 'KG', label: 'KG (Quilograma)' },
  { value: 'TN', label: 'TN (Tonelada)' },
  { value: 'LT', label: 'LT (Litro)' },
  { value: 'PR', label: 'PR (Par)' },
  { value: 'M2', label: 'M² (Metro Quadrado)' },
  { value: 'M3', label: 'M³ (Metro Cúbico)' },
  { value: 'PCT', label: 'PCT (Pacote)' },
  { value: 'CX', label: 'CX (Caixa)' },
  { value: 'BARRA', label: 'BARRA' },
  { value: 'ROLO', label: 'ROLO' },
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
    drivers,
    vehicles,
    showConfirm,
    showAlert,
    addToast
  } = useLogistics();

  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('geral'); // 'geral' | 'romaneio' | 'rota'
  const [saving, setSaving] = useState(false);
  const [loadingRomaneio, setLoadingRomaneio] = useState(false);
  
  // Quick Create Modal state
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
    urgente: false,
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

  // Quick-Add Material Form State (Top Bar in Romaneio Tab)
  const [quickItem, setQuickItem] = useState({
    material_id: null,
    codigo_material: '',
    nome_material: '',
    unidade: 'UN',
    quantidade: 1,
    peso_unitario_kg: '',
    peso_total_kg: '',
    valor_unitario: '',
    valor_total: '',
  });

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
        urgente: !!selectedDelivery.urgente,
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
        urgente: false,
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
      setRomaneioItens([]);
    }

    // Reset Quick-Add input
    resetQuickItem();
  }, [selectedDelivery, deliveryModalOpen]);

  if (!deliveryModalOpen) return null;

  const resetQuickItem = () => {
    setQuickItem({
      material_id: null,
      codigo_material: '',
      nome_material: '',
      unidade: 'UN',
      quantidade: 1,
      peso_unitario_kg: '',
      peso_total_kg: '',
      valor_unitario: '',
      valor_total: '',
    });
  };

  // ============================================================================
  // QUICK-ADD BAR LOGIC (Top of Romaneio Tab)
  // ============================================================================
  const handleSelectQuickMaterial = (material) => {
    const unit = material.unidade || 'UN';
    const qtd = parseFloat(quickItem.quantidade) || 1;
    
    // Weight calculation
    let pUnit = Number(material.peso_padrao_kg) || 0;
    if (unit === 'KG' && pUnit === 0) {
      pUnit = 1; // Default 1 kg per kg
    }
    
    const vUnit = Number(material.preco_trazer) || Number(material.preco_sugerido) || Number(material.valor_padrao) || 0;
    const pTotal = pUnit > 0 ? Number((qtd * pUnit).toFixed(2)) : '';
    const vTotal = vUnit > 0 ? Number((qtd * vUnit).toFixed(2)) : '';

    setQuickItem({
      material_id: material.id || null,
      codigo_material: material.codigo || '',
      nome_material: material.nome || '',
      unidade: unit,
      quantidade: qtd,
      peso_unitario_kg: pUnit > 0 ? pUnit : '',
      peso_total_kg: pTotal,
      valor_unitario: vUnit > 0 ? vUnit : '',
      valor_total: vTotal,
    });
  };

  const handleQuickItemFieldChange = (field, val) => {
    setQuickItem(prev => {
      const next = { ...prev, [field]: val };
      const qtd = parseFloat(next.quantidade) || 0;

      if (field === 'unidade') {
        if (val === 'KG') {
          if (!next.peso_unitario_kg || parseFloat(next.peso_unitario_kg) === 0) {
            next.peso_unitario_kg = 1;
          }
          next.peso_total_kg = qtd > 0 ? Number((qtd * (parseFloat(next.peso_unitario_kg) || 1)).toFixed(2)) : '';
        }
      } else if (field === 'quantidade') {
        const pUnit = parseFloat(next.peso_unitario_kg) || 0;
        const vUnit = parseFloat(next.valor_unitario) || 0;
        next.peso_total_kg = pUnit > 0 ? Number((qtd * pUnit).toFixed(2)) : (next.peso_total_kg || '');
        next.valor_total = vUnit > 0 ? Number((qtd * vUnit).toFixed(2)) : (next.valor_total || '');
      } else if (field === 'peso_unitario_kg') {
        const pUnit = parseFloat(val) || 0;
        next.peso_total_kg = pUnit > 0 && qtd > 0 ? Number((qtd * pUnit).toFixed(2)) : '';
      } else if (field === 'peso_total_kg') {
        const pTotal = parseFloat(val) || 0;
        if (qtd > 0 && pTotal > 0) {
          next.peso_unitario_kg = Number((pTotal / qtd).toFixed(4));
        }
      } else if (field === 'valor_unitario') {
        const vUnit = parseFloat(val) || 0;
        next.valor_total = vUnit > 0 && qtd > 0 ? Number((qtd * vUnit).toFixed(2)) : '';
      } else if (field === 'valor_total') {
        const vTotal = parseFloat(val) || 0;
        if (qtd > 0 && vTotal > 0) {
          next.valor_unitario = Number((vTotal / qtd).toFixed(4));
        }
      }

      return next;
    });
  };

  const handleInsertQuickItem = (e) => {
    if (e) e.preventDefault();

    if (!quickItem.nome_material.trim() && !quickItem.codigo_material.trim()) {
      showAlert({ 
        title: 'Material não especificado', 
        message: 'Busque um material no catálogo ou digite a descrição do item antes de adicionar ao romaneio.' 
      });
      return;
    }

    const qtd = parseFloat(quickItem.quantidade) || 1;
    const pUnit = parseFloat(quickItem.peso_unitario_kg) || 0;
    const pTotal = parseFloat(quickItem.peso_total_kg) || (qtd * pUnit) || 0;
    const vUnit = parseFloat(quickItem.valor_unitario) || 0;
    const vTotal = parseFloat(quickItem.valor_total) || (qtd * vUnit) || 0;

    const newItem = {
      id: 'item-' + Date.now() + Math.random().toString(36).substring(2, 6),
      material_id: quickItem.material_id || null,
      codigo_material: quickItem.codigo_material || '',
      nome_material: quickItem.nome_material.trim(),
      unidade: quickItem.unidade || 'UN',
      quantidade: qtd,
      peso_unitario_kg: pUnit,
      peso_total_kg: Number(pTotal.toFixed(2)),
      valor_unitario: vUnit,
      valor_total: Number(vTotal.toFixed(2)),
    };

    setRomaneioItens(prev => [...prev, newItem]);
    resetQuickItem();
    addToast('Item inserido no romaneio!', 'success');
  };

  // ============================================================================
  // TABLE ROW EDITING & ACTIONS
  // ============================================================================
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
      const unit = material.unidade || 'UN';

      let pUnit = Number(material.peso_padrao_kg) || 0;
      if (unit === 'KG' && pUnit === 0) {
        pUnit = 1;
      }

      row.material_id = material.id || null;
      row.codigo_material = material.codigo || '';
      row.nome_material = material.nome || '';
      row.unidade = unit;
      row.peso_unitario_kg = pUnit;
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
      const qtd = parseFloat(row.quantidade) || 0;

      if (field === 'unidade') {
        if (val === 'KG') {
          if (!row.peso_unitario_kg || parseFloat(row.peso_unitario_kg) === 0) {
            row.peso_unitario_kg = 1;
          }
          row.peso_total_kg = Number((qtd * (parseFloat(row.peso_unitario_kg) || 1)).toFixed(2));
        }
      } else if (field === 'quantidade') {
        const pUnit = parseFloat(row.peso_unitario_kg) || 0;
        const vUnit = parseFloat(row.valor_unitario) || 0;
        row.peso_total_kg = Number((qtd * pUnit).toFixed(2));
        row.valor_total = Number((qtd * vUnit).toFixed(2));
      } else if (field === 'peso_unitario_kg') {
        const pUnit = parseFloat(val) || 0;
        row.peso_total_kg = Number((qtd * pUnit).toFixed(2));
      } else if (field === 'peso_total_kg') {
        const pTotal = parseFloat(val) || 0;
        if (qtd > 0) {
          row.peso_unitario_kg = Number((pTotal / qtd).toFixed(4));
        }
      } else if (field === 'valor_unitario') {
        const vUnit = parseFloat(val) || 0;
        row.valor_total = Number((qtd * vUnit).toFixed(2));
      } else if (field === 'valor_total') {
        const vTotal = parseFloat(val) || 0;
        if (qtd > 0) {
          row.valor_unitario = Number((vTotal / qtd).toFixed(4));
        }
      }

      updated[idx] = row;
      return updated;
    });
  };

  const handleQuickMaterialCreated = (newMaterial) => {
    if (targetItemIndexForNewMaterial !== null && targetItemIndexForNewMaterial >= 0) {
      handleSelectMaterialRow(targetItemIndexForNewMaterial, newMaterial);
    } else {
      handleSelectQuickMaterial(newMaterial);
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
    if (!formData.cliente || !formData.cliente.trim()) {
      showAlert({ title: 'Campo obrigatório', message: 'O nome do cliente é obrigatório.' });
      return;
    }

    try {
      setSaving(true);

      // Sincroniza o valor_entrega com o total do romaneio se houver cálculo
      const finalValorEntrega = (!isMotorista && romaneioTotalValor > 0)
        ? romaneioTotalValor 
        : (parseFloat(formData.valor_entrega) || 0);

      const payload = {
        ...formData,
        cliente: formData.cliente?.trim() || '',
        endereco: formData.endereco?.trim() || '',
        placa: formData.placa?.trim() || null,
        boleto: formData.boleto?.trim() || null,
        vendedor: formData.vendedor?.trim() || null,
        local_carregamento: formData.local_carregamento || 'MATRIZ',
        cadastrador_entrega: formData.cadastrador_entrega?.trim() || null,
        telefone: formData.telefone?.trim() || null,
        como_foi_entrega: formData.como_foi_entrega?.trim() || null,
        motorista_id: formData.motorista_id || null,
        veiculo_id: formData.veiculo_id || null,
        valor_entrega: finalValorEntrega,
        frete: parseFloat(formData.frete) || 0,
        km_inicial: parseFloat(formData.km_inicial) || 0,
        km_final: parseFloat(formData.km_final) || 0,
        data_inicio: formData.data_inicio?.trim() || null,
        hora_inicio: formData.hora_inicio?.trim() || null,
        data_conclusao: formData.data_conclusao?.trim() || null,
        hora_conclusao: formData.hora_conclusao?.trim() || null,
      };
      delete payload.km_total; // Generated column in Postgres

      let savedDelivery;
      if (isEditing) {
        savedDelivery = await updateDelivery(selectedDelivery.id, payload);
      } else {
        savedDelivery = await createDelivery(payload);
      }

      // Salva itens do Romaneio vinculado apenas se não for motorista e houver romaneio definido
      if (!isMotorista && savedDelivery?.id && (romaneioItens?.length > 0 || romaneioObs)) {
        try {
          await romaneioService.saveRomaneio(savedDelivery.id, {
            observacoes: romaneioObs,
            itens: romaneioItens,
          });
        } catch (romErr) {
          console.warn('Aviso: romaneio não pôde ser salvo sincronizado:', romErr);
        }
      }

      addToast(isEditing ? 'Entrega atualizada com sucesso!' : 'Entrega cadastrada com sucesso!', 'success');
      setDeliveryModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar entrega:', err);
      showAlert({ 
        title: 'Erro', 
        message: `Erro ao salvar entrega: ${err?.message || 'Verifique sua conexão e tente novamente'}`, 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const isConcluido = formData.status === 'concluido';

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 transition-opacity p-2 sm:p-4 md:p-6 font-inter animate-in fade-in duration-200">
        
        {/* Modal Container: Expanded width to fully leverage wide screens */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] xl:max-w-[1400px] 2xl:max-w-[1550px] max-h-[94vh] flex flex-col overflow-hidden border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex justify-between items-center px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {isEditing ? `Entrega #${String(selectedDelivery.id).padStart(4, '0')} - ${formData.cliente}` : 'Nova Entrega com Romaneio'}
                  </h3>
                  {isConcluido && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Concluída
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {isMotorista 
                    ? 'Visualize dados de entrega, trace rotas e registre a execução do transporte'
                    : 'Gerencie os dados logísticos de transporte e a lista oficial de materiais do Romaneio de Carga'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isMotorista && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgente: !prev.urgente }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    formData.urgente 
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs' 
                      : 'bg-white text-slate-600 border-slate-300 hover:border-red-300 hover:text-red-600'
                  }`}
                  title="Marcar entrega como urgente para ficar sempre no topo"
                >
                  <Flame className={`w-3.5 h-3.5 ${formData.urgente ? 'fill-white' : 'text-red-500'}`} />
                  <span>{formData.urgente ? 'URGENTE' : 'Marcar Urgente'}</span>
                </button>
              )}

              <button 
                type="button" 
                onClick={() => setDeliveryModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subtabs Selector Bar */}
          <div className="flex items-center justify-between gap-2 px-5 sm:px-6 py-2 bg-white border-b border-slate-200 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('geral')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'geral'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>1. Dados da Entrega</span>
              </button>

              {!isMotorista && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab('romaneio')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                    activeSubTab === 'romaneio'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  <span>2. Romaneio & Carga</span>
                  {romaneioItens.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeSubTab === 'romaneio' ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                    }`}>
                      {romaneioItens.length}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSubTab('rota')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'rota'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Gauge className="w-3.5 h-3.5 shrink-0" />
                <span>{isMotorista ? '2. Rota & Execução' : '3. Rota & Execução'}</span>
              </button>
            </div>

            {/* Print & Download Romaneio Buttons inside Subtab Bar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDownloadRomaneio}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                title="Baixar Romaneio de Carga em PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Baixar Romaneio</span>
              </button>

              <button
                type="button"
                onClick={handlePrintRomaneio}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                title="Imprimir Romaneio de Carga"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Main Form Content Area */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 custom-scrollbar">
            
            {/* ======================================================== */}
            {/* TAB 1: DADOS GERAIS DA ENTREGA (3 Organized Cards)       */}
            {/* ======================================================== */}
            {activeSubTab === 'geral' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Card 1: Destinatário & Localização */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Destinatário & Localização</h4>
                    </div>

                    {/* Cliente */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cliente / Destinatário *
                      </label>
                      <input 
                        type="text" 
                        required
                        disabled={isMotorista}
                        value={formData.cliente}
                        onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                        placeholder="Nome do cliente ou empresa destinatária" 
                        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-semibold ${isMotorista ? 'bg-slate-100 text-slate-800' : 'bg-white'}`}
                      />
                    </div>

                    {/* Telefone */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Telefone / Contato
                        </label>
                        {formData.telefone && (
                          <a 
                            href={`tel:${formData.telefone.replace(/\D/g, '')}`}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
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
                        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs ${isMotorista ? 'bg-slate-100 text-slate-800' : 'bg-white'}`}
                      />
                    </div>

                    {/* Endereço */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Endereço de Entrega
                        </label>
                        <div className="flex items-center gap-2">
                          {formData.endereco && (
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formData.endereco)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Rota
                            </a>
                          )}
                          {!isMotorista && (
                            <button 
                              type="button" 
                              onClick={() => setMapPickerOpen(true)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <MapPin className="w-3 h-3" />
                              Mapa
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea 
                        rows={2}
                        disabled={isMotorista}
                        value={formData.endereco}
                        onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        placeholder="Rua, Número, Bairro, Cidade - UF" 
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs ${isMotorista ? 'bg-slate-100 text-slate-800 font-medium' : 'bg-white'}`}
                      />
                    </div>
                  </div>

                  {/* Card 2: Logística & Transporte */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2.5">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Logística & Transporte</h4>
                    </div>

                    {/* Placa / Motorista */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Placa do Veículo / Motorista
                      </label>
                      {isMotorista ? (
                        <input 
                          type="text"
                          disabled
                          value={formData.placa || 'Sem veículo definido'}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold"
                        />
                      ) : (
                        <select 
                          value={formData.placa}
                          onChange={(e) => handlePlacaChange(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-semibold bg-white cursor-pointer"
                        >
                          <option value="">Selecione o veículo...</option>
                          {PLACAS_OPTIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Local de Saída */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Local de Carregamento
                      </label>
                      {isMotorista ? (
                        <input 
                          type="text"
                          disabled
                          value={formData.local_carregamento || 'MATRIZ'}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold"
                        />
                      ) : (
                        <select 
                          value={formData.local_carregamento}
                          onChange={(e) => setFormData(prev => ({ ...prev, local_carregamento: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold bg-white cursor-pointer"
                        >
                          <option value="MATRIZ">MATRIZ (Mossoró/RN)</option>
                          <option value="FILIAL">FILIAL (Mossoró/RN)</option>
                        </select>
                      )}
                    </div>

                    {/* Quem Cadastrou */}
                    {!isMotorista && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Quem Cadastrou (Gestor)
                        </label>
                        <select 
                          value={formData.cadastrador_entrega}
                          onChange={(e) => setFormData(prev => ({ ...prev, cadastrador_entrega: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-semibold bg-white cursor-pointer"
                        >
                          <option value="">Selecione o responsável...</option>
                          {CADASTRADORES_ENTREGA.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Faturamento & Frete */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2.5">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Faturamento & Vendas</h4>
                    </div>

                    {/* Boleto / NF */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Número do Boleto / NF / Pedido
                      </label>
                      <input 
                        type="text" 
                        disabled={isMotorista}
                        value={formData.boleto}
                        onChange={(e) => setFormData(prev => ({ ...prev, boleto: e.target.value }))}
                        placeholder="Ex: BOL-12345 / NF-890" 
                        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-mono ${isMotorista ? 'bg-slate-100 text-slate-800 font-bold' : 'bg-white'}`}
                      />
                    </div>

                    {/* Vendedor */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vendedor Responsável
                      </label>
                      {isMotorista ? (
                        <input 
                          type="text"
                          disabled
                          value={formData.vendedor || 'Vendedor N/D'}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold"
                        />
                      ) : (
                        <select 
                          value={formData.vendedor}
                          onChange={(e) => setFormData(prev => ({ ...prev, vendedor: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-bold bg-white cursor-pointer"
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

                    {/* Valor do Frete */}
                    {!isMotorista && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Valor do Frete Cobrado (R$)
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formData.frete}
                          onChange={(e) => setFormData(prev => ({ ...prev, frete: e.target.value }))}
                          placeholder="0,00" 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-mono font-bold bg-white" 
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: ROMANEIO DE CARGA EMBEDDED (HIGH-DENSITY & CLEAN) */}
            {/* ======================================================== */}
            {activeSubTab === 'romaneio' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                
                {/* 1. Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>{isMotorista ? 'Conferência de Carga do Romaneio' : 'Romaneio de Carga & Materiais'}</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isMotorista 
                        ? 'Confira os materiais físicos e quantidades desta entrega' 
                        : 'Adicione ou edite os materiais, pesos e valores que compõem esta carga'}
                    </p>
                  </div>

                  {!isMotorista && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickMaterialInitialName('');
                        setTargetItemIndexForNewMaterial(null);
                        setQuickMaterialModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cadastrar Material no Catálogo</span>
                    </button>
                  )}
                </div>

                {/* 2. DEDICATED QUICK-ADD MATERIAL INLINE BAR */}
                {!isMotorista && (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        Adicionar Item ao Romaneio
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Busque pelo código SAGI ou nome do material
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                      
                      {/* Material Search */}
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                          <span>Material / Descrição *</span>
                          {quickItem.codigo_material && (
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              Cód: {quickItem.codigo_material}
                            </span>
                          )}
                        </label>
                        <MaterialSearchInput
                          size="md"
                          value={quickItem.nome_material}
                          selectedMaterialId={quickItem.material_id}
                          codigoMaterial={quickItem.codigo_material}
                          unidade={quickItem.unidade}
                          type="trazer"
                          onSelect={handleSelectQuickMaterial}
                          onChangeText={(text) => setQuickItem(prev => ({ ...prev, nome_material: text }))}
                          onAddNewMaterial={(initialText) => {
                            setQuickMaterialInitialName(initialText);
                            setQuickMaterialModalOpen(true);
                          }}
                          placeholder="Digite o código (ex: TUB100) ou nome..."
                        />
                      </div>

                      {/* Quantidade */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 text-center">
                          Qtd *
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={quickItem.quantidade}
                          onChange={(e) => handleQuickItemFieldChange('quantidade', e.target.value)}
                          placeholder="1"
                          className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                        />
                      </div>

                      {/* Unidade */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 text-center">
                          Unid *
                        </label>
                        <select
                          value={quickItem.unidade}
                          onChange={(e) => handleQuickItemFieldChange('unidade', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-center"
                        >
                          {UNIDADES_MEDIDA.map(u => (
                            <option key={u.value} value={u.value}>{u.value}</option>
                          ))}
                        </select>
                      </div>

                      {/* Peso Unitário & Peso Total */}
                      <div className="md:col-span-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate" title={`Peso Unitário (kg/${quickItem.unidade})`}>
                            Peso Unit. (kg)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={quickItem.peso_unitario_kg}
                            onChange={(e) => handleQuickItemFieldChange('peso_unitario_kg', e.target.value)}
                            placeholder="0,00"
                            className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate" title="Peso Total (kg)">
                            Peso Total (kg)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={quickItem.peso_total_kg}
                            onChange={(e) => handleQuickItemFieldChange('peso_total_kg', e.target.value)}
                            placeholder="0,00"
                            className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none text-right"
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="md:col-span-12 lg:col-span-2">
                        <button
                          type="button"
                          onClick={handleInsertQuickItem}
                          className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer h-[34px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Inserir Item</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. TABELA DE ITENS DO ROMANEIO (Clean, High Density, Aligned) */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center text-slate-400 font-mono">#</th>
                        <th className="py-2.5 px-3 min-w-[280px]">Material / Descrição</th>
                        <th className="py-2.5 px-3 w-24 text-center">Quantidade</th>
                        <th className="py-2.5 px-3 w-20 text-center">Unidade</th>
                        <th className="py-2.5 px-3 w-28 text-right">Peso Unitário</th>
                        <th className="py-2.5 px-3 w-32 text-right">Peso Total (kg)</th>
                        {!isMotorista && <th className="py-2.5 px-3 w-28 text-right">Vlr Unit (R$)</th>}
                        {!isMotorista && <th className="py-2.5 px-3 w-32 text-right">Vlr Total (R$)</th>}
                        {!isMotorista && <th className="py-2.5 px-3 w-10 text-center"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {romaneioItens.length === 0 ? (
                        <tr>
                          <td colSpan={isMotorista ? 6 : 9} className="py-8 px-4 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <Package className="w-6 h-6 text-slate-300" />
                              <p className="font-semibold text-slate-600 text-xs">Nenhum material adicionado a esta carga ainda.</p>
                              {!isMotorista && (
                                <p className="text-[11px] text-slate-400 max-w-md">
                                  Utilize o campo de busca acima para pesquisar no catálogo SAGI e adicionar itens ao Romaneio.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        romaneioItens.map((item, idx) => {
                          const unit = item.unidade || 'UN';

                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                              {/* # Row Number */}
                              <td className="py-2 px-3 text-center text-slate-400 font-mono font-semibold text-xs">
                                {idx + 1}
                              </td>

                              {/* Material Description & Code */}
                              <td className="py-2 px-3">
                                {isMotorista ? (
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800 text-xs">
                                      {item.nome_material || item.codigo_material || 'Material sem descrição'}
                                    </span>
                                    {item.codigo_material && (
                                      <span className="text-[10px] font-mono text-slate-400">
                                        Cód: {item.codigo_material}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <MaterialSearchInput
                                        size="sm"
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
                                        placeholder="Digite o código ou nome..."
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Quantidade */}
                              <td className="py-2 px-3 text-center">
                                {isMotorista ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
                                    {item.quantidade}
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={item.quantidade}
                                    onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-xs text-center font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                                  />
                                )}
                              </td>

                              {/* Unidade */}
                              <td className="py-2 px-3 text-center">
                                {isMotorista ? (
                                  <span className="font-semibold text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                    {unit}
                                  </span>
                                ) : (
                                  <select
                                    value={unit}
                                    onChange={(e) => handleItemChange(idx, 'unidade', e.target.value)}
                                    className="w-16 px-1.5 py-1 rounded border border-slate-300 text-xs font-semibold bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer text-center"
                                  >
                                    {UNIDADES_MEDIDA.map(u => (
                                      <option key={u.value} value={u.value}>{u.value}</option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              {/* Peso Unitário */}
                              <td className="py-2 px-3 text-right">
                                {isMotorista ? (
                                  <span className="text-slate-600 font-mono text-xs">
                                    {(Number(item.peso_unitario_kg) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg/{unit}
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={item.peso_unitario_kg}
                                      onChange={(e) => handleItemChange(idx, 'peso_unitario_kg', e.target.value)}
                                      className="w-20 px-1.5 py-1 rounded border border-slate-300 text-xs text-right font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400 font-medium">/{unit}</span>
                                  </div>
                                )}
                              </td>

                              {/* Peso Total (kg) */}
                              <td className="py-2 px-3 text-right">
                                {isMotorista ? (
                                  <span className="font-mono font-semibold text-slate-800 text-xs">
                                    {(Number(item.peso_total_kg) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={item.peso_total_kg}
                                      onChange={(e) => handleItemChange(idx, 'peso_total_kg', e.target.value)}
                                      className="w-20 px-1.5 py-1 rounded border border-slate-300 text-xs text-right font-mono font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400 font-medium">kg</span>
                                  </div>
                                )}
                              </td>

                              {/* Valor Unitário (R$) */}
                              {!isMotorista && (
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-[10px] text-slate-400 font-medium">R$</span>
                                    <input
                                      type="number"
                                      step="any"
                                      value={item.valor_unitario}
                                      onChange={(e) => handleItemChange(idx, 'valor_unitario', e.target.value)}
                                      className="w-20 px-1.5 py-1 rounded border border-slate-300 text-xs text-right font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                  </div>
                                </td>
                              )}

                              {/* Valor Total (R$) */}
                              {!isMotorista && (
                                <td className="py-2 px-3 text-right">
                                  <span className="font-mono font-semibold text-slate-900 text-xs">
                                    R$ {(Number(item.valor_total) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </td>
                              )}

                              {/* Action: Delete */}
                              {!isMotorista && (
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Remover item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTALS RESUMO BAR (Clean, Legible, Cohesive) */}
                <div className={`grid grid-cols-1 ${isMotorista ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200`}>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Volume Total
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                        {romaneioTotalQtd.toLocaleString('pt-BR')} {romaneioTotalQtd === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Peso Bruto Total
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                        {romaneioTotalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                      </span>
                    </div>
                  </div>

                  {!isMotorista && (
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                          Valor Total da Carga
                        </span>
                        <span className="text-xs sm:text-sm font-bold font-mono text-emerald-700">
                          R$ {romaneioTotalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Observações do Romaneio */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Observações do Romaneio (Impressas no Documento PDF)</span>
                  </label>
                  {isMotorista ? (
                    <div className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 min-h-[40px]">
                      {romaneioObs || 'Nenhuma observação informada.'}
                    </div>
                  ) : (
                    <textarea
                      rows={2}
                      value={romaneioObs}
                      onChange={(e) => setRomaneioObs(e.target.value)}
                      placeholder="Ex: Entregar com nota fiscal anexa; conferir peso antes do descarregamento..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Início de Rota */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Início do Deslocamento
                      </h4>
                      <button
                        type="button"
                        onClick={marcarInicioAgora}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        Marcar Agora
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Data Início</label>
                        <input
                          type="date"
                          value={formData.data_inicio}
                          onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hora Início</label>
                        <input
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">KM Inicial</label>
                        <input
                          type="number"
                          value={formData.km_inicial}
                          onChange={(e) => handleKmChange('km_inicial', e.target.value)}
                          placeholder="Ex: 50200"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conclusão de Entrega */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Conclusão da Entrega
                      </h4>
                      <button
                        type="button"
                        onClick={marcarConclusaoAgora}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        Finalizar Agora
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Data Conclusão</label>
                        <input
                          type="date"
                          value={formData.data_conclusao}
                          onChange={(e) => setFormData(prev => ({ ...prev, data_conclusao: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hora Conclusão</label>
                        <input
                          type="time"
                          value={formData.hora_conclusao}
                          onChange={(e) => setFormData(prev => ({ ...prev, hora_conclusao: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">KM Final</label>
                        <input
                          type="number"
                          value={formData.km_final}
                          onChange={(e) => handleKmChange('km_final', e.target.value)}
                          placeholder="Ex: 50245"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* KM Total & Ocorrências */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">KM Total Rodado</label>
                    <input
                      type="number"
                      disabled
                      value={formData.km_total}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Relato de Ocorrência / Como foi a Entrega
                    </label>
                    <select
                      value={formData.como_foi_entrega || 'Sem ocorrências'}
                      onChange={(e) => setFormData(prev => ({ ...prev, como_foi_entrega: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold bg-white cursor-pointer"
                    >
                      {OCORRENCIAS_OPTIONS.map(oc => (
                        <option key={oc.value} value={oc.value} className={oc.color}>
                          {oc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-3 mt-4 flex flex-col sm:flex-row justify-between items-center gap-2.5 border-t border-slate-200">
              
              {/* Left Actions: Print, Download & Delete */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrintRomaneio}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 flex-1 sm:flex-none cursor-pointer"
                  title="Imprimir Romaneio de Carga Oficial"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Imprimir Romaneio</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadRomaneio}
                  className="p-2 text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                  title="Baixar Romaneio em PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {isEditing && !isMotorista && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="p-2 text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors text-center flex items-center justify-center shadow-2xs cursor-pointer" 
                    title="Excluir Entrega"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Right Actions: Concluir, Cancelar & Salvar */}
              <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={toggleConcluir}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
                      isConcluido 
                        ? 'text-green-800 bg-green-100 hover:bg-green-200 border border-green-300' 
                        : 'text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-300'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isConcluido ? 'Entrega Concluída' : 'Marcar Concluída'}</span>
                  </button>
                )}

                <button 
                  type="button" 
                  onClick={() => setDeliveryModalOpen(false)} 
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  Cancelar
                </button>
                
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
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
