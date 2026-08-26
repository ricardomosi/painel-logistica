import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  Save, 
  Package, 
  Building2, 
  User, 
  Truck, 
  DollarSign, 
  Scale, 
  Layers 
} from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';
import { romaneioService } from '../../services/romaneioService';
import { downloadRomaneioPdf, printRomaneioPdf } from './RomaneioPdfDocument';
import MaterialSearchInput from '../forms/MaterialSearchInput';

export default function RomaneioModal() {
  const { 
    romaneioModalOpen, 
    setRomaneioModalOpen, 
    selectedRomaneioDelivery, 
    materials, 
    addToast 
  } = useLogistics();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [romaneioData, setRomaneioData] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [items, setItems] = useState([]);

  // Load existing romaneio data for the selected delivery
  useEffect(() => {
    async function fetchRomaneio() {
      if (!selectedRomaneioDelivery?.id) return;
      try {
        setLoading(true);
        const data = await romaneioService.getByDeliveryId(selectedRomaneioDelivery.id);
        if (data) {
          setRomaneioData(data);
          setObservacoes(data.observacoes || '');
          setItems(data.itens || []);
        } else {
          setRomaneioData(null);
          setObservacoes('');
          // Initialize with 1 default row
          setItems([
            {
              id: 'temp-1',
              material_id: '',
              codigo_material: '',
              nome_material: '',
              quantidade: 1,
              peso_unitario_kg: 0,
              peso_total_kg: 0,
              valor_unitario: 0,
              valor_total: 0,
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching romaneio:', err);
      } finally {
        setLoading(false);
      }
    }

    if (romaneioModalOpen && selectedRomaneioDelivery) {
      fetchRomaneio();
    }
  }, [romaneioModalOpen, selectedRomaneioDelivery]);

  if (!romaneioModalOpen || !selectedRomaneioDelivery) return null;

  // Handle Material selection from catalog autocomplete
  const handleMaterialSelectRow = (index, material) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const qty = parseFloat(item.quantidade) || 1;

      item.material_id = material.id || null;
      item.codigo_material = material.codigo || '';
      item.nome_material = material.nome || '';
      item.unidade = material.unidade || 'UN';
      item.peso_unitario_kg = Number(material.peso_padrao_kg) || 0;
      item.valor_unitario = Number(material.preco_trazer) || Number(material.preco_sugerido) || Number(material.valor_padrao) || 0;
      item.peso_total_kg = Number((qty * item.peso_unitario_kg).toFixed(2));
      item.valor_total = Number((qty * item.valor_unitario).toFixed(2));

      updated[index] = item;
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      const qty = parseFloat(item.quantidade) || 0;
      const unitWeight = parseFloat(item.peso_unitario_kg) || 0;
      const unitPrice = parseFloat(item.valor_unitario) || 0;

      item.peso_total_kg = Number((qty * unitWeight).toFixed(2));
      item.valor_total = Number((qty * unitPrice).toFixed(2));

      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
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

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      addToast('O romaneio deve conter pelo menos 1 item.', 'warning');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validItems = items.filter(it => it.nome_material.trim() || it.codigo_material.trim());
    if (validItems.length === 0) {
      addToast('Preencha ao menos a descrição de 1 material.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const saved = await romaneioService.saveRomaneio(selectedRomaneioDelivery.id, {
        observacoes,
        itens: validItems,
      });
      setRomaneioData(saved);
      addToast('Romaneio salvo com sucesso!');
    } catch (err) {
      console.error('Error saving romaneio:', err);
      addToast('Erro ao salvar romaneio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    downloadRomaneioPdf({
      delivery: selectedRomaneioDelivery,
      romaneio: romaneioData,
      items,
    });
    addToast('Romaneio PDF gerado com sucesso!');
  };

  const handlePrintPdf = () => {
    printRomaneioPdf({
      delivery: selectedRomaneioDelivery,
      romaneio: romaneioData,
      items,
    });
  };

  // Grand Totals Calculation
  const grandTotalQtd = items.reduce((acc, it) => acc + (parseFloat(it.quantidade) || 0), 0);
  const grandTotalWeight = items.reduce((acc, it) => acc + (parseFloat(it.peso_total_kg) || 0), 0);
  const grandTotalValue = items.reduce((acc, it) => acc + (parseFloat(it.valor_total) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl my-6 overflow-hidden rounded-3xl glass-panel border border-cyan-500/40 shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Romaneio & Packing List de Carga
                </h3>
                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Nº {romaneioData?.numero_romaneio ? String(romaneioData.numero_romaneio).padStart(6, '0') : 'AUTOMÁTICO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cliente: <span className="text-white font-semibold">{selectedRomaneioDelivery.cliente}</span> • Destino: {selectedRomaneioDelivery.endereco}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              title="Imprimir Romaneio"
              className="p-2 rounded-xl glass-btn-secondary text-slate-200 hover:text-white"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={() => setRomaneioModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METADATA SUMMARY BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black/40 border-b border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Local: <strong className="text-white">{selectedRomaneioDelivery.local_carregamento || 'MATRIZ'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Placa: <strong className="text-white">{selectedRomaneioDelivery.placa || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Motorista: <strong className="text-white">{selectedRomaneioDelivery.motorista?.nome || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Valor Pedido: <strong className="text-emerald-400">R$ {Number(grandTotalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Itens e Materiais Carregados</span>
            </h4>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Material</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3 min-w-[240px]">Material / Descrição (Catálogo SAGI)</th>
                  <th className="p-3 w-20 text-center">Qtd</th>
                  <th className="p-3 w-16 text-center">Unid</th>
                  <th className="p-3 w-28 text-right">Peso Unit (kg)</th>
                  <th className="p-3 w-28 text-right">Peso Total (kg)</th>
                  <th className="p-3 w-28 text-right">Preço Unit (R$)</th>
                  <th className="p-3 w-28 text-right">Preço Total (R$)</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-mono font-bold">
                      {index + 1}
                    </td>

                    {/* Catalog Autocomplete Search Input */}
                    <td className="p-2.5">
                      <MaterialSearchInput
                        value={item.nome_material || ''}
                        selectedMaterialId={item.material_id}
                        codigoMaterial={item.codigo_material}
                        unidade={item.unidade}
                        type="trazer"
                        onSelect={(mat) => handleMaterialSelectRow(index, mat)}
                        onChangeText={(text) => handleItemChange(index, 'nome_material', text)}
                        placeholder="Buscar no catálogo SAGI..."
                      />
                    </td>

                    {/* Quantity */}
                    <td className="p-2.5 text-center">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg glass-input text-xs text-center font-mono font-bold"
                      />
                    </td>

                    {/* Unidade */}
                    <td className="p-2.5 text-center">
                      <select
                        value={item.unidade || 'UN'}
                        onChange={(e) => handleItemChange(index, 'unidade', e.target.value)}
                        className="w-16 px-1 py-1.5 rounded-lg glass-input text-[11px] font-bold cursor-pointer bg-slate-900 text-white"
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
                      </select>
                    </td>

                    {/* Unit Weight */}
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.peso_unitario_kg}
                        onChange={(e) => handleItemChange(index, 'peso_unitario_kg', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg glass-input text-xs text-right font-mono"
                      />
                    </td>

                    {/* Total Weight (calculated) */}
                    <td className="p-2.5 text-right font-mono font-bold text-cyan-300">
                      {Number(item.peso_total_kg || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                    </td>

                    {/* Unit Price */}
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.valor_unitario}
                        onChange={(e) => handleItemChange(index, 'valor_unitario', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg glass-input text-xs text-right font-mono"
                      />
                    </td>

                    {/* Total Price (calculated) */}
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                      R$ {Number(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Delete Item */}
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        title="Remover linha"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observations */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Observações Adicionais do Romaneio
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções de descarregamento, condições do material, etc."
              className="px-3.5 py-2 rounded-xl glass-input text-xs"
            />
          </div>
        </div>

        {/* FOOTER TOTALS & SAVE ACTION */}
        <div className="p-4 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Peso Total: <strong className="text-white text-sm font-mono">{grandTotalWeight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Valor Total: <strong className="text-emerald-400 text-sm font-mono">R$ {grandTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRomaneioModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl glass-btn-primary text-xs font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando...' : 'Salvar Romaneio'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
