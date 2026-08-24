import React, { useState } from 'react';
import { Users, DollarSign, PackageCheck, TrendingUp, Building } from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function SellersTable() {
  const { deliveries, sellers } = useLogistics();
  const [filterUnit, setFilterUnit] = useState('ALL'); // 'ALL' | 'Matriz' | 'Filial'

  // Map deliveries by seller name
  const salesBySeller = deliveries.reduce((acc, d) => {
    const rawName = d.vendedor || 'Não Informado';
    if (!acc[rawName]) {
      acc[rawName] = {
        totalVendas: 0,
        concluidas: 0,
        valorTotal: 0,
      };
    }
    acc[rawName].totalVendas += 1;
    if (d.status === 'concluido') {
      acc[rawName].concluidas += 1;
    }
    acc[rawName].valorTotal += Number(d.valor_entrega) || 0;
    return acc;
  }, {});

  // Build combined seller list from database + deliveries
  const combinedSellers = (sellers && sellers.length > 0 ? sellers : []).map(s => {
    const fullName = s.nome_completo || `${s.nome} (${s.unidade})`;
    const stats = salesBySeller[fullName] || salesBySeller[s.nome] || {
      totalVendas: 0,
      concluidas: 0,
      valorTotal: 0,
    };

    return {
      id: s.id,
      nome: s.nome,
      unidade: s.unidade,
      nomeCompleto: fullName,
      totalVendas: stats.totalVendas,
      concluidas: stats.concluidas,
      valorTotal: stats.valorTotal,
      ticketMedio: stats.totalVendas > 0 ? stats.valorTotal / stats.totalVendas : 0,
    };
  });

  // Include any extra sellers found in deliveries that might not be in official table
  Object.keys(salesBySeller).forEach(sellerName => {
    const alreadyListed = combinedSellers.some(
      s => s.nomeCompleto === sellerName || s.nome === sellerName
    );
    if (!alreadyListed) {
      const stats = salesBySeller[sellerName];
      const isFilial = sellerName.toLowerCase().includes('filial');
      combinedSellers.push({
        id: sellerName,
        nome: sellerName.replace(/\s*\((Matriz|Filial)\)/gi, ''),
        unidade: isFilial ? 'Filial' : 'Matriz',
        nomeCompleto: sellerName,
        totalVendas: stats.totalVendas,
        concluidas: stats.concluidas,
        valorTotal: stats.valorTotal,
        ticketMedio: stats.totalVendas > 0 ? stats.valorTotal / stats.totalVendas : 0,
      });
    }
  });

  // Filter and sort
  const filteredSellers = combinedSellers
    .filter(s => {
      if (filterUnit === 'ALL') return true;
      return s.unidade.toLowerCase() === filterUnit.toLowerCase();
    })
    .sort((a, b) => {
      if (b.valorTotal !== a.valorTotal) return b.valorTotal - a.valorTotal;
      return b.totalVendas - a.totalVendas;
    });

  // Aggregated totals
  const totalFaturamento = filteredSellers.reduce((sum, s) => sum + s.valorTotal, 0);
  const totalEntregas = filteredSellers.reduce((sum, s) => sum + s.totalVendas, 0);

  return (
    <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Desempenho Comercial por Vendedor (KPI)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {filteredSellers.length} Vendedores • Faturamento Total: R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterUnit('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterUnit === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterUnit('Matriz')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterUnit === 'Matriz'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Matriz
          </button>
          <button
            type="button"
            onClick={() => setFilterUnit('Filial')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterUnit === 'Filial'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Filial
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3">Rank / Vendedor</th>
              <th className="p-3 text-center">Unidade</th>
              <th className="p-3 text-center">Nº Vendas / Entregas</th>
              <th className="p-3 text-center">Concluídas</th>
              <th className="p-3 text-right">Volume Faturado</th>
              <th className="p-3 text-right">Ticket Médio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  Nenhum vendedor encontrado para o filtro selecionado
                </td>
              </tr>
            ) : (
              filteredSellers.map((seller, idx) => (
                <tr key={seller.id || seller.nomeCompleto} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      idx === 0 
                        ? 'bg-amber-400 text-slate-950 shadow-sm' 
                        : idx === 1 
                        ? 'bg-slate-300 text-slate-950' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold">{seller.nome}</span>
                  </td>

                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      seller.unidade === 'Matriz'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    }`}>
                      {seller.unidade}
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-slate-300">
                    {seller.totalVendas}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-emerald-400">
                    {seller.concluidas}
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-cyan-300">
                    R$ {seller.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="p-3 text-right font-mono text-slate-400 text-[11px]">
                    R$ {seller.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
