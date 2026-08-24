import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';

const TIPO_CONFIG = {
  'Envio': { colorText: 'text-blue-600', colorBgDesktop: 'bg-blue-100 border-blue-200 text-blue-800', borderLeftClass: 'border-l-blue-500', icon: 'local_shipping' },
  'Troca': { colorText: 'text-amber-600', colorBgDesktop: 'bg-amber-100 border-amber-200 text-amber-800', borderLeftClass: 'border-l-amber-400', icon: 'sync_alt' },
  'Retirada': { colorText: 'text-emerald-600', colorBgDesktop: 'bg-emerald-100 border-emerald-200 text-emerald-800', borderLeftClass: 'border-l-emerald-500', icon: 'inventory_2' },
  'Busca': { colorText: 'text-purple-600', colorBgDesktop: 'bg-purple-100 border-purple-200 text-purple-800', borderLeftClass: 'border-l-purple-500', icon: 'travel_explore' },
};

export default function KanbanCard({ item, type = 'entrega', onDragStart }) {
  const { isMotorista } = useAuth();
  const { 
    setSelectedDelivery, 
    setDeliveryModalOpen, 
    setSelectedCollection, 
    setCollectionModalOpen,
    openRomaneio 
  } = useLogistics();

  const isColeta = type === 'coleta';
  const isCompleted = item.status === 'concluido';
  const hasOccurrence = isCompleted && item.como_foi_entrega && item.como_foi_entrega !== 'Sem ocorrências' && item.como_foi_entrega !== '';

  const handleClick = () => {
    if (isColeta) {
      setSelectedCollection(item);
      setCollectionModalOpen(true);
    } else {
      setSelectedDelivery(item);
      setDeliveryModalOpen(true);
    }
  };

  // Determine border-l color
  let borderLeftClass = 'border-l-slate-400';
  if (isColeta) {
    const conf = TIPO_CONFIG[item.tipo] || { borderLeftClass: 'border-l-slate-400' };
    borderLeftClass = conf.borderLeftClass;
  } else {
    if (item.local_carregamento === 'MATRIZ') {
      borderLeftClass = 'border-l-blue-500';
    } else if (item.local_carregamento === 'FILIAL') {
      borderLeftClass = 'border-l-orange-500';
    } else {
      borderLeftClass = 'border-l-indigo-400';
    }
  }

  // Base background & border styling
  let baseBg = 'bg-white';
  let borderColor = 'border-t-slate-200 border-r-slate-200 border-b-slate-200';
  let titleClass = 'text-slate-800';
  const opacityClass = isCompleted ? 'opacity-90' : '';

  if (isCompleted) {
    if (!isColeta && hasOccurrence) {
      baseBg = 'bg-red-50';
      borderColor = 'border-t-red-300 border-r-red-300 border-b-red-300';
      titleClass = 'text-red-900 line-through opacity-80';
    } else {
      baseBg = 'bg-green-50';
      borderColor = 'border-t-green-300 border-r-green-300 border-b-green-300';
      titleClass = 'text-green-900 line-through opacity-80';
    }
  }

  // Check icon in top corner
  let checkIcon = null;
  if (isCompleted) {
    if (!isColeta && hasOccurrence) {
      checkIcon = (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md z-10">
          <span className="material-symbols-outlined text-[12px] block">warning</span>
        </div>
      );
    } else {
      checkIcon = (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md z-10">
          <span className="material-symbols-outlined text-[12px] block">check</span>
        </div>
      );
    }
  }

  // Date and Time formatted
  const dataExibicao = item.data_registro || (item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '--/--/----');
  const horaExibicao = item.hora_registro || (item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--');

  // Concluded footer
  let conclusaoText = null;
  if (isCompleted && item.data_conclusao) {
    const colorC = (!isColeta && hasOccurrence) ? 'text-red-700 border-red-100' : 'text-green-700 border-green-100';
    conclusaoText = (
      <div className={`mt-1 text-[9px] lg:text-[7.5px] xl:text-[8px] font-bold flex flex-col gap-1 border-t pt-1 ${colorC}`}>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[11px] lg:text-[9px]">done_all</span>
          <span>Finalizado: {item.data_conclusao} às {item.hora_conclusao || '--:--'}</span>
        </div>
      </div>
    );
  }

  // Config for Coleta
  const config = TIPO_CONFIG[item.tipo] || { 
    colorText: 'text-slate-600', 
    colorBgDesktop: 'bg-slate-100 border-slate-200 text-slate-800', 
    borderLeftClass: 'border-l-slate-400', 
    icon: 'check_box_outline_blank' 
  };

  return (
    <div
      draggable={!isMotorista}
      onDragStart={(e) => onDragStart && onDragStart(e, item.id)}
      onClick={handleClick}
      className={`glass-card ${baseBg} w-full relative group hover:shadow-lg lg:hover:shadow-md transition-all cursor-pointer rounded-xl p-3 lg:p-1.5 xl:p-2 border border-l-[4px] ${borderLeftClass} ${borderColor} active:scale-95 ${opacityClass}`}
    >
      {checkIcon}

      <div className="flex w-full h-full">
        <div className="flex-1 min-w-0 pl-1 lg:pl-0 w-full flex flex-col justify-between h-full">
          
          {isColeta ? (
            /* ================= COLETA CARD ================= */
            <div className="w-full min-w-0">
              <div className="flex justify-between items-start mb-1 w-full">
                {/* Mobile Type */}
                <div className="flex lg:hidden items-center gap-1 shrink-0">
                  <span className={`material-symbols-outlined text-sm ${config.colorText}`}>{config.icon}</span>
                  <span className={`text-[11px] font-bold ${config.colorText} uppercase tracking-wider`}>{item.tipo}</span>
                </div>
                {/* Desktop Type */}
                <span className={`hidden lg:flex text-[9px] font-semibold px-1 py-0.5 rounded-md border items-center gap-1 shrink-0 ${config.colorBgDesktop}`}>
                  <span className="material-symbols-outlined text-[12px]">{config.icon}</span> 
                  <span className="hidden xl:inline">{item.tipo}</span>
                </span>
                
                <div className="flex flex-col items-end shrink-0 ml-2 text-right">
                  <span className="text-[10px] lg:text-[8.5px] font-bold text-slate-600">{dataExibicao}</span>
                  <span className="text-[9px] lg:text-[8px] font-medium text-slate-400">{horaExibicao}</span>
                </div>
              </div>

              <h3 
                className={`text-[14px] lg:text-[10.5px] xl:text-[11.5px] font-bold leading-tight break-words whitespace-normal w-full min-w-0 ${titleClass} mb-1`}
                style={{ wordBreak: 'break-word' }}
                title={item.fornecedor}
              >
                {item.fornecedor}
              </h3>

              <div className="flex flex-col gap-0.5 text-[11px] lg:text-[8.5px] xl:text-[9px] text-slate-500 w-full min-w-0">
                {item.telefone && (
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="material-symbols-outlined text-[12px] lg:text-[10px]">call</span>
                    <span className="font-medium truncate">{item.telefone}</span>
                  </div>
                )}
                {item.placa && (
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="material-symbols-outlined text-[12px] lg:text-[10px]">directions_car</span>
                    <span className="font-medium truncate">{item.placa}</span>
                  </div>
                )}
              </div>

              {conclusaoText}

              {item.responsavel && (
                <div className="mt-1.5 flex justify-end w-full">
                  <span className="text-[9px] lg:text-[7.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">person</span>
                    {item.responsavel}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ================= ENTREGA CARD ================= */
            <div className="w-full min-w-0">
              <div className="flex justify-between items-start mb-1 w-full">
                <span className="hidden lg:flex text-[9px] font-semibold px-1 py-0.5 rounded-md border items-center gap-1 shrink-0 bg-indigo-100 border-indigo-200 text-indigo-800">
                  <span className="material-symbols-outlined text-[12px]">local_shipping</span> 
                  <span className="hidden xl:inline">Entrega</span>
                </span>
                <div className="flex lg:hidden items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-sm text-indigo-600">local_shipping</span>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Entrega</span>
                </div>
                
                <div className="flex flex-col items-end shrink-0 ml-2 text-right">
                  <span className="text-[10px] lg:text-[8.5px] font-bold text-slate-600">{dataExibicao}</span>
                  <span className="text-[9px] lg:text-[8px] font-medium text-slate-400">{horaExibicao}</span>
                </div>
              </div>
              
              <h3 
                className={`text-[14px] lg:text-[10.5px] xl:text-[11.5px] font-bold leading-tight break-words whitespace-normal w-full min-w-0 ${titleClass} mb-1`}
                style={{ wordBreak: 'break-word' }}
                title={item.cliente}
              >
                {item.cliente}
              </h3>
              
              <div className="flex flex-col gap-0.5 text-[11px] lg:text-[8.5px] xl:text-[9px] text-slate-500 w-full min-w-0">
                {/* Endereço + Traçar Rota */}
                {item.endereco && (
                  <div className="flex items-start gap-1 w-full min-w-0">
                    <span className="material-symbols-outlined text-[12px] lg:text-[10px] mt-0.5 shrink-0">location_on</span> 
                    <div className="flex flex-col w-full min-w-0">
                      <span className="break-words whitespace-normal leading-tight min-w-0 w-full" style={{ wordBreak: 'break-word' }}>
                        {item.endereco}
                      </span>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.endereco)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} 
                        className="mt-0.5 self-start flex items-center gap-0.5 text-[9px] lg:text-[8px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[10px]">directions</span>
                        Traçar Rota
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Placa e Frete */}
                <div className="flex flex-wrap items-start justify-between gap-y-0.5 gap-x-2 w-full min-w-0 mt-0.5">
                  <div className="flex items-start gap-1 min-w-0">
                    <span className="material-symbols-outlined text-[12px] lg:text-[10px] mt-[1px] shrink-0">directions_car</span>
                    <span className="font-medium break-words whitespace-normal min-w-0" style={{ wordBreak: 'break-word' }}>
                      {item.placa || 'Sem placa'}
                    </span>
                  </div>
                  {item.frete ? (
                    <div className="max-w-full font-bold text-[8.5px] lg:text-[7.5px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded shadow-sm border border-slate-200 flex items-start gap-0.5">
                      <span className="material-symbols-outlined text-[9px] shrink-0 mt-[1px]">payments</span>
                      <span className="break-words whitespace-normal min-w-0" style={{ wordBreak: 'break-word' }}>
                        Frete: R$ {item.frete}
                      </span>
                    </div>
                  ) : null}
                </div>
                
                {/* Boleto e Telefone */}
                <div className="flex flex-wrap items-start justify-between gap-y-0.5 gap-x-2 w-full min-w-0">
                  {item.boleto && (
                    <div className="flex items-start gap-1 min-w-0">
                      <span className="material-symbols-outlined text-[12px] lg:text-[10px] mt-[1px] shrink-0">receipt_long</span>
                      <span className="font-medium break-words whitespace-normal min-w-0" style={{ wordBreak: 'break-word' }}>
                        {item.boleto}
                      </span>
                    </div>
                  )}
                  {item.telefone && (
                    <div className="flex items-start gap-1 min-w-0">
                      <span className="material-symbols-outlined text-[12px] lg:text-[10px] mt-[1px] shrink-0">call</span>
                      <span className="font-medium break-words whitespace-normal min-w-0" style={{ wordBreak: 'break-word' }}>
                        {item.telefone}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Footer Vendedor & Local Carregamento */}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 w-full min-w-0 gap-2">
                  <span className={`font-bold ${item.vendedor && item.vendedor.includes('Matriz') ? 'text-blue-600' : 'text-orange-600'} break-words whitespace-normal min-w-0`} style={{ wordBreak: 'break-word' }}>
                    {item.vendedor ? item.vendedor.replace(/\s*\((Matriz|Filial)\)/gi, '') : ''}
                  </span>
                  <span className="font-bold bg-slate-200 text-slate-700 px-1 py-0.5 rounded text-[8px] lg:text-[7.5px] shrink-0 whitespace-nowrap">
                    {item.local_carregamento || ''}
                  </span>
                </div>
              </div>

              {conclusaoText}

              {/* Action Romaneio & Cadastrador */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRomaneio(item);
                  }}
                  className="flex items-center gap-1 text-[9px] lg:text-[8px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition-colors shadow-xs active:scale-95"
                  title="Abrir e Emitir Romaneio de Carga"
                >
                  <span className="material-symbols-outlined text-[11px] lg:text-[9.5px]">receipt_long</span>
                  <span>Romaneio</span>
                </button>

                {item.cadastrador_entrega && (
                  <span className="text-[9px] lg:text-[7.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">person</span>
                    {item.cadastrador_entrega}
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      
      <div className="hidden lg:block absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/10 rounded-xl pointer-events-none transition-colors" />
    </div>
  );
}
