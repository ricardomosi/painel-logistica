import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Check, X, DollarSign, Scale, Hash } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function MaterialsManagement() {
  const { showConfirm, addToast } = useLogistics();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    unidade: 'UN',
    peso_padrao_kg: 0,
    valor_padrao: 0,
  });

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMaterials();
      setMaterials(data);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar catálogo de materiais', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleEdit = (material) => {
    setEditingId(material.id);
    setFormData({
      codigo: material.codigo,
      nome: material.nome,
      unidade: material.unidade || 'UN',
      peso_padrao_kg: material.peso_padrao_kg || 0,
      valor_padrao: material.valor_padrao || 0,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ codigo: '', nome: '', unidade: 'UN', peso_padrao_kg: 0, valor_padrao: 0 });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nome.trim()) {
      addToast('Informe o código e o nome do material.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await adminService.updateMaterial(editingId, formData);
        addToast('Material atualizado!');
      } else {
        await adminService.createMaterial(formData);
        addToast('Material adicionado ao catálogo!');
      }
      handleCancel();
      loadMaterials();
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar material', 'error');
    }
  };

  const handleDelete = (material) => {
    showConfirm({
      title: 'Excluir Material',
      message: `Deseja realmente remover o material "${material.nome}" (${material.codigo})?`,
      confirmText: 'Excluir',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminService.deleteMaterial(material.id);
          addToast('Material excluído do catálogo.');
          loadMaterials();
        } catch (err) {
          console.error(err);
          addToast('Erro ao excluir material.', 'error');
        }
      },
    });
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Catálogo de Materiais & Romaneios</h3>
            <p className="text-xs text-slate-400">Cadastre produtos, pesos padrão e valores para preenchimento ágil de Romaneios</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-4">
        <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          {editingId ? 'Editar Material' : 'Adicionar Novo Material'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Código do Material *</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ex: MET-001"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs text-slate-300">Nome / Descrição do Material *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Barra de Alumínio Extrudado 6m"
              className="px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Unidade</label>
            <select
              value={formData.unidade}
              onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
              className="px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
            >
              <option value="UN" className="bg-slate-900">UN (Unidade)</option>
              <option value="KG" className="bg-slate-900">KG (Quilograma)</option>
              <option value="M" className="bg-slate-900">M (Metros)</option>
              <option value="PC" className="bg-slate-900">PÇ (Peça)</option>
              <option value="CX" className="bg-slate-900">CX (Caixa)</option>
              <option value="FD" className="bg-slate-900">FD (Fardo)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Peso Padrão (kg)</label>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.peso_padrao_kg}
                onChange={(e) => setFormData({ ...formData, peso_padrao_kg: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Valor Unitário Padrão (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_padrao}
                onChange={(e) => setFormData({ ...formData, valor_padrao: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs font-mono text-emerald-400 font-bold"
              />
            </div>
          </div>

          <div className="flex items-end justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl glass-btn-primary text-xs font-bold"
            >
              {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingId ? 'Salvar Edição' : 'Cadastrar Material'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Materials Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Descrição do Material</th>
              <th className="p-3 text-center">Unidade</th>
              <th className="p-3 text-right">Peso Unitário</th>
              <th className="p-3 text-right">Preço Padrão</th>
              <th className="p-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {materials.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  {loading ? 'Carregando...' : 'Nenhum material cadastrado'}
                </td>
              </tr>
            ) : (
              materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-cyan-300">
                    {mat.codigo}
                  </td>
                  <td className="p-3 font-semibold text-white">
                    {mat.nome}
                  </td>
                  <td className="p-3 text-center font-mono text-slate-400">
                    {mat.unidade || 'UN'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">
                    {Number(mat.peso_padrao_kg || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    R$ {Number(mat.valor_padrao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(mat)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(mat)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10"
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

    </div>
  );
}
