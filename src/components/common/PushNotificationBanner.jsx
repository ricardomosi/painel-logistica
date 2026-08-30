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

  let bannerBg = 'bg-surface-container border-grid-line text-on-surface';
  let badgeColor = 'bg-primary-container/20 text-primary border-primary/30';
  let IconComponent = Truck;
  let iconColor = 'text-primary';

  if (isForMe) {
    bannerBg = 'bg-surface-container-high border-secondary-container/50 text-on-surface';
    badgeColor = 'bg-secondary-container/20 text-secondary border-secondary-container/40 font-bold';
    iconColor = 'text-secondary';
  } else if (isColeta) {
    bannerBg = 'bg-surface-container border-grid-line text-on-surface';
    badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold';
    IconComponent = Package;
    iconColor = 'text-emerald-400';
  } else if (isConcluded) {
    bannerBg = 'bg-surface-container border-grid-line text-on-surface';
    badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold';
    IconComponent = CheckCircle2;
    iconColor = 'text-emerald-400';
  }

  return (
    <div className="fixed top-3 inset-x-0 z-[100] flex justify-center px-3 sm:px-6 pointer-events-none animate-in slide-in-from-top-4 duration-200">
      <div 
        onClick={handleOpenItem}
        className={`pointer-events-auto w-full max-w-lg rounded-lg ${bannerBg} shadow-xl p-3.5 border backdrop-blur-xl flex items-start gap-3 cursor-pointer transition-all hover:bg-surface-container-high`}
      >
        {/* Icon Avatar */}
        <div className="w-9 h-9 rounded-md bg-surface-container-highest border border-grid-line flex items-center justify-center shrink-0">
          <IconComponent className={`w-4 h-4 ${iconColor}`} />
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
              {isForMe ? '🚨 ATRIBUÍDO A VOCÊ' : (isColeta ? 'NOVA COLETA' : (isConcluded ? 'CONCLUÍDO' : 'NOVA ENTREGA'))}
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">Agora</span>
          </div>

          <h4 className="text-xs font-bold text-on-surface tracking-tight leading-snug truncate">
            {title}
          </h4>

          {message && (
            <p className="text-[11px] text-on-surface-variant font-normal line-clamp-2 mt-0.5 leading-relaxed">
              {message}
            </p>
          )}

          {/* Quick Action Hint */}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-primary">
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
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[10px] border border-grid-line transition-colors"
              >
                <Navigation className="w-2.5 h-2.5 text-primary" />
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
          className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors shrink-0"
          title="Fechar notificação"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
