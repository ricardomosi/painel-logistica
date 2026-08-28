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
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 text-white shadow-xl flex flex-col gap-6 font-inter">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Quadro de Vendedores (Equipe Comercial)
            </h2>
            <p className="text-xs text-slate-400">
              Gerencie os vendedores cadastrados para apropriação e KPIs de vendas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar vendedor..."
              className="pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-blue-500 outline-none w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Vendedor</span>
          </button>
        </div>
      </div>

      {/* Sellers List Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3.5">Nome do Vendedor</th>
              <th className="p-3.5">Unidade</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  Carregando vendedores...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  Nenhum vendedor encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((seller) => (
                <tr key={seller.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5 font-semibold text-white">
                    {seller.nome}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      seller.unidade === 'Matriz'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {seller.unidade}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      seller.ativo
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700/40 text-slate-400 border border-slate-600/40'
                    }`}>
                      {seller.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(seller)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-colors"
                        title="Editar Vendedor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(seller)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col gap-4 font-inter text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Nome do Vendedor</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                  placeholder="Ex: MARCOS"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold text-slate-900"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Unidade de Lotação</label>
                <select
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-semibold cursor-pointer text-slate-900 bg-white"
                >
                  <option value="Matriz">Matriz (Mossoró)</option>
                  <option value="Filial">Filial (Mossoró)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vendedorAtivo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="vendedorAtivo" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Vendedor Ativo na Operação
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
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
