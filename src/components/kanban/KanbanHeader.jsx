import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';
import { useSound } from '../../contexts/SoundContext';
import { LOGO_COLETAS, LOGO_ENTREGAS } from '../../assets/logo';

export function KanbanHeader({ weekNav }) {
  const { user, profile, role, switchRole, isAdmin, isGestor, isMotorista, signOut } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const { 
    activeTab, 
    setActiveTab, 
    clearBoard,
    setDeliveryModalOpen,
    setSelectedDelivery,
    setCollectionModalOpen,
    setSelectedCollection,
    deliveries,
    drivers,
    showAlert,
    addToast,
    notificationService
  } = useLogistics();

  const { formattedWeekRange } = weekNav;

  const currentLogo = activeTab === 'coletas' ? LOGO_COLETAS : LOGO_ENTREGAS;

  const handleSwitchBoard = (type) => {
    if (type === 'dashboard' && !isAdmin && !isGestor) {
      showAlert({ title: 'Acesso Restrito', message: 'A aba de Relatórios é exclusiva para Gestores e Administradores.' });
      return;
    }
    setActiveTab(type);
  };

  const handleOpenNewModal = () => {
    if (activeTab === 'coletas') {
      setSelectedCollection(null);
      setCollectionModalOpen(true);
    } else {
      setSelectedDelivery(null);
      setDeliveryModalOpen(true);
    }
  };


  const userDisplayName = profile?.nome || (user?.email ? user.email.split('@')[0].toUpperCase() : 'USUÁRIO');
  const userRoleLabel = isAdmin ? 'Admin' : isGestor ? 'Gestor' : 'Motorista';
  const roleBadgeClass = isAdmin 
    ? 'bg-amber-100 text-amber-900 border-amber-300' 
    : isGestor 
    ? 'bg-blue-100 text-blue-900 border-blue-300' 
    : 'bg-emerald-100 text-emerald-900 border-emerald-300';

  return (
    <>
      {/* ============================================== */}
      {/* CABEÇALHO MOBILE                               */}
      {/* ============================================== */}
      {/* CABEÇALHO MOBILE                               */}
      {/* ============================================== */}
      <header className="flex lg:hidden flex-col px-3 pt-2.5 pb-2 shrink-0 z-20 gap-2 bg-surface/90 backdrop-blur-md border-b border-grid-line">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Transparent Dynamic Logo */}
            <img 
              src={currentLogo} 
              alt="J Patricio Metais" 
              className="h-10 sm:h-11 w-auto object-contain bg-transparent drop-shadow-sm shrink-0"
            />
            <div className="flex flex-col leading-none min-w-0">
              <h1 className="font-cunia text-sm sm:text-base font-bold tracking-tight text-primary truncate">
                Gestão Logística
              </h1>
              <span className="text-[11px] text-on-surface-variant font-medium truncate max-w-[150px] mt-0.5">
                {userDisplayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sound Toggle */}
            <button 
              id="btn-sound-mob" 
              onClick={toggleSound} 
              className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors focus:outline-none shrink-0 ${
                soundEnabled 
                  ? 'bg-primary-container/20 border-primary/40 text-primary' 
                  : 'bg-surface-container-high border-grid-line text-on-surface-variant'
              }`}
              title="Ligar/Desligar Som"
            >
              <span className="material-symbols-outlined text-base">
                {soundEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>

            {/* Logout / Switch Account */}
            <button
              onClick={signOut}
              className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              title="Sair / Trocar Conta"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>

            {/* Notification Activation Button on Mobile */}
            {notificationService.isSupported() && notificationService.getPermission() !== 'granted' && (
              <button
                type="button"
                onClick={async () => {
                  const p = await notificationService.requestPermission();
                  if (p === 'granted') {
                    addToast('Notificações no celular ativadas com sucesso!', 'success');
                  } else {
                    showAlert({ title: 'Permissão de Notificação', message: 'Permita as notificações nas configurações do seu navegador para receber alertas na barra do celular.' });
                  }
                }}
                className="h-8 px-2.5 rounded-lg bg-secondary-container text-white font-bold text-[10px] flex items-center gap-1"
                title="Ativar Notificações no Celular"
              >
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                <span>Ativar Alertas</span>
              </button>
            )}

            {/* Add Button */}
            {!isMotorista && activeTab !== 'dashboard' && activeTab !== 'admin' && (
              <button 
                id="btn-add-mob" 
                onClick={handleOpenNewModal} 
                className="h-8 w-8 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-bold flex items-center justify-center transition-colors focus:outline-none shrink-0"
                title={activeTab === 'coletas' ? 'Nova Coleta' : 'Nova Entrega'}
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle Bar Mobile */}
        <div className="flex bg-surface-container-lowest rounded-lg p-1 border border-grid-line w-full">
          <button 
            onClick={() => handleSwitchBoard('coletas')} 
            id="btn-tab-coleta-mob" 
            className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-colors relative ${
              activeTab === 'coletas' ? 'bg-[#2563EB] text-white' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Coletas
          </button>
          
          <button 
            onClick={() => handleSwitchBoard('entregas')} 
            id="btn-tab-entrega-mob" 
            className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-colors relative ${
              activeTab === 'entregas' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Entregas
          </button>

          {(isAdmin || isGestor) && (
            <button 
              onClick={() => handleSwitchBoard('dashboard')} 
              id="btn-tab-relatorio-mob" 
              className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-colors ${
                activeTab === 'dashboard' ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Relatórios
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => handleSwitchBoard('admin')} 
              className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-colors ${
                activeTab === 'admin' ? 'bg-secondary-container text-white font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Admin
            </button>
          )}
        </div>
      </header>

      {/* ============================================== */}
      {/* CABEÇALHO DESKTOP                              */}
      {/* ============================================== */}
      <header className="hidden lg:flex bg-surface/90 backdrop-blur-md border-b border-grid-line px-6 py-2.5 justify-between items-center shrink-0 z-10 gap-3">
        <div className="flex items-center gap-4">
          {/* Transparent Dynamic Logo */}
          <img 
            src={currentLogo} 
            alt="J Patricio Metais" 
            className="h-11 xl:h-12 w-auto object-contain bg-transparent drop-shadow-sm hover:opacity-95 transition-opacity"
          />
          
          <div className="flex flex-col justify-center border-l border-grid-line pl-4">
            <h1 className="font-cunia text-lg font-bold text-primary leading-tight">
              Gestão Semanal Logística
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-on-surface-variant leading-tight">
                Patricio Metais • Controle Operacional
              </span>
              
              <div className="flex bg-surface-container-lowest rounded-lg p-1 border border-grid-line">
                <button 
                  onClick={() => handleSwitchBoard('coletas')} 
                  id="btn-tab-coleta-desk" 
                  className={`text-xs font-bold px-3.5 py-1 rounded-md transition-colors ${
                    activeTab === 'coletas' ? 'bg-[#2563EB] text-white' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Coletas
                </button>
                
                <button 
                  onClick={() => handleSwitchBoard('entregas')} 
                  id="btn-tab-entrega-desk" 
                  className={`text-xs font-bold px-3.5 py-1 rounded-md transition-colors ${
                    activeTab === 'entregas' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Entregas
                </button>

                {(isAdmin || isGestor) && (
                  <button 
                    onClick={() => handleSwitchBoard('dashboard')} 
                    id="btn-tab-relatorio-desk" 
                    className={`text-xs font-bold px-3.5 py-1 rounded-md transition-colors ${
                      activeTab === 'dashboard' ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Relatórios & KPIs
                  </button>
                )}

                {isAdmin && (
                  <button 
                    onClick={() => handleSwitchBoard('admin')} 
                    className={`text-xs font-bold px-3.5 py-1 rounded-md transition-colors ${
                      activeTab === 'admin' ? 'bg-secondary-container text-white font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-on-surface font-medium bg-surface-container border border-grid-line px-3 py-1.5 rounded-lg flex items-center gap-1.5" id="week-display">
              <span className="text-on-surface-variant">📅</span> {formattedWeekRange}
            </span>

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2 pl-2 border-l border-grid-line">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container border border-grid-line">
                <span className="material-symbols-outlined text-lg text-primary">account_circle</span>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-semibold text-on-surface truncate max-w-[140px]">
                    {userDisplayName}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${roleBadgeClass}`}>
                      {userRoleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors flex items-center gap-1"
                title="Desconectar da conta atual"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Sair</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button 
              id="btn-sound-desk" 
              onClick={toggleSound} 
              className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors focus:outline-none ${
                soundEnabled 
                  ? 'bg-primary-container/20 border-primary/40 text-primary' 
                  : 'bg-surface-container-high border-grid-line text-on-surface-variant hover:text-on-surface'
              }`}
              title="Ligar/Desligar Som"
            >
              <span className="material-symbols-outlined text-base">
                {soundEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>

            {/* Add Action Button */}
            {!isMotorista && activeTab !== 'dashboard' && activeTab !== 'admin' && (
              <button 
                id="btn-add-desk" 
                onClick={handleOpenNewModal} 
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>{activeTab === 'coletas' ? 'Nova Coleta' : 'Nova Entrega'}</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default KanbanHeader;
