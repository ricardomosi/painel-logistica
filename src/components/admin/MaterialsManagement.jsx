import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  Scale, 
  Hash, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Package,
  ArrowDownUp
} from 'lucide-react';
import { materialsService } from '../../services/materialsService';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function MaterialsManagement() {
  const { showConfirm, addToast } = useLogistics();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Pagination & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    unidade: 'UN',
    peso_padrao_kg: 0,
    preco_trazer: 0,
    preco_buscar: 0,
    valor_padrao: 0,
    categoria: '',
  });

  const loadMaterials = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const res = await materialsService.getMaterials({
        page,
        pageSize,
        search,
      });
      setMaterials(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.page);
    } catch (err) {
      console.error('Erro ao carregar catálogo de materiais:', err);
      addToast('Erro ao carregar catálogo de materiais', 'error');
    } finally {
      setLoading(false);
    }
  }, [pageSize, addToast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMaterials(1, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, loadMaterials]);

  const handleEdit = (material) => {
    setEditingId(material.id);
    setFormData({
      codigo: material.codigo || '',
      nome: material.nome || '',
      unidade: material.unidade || 'UN',
      peso_padrao_kg: material.peso_padrao_kg || 0,
      preco_trazer: material.preco_trazer || 0,
      preco_buscar: material.preco_buscar || 0,
      valor_padrao: material.valor_padrao || material.preco_trazer || 0,
      categoria: material.categoria || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      codigo: '',
      nome: '',
      unidade: 'UN',
      peso_padrao_kg: 0,
      preco_trazer: 0,
      preco_buscar: 0,
      valor_padrao: 0,
      categoria: '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      addToast('Informe a descrição do material.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await materialsService.updateMaterial(editingId, formData);
        addToast('Material atualizado no catálogo!');
      } else {
        await materialsService.createMaterial(formData);
        addToast('Material adicionado ao catálogo!');
      }
      handleCancel();
      loadMaterials(currentPage, searchTerm);
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar material', 'error');
    }
  };

  const handleDelete = (material) => {
    showConfirm({
      title: 'Excluir Material',
      message: `Deseja realmente remover o material "${material.nome}" (${material.codigo || 'S/C'}) do catálogo?`,
      confirmText: 'Excluir',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await materialsService.deleteMaterial(material.id);
          addToast('Material excluído do catálogo.');
          loadMaterials(currentPage, searchTerm);
        } catch (err) {
          console.error(err);
          addToast('Erro ao excluir material.', 'error');
        }
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col gap-6 font-inter text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Catálogo de Materiais (SAGI & Entregas)</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {totalCount.toLocaleString('pt-BR')} itens
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gerencie produtos, pesos unitários padrão e preços diferenciados por Entrega (Trazer) e Coleta (Buscar)
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nome ou categoria..."
            className="w-full pl-9 pr-8 py-2 rounded-xl glass-input text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Form / Edit Section */}
      <form onSubmit={handleSave} className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            {editingId ? 'Editar Material do Catálogo' : 'Adicionar Novo Material'}
          </span>
          {editingId && (
            <span className="text-[11px] font-mono text-amber-400">Editando ID: {editingId}</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Código */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Código SAGI</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ex: ABD13"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Nome */}
          <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1">
            <label className="text-xs text-slate-300">Nome / Descrição do Material *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: ABRACADEIRA ACO INOX 6\"
              className="px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Unidade */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Unidade</label>
            <select
              value={formData.unidade}
              onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
              className="px-3 py-2 rounded-xl glass-input text-xs cursor-pointer bg-slate-900 text-white"
            >
              <option value="UN">UN (Unidade)</option>
              <option value="KG">KG (Quilograma)</option>
              <option value="MT">MT (Metro)</option>
              <option value="TN">TN (Tonelada)</option>
              <option value="LT">LT (Litro)</option>
              <option value="PR">PR (Par)</option>
              <option value="M2">M² (Metro Quadrado)</option>
              <option value="M3">M³ (Metro Cúbico)</option>
              <option value="PCT">PCT (Pacote)</option>
              <option value="CX">CX (Caixa)</option>
            </select>
          </div>

          {/* Peso Padrão */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Peso Unitário (kg)</label>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.peso_padrao_kg}
                onChange={(e) => setFormData({ ...formData, peso_padrao_kg: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Preços e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Preço Trazer / Entrega */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-indigo-300 font-bold">Preço Trazer / Entrega (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_trazer}
                onChange={(e) => setFormData({ ...formData, preco_trazer: e.target.value })}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-indigo-300"
              />
            </div>
          </div>

          {/* Preço Buscar / Coleta */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-emerald-300 font-bold">Preço Buscar / Coleta (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_buscar}
                onChange={(e) => setFormData({ ...formData, preco_buscar: e.target.value })}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-emerald-300"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Categoria</label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ex: ABRACADEIRAS / METAL"
              className="px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl glass-btn-primary text-xs font-bold cursor-pointer"
          >
            {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Material'}</span>
          </button>
        </div>
      </form>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3 w-24">Código</th>
              <th className="p-3 min-w-[200px]">Descrição do Material</th>
              <th className="p-3">Categoria</th>
              <th className="p-3 text-center w-16">Unidade</th>
              <th className="p-3 text-right w-24">Peso Unit.</th>
              <th className="p-3 text-right w-28">Preço Entrega</th>
              <th className="p-3 text-right w-28">Preço Busca</th>
              <th className="p-3 text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Carregando materiais do catálogo...</span>
                  </div>
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Nenhum material encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-cyan-300">
                    {mat.codigo || '-'}
                  </td>
                  <td className="p-3 font-semibold text-white">
                    {mat.nome}
                  </td>
                  <td className="p-3 text-slate-400 text-[11px] truncate max-w-[180px]" title={mat.categoria}>
                    {mat.categoria || '-'}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {mat.unidade || 'UN'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">
                    {Number(mat.peso_padrao_kg || 0) > 0 
                      ? `${Number(mat.peso_padrao_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`
                      : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-indigo-300">
                    {Number(mat.preco_trazer || 0) > 0 
                      ? `R$ ${Number(mat.preco_trazer).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-300">
                    {Number(mat.preco_buscar || 0) > 0 
                      ? `R$ ${Number(mat.preco_buscar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(mat)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-colors"
                        title="Editar Material"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mat)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10 transition-colors"
                        title="Excluir Material"
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

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-slate-400">
        <div>
          Mostrando página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span> ({totalCount.toLocaleString('pt-BR')} registros)
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => loadMaterials(currentPage - 1, searchTerm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-white/10 font-mono font-bold text-cyan-300">
            {currentPage}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || loading}
            onClick={() => loadMaterials(currentPage + 1, searchTerm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <span>Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
