import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';

const TIPO_CONFIG = {
  'Envio': { 
    colorText: 'text-emerald-700 font-bold', 
    colorBgDesktop: 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold', 
    icon: 'send' 
  },
  'Coleta': { 
    colorText: 'text-blue-700 font-bold', 
    colorBgDesktop: 'bg-blue-50 border-blue-200 text-blue-800 font-semibold', 
    icon: 'call_received' 
  },
  'Visita': { 
    colorText: 'text-purple-700 font-bold', 
    colorBgDesktop: 'bg-purple-50 border-purple-200 text-purple-800 font-semibold', 
    icon: 'group' 
  },
  'Cotação': { 
    colorText: 'text-amber-700 font-bold', 
    colorBgDesktop: 'bg-amber-50 border-amber-200 text-amber-900 font-semibold', 
    icon: 'paid' 
  },
};

export default function KanbanCard({ item, type = 'entrega', onDragStart }) {
  const { isMotorista } = useAuth();
  const { 
    setSelectedDelivery, 
    setDeliveryModalOpen, 
    setSelectedCollection, 
    setCollectionModalOpen,
    toggleDeliveryUrgent,
    toggleCollectionUrgent
  } = useLogistics();

  const isColeta = type === 'coleta';
  const isCompleted = item.status === 'concluido';
  const isUrgent = !!item.urgente;
  const isAtualizacoes = (item.coluna || '').includes('atualizacoes');
  const hasOccurrence = !isColeta && item.como_foi_entrega && item.como_foi_entrega !== 'Sem ocorrências';

  const handleClick = () => {
    if (isColeta) {
      setSelectedCollection(item);
      setCollectionModalOpen(true);
    } else {
      setSelectedDelivery(item);
      setDeliveryModalOpen(true);
    }
  };

  const handleToggleUrgent = (e) => {
    e.stopPropagation();
    if (isColeta) {
      toggleCollectionUrgent(item.id, isUrgent);
    } else {
      toggleDeliveryUrgent(item.id, isUrgent);
    }
  };

  // Date and Time formatting
  const rawDate = item.data_registro || item.created_at || '';
  let dataExibicao = '';
  if (rawDate) {
    const parts = rawDate.split('T')[0].split('-');
    if (parts.length === 3) {
      dataExibicao = `${parts[2]}/${parts[1]}`;
    }
  }

  const rawHora = item.hora_registro || '';
  let horaExibicao = '';
  if (rawHora) {
    const hParts = rawHora.split(':');
    if (hParts.length >= 2) {
      horaExibicao = `${hParts[0]}:${hParts[1]}`;
    }
  }

  // Concluded Date & Time formatting
  let dataConclusaoFmt = '';
  if (item.data_conclusao) {
    const parts = item.data_conclusao.split('-');
    if (parts.length === 3) {
      dataConclusaoFmt = `${parts[2]}/${parts[1]}`;
    } else {
      dataConclusaoFmt = item.data_conclusao;
    }
  }

  let horaConclusaoFmt = '';
  if (item.hora_conclusao) {
    const hParts = item.hora_conclusao.split(':');
    if (hParts.length >= 2) {
      horaConclusaoFmt = `${hParts[0]}:${hParts[1]}`;
    } else {
      horaConclusaoFmt = item.hora_conclusao;
    }
  }

  // Styles based on status (Stable colors, no color changes on mouse hover)
  let baseBg = 'bg-[#FFFFFF] shadow-2xs';
  let borderColor = 'border-slate-200/90';
  let titleClass = 'text-slate-900 font-bold';
  let opacityClass = 'opacity-100';

  if (isCompleted) {
    baseBg = 'bg-[#EEF9F3] shadow-2xs';
    borderColor = 'border-emerald-200/80';
    titleClass = 'text-[#14532d] font-bold line-through';
    opacityClass = 'opacity-95';
  } else if (isUrgent) {
    baseBg = 'bg-[#FFFFFF] shadow-2xs ring-1 ring-rose-200';
    borderColor = 'border-rose-300';
    titleClass = 'text-slate-900 font-bold';
  } else if (hasOccurrence) {
    baseBg = 'bg-[#FFFFFF] shadow-2xs ring-1 ring-amber-200';
    borderColor = 'border-amber-300';
    titleClass = 'text-slate-900 font-bold';
  }

  // Config for Coleta
  const config = TIPO_CONFIG[item.tipo] || { 
    colorText: 'text-slate-800 font-semibold', 
    colorBgDesktop: 'bg-slate-50 border-slate-200 text-slate-800 font-semibold', 
    icon: 'check_box_outline_blank' 
  };

  return (
    <div
      draggable={!isMotorista}
      onDragStart={(e) => onDragStart && onDragStart(e, item.id)}
      onClick={handleClick}
      className={`w-full relative cursor-pointer rounded-[4px] p-2.5 lg:p-2 border ${borderColor} ${baseBg} active:scale-[0.99] ${opacityClass} font-inter`}
    >
      <div className="flex w-full h-full">
        <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
          
          {isColeta ? (
            /* ================= COLETA CARD ================= */
            <div className="w-full min-w-0">
              <div className="flex justify-between items-center mb-1.5 w-full gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  {/* Mobile Type */}
                  <div className="flex lg:hidden items-center gap-1 shrink-0">
                    <span className={`material-symbols-outlined text-sm ${config.colorText}`}>{config.icon}</span>
                    <span className={`text-[11px] font-bold ${config.colorText} uppercase tracking-wider`}>{item.tipo}</span>
                  </div>
                  {/* Desktop Type */}
                  <span className={`hidden lg:flex text-[9px] font-semibold px-1.5 py-0.5 rounded-[3px] border items-center gap-1 shrink-0 ${config.colorBgDesktop}`}>
                    <span className="material-symbols-outlined text-[12px]">{config.icon}</span> 
                    <span>{item.tipo}</span>
                  </span>

                  {isUrgent && !isCompleted && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold uppercase tracking-wider shrink-0">
                      <span>URGENTE</span>
                    </span>
                  )}

                  {isCompleted && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-[9px] font-bold shrink-0">
                      <span className="material-symbols-outlined text-[11px] text-emerald-800 font-bold">check_circle</span>
                      <span>Concluído</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {!isMotorista && !isCompleted && (
                    <button
                      type="button"
                      onClick={handleToggleUrgent}
                      title={isUrgent ? 'Remover urgência' : 'Marcar como Urgente'}
                      className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                        isUrgent 
                          ? 'text-rose-600 hover:bg-rose-50' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isUrgent ? 'local_fire_department' : 'outlined_flag'}
                      </span>
                    </button>
                  )}
                  <div className="flex items-center text-right">
                    <span className="text-[10px] lg:text-[9px] font-semibold text-slate-500">{dataExibicao}</span>
                    {horaExibicao && (
                      <span className="text-[9px] lg:text-[8px] text-slate-400 ml-1 font-mono">{horaExibicao}</span>
                    )}
                  </div>
                </div>
              </div>

              <h3 
                className={`text-xs leading-tight break-words whitespace-normal w-full min-w-0 ${titleClass} mb-1`}
                style={{ wordBreak: 'break-word' }}
                title={item.fornecedor}
              >
                {item.fornecedor}
              </h3>

              <div className="flex flex-col gap-1 text-[11px] lg:text-[9.5px] text-slate-700 font-medium w-full min-w-0">
                {/* Endereço + Traçar Rota */}
                {item.endereco && (
                  <div className="flex items-start gap-1 w-full min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-400 mt-0.5 shrink-0">location_on</span> 
                    <div className="flex flex-col w-full min-w-0">
                      <span className="break-words whitespace-normal leading-tight min-w-0 w-full text-slate-700 font-medium" style={{ wordBreak: 'break-word' }}>
                        {item.endereco}
                      </span>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.endereco)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} 
                        className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5 mt-0.5 w-fit text-[10px]"
                      >
                        <span>Traçar rota</span>
                        <span className="material-symbols-outlined text-[11px]">directions</span>
                      </a>
                    </div>
                  </div>
                )}
                {item.telefone && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-400">call</span>
                    <span className="font-medium truncate text-slate-700">{item.telefone}</span>
                  </div>
                )}
                {item.placa && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-400">directions_car</span>
                    <span className="font-semibold truncate text-slate-800">{item.placa}</span>
                  </div>
                )}
              </div>

              {/* Concluded Info */}
              {isCompleted && item.data_conclusao && (
                <div className="mt-1.5 pt-1 border-t border-emerald-200/60 flex items-center justify-between text-[9px] text-emerald-800 font-semibold">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px] text-emerald-700">done_all</span>
                    <span>Concluído: {dataConclusaoFmt} {horaConclusaoFmt && `às ${horaConclusaoFmt}`}</span>
                  </div>
                </div>
              )}

              {item.responsavel && (
                <div className="mt-1.5 pt-1 border-t border-slate-100 flex justify-end w-full">
                  <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-[3px] uppercase tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px] text-slate-400">person</span>
                    {item.responsavel}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ================= ENTREGA CARD ================= */
            <div className="w-full min-w-0">
              <div className="flex justify-between items-center mb-1.5 w-full gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="hidden lg:flex text-[9px] font-semibold px-1.5 py-0.5 rounded-[3px] border items-center gap-1 shrink-0 bg-blue-50 border-blue-200 text-blue-800">
                    <span className="material-symbols-outlined text-[12px]">local_shipping</span> 
                    <span>Entrega</span>
                  </span>
                  <div className="flex lg:hidden items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-sm text-blue-700">local_shipping</span>
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Entrega</span>
                  </div>

                  {isUrgent && !isCompleted && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold uppercase tracking-wider shrink-0">
                      <span>URGENTE</span>
                    </span>
                  )}

                  {isCompleted && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-[9px] font-bold shrink-0">
                      <span className="material-symbols-outlined text-[11px] text-emerald-800 font-bold">check_circle</span>
                      <span>Concluído</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {!isMotorista && !isCompleted && (
                    <button
                      type="button"
                      onClick={handleToggleUrgent}
                      title={isUrgent ? 'Remover urgência' : 'Marcar como Urgente'}
                      className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                        isUrgent 
                          ? 'text-rose-600 hover:bg-rose-50' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isUrgent ? 'local_fire_department' : 'outlined_flag'}
                      </span>
                    </button>
                  )}
                  <div className="flex items-center text-right">
                    <span className="text-[10px] lg:text-[9px] font-semibold text-slate-500">{dataExibicao}</span>
                    {horaExibicao && (
                      <span className="text-[9px] lg:text-[8px] text-slate-400 ml-1 font-mono">{horaExibicao}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 
                className={`text-xs leading-tight break-words whitespace-normal w-full min-w-0 ${titleClass} mb-1`}
                style={{ wordBreak: 'break-word' }}
                title={item.cliente}
              >
                {item.cliente}
              </h3>
              
              <div className="flex flex-col gap-1 text-[11px] lg:text-[9.5px] text-slate-700 font-medium w-full min-w-0">
                {/* Endereço + Traçar Rota */}
                {item.endereco && (
                  <div className="flex items-start gap-1 w-full min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-400 mt-0.5 shrink-0">location_on</span> 
                    <div className="flex flex-col w-full min-w-0">
                      <span className="break-words whitespace-normal leading-tight min-w-0 w-full text-slate-700 font-medium" style={{ wordBreak: 'break-word' }}>
                        {item.endereco}
                      </span>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.endereco)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} 
                        className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5 mt-0.5 w-fit text-[10px]"
                      >
                        <span>Traçar rota</span>
                        <span className="material-symbols-outlined text-[11px]">directions</span>
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Placa e Frete */}
                <div className="flex flex-wrap items-center justify-between gap-1 w-full min-w-0 mt-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">directions_car</span>
                    <span className="font-semibold break-words whitespace-normal min-w-0 text-slate-800" style={{ wordBreak: 'break-word' }}>
                      {item.placa || 'Sem placa'}
                    </span>
                  </div>
                  {item.frete && !isMotorista ? (
                    <div className="font-bold text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-[3px] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px] shrink-0">payments</span>
                      <span>Frete: R$ {item.frete}</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Boleto e Telefone */}
                <div className="flex flex-wrap items-center justify-between gap-1 w-full min-w-0">
                  {item.boleto && !isMotorista && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">receipt_long</span>
                      <span className="font-semibold text-slate-600 font-mono" style={{ wordBreak: 'break-word' }}>
                        {item.boleto}
                      </span>
                    </div>
                  )}
                  {item.telefone && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">call</span>
                      <a 
                        href={`tel:${item.telefone.replace(/\D/g, '')}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-slate-600 hover:text-blue-600 transition-colors" 
                        style={{ wordBreak: 'break-word' }}
                      >
                        {item.telefone}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Footer Vendedor & Local Carregamento */}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 w-full min-w-0 gap-2">
                  <span className="font-semibold text-[10px] text-slate-700 break-words whitespace-normal min-w-0" style={{ wordBreak: 'break-word' }}>
                    {item.vendedor || 'Vendedor N/D'}
                  </span>
                  <span className="font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-[3px] text-[9px] shrink-0 whitespace-nowrap border border-slate-200">
                    {item.local_carregamento || 'MATRIZ'}
                  </span>
                </div>
              </div>

              {/* Concluded Info */}
              {isCompleted && item.data_conclusao && (
                <div className="mt-1.5 pt-1 border-t border-emerald-200/60 flex items-center justify-between text-[9px] text-emerald-800 font-semibold">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px] text-emerald-700">done_all</span>
                    <span>Concluído: {dataConclusaoFmt} {horaConclusaoFmt && `às ${horaConclusaoFmt}`}</span>
                  </div>
                  {hasOccurrence && (
                    <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded-[2px] text-[8.5px] font-semibold">
                      {item.como_foi_entrega}
                    </span>
                  )}
                </div>
              )}

              {item.cadastrador_entrega && (
                <div className="mt-1.5 pt-1 border-t border-slate-100 flex justify-end w-full">
                  <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-[3px] uppercase tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px] text-slate-400">person</span>
                    {item.cadastrador_entrega}
                  </span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
