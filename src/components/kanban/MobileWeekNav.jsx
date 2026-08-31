import React from 'react';

const TITULOS_MOBILE = {
  atualizacoes: 'Atualizações',
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado'
};

const SHORT_DAYS = [
  { key: 'segunda', label: 'Seg', dayOffset: 0 },
  { key: 'terca', label: 'Ter', dayOffset: 1 },
  { key: 'quarta', label: 'Qua', dayOffset: 2 },
  { key: 'quinta', label: 'Qui', dayOffset: 3 },
  { key: 'sexta', label: 'Sex', dayOffset: 4 },
  { key: 'sabado', label: 'Sáb', dayOffset: 5 },
];

export default function MobileWeekNav({ columns, activeColumnKey, onSelectColumn, itemCounts = {} }) {
  return (
    <>
      {/* NAVEGAÇÃO ABAS DIAS DA SEMANA (Mobile) */}
      <div id="mobile-days-nav" className="w-full pb-2 px-1 sm:px-2 z-10 lg:hidden shrink-0 transition-opacity duration-300">
        <div className="grid grid-cols-[1.1fr_repeat(6,1fr)] gap-1 w-full font-inter pt-2">
          
          {/* Atualizações Tab Button */}
          <button 
            type="button"
            onClick={() => onSelectColumn('atualizacoes')} 
            className={`w-full h-[52px] rounded-[4px] flex flex-col items-center justify-center relative transition-all ${
              activeColumnKey === 'atualizacoes'
                ? 'bg-[#1E293B] text-white border border-[#334155] font-bold shadow-xs'
                : 'bg-white/90 border border-slate-300/80 text-slate-800 shadow-2xs'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">inbox</span>
            {itemCounts['atualizacoes'] > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white z-10">
                {itemCounts['atualizacoes']}
              </div>
            )}
          </button>

          {/* Days Seg to Sab */}
          {SHORT_DAYS.map((d) => {
            const col = columns.find(c => c.key === d.key);
            const isTarget = activeColumnKey === d.key;
            const count = itemCounts[d.key] || 0;
            const dayNum = col?.date ? new Date(col.date).getDate() : '--';

            return (
              <button 
                key={d.key}
                type="button"
                onClick={() => onSelectColumn(d.key)} 
                className={`w-full h-[52px] rounded-[4px] flex flex-col items-center justify-center relative transition-all ${
                  isTarget
                    ? 'bg-[#0081A7] text-white border border-[#006c8c] font-bold shadow-xs'
                    : 'bg-white/90 border border-slate-300/80 text-slate-800 shadow-2xs'
                }`}
              >
                <span className={`text-[9px] uppercase tracking-wider font-label-caps ${
                  isTarget ? 'text-cyan-100 font-bold' : 'text-slate-600'
                }`}>
                  {d.label}
                </span>

                <span className={`text-[15px] font-data-mono font-bold leading-tight ${
                  isTarget ? 'text-white' : 'text-slate-900'
                }`}>
                  {dayNum}
                </span>

                {count > 0 && (
                  <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold z-10 ${
                    isTarget ? 'bg-white text-[#0081A7]' : 'bg-[#1E293B] text-white'
                  }`}>
                    {count}
                  </div>
                )}
              </button>
            );
          })}

        </div>
      </div>

      {/* Título Dinâmico Mobile Acima dos Cards */}
      <div id="mobile-col-title-container" className="lg:hidden flex items-center justify-between px-3 pt-2 pb-1 shrink-0 font-inter">
        <h2 className="text-sm font-bold text-slate-900 tracking-wide" id="mobile-col-title">
          {TITULOS_MOBILE[activeColumnKey] || 'Atualizações'}
        </h2>
      </div>
    </>
  );
}
