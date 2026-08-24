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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Total Entregas */}
      <div className="p-5 rounded-3xl glass-panel border border-cyan-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Entregas</span>
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {totalDeliveries}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-400 font-semibold">{completedDeliveries} concluídas</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-400 font-semibold">{inProgressDeliveries} em rota</span>
          </div>
        </div>

        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
      </div>

      {/* 2. OTIF Rate */}
      <div className="p-5 rounded-3xl glass-panel border border-emerald-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Índice OTIF</span>
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-3xl font-black text-emerald-300 font-mono tracking-tight">
            {otifRate}%
          </div>
          <div className="mt-2 text-xs text-slate-400">
            On-Time In-Full (Entregas sem desvio)
          </div>
        </div>

        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
      </div>

      {/* 3. Total Coletas */}
      <div className="p-5 rounded-3xl glass-panel border border-pink-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-pink-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Coletas & Retiradas</span>
          <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-3xl font-black text-pink-300 font-mono tracking-tight">
            {totalCollections}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-pink-400 font-semibold">{completedCollections} realizadas</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{totalCollections - completedCollections} pendentes</span>
          </div>
        </div>

        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all" />
      </div>

      {/* 4. Financial or Fleet KM */}
      {!isMotorista ? (
        <div className="p-5 rounded-3xl glass-panel border border-amber-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Carga & Frete Total</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Fretes: <strong className="text-cyan-400">R$ {totalFreight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
        </div>
      ) : (
        <div className="p-5 rounded-3xl glass-panel border border-cyan-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quilometragem</span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Gauge className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black text-cyan-300 font-mono tracking-tight">
              {totalKm} km
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Total rodado nas entregas
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
