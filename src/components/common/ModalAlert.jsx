import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function ModalAlert({
  isOpen,
  title = 'Aviso',
  message = '',
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  onClose,
}) {
  if (!isOpen) return null;

  const config = {
    info: {
      icon: Info,
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      btn: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      btn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    },
    error: {
      icon: AlertCircle,
      color: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white',
    },
  }[type] || {
    icon: Info,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    btn: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
  };

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-panel border border-slate-700/60 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${config.color}`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white tracking-wide">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all shadow-lg ${config.btn}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
