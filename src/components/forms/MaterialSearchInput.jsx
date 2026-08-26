import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus, Check, Loader2, DollarSign, Scale, Tag, X } from 'lucide-react';
import { materialsService } from '../../services/materialsService';

export default function MaterialSearchInput({
  value = '',
  selectedMaterialId = null,
  codigoMaterial = '',
  unidade = 'UN',
  onSelect,
  onChangeText,
  onAddNewMaterial,
  type = 'trazer', // 'trazer' | 'buscar'
  placeholder = 'Buscar material no catálogo SAGI...',
  disabled = false,
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal query state with incoming value prop
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search debounced
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await materialsService.searchMaterials(query, { limit: 20, type });
        setResults(data);
      } catch (err) {
        console.error('Erro na pesquisa de materiais:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen, type]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    if (onChangeText) onChangeText(text);
    if (!isOpen) setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSelectMaterial = (material) => {
    setQuery(material.nome);
    setIsOpen(false);
    if (onSelect) {
      onSelect(material);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectMaterial(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setQuery('');
    if (onChangeText) onChangeText('');
    if (onSelect) {
      onSelect({
        id: null,
        codigo: '',
        nome: '',
        unidade: 'UN',
        peso_padrao_kg: 0,
        preco_trazer: 0,
        preco_buscar: 0,
        valor_padrao: 0,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field with Icons */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-8 pr-16 py-1.5 rounded-lg border text-xs font-semibold outline-none transition-all ${
            selectedMaterialId
              ? 'border-indigo-300 bg-indigo-50/40 text-indigo-950 focus:ring-2 focus:ring-indigo-500'
              : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
        />

        {/* Left Search Icon */}
        <div className="absolute left-2.5 text-slate-400 pointer-events-none flex items-center">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Right Badges / Clear */}
        <div className="absolute right-2 flex items-center gap-1">
          {codigoMaterial && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200" title={`Código SAGI: ${codigoMaterial}`}>
              {codigoMaterial}
            </span>
          )}
          
          {query && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Limpar seleção"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Popup */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Top Info Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              {results.length > 0 ? `${results.length} materiais encontrados` : 'Nenhum material encontrado'}
            </span>
            
            {onAddNewMaterial && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewMaterial(query);
                }}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Cadastrar novo
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 custom-scrollbar flex-1">
            {results.length === 0 && !loading ? (
              <div className="p-4 text-center">
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  Nenhum material cadastrado com "{query}"
                </p>
                <p className="text-[11px] text-slate-400">
                  Você pode usar esta descrição personalizada ou cadastrar um novo material.
                </p>
                {onAddNewMaterial && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewMaterial(query);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar "{query}" no Catálogo
                  </button>
                )}
              </div>
            ) : (
              results.map((mat, index) => {
                const isSelected = selectedIndex === index;
                const isCurrentItem = selectedMaterialId === mat.id;
                const precoExibicao = type === 'buscar' 
                  ? (Number(mat.preco_buscar) || Number(mat.valor_padrao) || 0)
                  : (Number(mat.preco_trazer) || Number(mat.valor_padrao) || 0);

                return (
                  <div
                    key={mat.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => handleSelectMaterial(mat)}
                    className={`px-3 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-950'
                        : isCurrentItem
                        ? 'bg-indigo-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Material Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {mat.codigo}
                        </span>
                        
                        <span className="font-bold text-xs text-slate-800 truncate" title={mat.nome}>
                          {mat.nome}
                        </span>

                        {isCurrentItem && (
                          <span className="inline-flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded">
                            <Check className="w-2.5 h-2.5 mr-0.5" /> Selecionado
                          </span>
                        )}
                      </div>

                      {mat.categoria && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {mat.categoria}
                        </p>
                      )}
                    </div>

                    {/* Metadata Badges: Unidade, Peso, Preço */}
                    <div className="flex items-center gap-1.5 shrink-0 text-right">
                      {/* Unidade */}
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {mat.unidade || 'UN'}
                      </span>

                      {/* Peso Padrão */}
                      {Number(mat.peso_padrao_kg) > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title="Peso unitário padrão">
                          <Scale className="w-2.5 h-2.5" />
                          {Number(mat.peso_padrao_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                        </span>
                      )}

                      {/* Preço Trazer / Buscar */}
                      {precoExibicao > 0 ? (
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          type === 'buscar'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`} title={`Preço padrão (${type === 'buscar' ? 'Busca' : 'Entrega'})`}>
                          R$ {precoExibicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Sob cotação
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Action */}
          {onAddNewMaterial && (
            <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewMaterial(query);
                }}
                className="w-full py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Novo Material no Sistema
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
