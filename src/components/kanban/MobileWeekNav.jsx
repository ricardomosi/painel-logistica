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
        <div className="grid grid-cols-[1.2fr_repeat(6,1fr)] gap-1 w-full font-space pt-2">
          
          {/* Atualizações Tab Button */}
          <button 
            type="button"
            onClick={() => onSelectColumn('atualizacoes')} 
            className={`mobile-tab-btn w-full h-[65px] rounded-[14px] flex flex-col items-center justify-center relative transition-all group ${
              activeColumnKey === 'atualizacoes'
                ? 'bg-white shadow-md scale-105 border border-white text-slate-800'
                : 'bg-white/80 backdrop-blur-md text-slate-800 border border-white/60 shadow-sm opacity-80'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] text-blue-600">inbox</span>
            <div className="mobile-tab-badge absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white border border-[#80DCFB] shadow-sm z-10">
              {itemCounts['atualizacoes'] || 0}
            </div>
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
                className={`mobile-tab-btn w-full h-[65px] rounded-[14px] flex flex-col items-center justify-center relative backdrop-blur-md transition-all group ${
                  isTarget
                    ? 'bg-white shadow-md scale-105 border border-white'
                    : 'bg-white/40 border border-white/50 opacity-90'
                }`}
              >
                <span className={`text-[9px] font-bold mb-0.5 uppercase tracking-tighter ${
                  isTarget ? 'text-blue-600' : 'text-slate-700'
                }`}>
                  {d.label}
                </span>

                <span className={`text-[18px] font-extrabold mobile-date ${
                  isTarget ? 'text-[#0066FF]' : 'text-slate-800'
                }`}>
                  {dayNum}
                </span>

                {isTarget && (
                  <div className="indicator-dot absolute bottom-1 w-1 h-1 rounded-full bg-[#0066FF]" />
                )}

                {count > 0 && (
                  <div className="mobile-tab-badge absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#334155] flex items-center justify-center text-[9px] font-bold text-white border border-[#88DEFB] z-10 shadow-sm">
                    {count}
                  </div>
                )}
              </button>
            );
          })}

        </div>
      </div>

      {/* Título Dinâmico Mobile Acima dos Cards */}
      <div id="mobile-col-title-container" className="lg:hidden flex items-center justify-between px-4 pt-2 pb-1 shrink-0 font-space transition-opacity duration-300">
        <h2 className="text-lg font-bold text-slate-800 tracking-wide transition-colors duration-500" id="mobile-col-title">
          {TITULOS_MOBILE[activeColumnKey] || 'Atualizações'}
        </h2>
      </div>
    </>
  );
}
