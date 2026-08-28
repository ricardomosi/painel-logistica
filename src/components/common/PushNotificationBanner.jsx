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

  let bannerGradient = 'from-blue-600 to-indigo-700 text-white';
  let badgeColor = 'bg-blue-500/30 text-white border-blue-400/40';
  let IconComponent = Truck;

  if (isForMe) {
    bannerGradient = 'from-amber-600 via-orange-600 to-red-600 text-white shadow-orange-500/30';
    badgeColor = 'bg-white/20 text-white border-white/30 font-black';
  } else if (isColeta) {
    bannerGradient = 'from-emerald-600 to-teal-700 text-white';
    badgeColor = 'bg-emerald-500/30 text-white border-emerald-400/40';
    IconComponent = Package;
  } else if (isConcluded) {
    bannerGradient = 'from-green-600 to-emerald-700 text-white';
    badgeColor = 'bg-green-500/30 text-white border-green-400/40';
    IconComponent = CheckCircle2;
  }

  return (
    <div className="fixed top-3 inset-x-0 z-[100] flex justify-center px-3 sm:px-6 pointer-events-none animate-in slide-in-from-top-6 duration-300">
      <div 
        onClick={handleOpenItem}
        className={`pointer-events-auto w-full max-w-lg rounded-2xl bg-gradient-to-r ${bannerGradient} shadow-2xl p-4 border border-white/20 backdrop-blur-xl flex items-start gap-3.5 cursor-pointer transform active:scale-[0.99] transition-all hover:shadow-cyan-500/20`}
      >
        {/* Icon Avatar */}
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner ring-1 ring-white/30">
          <IconComponent className="w-5 h-5 text-white" />
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {isForMe ? '🚨 ATRIBUÍDO A VOCÊ' : (isColeta ? 'NOVA COLETA' : (isConcluded ? 'CONCLUÍDO' : 'NOVA ENTREGA'))}
            </span>
            <span className="text-[10px] text-white/80 font-medium">Agora</span>
          </div>

          <h4 className="text-sm font-bold text-white tracking-tight leading-snug truncate">
            {title}
          </h4>

          {message && (
            <p className="text-xs text-white/90 font-medium line-clamp-2 mt-0.5 leading-relaxed">
              {message}
            </p>
          )}

          {/* Quick Action Hint */}
          <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-white/95">
            <span className="flex items-center gap-1 underline underline-offset-2">
              <span>Toque para ver detalhes</span>
              <ArrowRight className="w-3 h-3" />
            </span>
            {item?.endereco && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.endereco)}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[10px] transition-colors"
              >
                <Navigation className="w-2.5 h-2.5" />
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
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          title="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
