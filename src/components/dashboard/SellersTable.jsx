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
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex flex-col gap-0">
      {/* Header */}
      <div className="p-4 border-b border-grid-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-surface-container-high text-secondary border border-grid-line shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-on-surface text-xs uppercase tracking-wider font-label-caps">
              Desempenho Comercial por Vendedor (KPI)
            </h3>
            <span className="text-[11px] text-on-surface-variant font-data-mono">
              {filteredSellers.length} Vendedores • Faturamento Total: R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-grid-line self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterUnit('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              filterUnit === 'ALL'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterUnit('Matriz')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              filterUnit === 'Matriz'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Matriz
          </button>
          <button
            type="button"
            onClick={() => setFilterUnit('Filial')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              filterUnit === 'Filial'
                ? 'bg-secondary-container text-white font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Filial
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-grid-line bg-surface-container-lowest/70 text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">RANK / VENDEDOR</th>
              <th className="py-2.5 px-4 text-center">UNIDADE</th>
              <th className="py-2.5 px-4 text-center">Nº VENDAS</th>
              <th className="py-2.5 px-4 text-center">CONCLUÍDAS</th>
              <th className="py-2.5 px-4 text-right">VOLUME FATURADO</th>
              <th className="py-2.5 px-4 text-right">TICKET MÉDIO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line text-on-surface">
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-on-surface-variant">
                  Nenhum vendedor encontrado para o filtro selecionado
                </td>
              </tr>
            ) : (
              filteredSellers.map((seller, idx) => (
                <tr key={seller.id || seller.nomeCompleto} className="border-b border-grid-line hover:bg-primary-container/5 transition-colors group">
                  <td className="py-2.5 px-4 font-semibold text-on-surface flex items-center gap-2">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-data-mono font-bold ${
                      idx === 0 
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                        : idx === 1 
                        ? 'bg-surface-container-highest text-on-surface border border-grid-line' 
                        : idx === 2 
                        ? 'bg-secondary-container/20 text-secondary border border-secondary-container/30' 
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-on-surface">{seller.nome}</span>
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-container-highest border border-grid-line text-on-surface">
                      {seller.unidade}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-center font-data-mono text-on-surface">
                    {seller.totalVendas}
                  </td>

                  <td className="py-2.5 px-4 text-center font-data-mono font-semibold text-emerald-400">
                    {seller.concluidas}
                  </td>

                  <td className="py-2.5 px-4 text-right font-data-mono font-bold text-primary">
                    R$ {seller.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-2.5 px-4 text-right font-data-mono text-on-surface-variant text-[11px]">
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
