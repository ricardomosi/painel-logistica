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

const UNIDADES_OPTIONS = [
  'UN',
  'KG',
  'MT',
  'TN',
  'LT',
  'PR',
  'M2',
  'M3',
  'PCT',
  'CX',
  'RL',
  'BR',
  'CJ'
];

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
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex flex-col font-inter shadow-xs">
      
      {/* Header Controls & Search */}
      <div className="p-4 border-b border-grid-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-on-surface font-semibold text-sm">Catálogo de Materiais</h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-data-mono font-medium bg-surface-container-lowest text-primary border border-grid-line">
                {totalCount.toLocaleString('pt-BR')} itens
              </span>
            </div>
            <p className="text-on-surface-variant text-xs">
              Gerencie produtos, pesos unitários padrão e preços por entrega (Trazer) e coleta (Buscar)
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nome ou categoria..."
            className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-surface border border-grid-line text-xs text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Form / Edit Section */}
      <form onSubmit={handleSave} className="p-4 border-b border-grid-line bg-surface-container-lowest/30 flex flex-col gap-3.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary font-label-caps flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            {editingId ? 'Editar Material do Catálogo' : 'Adicionar Novo Material'}
          </span>
          {editingId && (
            <span className="text-[11px] font-data-mono text-secondary">Editando ID: {editingId}</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Código SAGI */}
          <div className="lg:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Código (SAGI)</label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              placeholder="Ex: TUB100"
              className="bg-surface border border-grid-line text-primary font-data-mono font-bold text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Nome do Material */}
          <div className="lg:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Descrição / Nome do Material *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Tubo Galvanizado 100mm"
              className="bg-surface border border-grid-line text-on-surface text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Categoria */}
          <div className="lg:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Categoria</label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ex: Tubos"
              className="bg-surface border border-grid-line text-on-surface text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Unidade */}
          <div className="lg:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Unidade</label>
            <select
              value={formData.unidade}
              onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
              className="bg-surface border border-grid-line text-on-surface text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer font-data-mono"
            >
              {UNIDADES_OPTIONS.map((u) => (
                <option key={u} value={u} className="bg-surface">{u}</option>
              ))}
            </select>
          </div>

          {/* Peso Padrão */}
          <div className="lg:col-span-1 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Peso Padrão (kg)</label>
            <div className="relative">
              <Scale className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
              <input
                type="number"
                step="any"
                min="0"
                value={formData.peso_padrao_kg}
                onChange={(e) => setFormData({ ...formData, peso_padrao_kg: e.target.value })}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-surface border border-grid-line text-on-surface text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-data-mono"
              />
            </div>
          </div>

          {/* Preço de Entrega (Trazer) */}
          <div className="lg:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-primary flex items-center gap-1">
              <span>Preço Padrão de Entrega (Trazer) R$</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/70" />
              <input
                type="number"
                step="any"
                min="0"
                value={formData.preco_trazer}
                onChange={(e) => setFormData({ ...formData, preco_trazer: e.target.value })}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-surface border border-primary/40 text-primary font-bold text-xs rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-data-mono"
              />
            </div>
          </div>

          {/* Preço de Coleta (Buscar) */}
          <div className="lg:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span>Preço Padrão de Coleta (Buscar) R$</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400/70" />
              <input
                type="number"
                step="any"
                min="0"
                value={formData.preco_buscar}
                onChange={(e) => setFormData({ ...formData, preco_buscar: e.target.value })}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-surface border border-emerald-500/40 text-emerald-400 font-bold text-xs rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-data-mono"
              />
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div className="lg:col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Observações / Detalhes</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Especificações adicionais..."
              className="bg-surface border border-grid-line text-on-surface text-xs rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-grid-line/50">
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
            <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Material'}</span>
          </button>
        </div>
      </form>

      {/* Table Container */}
      <div className="border-t border-grid-line overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-grid-line bg-surface-container-lowest/70 text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4 w-24">CÓDIGO</th>
              <th className="py-2.5 px-4 min-w-[200px]">DESCRIÇÃO DO MATERIAL</th>
              <th className="py-2.5 px-4">CATEGORIA</th>
              <th className="py-2.5 px-4 text-center w-16">UNIDADE</th>
              <th className="py-2.5 px-4 text-right w-24">PESO UNIT.</th>
              <th className="py-2.5 px-4 text-right w-28">PREÇO ENTREGA</th>
              <th className="py-2.5 px-4 text-right w-28">PREÇO BUSCA</th>
              <th className="py-2.5 px-4 text-right w-20">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line text-on-surface">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Carregando materiais do catálogo...</span>
                  </div>
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                  Nenhum material encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              materials.map((mat) => (
                <tr key={mat.id} className="border-b border-grid-line hover:bg-primary-container/5 transition-colors group">
                  <td className="py-2.5 px-4 font-data-mono font-bold text-primary">
                    {mat.codigo || '-'}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-on-surface">
                    {mat.nome}
                  </td>
                  <td className="py-2.5 px-4 text-on-surface-variant text-[11px] truncate max-w-[180px]" title={mat.categoria}>
                    {mat.categoria || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-center font-data-mono font-medium text-on-surface">
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest border border-grid-line text-[10px]">
                      {mat.unidade || 'UN'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-data-mono text-on-surface-variant">
                    {Number(mat.peso_padrao_kg || 0) > 0 
                      ? `${Number(mat.peso_padrao_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`
                      : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-data-mono font-bold text-primary">
                    {Number(mat.preco_trazer || 0) > 0 
                      ? `R$ ${Number(mat.preco_trazer).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-data-mono font-bold text-emerald-400">
                    {Number(mat.preco_buscar || 0) > 0 
                      ? `R$ ${Number(mat.preco_buscar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(mat)}
                        className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                        title="Editar Material"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mat)}
                        className="p-1 rounded text-on-surface-variant hover:text-rose-400 hover:bg-surface-container-high transition-colors"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface-container-low/50 text-xs text-on-surface-variant">
        <div>
          Mostrando página <span className="text-on-surface font-bold">{currentPage}</span> de <span className="text-on-surface font-bold">{totalPages}</span> ({totalCount.toLocaleString('pt-BR')} registros)
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => loadMaterials(currentPage - 1, searchTerm)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high border border-grid-line hover:bg-surface-container-highest text-on-surface font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <span className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-grid-line font-data-mono font-bold text-primary">
            {currentPage}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || loading}
            onClick={() => loadMaterials(currentPage + 1, searchTerm)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high border border-grid-line hover:bg-surface-container-highest text-on-surface font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>Próxima</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
