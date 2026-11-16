import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  FileText,
  FileSpreadsheet,
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
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import DeliveryHeatmap from './DeliveryHeatmap';
import { formatCurrencyBRL, formatDurationHours } from '../../lib/reportAnalytics';
import { downloadReportExcel } from '../../lib/reportExportExcel';
import { downloadReportPdf } from '../../lib/reportExportPdf';

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

function captureChartImage(ref) {
  try {
    const inst = ref?.current;
    if (!inst) return null;
    if (typeof inst.toBase64Image === 'function') {
      return inst.toBase64Image('image/png', 1.0);
    }
    if (inst.canvas && typeof inst.canvas.toDataURL === 'function') {
      return inst.canvas.toDataURL('image/png', 1.0);
    }
    return null;
  } catch {
    return null;
  }
}

function ModeSwitch({ mode, onChange, testIdPrefix }) {
  return (
    <div className="inline-flex items-center bg-[#020D1A] border border-white/10 rounded-[4px] p-0.5 shrink-0">
      <button
        type="button"
        data-testid={`${testIdPrefix}-total`}
        onClick={() => onChange('total')}
        className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-colors ${
          mode === 'total'
            ? 'bg-[#0081A7] text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        Total
      </button>
      <button
        type="button"
        data-testid={`${testIdPrefix}-monthly`}
        onClick={() => onChange('monthly')}
        className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-colors ${
          mode === 'monthly'
            ? 'bg-[#0081A7] text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        Por Mês
      </button>
    </div>
  );
}

const DARK_CHART_COMMON = {
  responsive: true,
  maintainAspectRatio: false,
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
      ticks: { color: '#94a3b8', font: { family: "'IBM Plex Sans', sans-serif", size: 10 } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
  },
};

export default function FullScreenReportModal({
  isOpen,
  onClose,
  analytics,
  dateStart,
  dateEnd,
  onChangeDateStart,
  onChangeDateEnd,
  onApplyPreset,
  onRefreshSync,
  isSyncing,
  addToast,
}) {
  const [sellerViewMode, setSellerViewMode] = useState('monthly');
  const [vehicleViewMode, setVehicleViewMode] = useState('monthly');
  const [materialViewMode, setMaterialViewMode] = useState('monthly');
  const [clientViewMode, setClientViewMode] = useState('monthly');
  const [locationViewMode, setLocationViewMode] = useState('monthly');
  const [exportingType, setExportingType] = useState(null);

  const monthlyVolumeChartRef = useRef(null);
  const otifMonthlyChartRef = useRef(null);
  const sellersChartRef = useRef(null);
  const vehiclesChartRef = useRef(null);
  const materialsChartRef = useRef(null);
  const locationsChartRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const {
    meta,
    summary,
    months = [],
    monthlySeries = [],
    sellers,
    vehicles,
    materials,
    clients,
    locations,
  } = analytics || {};

  // Chart datasets
  const monthlyComboData = useMemo(() => {
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
          yAxisID: 'y',
        },
        {
          label: 'KM (centenas)',
          data: monthlySeries.map((m) => Number((m.km / 100).toFixed(1))),
          backgroundColor: 'rgba(240, 113, 39, 0.78)',
          borderColor: '#F07127',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          label: 'Valor Total (mil R$)',
          data: monthlySeries.map((m) => Number((m.valorTotal / 1000).toFixed(1))),
          backgroundColor: 'rgba(16, 185, 129, 0.72)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y',
        },
      ],
    };
  }, [monthlySeries]);

  const otifMonthlyData = useMemo(() => {
    return {
      labels: monthlySeries.map((m) => m.label),
      datasets: [
        {
          label: 'OTIF Global (%)',
          data: monthlySeries.map((m) => Number(m.otifPct.toFixed(1))),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.16)',
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointRadius: 4,
        },
        {
          label: 'On-Time <= 24h (%)',
          data: monthlySeries.map((m) => Number(m.onTimePct.toFixed(1))),
          borderColor: '#00D4FF',
          backgroundColor: 'transparent',
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 3.5,
        },
        {
          label: 'In-Full Sem Ocorr. (%)',
          data: monthlySeries.map((m) => Number(m.inFullPct.toFixed(1))),
          borderColor: '#F07127',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 3.5,
        },
      ],
    };
  }, [monthlySeries]);

  const sellersChartData = useMemo(() => {
    const top = (sellers?.ranking || []).slice(0, 8);
    return {
      labels: top.map((s) => s.displayName.slice(0, 20)),
      datasets: [
        {
          label: 'Valor Total (R$)',
          data: top.map((s) => Number(s.valorTotal.toFixed(2))),
          backgroundColor: 'rgba(0, 129, 167, 0.85)',
          borderColor: '#00D4FF',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [sellers]);

  const vehiclesChartData = useMemo(() => {
    const top = (vehicles?.ranking || []).slice(0, 8);
    return {
      labels: top.map((v) => v.placaCurta.slice(0, 16)),
      datasets: [
        {
          label: 'Entregas Realizadas',
          data: top.map((v) => v.entregas),
          backgroundColor: 'rgba(240, 113, 39, 0.85)',
          borderColor: '#F07127',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [vehicles]);

  const materialsChartData = useMemo(() => {
    const top = (materials?.ranking || []).slice(0, 8);
    return {
      labels: top.map((m) => m.nome.slice(0, 26)),
      datasets: [
        {
          label: 'Entregas com o Item',
          data: top.map((m) => m.entregasDistintas),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [materials]);

  const locationsChartData = useMemo(() => {
    const top = (locations?.ranking || []).slice(0, 8);
    return {
      labels: top.map((l) => l.label.slice(0, 26)),
      datasets: [
        {
          label: 'Entregas no Local',
          data: top.map((l) => l.entregas),
          backgroundColor: 'rgba(0, 212, 255, 0.78)',
          borderColor: '#00D4FF',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [locations]);

  if (!isOpen || !analytics) return null;

  const handleExportPdf = async () => {
    try {
      setExportingType('pdf');
      const chartImages = {
        monthlyVolume: captureChartImage(monthlyVolumeChartRef),
        otifMonthly: captureChartImage(otifMonthlyChartRef),
        sellers: captureChartImage(sellersChartRef),
        vehicles: captureChartImage(vehiclesChartRef),
        materials: captureChartImage(materialsChartRef),
        locations: captureChartImage(locationsChartRef),
      };
      const fileName = await downloadReportPdf(analytics, chartImages);
      addToast?.(`PDF gerado: ${fileName}`, 'success');
    } catch (err) {
      addToast?.(`Erro ao exportar PDF: ${err?.message || 'falha inesperada'}`, 'error');
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = () => {
    try {
      setExportingType('excel');
      const fileName = downloadReportExcel(analytics);
      addToast?.(`Planilha Excel gerada: ${fileName}`, 'success');
    } catch (err) {
      addToast?.(`Erro ao exportar Excel: ${err?.message || 'falha inesperada'}`, 'error');
    } finally {
      setExportingType(null);
    }
  };

  return createPortal(
    <div
      id="fullscreen-report-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Relatório Executivo de Logística"
      className="fixed inset-0 z-[120] bg-[#020D1A] text-[#d3e3ff] flex flex-col overflow-hidden font-hanken"
    >
      {/* Top Sticky Control & Metadata Bar */}
      <header className="shrink-0 w-full min-w-0 bg-[#031428] border-b border-[#0081A7]/40 px-2.5 sm:px-6 py-3 flex flex-col gap-3 shadow-lg overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 max-w-full">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[4px] bg-[#0081A7]/20 border border-[#0081A7]/60 flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="text-[#00D4FF]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-lg font-extrabold tracking-tight text-white uppercase truncate">
                Relatório Executivo — J Patrício
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-300 font-data-mono tabular-nums min-w-0">
                <span className="text-[#00D4FF] font-bold truncate max-w-full">
                  Período: {meta.formattedPeriod}
                </span>
                <span className="text-slate-500">•</span>
                <span>{meta.totalRegistrosFiltrados} reg.</span>
                {summary.legacyCount > 0 && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-300">
                      {summary.legacyCount} pré-Set/26
                    </span>
                  </>
                )}
                <span className="hidden sm:inline text-slate-500">•</span>
                <span className="hidden sm:inline truncate">
                  Filtros: {meta.selectedLocalCarregamento || 'TODOS'} | Placa: {meta.selectedPlaca} | Vendedor: {meta.selectedVendedor}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
            <button
              id="btn-export-pdf-fullscreen"
              type="button"
              onClick={handleExportPdf}
              disabled={exportingType !== null}
              className="px-3.5 py-2 rounded-[4px] bg-[#F07127] hover:bg-[#d9621d] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
            >
              {exportingType === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              <span>Baixar PDF</span>
            </button>

            <button
              id="btn-export-excel-fullscreen"
              type="button"
              onClick={handleExportExcel}
              disabled={exportingType !== null}
              className="px-3.5 py-2 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
            >
              {exportingType === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              <span>Baixar Excel</span>
            </button>

            <button
              id="btn-close-fullscreen-report"
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-[4px] bg-[#1E293B] hover:bg-slate-700 border border-white/15 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <X size={14} />
              <span className="hidden sm:inline">Fechar</span>
            </button>
          </div>
        </div>

        {/* Inline Period Controls Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
              <Calendar size={12} className="text-[#00D4FF]" />
              Período:
            </span>
            <input
              id="report-modal-date-start"
              type="date"
              value={dateStart}
              onChange={(e) => onChangeDateStart?.(e.target.value)}
              className="dash-input text-[11px] sm:text-xs py-1 px-1.5 sm:px-2 rounded-[4px] font-data-mono w-[114px] sm:w-auto max-w-full"
            />
            <span className="text-[11px] text-slate-400">a</span>
            <input
              id="report-modal-date-end"
              type="date"
              value={dateEnd}
              onChange={(e) => onChangeDateEnd?.(e.target.value)}
              className="dash-input text-[11px] sm:text-xs py-1 px-1.5 sm:px-2 rounded-[4px] font-data-mono w-[114px] sm:w-auto max-w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onApplyPreset?.('current_month')}
              className="px-2.5 py-1 rounded-[4px] bg-[#1E293B] hover:bg-[#0081A7]/40 border border-white/10 text-[11px] font-semibold text-slate-200 transition-colors"
            >
              Este Mês
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset?.('last_3_months')}
              className="px-2.5 py-1 rounded-[4px] bg-[#1E293B] hover:bg-[#0081A7]/40 border border-white/10 text-[11px] font-semibold text-slate-200 transition-colors"
            >
              Últimos 3 Meses
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset?.('all_history')}
              className="px-2.5 py-1 rounded-[4px] bg-[#1E293B] hover:bg-[#0081A7]/40 border border-white/10 text-[11px] font-semibold text-slate-200 transition-colors"
            >
              Todo Histórico
            </button>
            {onRefreshSync && (
              <button
                type="button"
                onClick={onRefreshSync}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded-[4px] bg-[#0081A7]/25 hover:bg-[#0081A7]/45 border border-[#0081A7]/50 text-[11px] font-bold text-[#00D4FF] flex items-center gap-1 transition-colors"
              >
                {isSyncing && <Loader2 size={11} className="animate-spin" />}
                <span>Atualizar Dados</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable Executive Body */}
      <main className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden px-2.5 sm:px-6 py-4 sm:py-5 space-y-6">
        {/* 1. CONSOLIDADO TOTAL DO PERÍODO (6 KPIs) */}
        <section className="space-y-3 min-w-0 w-full">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#00D4FF] rounded-[2px] inline-block" />
              1. Indicadores Gerais do Período ({meta.formattedPeriod})
            </h3>
            <span className="text-[11px] font-data-mono text-slate-400">
              {months.length} {months.length === 1 ? 'mês' : 'meses'} com movimento
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="dash-card p-3.5 border-l-2 border-l-[#00D4FF]">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>Total de Entregas</span>
                <Truck size={14} className="text-[#00D4FF]" />
              </div>
              <div className="mt-1.5 text-2xl font-extrabold font-data-mono tabular-nums text-white">
                {summary.totalEntregas}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-data-mono tabular-nums">
                {summary.concluidas} concl. • M:{summary.matrizCount} | F:{summary.filialCount}
              </div>
            </div>

            <div className="dash-card p-3.5 border-l-2 border-l-[#F07127]">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>KM Percorrido</span>
                <Route size={14} className="text-[#F07127]" />
              </div>
              <div className="mt-1.5 text-2xl font-extrabold font-data-mono tabular-nums text-white">
                {summary.totalKm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400">km</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-data-mono tabular-nums">
                Média: {summary.avgKmPerDelivery.toFixed(1)} km / entrega
              </div>
            </div>

            <div className="dash-card p-3.5 border-l-2 border-l-rose-400">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>Custo de Entregas</span>
                <DollarSign size={14} className="text-rose-400" />
              </div>
              <div className="mt-1.5 text-xl font-extrabold font-data-mono tabular-nums text-white truncate">
                {formatCurrencyBRL(summary.totalCost)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-data-mono tabular-nums">
                Base R$ {Number(meta.custoKm).toFixed(2)}/km • Méd {formatCurrencyBRL(summary.avgCostPerDelivery)}
              </div>
            </div>

            <div className="dash-card p-3.5 border-l-2 border-l-amber-400">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>Média Tempo / Entrega</span>
                <Clock size={14} className="text-amber-400" />
              </div>
              <div className="mt-1.5 text-2xl font-extrabold font-data-mono tabular-nums text-white">
                {formatDurationHours(summary.avgTimeH)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-data-mono tabular-nums">
                {summary.completedCountForTime} entregas cronometradas
              </div>
            </div>

            <div className="dash-card p-3.5 border-l-2 border-l-emerald-400">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>Valores das Entregas</span>
                <DollarSign size={14} className="text-emerald-400" />
              </div>
              <div className="mt-1.5 text-xl font-extrabold font-data-mono tabular-nums text-emerald-300 truncate">
                {formatCurrencyBRL(summary.totalValorGeral)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-data-mono tabular-nums truncate">
                Carga {formatCurrencyBRL(summary.totalValorCarga)} + Frete {formatCurrencyBRL(summary.totalFrete)}
              </div>
            </div>

            <div className="dash-card p-3.5 border-l-2 border-l-[#2E97C2]">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>OTIF Global</span>
                <Award size={14} className="text-[#2E97C2]" />
              </div>
              <div className="mt-1.5 text-2xl font-extrabold font-data-mono tabular-nums text-[#00D4FF]">
                {Math.round(summary.otif.otifPct)}%
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-data-mono tabular-nums">
                On-Time {Math.round(summary.otif.onTimePct)}% | In-Full {Math.round(summary.otif.inFullPct)}%
              </div>
            </div>
          </div>

          {/* Monthly Dual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            <div className="dash-card p-4 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                Gráfico Mensal: Entregas, KM e Valores
              </h4>
              <div className="h-[240px] sm:h-[260px] w-full min-w-0 overflow-hidden relative">
                <Bar ref={monthlyVolumeChartRef} data={monthlyComboData} options={DARK_CHART_COMMON} />
              </div>
            </div>

            <div className="dash-card p-4 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                Evolução Mensal do OTIF (% On-Time, In-Full e Global)
              </h4>
              <div className="h-[240px] sm:h-[260px] w-full min-w-0 overflow-hidden relative">
                <Line
                  ref={otifMonthlyChartRef}
                  data={otifMonthlyData}
                  options={{
                    ...DARK_CHART_COMMON,
                    scales: {
                      ...DARK_CHART_COMMON.scales,
                      y: { ...DARK_CHART_COMMON.scales.y, min: 0, max: 105 },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Monthly + Total Consolidation Table */}
          <div className="dash-card overflow-hidden min-w-0">
            <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Consolidado Mês a Mês & Total Geral
              </span>
              <span className="text-[10px] font-data-mono text-slate-400">Todos os indicadores operacionais e financeiros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
                <thead>
                  <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <th className="py-2.5 px-3 font-hanken">Mês</th>
                    <th className="py-2.5 px-3 text-right">Entregas</th>
                    <th className="py-2.5 px-3 text-right">Concl.</th>
                    <th className="py-2.5 px-3 text-right">KM</th>
                    <th className="py-2.5 px-3 text-right">Custo (R$)</th>
                    <th className="py-2.5 px-3 text-right">Tempo Médio</th>
                    <th className="py-2.5 px-3 text-right">Valor Carga</th>
                    <th className="py-2.5 px-3 text-right">Frete</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3 text-right">On-Time</th>
                    <th className="py-2.5 px-3 text-right">In-Full</th>
                    <th className="py-2.5 px-3 text-right">OTIF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {monthlySeries.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-white/[0.03]">
                      <td className="py-2 px-3 font-hanken font-bold text-white">{m.fullLabel}</td>
                      <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{m.entregas}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{m.concluidas}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{m.km.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right text-rose-300">{formatCurrencyBRL(m.custo)}</td>
                      <td className="py-2 px-3 text-right text-amber-300">{formatDurationHours(m.avgTimeH)}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{formatCurrencyBRL(m.valorCarga)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{formatCurrencyBRL(m.frete)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-300">{formatCurrencyBRL(m.valorTotal)}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{Math.round(m.onTimePct)}%</td>
                      <td className="py-2 px-3 text-right text-slate-200">{Math.round(m.inFullPct)}%</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">{Math.round(m.otifPct)}%</td>
                    </tr>
                  ))}
                  {monthlySeries.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-5 text-center text-slate-400 font-hanken">
                        Nenhuma entrega registrada para o período e filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
                {monthlySeries.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#0081A7]/20 border-t border-[#0081A7]/50 font-bold text-white">
                      <td className="py-2.5 px-3 font-hanken uppercase">TOTAL PERÍODO</td>
                      <td className="py-2.5 px-3 text-right text-[#00D4FF]">{summary.totalEntregas}</td>
                      <td className="py-2.5 px-3 text-right">{summary.concluidas}</td>
                      <td className="py-2.5 px-3 text-right">{summary.totalKm.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right text-rose-300">{formatCurrencyBRL(summary.totalCost)}</td>
                      <td className="py-2.5 px-3 text-right text-amber-300">{formatDurationHours(summary.avgTimeH)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrencyBRL(summary.totalValorCarga)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrencyBRL(summary.totalFrete)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-300">{formatCurrencyBRL(summary.totalValorGeral)}</td>
                      <td className="py-2.5 px-3 text-right">{Math.round(summary.otif.onTimePct)}%</td>
                      <td className="py-2.5 px-3 text-right">{Math.round(summary.otif.inFullPct)}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">{Math.round(summary.otif.otifPct)}%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </section>

        {/* 2. DADOS DO OTIF ORGANIZADOS (TOTAL + POR MÊS + OCORRÊNCIAS) */}
        <section className="space-y-3 min-w-0 w-full">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-400 rounded-[2px] inline-block" />
            2. Detalhamento OTIF (On-Time & In-Full) — Total e Mensal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="dash-card p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OTIF Global</div>
              <div className="text-2xl font-extrabold font-data-mono text-emerald-400 mt-1">
                {summary.otif.otifPct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Média ponderada On-Time × In-Full</div>
            </div>
            <div className="dash-card p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On-Time (Até 24h)</div>
              <div className="text-2xl font-extrabold font-data-mono text-[#00D4FF] mt-1">
                {summary.otif.onTimePct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-data-mono">
                {summary.otif.onTimeCount} de {summary.otif.totalOnTime} entregas cronometradas
              </div>
            </div>
            <div className="dash-card p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In-Full (Sem Ocorrências)</div>
              <div className="text-2xl font-extrabold font-data-mono text-white mt-1">
                {summary.otif.inFullPct.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-data-mono">
                {summary.otif.inFullCount} de {summary.otif.totalInFull} entregas concluídas
              </div>
            </div>
            <div className="dash-card p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ocorrências & Ofensor</div>
              <div className="text-lg font-extrabold text-[#F07127] mt-1 truncate">
                {summary.otif.maxErros > 0 ? summary.otif.ofensorName : 'Zero Ocorrências'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-data-mono">
                Total ocorrências: {summary.otif.ocorrenciasCount}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="dash-card overflow-hidden min-w-0">
              <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 text-xs font-bold uppercase tracking-wider text-white">
                OTIF Separado por Mês
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                      <th className="py-2 px-3 font-hanken">Mês</th>
                      <th className="py-2 px-3 text-right">Cronom.</th>
                      <th className="py-2 px-3 text-right">No Prazo</th>
                      <th className="py-2 px-3 text-right">On-Time</th>
                      <th className="py-2 px-3 text-right">In-Full</th>
                      <th className="py-2 px-3 text-right">Ocorr.</th>
                      <th className="py-2 px-3 text-right">OTIF %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {monthlySeries.map((m) => (
                      <tr key={m.monthKey} className="hover:bg-white/[0.03]">
                        <td className="py-2 px-3 font-hanken font-semibold text-white">{m.label}</td>
                        <td className="py-2 px-3 text-right">{m.totalOnTime}</td>
                        <td className="py-2 px-3 text-right text-[#00D4FF]">{m.onTimeCount}</td>
                        <td className="py-2 px-3 text-right">{m.onTimePct.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right">{m.inFullPct.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-amber-400">{m.ocorrenciasCount}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">{m.otifPct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dash-card overflow-hidden min-w-0">
              <div className="px-4 py-2.5 bg-[#07182c] border-b border-white/10 text-xs font-bold uppercase tracking-wider text-white">
                Status / Motivos Registrados nas Conclusões
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums">
                  <thead>
                    <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                      <th className="py-2 px-3 font-hanken">Como Foi a Entrega</th>
                      <th className="py-2 px-3 text-right">Qtd</th>
                      <th className="py-2 px-3 text-right">% Concluídas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(summary.otif.occurrencesBreakdown || []).map((occ) => {
                      const isClean = occ.motivo.toLowerCase().includes('sem ocorr');
                      return (
                        <tr key={occ.motivo} className="hover:bg-white/[0.03]">
                          <td className="py-2 px-3 font-hanken text-white flex items-center gap-2">
                            {isClean ? (
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                            )}
                            <span>{occ.motivo}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold">{occ.count}</td>
                          <td className="py-2 px-3 text-right text-slate-300">{occ.pct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PERFORMANCE POR VENDEDOR (GRÁFICO + TOTAL E POR MÊS) */}
        <section className="dash-card p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#00D4FF]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                3. Performance por Vendedor (Total e por Mês)
              </h3>
            </div>
            <ModeSwitch mode={sellerViewMode} onChange={setSellerViewMode} testIdPrefix="seller-mode" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-w-0">
            <div className="xl:col-span-5 h-[240px] sm:h-[260px] bg-[#020D1A]/60 border border-white/10 rounded-[4px] p-3 min-w-0 w-full overflow-hidden">
              <Bar
                ref={sellersChartRef}
                data={sellersChartData}
                options={{ ...DARK_CHART_COMMON, indexAxis: 'y' }}
              />
            </div>

            <div className="xl:col-span-7 overflow-x-auto border border-white/10 rounded-[4px] min-w-0 max-w-full">
              <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
                <thead>
                  <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                    <th className="py-2 px-3 font-hanken">Vendedor</th>
                    <th className="py-2 px-3">Unid.</th>
                    {sellerViewMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <th key={m.monthKey} className="py-2 px-3 text-right">
                            {m.label}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-right text-[#00D4FF]">Total Entr.</th>
                        <th className="py-2 px-3 text-right text-emerald-400">Total Valor</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 px-3 text-right">Entregas</th>
                        <th className="py-2 px-3 text-right">Carga (R$)</th>
                        <th className="py-2 px-3 text-right">Frete (R$)</th>
                        <th className="py-2 px-3 text-right">Total (R$)</th>
                        <th className="py-2 px-3 text-right">Ticket Médio</th>
                        <th className="py-2 px-3 text-right">Share</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(sellers?.ranking || []).map((s) => (
                    <tr key={s.name} className="hover:bg-white/[0.03]">
                      <td className="py-2 px-3 font-hanken font-semibold text-white">{s.displayName}</td>
                      <td className="py-2 px-3 text-[10px] text-slate-400">{s.unidade}</td>
                      {sellerViewMode === 'monthly' ? (
                        <>
                          {months.map((m) => {
                            const cell = s.byMonth?.[m.monthKey];
                            return (
                              <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                                {cell ? `${cell.entregas} | ${formatCurrencyBRL(cell.valorTotal)}` : '0'}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{s.entregas}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-300">{formatCurrencyBRL(s.valorTotal)}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{s.entregas}</td>
                          <td className="py-2 px-3 text-right">{formatCurrencyBRL(s.valorCarga)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrencyBRL(s.frete)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-300">{formatCurrencyBRL(s.valorTotal)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrencyBRL(s.ticketMedio)}</td>
                          <td className="py-2 px-3 text-right text-slate-300">{s.sharePct.toFixed(1)}%</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. PERFORMANCE POR VEÍCULO (GRÁFICO + TOTAL E POR MÊS) */}
        <section className="dash-card p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#F07127]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                4. Performance por Veículo / Frota (Total e por Mês)
              </h3>
            </div>
            <ModeSwitch mode={vehicleViewMode} onChange={setVehicleViewMode} testIdPrefix="vehicle-mode" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-w-0">
            <div className="xl:col-span-5 h-[240px] sm:h-[260px] bg-[#020D1A]/60 border border-white/10 rounded-[4px] p-3 min-w-0 w-full overflow-hidden">
              <Bar
                ref={vehiclesChartRef}
                data={vehiclesChartData}
                options={{ ...DARK_CHART_COMMON, indexAxis: 'y' }}
              />
            </div>

            <div className="xl:col-span-7 overflow-x-auto border border-white/10 rounded-[4px] min-w-0 max-w-full">
              <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
                <thead>
                  <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                    <th className="py-2 px-3 font-hanken">Veículo / Placa</th>
                    <th className="py-2 px-3 font-hanken">Motorista</th>
                    {vehicleViewMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <th key={m.monthKey} className="py-2 px-3 text-right">
                            {m.label}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-right text-[#F07127]">Total Entr.</th>
                        <th className="py-2 px-3 text-right text-slate-200">Total KM</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 px-3 text-right">Entregas</th>
                        <th className="py-2 px-3 text-right">KM</th>
                        <th className="py-2 px-3 text-right">Custo (R$)</th>
                        <th className="py-2 px-3 text-right">T. Médio</th>
                        <th className="py-2 px-3 text-right">In-Full %</th>
                        <th className="py-2 px-3 text-right">Valor Carga+Fr</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(vehicles?.ranking || []).map((v) => (
                    <tr key={v.placa} className="hover:bg-white/[0.03]">
                      <td className="py-2 px-3 font-hanken font-bold text-white">{v.placaCurta}</td>
                      <td className="py-2 px-3 font-hanken text-slate-300">{v.motorista}</td>
                      {vehicleViewMode === 'monthly' ? (
                        <>
                          {months.map((m) => {
                            const cell = v.byMonth?.[m.monthKey];
                            return (
                              <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                                {cell ? `${cell.entregas} ent. (${cell.km.toFixed(0)} km)` : '0'}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right font-bold text-[#F07127]">{v.entregas}</td>
                          <td className="py-2 px-3 text-right font-bold text-white">{v.km.toFixed(1)}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-right font-bold text-[#F07127]">{v.entregas}</td>
                          <td className="py-2 px-3 text-right">{v.km.toFixed(1)}</td>
                          <td className="py-2 px-3 text-right text-rose-300">{formatCurrencyBRL(v.custo)}</td>
                          <td className="py-2 px-3 text-right text-amber-300">{formatDurationHours(v.avgTimeH)}</td>
                          <td className="py-2 px-3 text-right text-emerald-400">{v.otifPct.toFixed(0)}%</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatCurrencyBRL(v.valorTotal)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. MATERIAIS MAIS VENDIDOS NO ROMANEIO (GRÁFICO + TOTAL E POR MÊS) */}
        <section className="dash-card p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Package size={16} className="text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  5. Materiais Mais Vendidos no Romaneio (Total e por Mês)
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-data-mono">
                {materials?.totals?.itensDistintos || 0} materiais distintos em {materials?.totals?.entregasComRomaneio || 0} entregas com romaneio • Total {Number(materials?.totals?.pesoTotalKg || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg • {formatCurrencyBRL(materials?.totals?.valorTotalRomaneios || 0)}
                {summary.legacyCount > 0
                  ? ` • Obs: ${summary.legacyCount} entregas pré-Set/2026 antecedem o módulo de romaneio detalhado.`
                  : ''}
              </p>
            </div>
            <ModeSwitch mode={materialViewMode} onChange={setMaterialViewMode} testIdPrefix="material-mode" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-w-0">
            <div className="xl:col-span-5 h-[240px] sm:h-[260px] bg-[#020D1A]/60 border border-white/10 rounded-[4px] p-3 min-w-0 w-full overflow-hidden">
              <Bar
                ref={materialsChartRef}
                data={materialsChartData}
                options={{ ...DARK_CHART_COMMON, indexAxis: 'y' }}
              />
            </div>

            <div className="xl:col-span-7 overflow-x-auto border border-white/10 rounded-[4px] min-w-0 max-w-full">
              <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
                <thead>
                  <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                    <th className="py-2 px-3">Cód.</th>
                    <th className="py-2 px-3 font-hanken">Material</th>
                    <th className="py-2 px-3">Un.</th>
                    {materialViewMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <th key={m.monthKey} className="py-2 px-3 text-right">
                            {m.label}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-right text-emerald-400">Qtd Total</th>
                        <th className="py-2 px-3 text-right text-[#00D4FF]">Valor Total</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 px-3 text-right">Entregas</th>
                        <th className="py-2 px-3 text-right">Qtd Total</th>
                        <th className="py-2 px-3 text-right">Peso (kg)</th>
                        <th className="py-2 px-3 text-right">Valor (R$)</th>
                        <th className="py-2 px-3 text-right">Share</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(materials?.ranking || []).slice(0, 25).map((mat) => (
                    <tr key={mat.key} className="hover:bg-white/[0.03]">
                      <td className="py-2 px-3 text-slate-400">{mat.codigo}</td>
                      <td className="py-2 px-3 font-hanken font-semibold text-white max-w-[220px] truncate" title={mat.nome}>
                        {mat.nome}
                      </td>
                      <td className="py-2 px-3 text-slate-400">{mat.unidade}</td>
                      {materialViewMode === 'monthly' ? (
                        <>
                          {months.map((m) => {
                            const cell = mat.byMonth?.[m.monthKey];
                            return (
                              <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                                {cell ? `${cell.ocorrencias}x (${Number(cell.quantidade).toFixed(0)})` : '0'}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right font-bold text-emerald-300">
                            {mat.quantidadeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">
                            {formatCurrencyBRL(mat.valorTotal)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{mat.entregasDistintas}</td>
                          <td className="py-2 px-3 text-right">
                            {mat.quantidadeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right">{mat.pesoTotalKg.toFixed(1)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-300">
                            {formatCurrencyBRL(mat.valorTotal)}
                          </td>
                          <td className="py-2 px-3 text-right">{mat.shareValorPct.toFixed(1)}%</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {(!materials?.ranking || materials.ranking.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-hanken">
                        Nenhum item de romaneio encontrado nas entregas filtradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 6. CLIENTES QUE MAIS FIZERAM ENTREGAS (TOTAL E POR MÊS) */}
        <section className="dash-card p-4 space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-[#00D4FF]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                6. Clientes que Mais Fizemos Entregas (Total e por Mês)
              </h3>
            </div>
            <ModeSwitch mode={clientViewMode} onChange={setClientViewMode} testIdPrefix="client-mode" />
          </div>

          <div className="overflow-x-auto border border-white/10 rounded-[4px]">
            <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
              <thead>
                <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3 font-hanken">Cliente</th>
                  {clientViewMode === 'monthly' ? (
                    <>
                      {months.map((m) => (
                        <th key={m.monthKey} className="py-2 px-3 text-right">
                          {m.label}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-right text-[#00D4FF]">Total Entr.</th>
                      <th className="py-2 px-3 text-right text-emerald-400">Valor Total</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-right">Entregas</th>
                      <th className="py-2 px-3 text-right">KM</th>
                      <th className="py-2 px-3 text-right">Ticket Médio</th>
                      <th className="py-2 px-3 text-right">Valor Total (R$)</th>
                      <th className="py-2 px-3 text-right">Share</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(clients?.ranking || []).slice(0, 25).map((cli, idx) => (
                  <tr key={cli.cliente} className="hover:bg-white/[0.03]">
                    <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-hanken font-semibold text-white max-w-[260px] truncate" title={cli.cliente}>
                      {cli.cliente}
                    </td>
                    {clientViewMode === 'monthly' ? (
                      <>
                        {months.map((m) => {
                          const cell = cli.byMonth?.[m.monthKey];
                          return (
                            <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                              {cell ? `${cell.entregas} (${formatCurrencyBRL(cell.valorTotal)})` : '0'}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{cli.entregas}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-300">{formatCurrencyBRL(cli.valorTotal)}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{cli.entregas}</td>
                        <td className="py-2 px-3 text-right">{cli.km.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right">{formatCurrencyBRL(cli.ticketMedio)}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-300">{formatCurrencyBRL(cli.valorTotal)}</td>
                        <td className="py-2 px-3 text-right">{cli.sharePct.toFixed(1)}%</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. LUGARES QUE MAIS FIZEMOS ENTREGA + MAPA DE CONCENTRAÇÃO */}
        <section className="dash-card p-4 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#F07127]" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                7. Lugares que Mais Fizemos Entrega & Mapa Geográfico (Total e por Mês)
              </h3>
            </div>
            <ModeSwitch mode={locationViewMode} onChange={setLocationViewMode} testIdPrefix="location-mode" />
          </div>

          <DeliveryHeatmap
            locationsRanking={locations?.ranking || []}
            mapStats={locations?.mapStats || null}
            heightClass="h-[290px] sm:h-[340px]"
            maxLocationsList={12}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-w-0 pt-2">
            <div className="xl:col-span-5 h-[220px] sm:h-[250px] bg-[#020D1A]/60 border border-white/10 rounded-[4px] p-3 min-w-0 w-full overflow-hidden">
              <Bar
                ref={locationsChartRef}
                data={locationsChartData}
                options={{ ...DARK_CHART_COMMON, indexAxis: 'y' }}
              />
            </div>

            <div className="xl:col-span-7 overflow-x-auto border border-white/10 rounded-[4px] min-w-0 max-w-full">
              <table className="w-full text-left border-collapse text-xs font-data-mono tabular-nums whitespace-nowrap">
                <thead>
                  <tr className="bg-[#020D1A] text-slate-400 uppercase text-[10px] border-b border-white/10">
                    <th className="py-2 px-3 font-hanken">Local / Região</th>
                    <th className="py-2 px-3 font-hanken">Categoria</th>
                    {locationViewMode === 'monthly' ? (
                      <>
                        {months.map((m) => (
                          <th key={m.monthKey} className="py-2 px-3 text-right">
                            {m.label}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-right text-[#00D4FF]">Total</th>
                        <th className="py-2 px-3 text-right text-emerald-400">Valor</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2 px-3 text-right">Entregas</th>
                        <th className="py-2 px-3 text-right">Share</th>
                        <th className="py-2 px-3 text-right">KM</th>
                        <th className="py-2 px-3 text-right">Valor Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(locations?.ranking || []).slice(0, 20).map((loc) => (
                    <tr key={loc.key} className="hover:bg-white/[0.03]">
                      <td className="py-2 px-3 font-hanken font-semibold text-white max-w-[210px] truncate" title={loc.label}>
                        {loc.label}
                      </td>
                      <td className="py-2 px-3 font-hanken text-[11px] text-slate-400">{loc.category}</td>
                      {locationViewMode === 'monthly' ? (
                        <>
                          {months.map((m) => {
                            const cell = loc.byMonth?.[m.monthKey];
                            return (
                              <td key={m.monthKey} className="py-2 px-3 text-right text-slate-300">
                                {cell ? cell.entregas : '0'}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{loc.entregas}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-300">
                            {formatCurrencyBRL(loc.valorTotal)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-right font-bold text-[#00D4FF]">{loc.entregas}</td>
                          <td className="py-2 px-3 text-right">{loc.sharePct.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-right">{loc.km.toFixed(1)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-300">
                            {formatCurrencyBRL(loc.valorTotal)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>,
    document.body
  );
}

