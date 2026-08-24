import React from 'react';

export default function Logo({ className = "h-9", textClassName = "text-xl", showText = true }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative flex items-center justify-center">
        <svg
          className={`${className} aspect-square animate-glow`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="50%" stopColor="#38a8f8" />
              <stop offset="100%" stopColor="#090979" />
            </linearGradient>
            <linearGradient id="metalGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>
          
          {/* Outer hexagon/rounded shield */}
          <rect x="6" y="6" width="88" height="88" rx="22" fill="rgba(2, 0, 36, 0.85)" stroke="url(#brandGrad)" strokeWidth="4" />
          
          {/* J shape with modern metallic cut */}
          <path
            d="M32 26 H68 V42 H54 V62 C54 70 48 75 38 75 C28 75 22 69 22 61 H34 C34 64 36 66 38 66 C41 66 43 64 43 61 V26 Z"
            fill="url(#brandGrad)"
          />
          {/* Futuristic dot / accent */}
          <circle cx="68" cy="62" r="10" fill="#00D4FF" />
          <circle cx="68" cy="62" r="5" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-400 uppercase ${textClassName}`}>
              J PATRICIO
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
              METAIS
            </span>
          </div>
          <span className="text-[10px] tracking-[0.25em] text-slate-400 uppercase font-semibold mt-1">
            LOGÍSTICA ENTERPRISE
          </span>
        </div>
      )}
    </div>
  );
}
