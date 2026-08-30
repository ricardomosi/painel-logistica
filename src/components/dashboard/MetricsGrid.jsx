import React from 'react';
import { Truck, Package, CheckCircle2, TrendingUp, DollarSign, Gauge } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function MetricsGrid() {
  const { isMotorista } = useAuth();
  const { deliveries, collections } = useLogistics();

  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter(d => d.status === 'concluido').length;
  const inProgressDeliveries = deliveries.filter(d => d.status === 'em_andamento').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'pendente').length;

  const totalCollections = collections.length;
  const completedCollections = collections.filter(c => c.status === 'concluido').length;

  // OTIF Calculation (Deliveries without issues)
  const perfectDeliveries = deliveries.filter(d => {
    if (d.status !== 'concluido') return false;
    if (!d.como_foi_entrega) return true;
    const txt = d.como_foi_entrega.toLowerCase();
    return !txt.includes('problema') && !txt.includes('avaria') && !txt.includes('atraso') && !txt.includes('recusa') && !txt.includes('devolu');
  }).length;

  const otifRate = completedDeliveries > 0 
    ? Number(((perfectDeliveries / completedDeliveries) * 100).toFixed(1)) 
    : 100;

  // Financial calculations (Admin / Gestor only)
  const totalRevenue = deliveries.reduce((acc, d) => acc + (Number(d.valor_entrega) || 0), 0);
  const totalFreight = deliveries.reduce((acc, d) => acc + (Number(d.frete) || 0), 0);
  const totalKm = deliveries.reduce((acc, d) => acc + (Number(d.km_total) || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      
      {/* 1. Total Entregas */}
      <div className="p-4 rounded-lg bg-surface-container border border-grid-line flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-label-caps">Total Entregas</span>
          <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2">
          <div className="text-2xl font-bold text-on-surface font-data-mono tracking-tight">
            {totalDeliveries}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="text-emerald-400 font-medium">{completedDeliveries} concluídas</span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="text-primary font-medium">{inProgressDeliveries} em rota</span>
          </div>
        </div>
      </div>

      {/* 2. OTIF Rate */}
      <div className="p-4 rounded-lg bg-surface-container border border-grid-line flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-label-caps">Índice OTIF</span>
          <div className="p-2 rounded bg-surface-container-high text-emerald-400 border border-grid-line">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2">
          <div className="text-2xl font-bold text-emerald-400 font-data-mono tracking-tight">
            {otifRate}%
          </div>
          <div className="mt-1.5 text-xs text-on-surface-variant">
            On-Time In-Full (Entregas sem desvio)
          </div>
        </div>
      </div>

      {/* 3. Total Coletas */}
      <div className="p-4 rounded-lg bg-surface-container border border-grid-line flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-label-caps">Coletas & Retiradas</span>
          <div className="p-2 rounded bg-surface-container-high text-secondary border border-grid-line">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2">
          <div className="text-2xl font-bold text-secondary font-data-mono tracking-tight">
            {totalCollections}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="text-secondary font-medium">{completedCollections} realizadas</span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="text-on-surface-variant">{totalCollections - completedCollections} pendentes</span>
          </div>
        </div>
      </div>

      {/* 4. Financial or Fleet KM */}
      {!isMotorista ? (
        <div className="p-4 rounded-lg bg-surface-container border border-grid-line flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-label-caps">Carga & Frete Total</span>
            <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xl font-bold text-on-surface font-data-mono tracking-tight">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1.5 text-xs text-on-surface-variant">
              Fretes: <strong className="text-primary font-medium">R$ {totalFreight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-surface-container border border-grid-line flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-label-caps">Quilometragem</span>
            <div className="p-2 rounded bg-surface-container-high text-primary border border-grid-line">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-2xl font-bold text-primary font-data-mono tracking-tight">
              {totalKm} km
            </div>
            <div className="mt-1.5 text-xs text-on-surface-variant">
              Total rodado nas entregas
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
