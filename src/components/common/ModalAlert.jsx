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
      color: 'text-primary bg-primary/10 border-primary/20',
      btn: 'bg-primary-container hover:bg-primary text-on-primary-container',
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      btn: 'bg-secondary-container hover:bg-secondary text-white',
    },
    error: {
      icon: AlertCircle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white',
    },
  }[type] || {
    icon: Info,
    color: 'text-primary bg-primary/10 border-primary/20',
    btn: 'bg-primary-container hover:bg-primary text-on-primary-container',
  };

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-deep/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md p-5 overflow-hidden rounded-lg bg-surface-container border border-grid-line shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-lg border shrink-0 ${config.color}`}>
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-sm font-bold text-on-surface tracking-wide">
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end pt-3 border-t border-grid-line">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${config.btn}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
