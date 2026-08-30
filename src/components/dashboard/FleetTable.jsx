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
    <div className="bg-surface-container border border-grid-line rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-grid-line flex items-center justify-between bg-surface-container-low/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-on-surface text-xs uppercase tracking-wider font-label-caps">
            Utilização e Eficiência da Frota
          </h3>
        </div>
        <span className="text-[11px] text-on-surface-variant font-data-mono">
          {vehicles.length} Veículos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-grid-line bg-surface-container-lowest/70 text-on-surface-variant font-label-caps uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">VEÍCULO / PLACA</th>
              <th className="py-2.5 px-4">MOTORISTA PADRÃO</th>
              <th className="py-2.5 px-4 text-center">ENTREGAS</th>
              <th className="py-2.5 px-4 text-right">KM TOTAL</th>
              <th className="py-2.5 px-4 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grid-line text-on-surface">
            {fleetData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                  Nenhum veículo cadastrado
                </td>
              </tr>
            ) : (
              fleetData.map((item) => (
                <tr key={item.id} className="border-b border-grid-line hover:bg-primary-container/5 transition-colors group">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-data-mono font-bold border border-grid-line text-[11px]">
                        {item.placa}
                      </span>
                      <span className="text-on-surface-variant text-[11px]">{item.modelo}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-on-surface font-medium">
                    {item.driverName}
                  </td>
                  <td className="py-2.5 px-4 text-center font-data-mono font-medium text-on-surface">
                    <span className="text-primary font-bold">{item.completed}</span> / {item.deliveriesCount}
                  </td>
                  <td className="py-2.5 px-4 text-right font-data-mono font-bold text-on-surface">
                    {item.totalKm} km
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      item.ativo 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-surface-container-highest text-on-surface-variant border border-grid-line'
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
