import React from 'react';
import { Truck, User, Gauge, CheckCircle2 } from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function FleetTable() {
  const { vehicles, drivers, deliveries } = useLogistics();

  // Aggregate metrics per vehicle
  const fleetData = vehicles.map(vehicle => {
    const vehDeliveries = deliveries.filter(d => d.placa === vehicle.placa);
    const completed = vehDeliveries.filter(d => d.status === 'concluido').length;
    const totalKm = vehDeliveries.reduce((sum, d) => sum + (Number(d.km_total) || 0), 0);
    const assignedDriver = drivers.find(d => d.id === vehicle.motorista_padrao_id);

    return {
      id: vehicle.id,
      placa: vehicle.placa,
      modelo: vehicle.modelo || 'Caminhão Padrão',
      driverName: assignedDriver?.nome || 'Rotativo',
      deliveriesCount: vehDeliveries.length,
      completed,
      totalKm,
      ativo: vehicle.ativo !== false,
    };
  });

  return (
    <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Utilização e Eficiência da Frota
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {vehicles.length} Veículos Cadastrados
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
            <tr>
              <th className="p-3">Veículo / Placa</th>
              <th className="p-3">Motorista Padrão</th>
              <th className="p-3 text-center">Entregas</th>
              <th className="p-3 text-right">KM Total</th>
              <th className="p-3 text-center">Status Frota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {fleetData.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">
                  Nenhum veículo cadastrado
                </td>
              </tr>
            ) : (
              fleetData.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                        {item.placa}
                      </span>
                      <span className="text-slate-400 text-[11px]">{item.modelo}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-300 font-medium">
                    {item.driverName}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-300">
                    <span className="text-white">{item.completed}</span> / {item.deliveriesCount}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-cyan-300">
                    {item.totalKm} km
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.ativo 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {item.ativo ? 'Operando' : 'Inativo'}
                    </span>
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
