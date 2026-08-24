import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Award, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function OtifGauge() {
  const { deliveries } = useLogistics();

  const completed = deliveries.filter(d => d.status === 'concluido');
  const perfect = completed.filter(d => {
    if (!d.como_foi_entrega) return true;
    const t = d.como_foi_entrega.toLowerCase();
    return !t.includes('problema') && !t.includes('avaria') && !t.includes('atraso') && !t.includes('recusa') && !t.includes('devolu');
  });

  const rate = completed.length > 0 
    ? Math.round((perfect.length / completed.length) * 100) 
    : 100;

  const data = {
    labels: ['Concluídas sem Avaria/Atraso', 'Com Ocorrências'],
    datasets: [
      {
        data: [rate, Math.max(0, 100 - rate)],
        backgroundColor: [
          rate >= 90 ? '#10b981' : rate >= 75 ? '#f59e0b' : '#ef4444',
          'rgba(255, 255, 255, 0.08)'
        ],
        borderWidth: 0,
        circumference: 240,
        rotation: 240,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Performance OTIF
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300">
          {completed.length} Entregas
        </span>
      </div>

      <div className="relative flex items-center justify-center my-4 h-48">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-6">
          <span className="text-4xl font-black text-white font-mono">{rate}%</span>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mt-1">
            {rate >= 90 ? 'Excelente' : rate >= 75 ? 'Regular' : 'Atenção'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">Perfeitas: <strong>{perfect.length}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300 font-medium">Ressalvas: <strong>{completed.length - perfect.length}</strong></span>
        </div>
      </div>
    </div>
  );
}
