import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';

const TIPO_CONFIG = {
  'Envio': { 
    colorText: 'text-emerald-700 font-bold', 
    colorBgDesktop: 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold', 
    borderLeftClass: 'border-l-emerald-500', 
    icon: 'send' 
  },
  'Coleta': { 
    colorText: 'text-blue-700 font-bold', 
    colorBgDesktop: 'bg-blue-100 border-blue-300 text-blue-800 font-bold', 
    borderLeftClass: 'border-l-blue-500', 
    icon: 'call_received' 
  },
  'Visita': { 
    colorText: 'text-purple-700 font-bold', 
    colorBgDesktop: 'bg-purple-100 border-purple-300 text-purple-800 font-bold', 
    borderLeftClass: 'border-l-purple-500', 
    icon: 'group' 
  },
  'Cotação': { 
    colorText: 'text-amber-700 font-bold', 
    colorBgDesktop: 'bg-amber-100 border-amber-300 text-amber-900 font-bold', 
    borderLeftClass: 'border-l-amber-500', 
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
    openRomaneio 
  } = useLogistics();

  const isColeta = type === 'coleta';
  const isCompleted = item.status === 'concluido';
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

  // Styles based on status
  let borderLeftClass = isColeta ? 'border-l-emerald-500' : 'border-l-blue-500';
  let baseBg = 'bg-white shadow-xs hover:shadow-md';
  let borderColor = 'border-slate-200';
  let titleClass = 'text-slate-900';
  let opacityClass = 'opacity-100';

  if (isCompleted) {
    borderLeftClass = 'border-l-green-600';
    baseBg = 'bg-green-50/70';
    borderColor = 'border-green-300';
    titleClass = 'text-green-950 font-bold';
    opacityClass = 'opacity-95';
  } else if (hasOccurrence) {
    borderLeftClass = 'border-l-red-600';
    baseBg = 'bg-red-50/70';
    borderColor = 'border-red-300';
    titleClass = 'text-red-950 font-bold';
  } else if (isColeta && TIPO_CONFIG[item.tipo]) {
    borderLeftClass = TIPO_CONFIG[item.tipo].borderLeftClass;
  }

  // Concluded footer
  let conclusaoText = null;
  if (isCompleted && item.data_conclusao) {
    const colorC = (!isColeta && hasOccurrence) ? 'text-red-800 border-red-200 bg-red-100/50' : 'text-green-800 border-green-200 bg-green-100/50';
    conclusaoText = (
      <div className={`mt-1.5 p-1 rounded-md text-[9px] lg:text-[8px] font-bold flex items-center gap-1 border ${colorC}`}>
        <span className="material-symbols-outlined text-[12px]">done_all</span>
        <span>Concluído: {item.data_conclusao} às {item.hora_conclusao || '--:--'}</span>
      </div>
    );
  }

  // Config for Coleta
  const config = TIPO_CONFIG[item.tipo] || { 
    colorText: 'text-slate-800 font-bold', 
    colorBgDesktop: 'bg-slate-100 border-slate-300 text-slate-800 font-bold', 
    borderLeftClass: 'border-l-slate-400', 
    icon: 'check_box_outline_blank' 
  };

  return (
    <div
      draggable={!isMotorista}
      onDragStart={(e) => onDragStart && onDragStart(e, item.id)}
      onClick={handleClick}
      className={`glass-card ${baseBg} w-full relative group hover:shadow-lg transition-all cursor-pointer rounded-2xl p-3 lg:p-2 border border-l-[5px] ${borderLeftClass} ${borderColor} active:scale-[0.98] ${opacityClass}`}
    >
      <div className="flex w-full h-full">
        <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
          
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
                <span className={`hidden lg:flex text-[9px] font-bold px-1.5 py-0.5 rounded-md border items-center gap-1 shrink-0 ${config.colorBgDesktop}`}>
                  <span className="material-symbols-outlined text-[12px]">{config.icon}</span> 
                  <span>{item.tipo}</span>
                </span>
                
                <div className="flex items-center gap-1.5 shrink-0 ml-2 text-right">
                  {isCompleted && (
                    <span className="flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-green-600 text-white shadow-xs shrink-0" title="Coleta Concluída">
                      <span className="material-symbols-outlined text-[11px] sm:text-[12px] font-black">check</span>
                    </span>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] lg:text-[9px] font-bold text-slate-700">{dataExibicao}</span>
                    <span className="text-[9px] lg:text-[8px] font-semibold text-slate-500">{horaExibicao}</span>
                  </div>
                </div>
              </div>

              <h3 
                className={`text-sm lg:text-xs font-extrabold leading-tight break-words whitespace-normal w-full min-w-0 ${titleClass} mb-1.5`}
                style={{ wordBreak: 'break-word' }}
                title={item.fornecedor}
              >
                {item.fornecedor}
              </h3>

              <div className="flex flex-col gap-1 text-[11px] lg:text-[9px] text-slate-700 font-medium w-full min-w-0">
                {item.telefone && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-500">call</span>
                    <span className="font-semibold truncate text-slate-800">{item.telefone}</span>
                  </div>
                )}
                {item.placa && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-500">directions_car</span>
                    <span className="font-bold truncate text-slate-800">{item.placa}</span>
                  </div>
                )}
              </div>

              {conclusaoText}

              {item.responsavel && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-end w-full">
                  <span className="text-[9px] lg:text-[8px] font-extrabold text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px] text-slate-500">person</span>
                    {item.responsavel}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ================= ENTREGA CARD ================= */
            <div className="w-full min-w-0">
              <div className="flex justify-between items-start mb-1 w-full">
                <span className="hidden lg:flex text-[9px] font-bold px-1.5 py-0.5 rounded-md border items-center gap-1 shrink-0 bg-blue-100 border-blue-300 text-blue-900">
                  <span className="material-symbols-outlined text-[12px]">local_shipping</span> 
                  <span>Entrega</span>
                </span>
                <div className="flex lg:hidden items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-sm text-blue-700">local_shipping</span>
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Entrega</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0 ml-2 text-right">
                  {isCompleted && (
                    <span className="flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-green-600 text-white shadow-xs shrink-0" title="Entrega Concluída">
                      <span className="material-symbols-outlined text-[11px] sm:text-[12px] font-black">check</span>
                    </span>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] lg:text-[9px] font-bold text-slate-700">{dataExibicao}</span>
                    <span className="text-[9px] lg:text-[8px] font-semibold text-slate-500">{horaExibicao}</span>
                  </div>
                </div>
              </div>
              
              <h3 
                className={`text-sm lg:text-xs font-extrabold leading-tight break-words whitespace-normal w-full min-w-0 ${titleClass} mb-1.5`}
                style={{ wordBreak: 'break-word' }}
                title={item.cliente}
              >
                {item.cliente}
              </h3>
              
              <div className="flex flex-col gap-1 text-[11px] lg:text-[9.5px] text-slate-700 font-medium w-full min-w-0">
                {/* Endereço + Traçar Rota */}
                {item.endereco && (
                  <div className="flex items-start gap-1 w-full min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-500 mt-0.5 shrink-0">location_on</span> 
                    <div className="flex flex-col w-full min-w-0">
                      <span className="break-words whitespace-normal leading-tight min-w-0 w-full text-slate-800 font-semibold" style={{ wordBreak: 'break-word' }}>
                        {item.endereco}
                      </span>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.endereco)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} 
                        className="mt-1 self-start flex items-center gap-0.5 text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-300 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[11px]">directions</span>
                        Traçar Rota
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Placa e Frete */}
                <div className="flex flex-wrap items-center justify-between gap-1 w-full min-w-0 mt-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-slate-500 shrink-0">directions_car</span>
                    <span className="font-bold break-words whitespace-normal min-w-0 text-slate-800" style={{ wordBreak: 'break-word' }}>
                      {item.placa || 'Sem placa'}
                    </span>
                  </div>
                  {item.frete && !isMotorista ? (
                    <div className="font-extrabold text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px] shrink-0">payments</span>
                      <span>Frete: R$ {item.frete}</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Boleto e Telefone */}
                <div className="flex flex-wrap items-center justify-between gap-1 w-full min-w-0">
                  {item.boleto && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="material-symbols-outlined text-[13px] text-slate-500 shrink-0">receipt_long</span>
                      <span className="font-bold text-slate-700 font-mono" style={{ wordBreak: 'break-word' }}>
                        {item.boleto}
                      </span>
                    </div>
                  )}
                  {item.telefone && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="material-symbols-outlined text-[13px] text-slate-500 shrink-0">call</span>
                      <a 
                        href={`tel:${item.telefone.replace(/\D/g, '')}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-slate-700 hover:text-blue-600 transition-colors" 
                        style={{ wordBreak: 'break-word' }}
                      >
                        {item.telefone}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Footer Vendedor & Local Carregamento */}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200 w-full min-w-0 gap-2">
                  <span className={`font-extrabold text-[10px] ${item.vendedor && item.vendedor.includes('Filial') ? 'text-orange-700' : 'text-blue-700'} break-words whitespace-normal min-w-0`} style={{ wordBreak: 'break-word' }}>
                    {item.vendedor || 'Vendedor N/D'}
                  </span>
                  <span className="font-extrabold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[9px] shrink-0 whitespace-nowrap border border-slate-300">
                    {item.local_carregamento || 'MATRIZ'}
                  </span>
                </div>
              </div>

              {conclusaoText}

              {/* Action Romaneio (Desktop only for Gestor/Admin) & Cadastrador */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 w-full">
                {!isMotorista ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRomaneio(item);
                    }}
                    className="hidden lg:flex items-center gap-1 text-[9.5px] font-extrabold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-lg transition-colors shadow-xs active:scale-95 cursor-pointer"
                    title="Abrir e Emitir Romaneio de Carga"
                  >
                    <span className="material-symbols-outlined text-[12px] text-indigo-600">receipt_long</span>
                    <span>Romaneio</span>
                  </button>
                ) : <div />}

                {item.cadastrador_entrega && (
                  <span className="text-[9px] font-extrabold text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1 ml-auto">
                    <span className="material-symbols-outlined text-[10px] text-slate-500">person</span>
                    {item.cadastrador_entrega}
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
