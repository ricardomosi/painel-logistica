import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  FileBarChart2,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Truck,
  Route,
  DollarSign,
  Clock,
  Award,
  Users,
  Package,
  UserCheck,
  MapPin,
  TrendingUp,
  TrendingDown,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';
import { fetchAllRomaneioItemsMap } from '../../services/reportsService';
import {
  buildReportAnalytics,
  formatCurrencyBRL,
  formatDurationHours,
  parseLocalDate,
} from '../../lib/reportAnalytics';
import { downloadReportExcel } from '../../lib/reportExportExcel';
import { downloadReportPdf } from '../../lib/reportExportPdf';
import DeliveryHeatmap from './DeliveryHeatmap';
import FullScreenReportModal from './FullScreenReportModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function formatIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function DeltaBadge({ current, previous, inverse = false }) {
  if (!previous || previous <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[10px] font-data-mono text-slate-400">
        Base inicial
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const isPositive = pct >= 0;
  const isGood = inverse ? !isPositive : isPositive;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold font-data-mono tabular-nums ${
        isGood
          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
      }`}
    >
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  );
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: {
        color: '#cbd5e1',
        font: { family: "'Hanken Grotesk', sans-serif", size: 11, weight: '600' },
        boxWidth: 12,
      },
    },
    tooltip: {
      backgroundColor: '#020D1A',
      titleColor: '#ffffff',
      bodyColor: '#d3e3ff',
      borderColor: '#0081A7',
      borderWidth: 1,
      padding: 10,
    },
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8', font: { family: "'IBM Plex Sans', sans-serif", size: 10 } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#94a3b8', font: { family: "'IBM Plex Sans', sans-serif", size: 10 } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
  },
};

export default function DashboardView() {
  const { deliveries, vehicles, sellers, loadData, addToast } = useLogistics();

  // Period defaults: current month
  const [dateStart, setDateStart] = useState(() => {
    const now = new Date();
    return formatIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [dateEnd, setDateEnd] = useState(() => {
    const now = new Date();
    return formatIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  });
  const [selectedPlaca, setSelectedPlaca] = useState('TODAS');
  const [selectedVendedor, setSelectedVendedor] = useState('TODAS');
  const [selectedUnidade, setSelectedUnidade] = useState('TODOS');
  const [custoKm, setCustoKm] = useState(() => {
    try {
      return localStorage.getItem('logistica_custo_km') || '5.24';
    } catch {
      return '5.24';
    }
  });

  const [romaneioItemsMap, setRomaneioItemsMap] = useState(() => new Map());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [chartGranularity, setChartGranularity] = useState('monthly'); // 'monthly' | 'daily'
  const [sellersMode, setSellersMode] = useState('total');
  const [vehiclesMode, setVehiclesMode] = useState('total');
  const [materialsMode, setMaterialsMode] = useState('total');
  const [clientsMode, setClientsMode] = useState('total');
  const [activePreset, setActivePreset] = useState('current_month');

  useEffect(() => {
    document.body.classList.add('theme-relatorio');
    return () => {
      document.body.classList.remove('theme-relatorio');
    };
  }, []);

  const syncReportsData = useCallback(
    async (notify = false) => {
      setIsSyncing(true);
      try {
        await Promise.all([
          typeof loadData === 'function' ? loadData(true) : Promise.resolve(),
          fetchAllRomaneioItemsMap().then((map) => setRomaneioItemsMap(map)),
        ]);
        if (notify) {
          addToast?.('Histórico de entregas e romaneios sincronizado.', 'success');
        }
      } catch (err) {
        if (notify) {
          addToast?.(`Aviso na sincronização: ${err?.message || 'usando cache local'}`, 'warning');
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [loadData, addToast]
  );

  useEffect(() => {
    fetchAllRomaneioItemsMap()
      .then((map) => setRomaneioItemsMap(map))
      .catch(() => {
        // Silent fallback when offline; delivery-level metrics continue normally
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('logistica_custo_km', String(custoKm));
    } catch {
      // Ignore storage error
    }
  }, [custoKm]);

  // Dynamic filter dropdown options merged from Supabase catalogs + historical deliveries
  const placaOptions = useMemo(() => {
    const set = new Set();
    (vehicles || []).forEach((v) => {
      if (v?.placa) {
        const label = v.motorista_padrao ? `${v.placa} (${v.motorista_padrao})` : v.placa;
        set.add(label);
      }
    });
    (deliveries || []).forEach((d) => {
      if (d?.placa && String(d.placa).trim()) set.add(String(d.placa).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [vehicles, deliveries]);

  const vendedorOptions = useMemo(() => {
    const set = new Set();
    (sellers || []).forEach((s) => {
      if (s?.nome) {
        const label = s.unidade ? `${s.nome} (${s.unidade === 'FILIAL' ? 'Filial' : 'Matriz'})` : s.nome;
        set.add(label);
      }
    });
    (deliveries || []).forEach((d) => {
      if (d?.vendedor && String(d.vendedor).trim()) set.add(String(d.vendedor).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [sellers, deliveries]);

  const applyDatePreset = useCallback(
    (preset) => {
      setActivePreset(preset);
      const now = new Date();
      if (preset === 'current_month') {
        setDateStart(formatIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)));
        setDateEnd(formatIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
        return;
      }
      if (preset === 'last_3_months') {
        setDateStart(formatIsoDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
        setDateEnd(formatIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
        return;
      }
      if (preset === 'all_history') {
        let minTime = Infinity;
        let maxTime = -Infinity;
        (deliveries || []).forEach((d) => {
          const parsed = parseLocalDate(d?.data_registro || d?.created_at || d?.data_inicio);
          if (!parsed) return;
          const t = parsed.getTime();
          if (t < minTime) minTime = t;
          if (t > maxTime) maxTime = t;
        });
        const start = isFinite(minTime) ? new Date(minTime) : new Date(now.getFullYear(), 0, 1);
        const end = isFinite(maxTime) && maxTime > now.getTime() ? new Date(maxTime) : now;
        setDateStart(formatIsoDate(start));
        setDateEnd(formatIsoDate(end));
      }
    },
    [deliveries]
  );

  // Full analytics dataset driven by active filters
  const analytics = useMemo(() => {
    return buildReportAnalytics({
      deliveries,
      romaneioItemsByEntregaId: romaneioItemsMap,
      dateStart,
      dateEnd,
      selectedPlaca,
      selectedVendedor,
      selectedLocalCarregamento: selectedUnidade,
      custoKm,
    });
  }, [
    deliveries,
    romaneioItemsMap,
    dateStart,
    dateEnd,
    selectedPlaca,
    selectedVendedor,
    selectedUnidade,
    custoKm,
  ]);

  const { meta, summary, months, monthlySeries, dailySeries, sellers: sellersStats, vehicles: vehiclesStats, materials: materialsStats, clients: clientsStats, locations: locationsStats } = analytics;

  const mainChartData = useMemo(() => {
    if (chartGranularity === 'monthly') {
      return {
        labels: monthlySeries.map((m) => m.label),
        datasets: [
          {
            label: 'Entregas',
            data: monthlySeries.map((m) => m.entregas),
            backgroundColor: 'rgba(0, 212, 255, 0.78)',
            borderColor: '#00D4FF',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'KM (centenas)',
            data: monthlySeries.map((m) => Number((m.km / 100).toFixed(1))),
            backgroundColor: 'rgba(240, 113, 39, 0.78)',
            borderColor: '#F07127',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Valor Total (mil R$)',
            data: monthlySeries.map((m) => Number((m.valorTotal / 1000).toFixed(1))),
            backgroundColor: 'rgba(16, 185, 129, 0.72)',
            borderColor: '#10B981',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      };
    }

    return {
      labels: dailySeries.labels,
      datasets: [
        {
          label: 'Entregas / Dia',
          data: dailySeries.counts,
          borderColor: '#00D4FF',
          backgroundColor: 'rgba(0, 212, 255, 0.14)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
        },
        {
          label: 'KM / Dia (x10)',
          data: dailySeries.kms.map((k) => Number((k / 10).toFixed(1))),
          borderColor: '#F07127',
          backgroundColor: 'transparent',
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 2.5,
        },
      ],
    };
  }, [chartGranularity, monthlySeries, dailySeries]);

  const handleQuickPdf = async () => {
    try {
      const fileName = await downloadReportPdf(analytics, {});
      addToast?.(`PDF gerado: ${fileName}`, 'success');
    } catch (err) {
      addToast?.(`Erro ao exportar PDF: ${err?.message || 'falha inesperada'}`, 'error');
    }
  };

  const handleQuickExcel = () => {
    try {
      const fileName = downloadReportExcel(analytics);
      addToast?.(`Excel gerado: ${fileName}`, 'success');
    } catch (err) {
      addToast?.(`Erro ao exportar Excel: ${err?.message || 'falha inesperada'}`, 'error');
    }
  };

  const otifAngle = Math.min(Math.max(summary.otif.otifPct, 0), 100);

  return (
    <div
      id="dashboard-view"
      className="h-full flex flex-col overflow-y-auto overflow-x-hidden w-full font-hanken p-3 sm:p-5 lg:p-6 text-on-surface relative z-10 pb-28 space-y-5"
    >
      {/* HEADER BAR & REPORT EXPORT COMMAND CENTER */}
      <header className="dash-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-[#0081A7]/40">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#0081A7]/25 border border-[#0081A7]/50 text-[#00D4FF] text-[10px] font-bold uppercase tracking-wider">
              <FileBarChart2 size={12} />
              Central de Inteligência & Relatórios
            </span>
            <span className="text-[11px] font-data-mono text-slate-400 tabular-nums">
              {meta.totalRegistrosFiltrados} entregas no recorte
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">
            Relatórios Gerenciais — J Patrício Metais
          </h1>
          <p className="text-xs text-slate-300 font-data-mono tabular-nums">
            Período ativo: <strong className="text-[#00D4FF]">{meta.formattedPeriod}</strong> ({months.length}{' '}
            {months.length === 1 ? 'mês' : 'meses'}) • Custos calculados a R$ {Number(meta.custoKm).toFixed(2)}/km
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="btn-open-fullscreen-report"
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-[4px] bg-[#0081A7] hover:bg-[#0099c4] text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md"
          >
            <Maximize2 size={15} />
            <span>Baixar Relatório</span>
          </button>

          <button
            id="btn-quick-pdf"
            type="button"
            onClick={handleQuickPdf}
            className="px-3.5 py-2.5 rounded-[4px] bg-[#F07127] hover:bg-[#d9621d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            title="Baixar PDF executivo diretamente"
          >
            <FileText size={14} />
            <span>PDF</span>
          </button>

          <button
            id="btn-quick-excel"
            type="button"
            onClick={handleQuickExcel}
            className="px-3.5 py-2.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            title="Baixar planilha Excel multi-abas (.xlsx)"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>

          <button
            id="btn-sync-reports"
            type="button"
            onClick={() => syncReportsData(true)}
            disabled={isSyncing}
            className="px-3 py-2.5 rounded-[4px] bg-[#020D1A] hover:bg-slate-800 border border-white/15 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-60"
            title="Recarregar dados completos do Supabase"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#00D4FF]' : ''} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </header>

      {/* FILTER CONTROLS */}
      <section className="dash-card p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
            <SlidersHorizontal size={14} className="text-[#00D4FF]" />
            <span>Filtros & Recorte Temporal</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'current_month', label: 'Este Mês' },
              { id: 'last_3_months', label: 'Últimos 3 Meses' },
              { id: 'all_history', label: 'Todo Histórico' },
            ].map((p) => (
              <button
                key={p.id}
                id={`btn-preset-${p.id}`}
                type="button"
                onClick={() => applyDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition-colors border ${
                  activePreset === p.id
                    ? 'bg-[#0081A7] border-[#00D4FF]/60 text-white'
                    : 'bg-[#020D1A] border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div>
            <label htmlFor="dash-date-start" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Data Início
            </label>
            <input
              id="dash-date-start"
              type="date"
              value={dateStart}
              onChange={(e) => {
                setActivePreset('custom');
                setDateStart(e.target.value);
              }}
              className="dash-input w-full text-xs py-1.5 px-2.5 rounded-[4px] font-data-mono"
            />
          </div>

          <div>
            <label htmlFor="dash-date-end" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Data Fim
            </label>
            <input
              id="dash-date-end"
              type="date"
              value={dateEnd}
              onChange={(e) => {
                setActivePreset('custom');
                setDateEnd(e.target.value);
              }}
              className="dash-input w-full text-xs py-1.5 px-2.5 rounded-[4px] font-data-mono"
            />
          </div>

          <div>
            <label htmlFor="dash-filter-unidade" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Unidade
            </label>
            <select
              id="dash-filter-unidade"
              value={selectedUnidade}
              onChange={(e) => setSelectedUnidade(e.target.value)}
              className="dash-input w-full text-xs py-1.5 px-2.5 rounded-[4px]"
            >
              <option value="TODOS">Todas as Unidades</option>
              <option value="MATRIZ">MATRIZ</option>
              <option value="FILIAL">FILIAL</option>
            </select>
          </div>

          <div>
            <label htmlFor="dash-filter-placa" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Veículo / Placa
            </label>
            <select
              id="dash-filter-placa"
              value={selectedPlaca}
              onChange={(e) => setSelectedPlaca(e.target.value)}
              className="dash-input w-full text-xs py-1.5 px-2.5 rounded-[4px]"
            >
              <option value="TODAS">Todos os Veículos</option>
              {placaOptions.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dash-filter-vendedor" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Vendedor
            </label>
            <select
              id="dash-filter-vendedor"
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
              className="dash-input w-full text-xs py-1.5 px-2.5 rounded-[4px]"
            >
              <option value="TODAS">Todos os Vendedores</option>
              {vendedorOptions.map((vend) => (
                <option key={vend} value={vend}>
                  {vend}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dash-cost-km" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Custo / KM (R$)
            </label>
            <input
              id="dash-cost-km"
              type="number"
              step="0.01"
              min="0.1"
              value={custoKm}
              onChange={(e) => setCustoKm(e.target.value)}
              className="dash-input w-full text-xs py-1.5 px-2.5 rounded-[4px] font-data-mono"
            />
          </div>
        </div>
      </section>

      {/* 6 EXECUTIVE KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="dash-card p-3.5 border-t-2 border-t-[#00D4FF]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entregas Totais</span>
            <Truck size={15} className="text-[#00D4FF]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold font-data-mono tabular-nums text-white">
              {summary.totalEntregas}
            </span>
            <DeltaBadge current={summary.totalEntregas} previous={summary.prevEntregas} />
          </div>
          <div className="mt-1.5 text-[11px] font-data-mono text-slate-400">
            M:{summary.matrizCount} | F:{summary.filialCount} • {summary.concluidas} concl.
          </div>
        </div>

        <div className="dash-card p-3.5 border-t-2 border-t-[#F07127]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KM Percorrido</span>
            <Route size={15} className="text-[#F07127]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold font-data-mono tabular-nums text-white">
              {summary.totalKm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400">km</span>
            </span>
            <DeltaBadge current={summary.totalKm} previous={summary.prevKm} />
          </div>
          <div className="mt-1.5 text-[11px] font-data-mono text-slate-400">
            Média {summary.avgKmPerDelivery.toFixed(1)} km / entrega
          </div>
        </div>

        <div className="dash-card p-3.5 border-t-2 border-t-rose-400">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custo Entregas</span>
            <DollarSign size={15} className="text-rose-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-lg font-extrabold font-data-mono tabular-nums text-white truncate">
              {formatCurrencyBRL(summary.totalCost)}
            </span>
            <DeltaBadge current={summary.totalCost} previous={summary.prevCost} inverse />
          </div>
          <div className="mt-1.5 text-[11px] font-data-mono text-slate-400 truncate">
            Méd: {formatCurrencyBRL(summary.avgCostPerDelivery)} / entrega
          </div>
        </div>

        <div className="dash-card p-3.5 border-t-2 border-t-amber-400">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Média de Tempo</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold font-data-mono tabular-nums text-white">
              {formatDurationHours(summary.avgTimeH)}
            </span>
            <DeltaBadge current={summary.avgTimeH} previous={summary.prevAvgTimeH} inverse />
          </div>
          <div className="mt-1.5 text-[11px] font-data-mono text-slate-400">
            {summary.completedCountForTime} entregas cronometradas
          </div>
        </div>

        <div className="dash-card p-3.5 border-t-2 border-t-emerald-400">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valores Entregas</span>
            <DollarSign size={15} className="text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-lg font-extrabold font-data-mono tabular-nums text-emerald-300 truncate">
              {formatCurrencyBRL(summary.totalValorGeral)}
            </span>
            <DeltaBadge current={summary.totalValorGeral} previous={summary.prevTotalValorGeral} />
          </div>
          <div className="mt-1.5 text-[11px] font-data-mono text-slate-400 truncate">
            Carga {formatCurrencyBRL(summary.totalValorCarga)} | Fr {formatCurrencyBRL(summary.totalFrete)}
          </div>
        </div>

        <div className="dash-card p-3.5 border-t-2 border-t-[#2E97C2]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OTIF Global</span>
            <Award size={15} className="text-[#2E97C2]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold font-data-mono tabular-nums text-[#00D4FF]">
              {Math.round(summary.otif.otifPct)}%
            </span>
            <span className="text-[10px] font-data-mono text-slate-300">
              {summary.otif.ocorrenciasCount} ocorr.
            </span>
          </div>
          <div className="mt-1.5 text-[11px] font-data-mono text-slate-400">
            On-Time {Math.round(summary.otif.onTimePct)}% • In-Full {Math.round(summary.otif.inFullPct)}%
          </div>
        </div>
      </section>

      {/* CHART + OTIF ORGANIZED PANEL */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-w-0">
        <div className="xl:col-span-8 dash-card p-4 flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Evolução de Entregas, KM e Valores
              </h2>
              <p className="text-[11px] text-slate-400">
                Alterne entre comparativo mês a mês ou ritmo diário no período
              </p>
            </div>
            <div className="inline-flex items-center bg-[#020D1A] border border-white/10 rounded-[4px] p-0.5">
              <button
                type="button"
                onClick={() => setChartGranularity('monthly')}
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase ${
                  chartGranularity === 'monthly' ? 'bg-[#0081A7] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Mês
              </button>
              <button
                type="button"
                onClick={() => setChartGranularity('daily')}
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase ${
                  chartGranularity === 'daily' ? 'bg-[#0081A7] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Dia
              </button>
            </div>
          </div>

          <div className="h-[250px] sm:h-[280px] w-full relative">
            {chartGranularity === 'monthly' ? (
              <Bar data={mainChartData} options={CHART_OPTIONS} />
            ) : (
              <Line data={mainChartData} options={CHART_OPTIONS} />
            )}
          </div>
        </div>

        {/* Structured OTIF Panel */}
        <div className="xl:col-span-4 dash-card p-4 flex flex-col justify-between gap-3 min-w-0">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Painel OTIF Estruturado
            </h2>
            <span className="text-[10px] font-data-mono text-emerald-400 font-bold uppercase">
              SLA 24h
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `conic-gradient(#10B981 ${otifAngle * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="w-[74px] h-[74px] rounded-full bg-[#020D1A] flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold font-data-mono text-white">
                  {Math.round(summary.otif.otifPct)}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400">OTIF</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-data-mono mb-0.5">
                  <span className="text-slate-300">On-Time (&lt;=24h)</span>
                  <span className="text-[#00D4FF] font-bold">{summary.otif.onTimePct.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-[2px] overflow-hidden">
                  <div className="h-full bg-[#00D4FF]" style={{ width: `${Math.min(summary.otif.onTimePct, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-data-mono mb-0.5">
                  <span className="text-slate-300">In-Full (Sem ocorr.)</span>
                  <span className="text-emerald-400 font-bold">{summary.otif.inFullPct.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-[2px] overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${Math.min(summary.otif.inFullPct, 100)}%` }} />
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-300 font-data-mono">
                Ofensor principal:{' '}
                <strong className={summary.otif.maxErros > 0 ? 'text-[#F07127]' : 'text-emerald-400'}>
                  {summary.otif.maxErros > 0 ? `${summary.otif.ofensorName} (${summary.otif.maxErros})` : 'Zero ocorrências'}
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-[#020D1A]/80 border border-white/10 rounded-[4px] p-2.5 space-y-1.5 max-h-[125px] overflow-y-auto">
            {(summary.otif.occurrencesBreakdown || []).slice(0, 4).map((occ) => (
              <div key={occ.motivo} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-200 truncate flex items-center gap-1.5">
                  {occ.motivo.toLowerCase().includes('sem ocorr') ? (
                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                  )}
                  <span className="truncate">{occ.motivo}</span>
                </span>
                <span className="font-data-mono font-bold text-slate-300 shrink-0">
                  {occ.count} ({occ.pct.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MONTHLY CONSOLIDATION PREVIEW TABLE */}
      <section className="dash-card overflow-hidden min-w-0">
        <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#00D4FF]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Resumo Separado por Mês & Total
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="text-[11px] font-bold text-[#00D4FF] hover:underline uppercase tracking-wider"
          >
            Abrir relatório tela cheia →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
            <thead>
              <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                <th className="py-2 px-3 font-hanken">Mês</th>
                <th className="py-2 px-3 text-right">Entregas</th>
                <th className="py-2 px-3 text-right">KM</th>
                <th className="py-2 px-3 text-right">Custo Est.</th>
                <th className="py-2 px-3 text-right">Tempo Médio</th>
                <th className="py-2 px-3 text-right">Carga + Frete</th>
                <th className="py-2 px-3 text-right">OTIF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthlySeries.map((m) => (
                <tr key={m.monthKey} className="hover:bg-white/[0.03]">
                  <td className="py-2 px-3 font-hanken font-bold text-white">{m.fullLabel}</td>
                  <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{m.entregas}</td>
                  <td className="py-2 px-3 text-right">{m.km.toFixed(1)} km</td>
                  <td className="py-2 px-3 text-right text-rose-300">{formatCurrencyBRL(m.custo)}</td>
                  <td className="py-2 px-3 text-right text-amber-300">{formatDurationHours(m.avgTimeH)}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-300">{formatCurrencyBRL(m.valorTotal)}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">{Math.round(m.otifPct)}%</td>
                </tr>
              ))}
              {monthlySeries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400 font-hanken">
                    Nenhum movimento encontrado para este período.
                  </td>
                </tr>
              )}
            </tbody>
            {monthlySeries.length > 0 && (
              <tfoot>
                <tr className="bg-[#0081A7]/20 border-t border-[#0081A7]/40 font-bold text-white">
                  <td className="py-2 px-3 font-hanken uppercase">TOTAL</td>
                  <td className="py-2 px-3 text-right text-[#00D4FF]">{summary.totalEntregas}</td>
                  <td className="py-2 px-3 text-right">{summary.totalKm.toFixed(1)} km</td>
                  <td className="py-2 px-3 text-right text-rose-300">{formatCurrencyBRL(summary.totalCost)}</td>
                  <td className="py-2 px-3 text-right text-amber-300">{formatDurationHours(summary.avgTimeH)}</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{formatCurrencyBRL(summary.totalValorGeral)}</td>
                  <td className="py-2 px-3 text-right text-emerald-400">{Math.round(summary.otif.otifPct)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* SELLERS & VEHICLES PERFORMANCE (TOTAL OR MONTHLY) */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
        {/* Sellers */}
        <div className="dash-card overflow-hidden flex flex-col min-w-0">
          <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Users size={15} className="text-[#00D4FF] shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                Performance Vendedores
              </h2>
            </div>
            <div className="inline-flex bg-[#020D1A] border border-white/10 rounded-[4px] p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setSellersMode('total')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  sellersMode === 'total' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => setSellersMode('monthly')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  sellersMode === 'monthly' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Por Mês
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
              <thead>
                <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                  <th className="py-2 px-3 font-hanken">Vendedor</th>
                  {sellersMode === 'monthly' ? (
                    <>
                      {months.map((m) => (
                        <th key={m.monthKey} className="py-2 px-3 text-right">
                          {m.label}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-right text-[#00D4FF]">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-right">Entr.</th>
                      <th className="py-2 px-3 text-right">Valor Total</th>
                      <th className="py-2 px-3 text-right">Share</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sellersStats.ranking.slice(0, 10).map((s) => (
                  <tr key={s.name} className="hover:bg-white/[0.03]">
                    <td className="py-2 px-3 font-hanken font-semibold text-white">{s.displayName}</td>
                    {sellersMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                            {s.byMonth?.[m.monthKey]?.entregas || 0}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{s.entregas}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{s.entregas}</td>
                        <td className="py-2 px-3 text-right text-emerald-300">{formatCurrencyBRL(s.valorTotal)}</td>
                        <td className="py-2 px-3 text-right">{s.sharePct.toFixed(1)}%</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicles */}
        <div className="dash-card overflow-hidden flex flex-col min-w-0">
          <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Truck size={15} className="text-[#F07127] shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                Performance Veículos / Frota
              </h2>
            </div>
            <div className="inline-flex bg-[#020D1A] border border-white/10 rounded-[4px] p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setVehiclesMode('total')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  vehiclesMode === 'total' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => setVehiclesMode('monthly')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  vehiclesMode === 'monthly' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Por Mês
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
              <thead>
                <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                  <th className="py-2 px-3 font-hanken">Placa / Motorista</th>
                  {vehiclesMode === 'monthly' ? (
                    <>
                      {months.map((m) => (
                        <th key={m.monthKey} className="py-2 px-3 text-right">
                          {m.label}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-right text-[#F07127]">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-right">Entr.</th>
                      <th className="py-2 px-3 text-right">KM</th>
                      <th className="py-2 px-3 text-right">T. Médio</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vehiclesStats.ranking.slice(0, 10).map((v) => (
                  <tr key={v.placa} className="hover:bg-white/[0.03]">
                    <td className="py-2 px-3 font-hanken font-semibold text-white">
                      {v.placaCurta} <span className="text-[10px] text-slate-400">({v.motorista})</span>
                    </td>
                    {vehiclesMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                            {v.byMonth?.[m.monthKey]?.entregas || 0}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-[#F07127]">{v.entregas}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-right font-bold text-[#F07127]">{v.entregas}</td>
                        <td className="py-2 px-3 text-right">{v.km.toFixed(0)} km</td>
                        <td className="py-2 px-3 text-right text-amber-300">{formatDurationHours(v.avgTimeH)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MOST SOLD MATERIALS (ROMANEIO) + TOP CLIENTS */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
        {/* Romaneio Materials */}
        <div className="dash-card overflow-hidden flex flex-col min-w-0">
          <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Package size={15} className="text-emerald-400 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                Materiais Mais Vendidos (Romaneio)
              </h2>
            </div>
            <div className="inline-flex bg-[#020D1A] border border-white/10 rounded-[4px] p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setMaterialsMode('total')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  materialsMode === 'total' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => setMaterialsMode('monthly')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  materialsMode === 'monthly' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Por Mês
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
              <thead>
                <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                  <th className="py-2 px-3 font-hanken">Material</th>
                  {materialsMode === 'monthly' ? (
                    <>
                      {months.map((m) => (
                        <th key={m.monthKey} className="py-2 px-3 text-right">
                          {m.label}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-right text-emerald-400">Qtd Total</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-right">Entr.</th>
                      <th className="py-2 px-3 text-right">Qtd</th>
                      <th className="py-2 px-3 text-right">Valor</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {materialsStats.ranking.slice(0, 10).map((mat) => (
                  <tr key={mat.key} className="hover:bg-white/[0.03]">
                    <td className="py-2 px-3 font-hanken font-semibold text-white max-w-[200px] truncate" title={mat.nome}>
                      {mat.nome}
                    </td>
                    {materialsMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                            {mat.byMonth?.[m.monthKey]?.ocorrencias || 0}x
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-emerald-300">
                          {mat.quantidadeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {mat.unidade}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{mat.entregasDistintas}</td>
                        <td className="py-2 px-3 text-right">
                          {mat.quantidadeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {mat.unidade}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-300">{formatCurrencyBRL(mat.valorTotal)}</td>
                      </>
                    )}
                  </tr>
                ))}
                {materialsStats.ranking.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 font-hanken">
                      Nenhum item de romaneio encontrado no recorte.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clients */}
        <div className="dash-card overflow-hidden flex flex-col min-w-0">
          <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck size={15} className="text-[#00D4FF] shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                Clientes que Mais Receberam
              </h2>
            </div>
            <div className="inline-flex bg-[#020D1A] border border-white/10 rounded-[4px] p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setClientsMode('total')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  clientsMode === 'total' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => setClientsMode('monthly')}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                  clientsMode === 'monthly' ? 'bg-[#0081A7] text-white' : 'text-slate-400'
                }`}
              >
                Por Mês
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
              <thead>
                <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                  <th className="py-2 px-3 font-hanken">Cliente</th>
                  {clientsMode === 'monthly' ? (
                    <>
                      {months.map((m) => (
                        <th key={m.monthKey} className="py-2 px-3 text-right">
                          {m.label}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-right text-[#00D4FF]">Total</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-right">Entregas</th>
                      <th className="py-2 px-3 text-right">KM</th>
                      <th className="py-2 px-3 text-right">Valor Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clientsStats.ranking.slice(0, 10).map((cli) => (
                  <tr key={cli.cliente} className="hover:bg-white/[0.03]">
                    <td className="py-2 px-3 font-hanken font-semibold text-white max-w-[200px] truncate" title={cli.cliente}>
                      {cli.cliente}
                    </td>
                    {clientsMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                            {cli.byMonth?.[m.monthKey]?.entregas || 0}
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{cli.entregas}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{cli.entregas}</td>
                        <td className="py-2 px-3 text-right">{cli.km.toFixed(0)} km</td>
                        <td className="py-2 px-3 text-right text-emerald-300">{formatCurrencyBRL(cli.valorTotal)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TOP DELIVERY LOCATIONS & INTERACTIVE MAP */}
      <section className="dash-card p-4 space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#F07127]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              Mapa & Locais onde Fizemos Mais Entregas
            </h2>
          </div>
          <span className="text-[11px] font-data-mono text-slate-400">
            Clique nos polos do ranking para centralizar no mapa
          </span>
        </div>

        <DeliveryHeatmap
          locationsRanking={locationsStats.ranking}
          mapStats={locationsStats.mapStats}
          heightClass="h-[300px] sm:h-[360px]"
          maxLocationsList={10}
        />
      </section>

      {/* FULL-SCREEN EXECUTIVE REPORT OVERLAY */}
      <FullScreenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        analytics={analytics}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onChangeDateStart={(val) => {
          setActivePreset('custom');
          setDateStart(val);
        }}
        onChangeDateEnd={(val) => {
          setActivePreset('custom');
          setDateEnd(val);
        }}
        onApplyPreset={applyDatePreset}
        onRefreshSync={() => syncReportsData(true)}
        isSyncing={isSyncing}
        addToast={addToast}
      />
    </div>
  );
}
