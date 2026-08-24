import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useLogistics } from '../../contexts/LogisticsContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).trim();
  if (str.includes('T')) return new Date(str);
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
  }
  return new Date(str);
}

function parseMonetaryValue(valStr) {
  if (typeof valStr === 'number') return valStr;
  if (!valStr) return 0;
  let str = String(valStr).trim();
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

const PLACAS_FILTER_OPTIONS = [
  'TODAS',
  'RGF9F21 (Jefferson)',
  'GVQ9436 (Jailson)',
  'QGT4I78 (Leandro)',
  'RGK9D89 (Fabio)',
  'RGK8J70 (Jucier)',
  'QGO-5D66 (Laercio)',
  'QGO-5D76 (Otoniel)',
  'RGF-9F11 (Ronys)',
  'OJW-0A50 (Genilson)',
  'TSW-3I57',
  'TSW-2F58 (Caninde)',
  'NOC-7041',
  'QGT-5D69 (Francinildo)',
  'TSW-7G98',
];

const VENDEDORES_FILTER_OPTIONS = [
  'TODAS',
  'BEBEZINHO (Filial)',
  'BRUNO (Matriz)',
  'CARLOS (Matriz)',
  'DANIEL HELIO (Matriz)',
  'DARLAN (Filial)',
  'JORGE (Matriz)',
  'LEONARDO (Matriz)',
  'MANOEL (Matriz)',
  'MARCOS (Matriz)',
  'PLASMA (Matriz)',
  'RODOLFO (Filial)',
];

export default function DashboardView() {
  const { deliveries, loadData } = useLogistics();

  // Filters State
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateStart, setDateStart] = useState(defaultStartDate);
  const [dateEnd, setDateEnd] = useState(defaultEndDate);
  const [selectedPlaca, setSelectedPlaca] = useState('TODAS');
  const [selectedVendedor, setSelectedVendedor] = useState('TODAS');
  const [custoKm, setCustoKm] = useState(5.24);

  // Compute all metrics based on historical deliveries
  const computed = useMemo(() => {
    const sF = parseDate(dateStart) || new Date(now.getFullYear(), now.getMonth(), 1);
    sF.setHours(0, 0, 0, 0);

    const eF = parseDate(dateEnd) || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    eF.setHours(23, 59, 59, 999);

    const diffTime = Math.abs(eF - sF);
    const prevEndFilter = new Date(sF.getTime() - 1);
    prevEndFilter.setHours(23, 59, 59, 999);
    const prevStartFilter = new Date(prevEndFilter.getTime() - diffTime);
    prevStartFilter.setHours(0, 0, 0, 0);

    const currentDeliveries = [];
    const previousDeliveries = [];

    deliveries.forEach(card => {
      const placaCard = card.placa || '';
      const vendedorCard = card.vendedor || '';

      if (selectedPlaca !== 'TODAS' && placaCard !== selectedPlaca) return;
      if (selectedVendedor !== 'TODAS' && vendedorCard !== selectedVendedor) return;

      const cardDate = parseDate(card.data_registro || card.created_at || card.data_inicio);
      if (!cardDate || isNaN(cardDate.getTime())) return;

      if (cardDate >= sF && cardDate <= eF) currentDeliveries.push(card);
      if (cardDate >= prevStartFilter && cardDate <= prevEndFilter) previousDeliveries.push(card);
    });

    // 1. Entregas
    const totalEntregas = currentDeliveries.length;
    const prevEntregas = previousDeliveries.length;
    const matrizCount = currentDeliveries.filter(c => c.local_carregamento === 'MATRIZ').length;
    const filialCount = currentDeliveries.filter(c => c.local_carregamento === 'FILIAL').length;

    let totalKm = 0, prevKm = 0, matrizKm = 0, filialKm = 0;
    let totalValor = 0, matrizValor = 0, filialValor = 0, prevTotalValor = 0;
    let totalFrete = 0, matrizFrete = 0, filialFrete = 0, prevTotalFrete = 0;

    let totalInFull = 0, inFullCount = 0;
    let totalOnTime = 0, onTimeCount = 0;
    let totalTempoMs = 0, completedCountForTime = 0;
    let prevTempoMs = 0, prevCompletedForTime = 0;

    const ofensoresPlaca = {};
    const veiculoStats = {};
    const vendStats = {};

    currentDeliveries.forEach(c => {
      const km = parseFloat(String(c.km_total || '0').replace(',', '.')) || 0;
      totalKm += km;

      const val = parseMonetaryValue(c.valor_entrega);
      const frete = parseMonetaryValue(c.frete);
      const totalComFrete = val + frete;

      totalValor += totalComFrete;
      totalFrete += frete;

      if (c.local_carregamento === 'MATRIZ') {
        matrizValor += totalComFrete;
        matrizFrete += frete;
        matrizKm += km;
      } else if (c.local_carregamento === 'FILIAL') {
        filialValor += totalComFrete;
        filialFrete += frete;
        filialKm += km;
      }

      const vend = c.vendedor || 'Não Informado';
      if (!vendStats[vend]) vendStats[vend] = { loc: c.local_carregamento || '-', total: 0, valor: 0 };
      vendStats[vend].total++;
      vendStats[vend].valor += totalComFrete;

      const placaDesc = c.placa || 'Sem Placa';
      if (!veiculoStats[placaDesc]) {
        veiculoStats[placaDesc] = { entregas: 0, km: 0, tempoMs: 0, concluidasTempo: 0 };
      }
      veiculoStats[placaDesc].entregas++;
      veiculoStats[placaDesc].km += km;

      if (c.status === 'concluido') {
        totalInFull++;
        const ocorrencia = c.como_foi_entrega || 'Sem ocorrências';

        if (ocorrencia === 'Sem ocorrências') {
          inFullCount++;
        } else {
          ofensoresPlaca[placaDesc] = (ofensoresPlaca[placaDesc] || 0) + 1;
        }

        if (c.data_inicio && c.data_conclusao) {
          totalOnTime++;
          const startDt = parseDate(c.data_inicio);
          if (c.hora_inicio && startDt) {
            const [hS, minS] = c.hora_inicio.split(':');
            startDt.setHours(parseInt(hS, 10) || 0, parseInt(minS, 10) || 0);
          }

          const endDt = parseDate(c.data_conclusao);
          if (c.hora_conclusao && endDt) {
            const [hE, minE] = c.hora_conclusao.split(':');
            endDt.setHours(parseInt(hE, 10) || 0, parseInt(minE, 10) || 0);
          }

          if (startDt && endDt) {
            const diffMs = endDt.getTime() - startDt.getTime();
            if (diffMs > 0) {
              totalTempoMs += diffMs;
              completedCountForTime++;
              veiculoStats[placaDesc].tempoMs += diffMs;
              veiculoStats[placaDesc].concluidasTempo++;

              if (diffMs <= 24 * 60 * 60 * 1000) onTimeCount++;
            }
          }
        }
      }
    });

    previousDeliveries.forEach(c => {
      const km = parseFloat(String(c.km_total || '0').replace(',', '.')) || 0;
      prevKm += km;

      const val = parseMonetaryValue(c.valor_entrega);
      const frete = parseMonetaryValue(c.frete);
      prevTotalValor += (val + frete);
      prevTotalFrete += frete;

      if (c.status === 'concluido' && c.data_inicio && c.data_conclusao) {
        const startDt = parseDate(c.data_inicio);
        if (c.hora_inicio && startDt) {
          const [hS, minS] = c.hora_inicio.split(':');
          startDt.setHours(parseInt(hS, 10) || 0, parseInt(minS, 10) || 0);
        }

        const endDt = parseDate(c.data_conclusao);
        if (c.hora_conclusao && endDt) {
          const [hE, minE] = c.hora_conclusao.split(':');
          endDt.setHours(parseInt(hE, 10) || 0, parseInt(minE, 10) || 0);
        }

        if (startDt && endDt && (endDt.getTime() - startDt.getTime()) > 0) {
          prevTempoMs += (endDt.getTime() - startDt.getTime());
          prevCompletedForTime++;
        }
      }
    });

    // 2. Costs
    const totalCost = totalKm * (parseFloat(custoKm) || 5.24);
    const prevCost = prevKm * (parseFloat(custoKm) || 5.24);
    const matrizCost = matrizKm * (parseFloat(custoKm) || 5.24);
    const filialCost = filialKm * (parseFloat(custoKm) || 5.24);

    // 3. Average Duration
    let avgTimeH = 0;
    let prevAvgTimeH = 0;
    if (completedCountForTime > 0) avgTimeH = (totalTempoMs / completedCountForTime) / (1000 * 60 * 60);
    if (prevCompletedForTime > 0) prevAvgTimeH = (prevTempoMs / prevCompletedForTime) / (1000 * 60 * 60);

    // 4. OTIF
    const onTimePct = totalOnTime > 0 ? (onTimeCount / totalOnTime) * 100 : 0;
    const inFullPct = totalInFull > 0 ? (inFullCount / totalInFull) * 100 : 0;
    const otifPct = (onTimePct / 100) * (inFullPct / 100) * 100;

    let maxErros = 0;
    let ofensorName = 'Nenhum Registro';
    for (const [placa, count] of Object.entries(ofensoresPlaca)) {
      if (count > maxErros) {
        maxErros = count;
        ofensorName = placa;
      }
    }

    // 5. Line chart volume by day
    const diasGrafico = {};
    currentDeliveries.forEach(c => {
      const d = parseDate(c.data_registro || c.created_at || c.data_inicio);
      if (!d) return;
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const fmt = `${dayStr}/${monthStr}`;
      diasGrafico[fmt] = (diasGrafico[fmt] || 0) + 1;
    });

    const labelsGrafico = Object.keys(diasGrafico).sort((a, b) => {
      const [da, ma] = a.split('/');
      const [db, mb] = b.split('/');
      return new Date(2020, parseInt(ma, 10) - 1, parseInt(da, 10)) - new Date(2020, parseInt(mb, 10) - 1, parseInt(db, 10));
    });
    const dataGrafico = labelsGrafico.map(l => diasGrafico[l]);

    // 6. Sellers ranking
    const vendArr = Object.entries(vendStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.valor - a.valor);

    // 7. Fleet ranking
    const veicArr = Object.entries(veiculoStats)
      .map(([placa, data]) => ({ placa, ...data }))
      .sort((a, b) => b.entregas - a.entregas);

    return {
      totalEntregas,
      prevEntregas,
      matrizCount,
      filialCount,
      totalKm,
      prevKm,
      totalCost,
      prevCost,
      matrizCost,
      filialCost,
      avgTimeH,
      prevAvgTimeH,
      totalValor,
      prevTotalValor,
      matrizValor,
      filialValor,
      totalFrete,
      prevTotalFrete,
      matrizFrete,
      filialFrete,
      onTimePct,
      inFullPct,
      otifPct,
      ofensorName,
      maxErros,
      labelsGrafico,
      dataGrafico,
      vendArr,
      veicArr,
    };
  }, [deliveries, dateStart, dateEnd, selectedPlaca, selectedVendedor, custoKm]);

  // MoM calculation helper
  const renderMoM = (current, prev, reverseColor = false) => {
    if (prev === 0) {
      if (current > 0) {
        return (
          <span className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${reverseColor ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            100% ↗
          </span>
        );
      }
      return <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">0%</span>;
    }
    const perc = ((current - prev) / prev) * 100;
    const absPerc = Math.abs(perc).toFixed(1);

    if (perc > 0) {
      return (
        <span className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${reverseColor ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
          {absPerc}% ↗
        </span>
      );
    } else if (perc < 0) {
      return (
        <span className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${reverseColor ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {absPerc}% ↘
        </span>
      );
    }
    return <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">0%</span>;
  };

  const otifCircleColor = computed.otifPct >= 90 ? '#10B981' : computed.otifPct >= 70 ? '#F59E0B' : '#EF4444';
  const otifStrokeDashoffset = 283 - (283 * (computed.otifPct / 100));

  const chartData = {
    labels: computed.labelsGrafico,
    datasets: [
      {
        label: 'Nº de Entregas',
        data: computed.dataGrafico,
        borderColor: '#00D4FF',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#172090',
        pointBorderColor: '#00D4FF',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
      },
    },
  };

  return (
    <div id="dashboard-view" className="h-full flex flex-col overflow-y-auto w-full font-inter p-4 lg:p-6 text-white transition-opacity duration-500 relative z-10 pb-32">
      
      {/* Page Title & Sincronizar button */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-cunia tracking-wider text-[#00D4FF] flex items-center gap-3">
            Análise de Entregas
            <button 
              onClick={loadData}
              className="text-[10px] font-inter bg-blue-600/20 text-[#00D4FF] border border-[#00D4FF]/30 px-2 py-1 rounded hover:bg-[#00D4FF]/20 transition flex items-center gap-1 focus:outline-none"
            >
              <span className="material-symbols-outlined text-[14px]">sync</span> Sincronizar Histórico
            </button>
          </h2>
          <p className="text-sm text-blue-200/70 mt-1">
            Métricas e performance logística baseadas em todo o histórico de entregas.
          </p>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="dash-card p-5 mb-6">
        <h3 className="text-sm font-bold text-[#00D4FF] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">tune</span> Filtros do Relatório
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-blue-200 mb-1 uppercase tracking-wider">Data Inicial</label>
            <input 
              type="date" 
              value={dateStart} 
              onChange={(e) => setDateStart(e.target.value)} 
              className="dash-input text-sm h-10"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-blue-200 mb-1 uppercase tracking-wider">Data Final</label>
            <input 
              type="date" 
              value={dateEnd} 
              onChange={(e) => setDateEnd(e.target.value)} 
              className="dash-input text-sm h-10"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-blue-200 mb-1 uppercase tracking-wider">Placa do Veículo</label>
            <select 
              value={selectedPlaca} 
              onChange={(e) => setSelectedPlaca(e.target.value)} 
              className="dash-input text-sm h-10"
            >
              {PLACAS_FILTER_OPTIONS.map((p) => (
                <option key={p} value={p}>{p === 'TODAS' ? 'Todas as Placas' : p}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-blue-200 mb-1 uppercase tracking-wider">Vendedor</label>
            <select 
              value={selectedVendedor} 
              onChange={(e) => setSelectedVendedor(e.target.value)} 
              className="dash-input text-sm h-10"
            >
              {VENDEDORES_FILTER_OPTIONS.map((v) => (
                <option key={v} value={v}>{v === 'TODAS' ? 'Todos os Vendedores' : v}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-blue-200 mb-1 uppercase tracking-wider">Custo do KM rodado</label>
            <input 
              type="number" 
              step="0.01" 
              value={custoKm} 
              onChange={(e) => setCustoKm(e.target.value)} 
              className="dash-input text-sm text-[#00D4FF] font-bold h-10"
            />
          </div>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
        
        {/* KPI 1: Entregas */}
        <div className="dash-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Entregas</p>
            <span className="material-symbols-outlined text-blue-400">local_shipping</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{computed.totalEntregas}</h3>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            {renderMoM(computed.totalEntregas, computed.prevEntregas)}
            <span className="text-blue-300/80">vs Período Ant.</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[10px] font-semibold text-blue-200">
            <span>Matriz: {computed.matrizCount}</span>
            <span>Filial: {computed.filialCount}</span>
          </div>
        </div>

        {/* KPI 2: KM Percorrido */}
        <div className="dash-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">KM Percorrido</p>
            <span className="material-symbols-outlined text-emerald-400">route</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            <span>{computed.totalKm.toLocaleString('pt-BR')}</span> <span className="text-sm font-normal text-emerald-200/70">km</span>
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            {renderMoM(computed.totalKm, computed.prevKm)}
            <span className="text-emerald-300/80">vs Período Ant.</span>
          </div>
        </div>

        {/* KPI 3: Custo Entrega */}
        <div className="dash-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-orange-200 uppercase tracking-wider">Custo Entrega</p>
            <span className="material-symbols-outlined text-orange-400">local_gas_station</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            <span className="text-sm font-normal text-orange-200/70">R$</span> {computed.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            {renderMoM(computed.totalCost, computed.prevCost, true)}
            <span className="text-orange-300/80">vs Período Ant.</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[10px] font-semibold text-orange-200">
            <span>Matriz: R$ {computed.matrizCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>Filial: R$ {computed.filialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* KPI 4: Tempo Médio */}
        <div className="dash-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Tempo Médio</p>
            <span className="material-symbols-outlined text-purple-400">timer</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {Math.floor(computed.avgTimeH)}h {Math.round((computed.avgTimeH % 1) * 60)}m
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            {renderMoM(computed.avgTimeH, computed.prevAvgTimeH, true)}
            <span className="text-purple-300/80">vs Período Ant.</span>
          </div>
        </div>

        {/* KPI 5: Valor das Entregas */}
        <div className="dash-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-yellow-200 uppercase tracking-wider">Valor das Entregas</p>
            <span className="material-symbols-outlined text-yellow-400">payments</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            <span className="text-sm font-normal text-yellow-200/70">R$</span> {computed.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            {renderMoM(computed.totalValor, computed.prevTotalValor)}
            <span className="text-yellow-300/80">vs Período Ant.</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[10px] font-semibold text-yellow-200">
            <span>Matriz: R$ {computed.matrizValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>Filial: R$ {computed.filialValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* KPI 6: Total Fretes */}
        <div className="dash-card p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-rose-200 uppercase tracking-wider">Total Fretes</p>
            <span className="material-symbols-outlined text-rose-400">local_shipping</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            <span className="text-sm font-normal text-rose-200/70">R$</span> {computed.totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-medium">
            {renderMoM(computed.totalFrete, computed.prevTotalFrete)}
            <span className="text-rose-300/80">vs Período Ant.</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[10px] font-semibold text-rose-200">
            <span>Matriz: R$ {computed.matrizFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>Filial: R$ {computed.filialFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>

      {/* OTIF & Volume Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* OTIF Gauge Card */}
        <div className="dash-card p-5 lg:col-span-1 flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <h3 className="text-sm font-bold text-[#00D4FF] mb-1">OTIF (On-Time In-Full)</h3>
          <p className="text-[10px] text-blue-200/80 mb-6">Eficiência das entregas: Feitas até 24h e sem ocorrências.</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle 
                  id="otif-circle" 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={otifCircleColor} 
                  strokeWidth="8" 
                  strokeDasharray="283" 
                  strokeDashoffset={otifStrokeDashoffset} 
                  className="transition-all duration-1000 ease-out" 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-cunia text-white">{Math.round(computed.otifPct)}%</span>
                <span className="text-[9px] font-bold text-[#00D4FF] tracking-widest uppercase">OTIF</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mb-4">
              <div className="text-center">
                <p className="text-[10px] text-emerald-300 font-semibold mb-0.5 uppercase tracking-wider">On-Time</p>
                <p className="text-lg font-bold text-white">{Math.round(computed.onTimePct)}%</p>
                <p className="text-[8px] text-slate-400">Em até 24h</p>
              </div>
              <div className="text-center border-l border-white/10">
                <p className="text-[10px] text-blue-300 font-semibold mb-0.5 uppercase tracking-wider">In-Full</p>
                <p className="text-lg font-bold text-white">{Math.round(computed.inFullPct)}%</p>
                <p className="text-[8px] text-slate-400">Sem Ocorrências</p>
              </div>
            </div>
            
            <div className="w-full bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
              <p className="text-[9px] text-red-200 uppercase font-bold tracking-widest mb-1">⚠️ Maior Ofensor de Ocorrências</p>
              <p className="text-sm font-bold text-white truncate">
                {computed.maxErros > 0 ? `${computed.ofensorName} (${computed.maxErros} Erros)` : 'Perfeito! Zero erros.'}
              </p>
            </div>
          </div>
        </div>

        {/* Volume Chart */}
        <div className="dash-card p-5 lg:col-span-2 flex flex-col relative h-[400px] lg:h-auto">
          <h3 className="text-sm font-bold text-[#00D4FF] mb-1">Volume de Entregas por Dia</h3>
          <p className="text-[10px] text-blue-200/80 mb-4">Acompanhamento diário dentro do período filtrado.</p>
          
          <div className="flex-1 relative w-full h-full min-h-[250px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* Sellers & Vehicles Performance Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        
        {/* Performance por Vendedor */}
        <div className="dash-card p-5 overflow-hidden">
          <h3 className="text-sm font-bold text-[#00D4FF] mb-1">Performance por Vendedor</h3>
          <p className="text-[10px] text-blue-200/80 mb-4">Volume financeiro de entregas registradas por equipe de vendas.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[10px] text-blue-300 uppercase font-bold tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3 text-right">Qtd Entregas</th>
                  <th className="px-4 py-3 text-right">Valor Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {computed.vendArr.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-slate-400">Nenhum dado encontrado no período</td>
                  </tr>
                ) : (
                  computed.vendArr.map(v => (
                    <tr key={v.name} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {v.name.replace(/\s*\((Matriz|Filial)\)/gi, '')}
                      </td>
                      <td className={`px-4 py-3 text-[10px] font-bold ${v.loc === 'MATRIZ' ? 'text-blue-400' : 'text-orange-400'}`}>
                        {v.loc}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#00D4FF]">
                        {v.total}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">
                        R$ {v.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance por Veículo */}
        <div className="dash-card p-5 overflow-hidden">
          <h3 className="text-sm font-bold text-[#00D4FF] mb-1">Performance por Veículo</h3>
          <p className="text-[10px] text-blue-200/80 mb-4">Ranking de eficiência de rota, tempo e custo da frota.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Placa / Veículo</th>
                  <th className="px-4 py-3 text-right">Entregas</th>
                  <th className="px-4 py-3 text-right">Tempo Médio</th>
                  <th className="px-4 py-3 text-right">KM Total</th>
                  <th className="px-4 py-3 text-right">Custo Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {computed.veicArr.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-400">Nenhum dado encontrado no período</td>
                  </tr>
                ) : (
                  computed.veicArr.map(v => {
                    const avgT = v.concluidasTempo > 0 ? (v.tempoMs / v.concluidasTempo) / (1000 * 60 * 60) : 0;
                    const timeStr = v.concluidasTempo > 0 ? `${Math.floor(avgT)}h ${Math.round((avgT % 1) * 60)}m` : '-';
                    const custoTotalVeic = v.km * (parseFloat(custoKm) || 5.24);

                    return (
                      <tr key={v.placa} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2 font-semibold text-white truncate max-w-[140px]" title={v.placa}>
                          {v.placa.split('(')[0].trim()}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-[#00D4FF]">
                          {v.entregas}
                        </td>
                        <td className="px-4 py-2 text-right text-purple-300 text-xs">
                          {timeStr}
                        </td>
                        <td className="px-4 py-2 text-right text-emerald-300 text-xs">
                          {v.km.toFixed(1)} km
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-orange-300 text-xs">
                          R$ {custoTotalVeic.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
