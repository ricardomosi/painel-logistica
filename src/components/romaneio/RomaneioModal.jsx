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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto font-inter">
      <div 
        className="relative w-full max-w-5xl my-4 overflow-hidden rounded-lg bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[4px] bg-[#0081A7]/10 text-[#0081A7]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Romaneio & Packing List de Carga
                </h3>
                <span className="px-2 py-0.5 rounded-[3px] text-xs font-mono font-bold bg-[#0081A7]/10 text-[#0081A7] border border-[#0081A7]/20">
                  Nº {romaneioData?.numero_romaneio ? String(romaneioData.numero_romaneio).padStart(6, '0') : 'AUTOMÁTICO'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cliente: <span className="text-slate-800 font-semibold">{selectedRomaneioDelivery.cliente}</span> • Destino: {selectedRomaneioDelivery.endereco}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              title="Imprimir Romaneio"
              className="p-2 rounded-[4px] bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={() => setRomaneioModalOpen(false)}
              className="p-1.5 rounded-[4px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METADATA SUMMARY BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-50/50 border-b border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0081A7] shrink-0" />
            <span className="truncate">Local: <strong className="text-slate-800">{selectedRomaneioDelivery.local_carregamento || 'MATRIZ'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#0081A7] shrink-0" />
            <span className="truncate">Placa: <strong className="text-slate-800">{selectedRomaneioDelivery.placa || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#0081A7] shrink-0" />
            <span className="truncate">Motorista: <strong className="text-slate-800">{selectedRomaneioDelivery.motorista?.nome || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Valor Total: <strong className="text-emerald-700 font-mono">R$ {Number(grandTotalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0081A7]" />
              <span>Itens e Materiais Carregados</span>
            </h4>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#0081A7] hover:bg-[#006c8c] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Material</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-[4px] border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center text-slate-400 font-mono">#</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Material / Descrição</th>
                  <th className="py-2.5 px-3 w-20 text-center">Quant.</th>
                  <th className="py-2.5 px-3 w-16 text-center">Unid</th>
                  <th className="py-2.5 px-3 w-28 text-right">Peso Unit (kg)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Peso Total (kg)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Preço Unit (R$)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Preço Total (R$)</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono font-bold">
                      {index + 1}
                    </td>

                    {/* Material description read-only or search input when adding */}
                    <td className="py-2 px-2.5">
                      {item.nome_material ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">
                            {item.nome_material}
                          </span>
                          {item.codigo_material && (
                            <span className="text-[10px] font-mono text-slate-500">
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
                          onSelect={(mat) => handleMaterialSelectRow(index, mat)}
                          onChangeText={(text) => handleItemChange(index, 'nome_material', text)}
                          placeholder="Buscar no catálogo..."
                        />
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-2.5 text-center">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                        className="w-16 px-1.5 py-1 rounded-[3px] border border-slate-300 text-xs text-center font-mono font-bold outline-none focus:ring-1 focus:ring-[#0081A7]"
                      />
                    </td>

                    {/* Unidade */}
                    <td className="py-2 px-2.5 text-center">
                      <select
                        value={item.unidade || 'UN'}
                        onChange={(e) => handleItemChange(index, 'unidade', e.target.value)}
                        className="w-16 px-1 py-1 rounded-[3px] border border-slate-300 text-[11px] font-bold cursor-pointer bg-white text-slate-800 outline-none focus:ring-1 focus:ring-[#0081A7]"
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
                    <td className="py-2 px-2.5 text-right">
                      <input
                        type="number"
                        step="any"
                        value={item.peso_unitario_kg}
                        onChange={(e) => handleItemChange(index, 'peso_unitario_kg', e.target.value)}
                        className="w-20 px-1.5 py-1 rounded-[3px] border border-slate-300 text-xs text-right font-mono outline-none focus:ring-1 focus:ring-[#0081A7]"
                      />
                    </td>

                    {/* Total Weight */}
                    <td className="py-2 px-2.5 text-right font-mono font-semibold text-slate-800 text-xs">
                      {Number(item.peso_total_kg || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Unit Price */}
                    <td className="py-2 px-2.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => handleItemChange(index, 'valor_unitario', e.target.value)}
                        className="w-20 px-1.5 py-1 rounded-[3px] border border-slate-300 text-xs text-right font-mono outline-none focus:ring-1 focus:ring-[#0081A7]"
                      />
                    </td>

                    {/* Total Price */}
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700 text-xs">
                      {Number(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Delete Action */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 rounded-[3px] text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* OBSERVATIONS & NOTES */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações do Romaneio (Impressas no Documento PDF)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Entrega prioritária; conferir peças junto à nota fiscal..."
              className="w-full px-3 py-2 border border-slate-300 rounded-[4px] text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#0081A7] resize-none"
            />
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Volume Total:</span>
              <strong className="text-slate-800 text-sm font-mono">{grandTotalQtd} un</strong>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Peso Total:</span>
              <strong className="text-slate-800 text-sm font-mono">{grandTotalWeight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</strong>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Valor Total:</span>
              <strong className="text-emerald-700 text-sm font-mono">R$ {grandTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setRomaneioModalOpen(false)}
              className="px-4 py-2 rounded-[4px] bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-[4px] bg-[#0081A7] hover:bg-[#006c8c] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Romaneio'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
