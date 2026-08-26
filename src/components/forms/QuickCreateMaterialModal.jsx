import React, { useState } from 'react';
import { X, Plus, Package, Save, Scale, DollarSign } from 'lucide-react';
import { materialsService } from '../../services/materialsService';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function QuickCreateMaterialModal({
  isOpen,
  initialName = '',
  onClose,
  onMaterialCreated,
}) {
  const { addToast } = useLogistics();
  const [formData, setFormData] = useState({
    codigo: '',
    nome: initialName || '',
    unidade: 'UN',
    peso_padrao_kg: '',
    preco_trazer: '',
    preco_buscar: '',
    categoria: 'GERAL',
  });
  const [saving, setSaving] = useState(false);

  // Sync initial name
  React.useEffect(() => {
    if (initialName) {
      setFormData(prev => ({ ...prev, nome: initialName }));
    }
  }, [initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      addToast('Informe o nome ou descrição do material.', 'warning');
      return;
    }

    try {
      setSaving(true);
      const created = await materialsService.createMaterial(formData);
      addToast('Material cadastrado no catálogo com sucesso!', 'success');
      if (onMaterialCreated) {
        onMaterialCreated(created);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao cadastrar material:', err);
      addToast('Erro ao salvar material no catálogo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Cadastrar Novo Material</h3>
              <p className="text-[11px] text-slate-500">Adicione este item ao catálogo permanente de materiais</p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-inter">
          {/* Nome */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Descrição do Material *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: TUBO PEAD 110MM PN10"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
            />
          </div>

          {/* Código e Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Código (Opcional)</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                placeholder="Ex: TUB100"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Unidade Padrão *</label>
              <select
                value={formData.unidade}
                onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold cursor-pointer"
              >
                <option value="UN">UN (Unidade)</option>
                <option value="KG">KG (Quilograma)</option>
                <option value="MT">MT (Metro)</option>
                <option value="TN">TN (Tonelada)</option>
                <option value="LT">LT (Litro)</option>
                <option value="PR">PR (Par)</option>
                <option value="M2">M² (Metro Quadrado)</option>
                <option value="M3">M³ (Metro Cúbico)</option>
              </select>
            </div>
          </div>

          {/* Peso e Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Peso Unitário (KG)</label>
              <input
                type="number"
                step="0.001"
                value={formData.peso_padrao_kg}
                onChange={(e) => setFormData(prev => ({ ...prev, peso_padrao_kg: e.target.value }))}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoria</label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                placeholder="Ex: TUBULACOES"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Preços Diferenciados: Entrega vs Busca */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Preços Padrão por Modalidade (R$)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-700 mb-1">
                  Preço Trazer / Entrega
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco_trazer}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco_trazer: e.target.value }))}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-indigo-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                  Preço Buscar / Coleta
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco_buscar}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco_buscar: e.target.value }))}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-emerald-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-emerald-900"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar no Catálogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
