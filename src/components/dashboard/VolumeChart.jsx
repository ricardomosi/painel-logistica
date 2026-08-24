import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function VolumeChart() {
  const { deliveries, collections } = useLogistics();

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayKeys = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

  const deliveriesPerDay = dayKeys.map(key => {
    return deliveries.filter(d => d.coluna === key || (d.coluna && d.coluna.startsWith(`${key}|`))).length;
  });

  const collectionsPerDay = dayKeys.map(key => {
    return collections.filter(c => c.coluna_kanban === key || (c.coluna_kanban && c.coluna_kanban.startsWith(`${key}|`))).length;
  });

  const data = {
    labels: days,
    datasets: [
      {
        type: 'bar',
        label: 'Entregas Agendadas',
        data: deliveriesPerDay,
        backgroundColor: 'rgba(0, 212, 255, 0.75)',
        borderRadius: 8,
        barThickness: 16,
      },
      {
        type: 'bar',
        label: 'Coletas / Retiradas',
        data: collectionsPerDay,
        backgroundColor: 'rgba(238, 174, 202, 0.75)',
        borderRadius: 8,
        barThickness: 16,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Space Grotesk', size: 12, weight: 'bold' },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(2, 0, 36, 0.9)',
        titleColor: '#00D4FF',
        bodyColor: '#ffffff',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Space Grotesk', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', stepSize: 1, font: { family: 'Space Grotesk', size: 11 } },
      },
    },
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Volume Semanal por Dia
          </h3>
        </div>
      </div>

      <div className="h-64 sm:h-72">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
