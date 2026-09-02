import React, { useEffect } from 'react';
import { Truck, Package, CheckCircle2, ArrowRight, X, Navigation, AlertTriangle } from 'lucide-react';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function PushNotificationBanner() {
  const { pushNotification, clearPushNotification, setSelectedDelivery, setDeliveryModalOpen, setSelectedCollection, setCollectionModalOpen } = useLogistics();

  useEffect(() => {
    if (!pushNotification) return;

    // Auto-dismiss after 9 seconds if not interacted
    const timer = setTimeout(() => {
      clearPushNotification();
    }, 9000);

    return () => clearTimeout(timer);
  }, [pushNotification, clearPushNotification]);

  if (!pushNotification) return null;

  const { title, message, type = 'delivery', item, isForMe = false } = pushNotification;

  const handleOpenItem = () => {
    if (type === 'delivery' && item) {
      setSelectedDelivery(item);
      setDeliveryModalOpen(true);
    } else if (type === 'collection' && item) {
      setSelectedCollection(item);
      setCollectionModalOpen(true);
    }
    clearPushNotification();
  };

  const isColeta = type === 'collection';
  const isConcluded = type === 'concluded';

  let bannerBorder = 'border-[#0081A7]/30';
  let badgeClass = 'bg-cyan-50 text-[#0081A7] border-[#0081A7]/40 font-bold';
  let avatarBg = 'bg-[#0081A7]/10 text-[#0081A7] border border-[#0081A7]/20';
  let IconComponent = Truck;

  if (isForMe) {
    bannerBorder = 'border-amber-300 ring-2 ring-amber-400/20';
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    avatarBg = 'bg-amber-50 text-amber-700 border border-amber-300';
    IconComponent = AlertTriangle;
  } else if (isColeta) {
    bannerBorder = 'border-[#2E97C2]/30';
    badgeClass = 'bg-sky-50 text-[#2E97C2] border-[#2E97C2]/40 font-bold';
    avatarBg = 'bg-[#2E97C2]/10 text-[#2E97C2] border border-[#2E97C2]/20';
    IconComponent = Package;
  } else if (isConcluded) {
    bannerBorder = 'border-emerald-300';
    badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    avatarBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    IconComponent = CheckCircle2;
  }

  return (
    <div className="fixed top-3 inset-x-0 z-[100] flex justify-center px-3 sm:px-6 pointer-events-none animate-in slide-in-from-top-4 duration-200">
      <div 
        onClick={handleOpenItem}
        className={`pointer-events-auto w-full max-w-lg rounded-[6px] bg-white ${bannerBorder} shadow-xl p-3.5 border flex items-start gap-3 cursor-pointer transition-all hover:shadow-2xl hover:bg-slate-50/90`}
      >
        {/* Icon Avatar */}
        <div className={`w-9 h-9 rounded-[4px] ${avatarBg} flex items-center justify-center shrink-0`}>
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9.5px] uppercase px-2 py-0.5 rounded-[3px] border ${badgeClass}`}>
              {isForMe ? '🚨 ATRIBUÍDO A VOCÊ' : (isColeta ? 'NOVA COLETA' : (isConcluded ? 'CONCLUÍDO' : 'NOVA ENTREGA'))}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Agora</span>
          </div>

          <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-snug truncate">
            {title}
          </h4>

          {message && (
            <p className="text-[11px] text-slate-600 font-normal line-clamp-2 mt-0.5 leading-relaxed">
              {message}
            </p>
          )}

          {/* Quick Action Hint */}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-[#0081A7]">
            <span className="flex items-center gap-1 hover:underline">
              <span>Ver detalhes</span>
              <ArrowRight className="w-3 h-3" />
            </span>
            {item?.endereco && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.endereco)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-sky-50 hover:bg-sky-100 text-sky-800 text-[10px] font-bold border border-sky-200 transition-colors"
              >
                <Navigation className="w-2.5 h-2.5 text-sky-700" />
                <span>Traçar Rota</span>
              </a>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            clearPushNotification();
          }}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-[4px] hover:bg-slate-100 transition-colors shrink-0"
          title="Fechar notificação"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
