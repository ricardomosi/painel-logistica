import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useLogistics();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-[6px] border transition-all transform animate-in slide-in-from-bottom-3 duration-200 bg-white shadow-lg ${
              isSuccess
                ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                : isError
                ? 'border-rose-300 bg-rose-50/90 text-rose-950'
                : isWarning
                ? 'border-amber-300 bg-amber-50/90 text-amber-950'
                : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-[#0081A7] shrink-0" />}
              <span className="text-xs font-semibold leading-snug">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-[4px] text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
