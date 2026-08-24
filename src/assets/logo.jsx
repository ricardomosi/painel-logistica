import React from 'react';

export const OFFICIAL_LOGO_URL = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1761740142/jp-branco-300x181_wheyp9.png';

export default function Logo({ className = "h-11", showText = true, textClassName = "text-lg" }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Official Company Logo */}
      <img
        src={OFFICIAL_LOGO_URL}
        alt="J Patricio Metais"
        className={`${className} w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-200`}
        loading="eager"
      />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-wider text-white uppercase ${textClassName}`}>
              J PATRICIO
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-400/40 px-1.5 py-0.5 rounded shadow-sm">
              METAIS
            </span>
          </div>
          <span className="text-[10px] tracking-[0.22em] text-slate-300 uppercase font-semibold mt-1">
            LOGÍSTICA & DISTRIBUIÇÃO
          </span>
        </div>
      )}
    </div>
  );
}
