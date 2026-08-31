import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Check, X, Building, Search, Sparkles } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function SellersManagement() {
  const { showConfirm, addToast } = useLogistics();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    unidade: 'Matriz',
    ativo: true,
  });

  const loadSellers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSellers();
      setSellers(data);
    } catch (err) {
      console.error('Erro ao buscar vendedores:', err);
      addToast('Erro ao buscar vendedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleOpenNew = () => {
    setEditingSeller(null);
    setFormData({ nome: '', unidade: 'Matriz', ativo: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (seller) => {
    setEditingSeller(seller);
    setFormData({
      nome: seller.nome,
      unidade: seller.unidade,
      ativo: seller.ativo,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      addToast('Informe o nome do vendedor', 'warning');
      return;
    }

    try {
      if (editingSeller) {
        await adminService.updateSeller(editingSeller.id, formData);
        addToast('Vendedor atualizado com sucesso!', 'success');
      } else {
        await adminService.createSeller(formData);
        addToast('Vendedor cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      loadSellers();
    } catch (err) {
      console.error('Erro ao salvar vendedor:', err);
      addToast('Erro ao salvar vendedor', 'error');
    }
  };

  const handleDelete = (seller) => {
    showConfirm({
      title: 'Excluir Vendedor',
      message: `Tem certeza que deseja excluir o vendedor ${seller.nome}?`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminService.deleteSeller(seller.id);
          addToast('Vendedor excluído com sucesso!', 'success');
          loadSellers();
        } catch (err) {
          console.error('Erro ao excluir vendedor:', err);
          addToast('Erro ao excluir vendedor', 'error');
        }
      },
    });
  };

  const filtered = sellers.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.unidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex flex-col font-inter shadow-xs">
      {/* Header Bar */}
      <div className="p-4 border-b border-grid-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-surface-container-high text-secondary border border-grid-line shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-on-surface">
              Equipe Comercial (Vendedores)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Gerencie os vendedores cadastrados para apropriação e KPIs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar vendedor..."
              className="pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-grid-line text-on-surface placeholder:text-on-surface-variant/40 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Vendedor</span>
          </button>
        </div>
      </div>

      {/* Sellers List Table */}
      <div className="border-t border-grid-line overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-grid-line bg-surface-container-lowest/90 backdrop-blur-xs text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">NOME DO VENDEDOR</th>
              <th className="py-2.5 px-4">UNIDADE</th>
              <th className="py-2.5 px-4 text-center">STATUS</th>
              <th className="py-2.5 px-4 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line text-on-surface">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-on-surface-variant">
                  Carregando vendedores...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-on-surface-variant">
                  Nenhum vendedor encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((seller) => (
                <tr key={seller.id} className="border-b border-grid-line hover:bg-primary-container/5 transition-colors group">
                  <td className="py-2.5 px-4 font-semibold text-on-surface">
                    {seller.nome}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-highest border border-grid-line text-on-surface">
                      {seller.unidade}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      seller.ativo
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {seller.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(seller)}
                        className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                        title="Editar Vendedor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(seller)}
                        className="p-1 rounded text-on-surface-variant hover:text-rose-400 hover:bg-surface-container-high transition-colors"
                        title="Excluir Vendedor"
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

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-deep/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-5 rounded-lg bg-surface-container border border-grid-line shadow-2xl flex flex-col gap-4 font-inter text-on-surface">
            <div className="flex items-center justify-between border-b border-grid-line pb-3">
              <h3 className="text-sm font-bold text-on-surface">
                {editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface-variant">Nome do Vendedor *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                  placeholder="Ex: MARCOS"
                  className="px-3 py-2 bg-surface border border-grid-line rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface-variant">Unidade de Lotação</label>
                <select
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  className="px-3 py-2 bg-surface border border-grid-line rounded-lg text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium cursor-pointer"
                >
                  <option value="Matriz" className="bg-surface">Matriz (Mossoró)</option>
                  <option value="Filial" className="bg-surface">Filial (Mossoró)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vendedorAtivo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded bg-surface border-grid-line text-primary focus:ring-0"
                />
                <label htmlFor="vendedorAtivo" className="text-xs text-on-surface-variant hover:text-on-surface cursor-pointer">
                  Vendedor Ativo na Operação
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-grid-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-high border border-grid-line transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary-container hover:bg-primary text-on-primary-container transition-colors"
                >
                  Salvar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
