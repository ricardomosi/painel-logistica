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
      <header className="flex lg:hidden flex-col px-3 pt-2.5 pb-2 shrink-0 z-20 transition-colors duration-500 gap-2 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Transparent Dynamic Logo */}
            <img 
              src={currentLogo} 
              alt="J Patricio Metais" 
              className="h-10 sm:h-11 w-auto object-contain bg-transparent drop-shadow-sm shrink-0"
            />
            <div className="flex flex-col leading-none min-w-0">
              <h1 className="font-cunia text-sm sm:text-base font-bold tracking-tight text-slate-900 dynamic-title truncate">
                Gestão Logística
              </h1>
              <span className="text-[11px] text-slate-600 font-bold truncate max-w-[150px] mt-0.5">
                {userDisplayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sound Toggle */}
            <button 
              id="btn-sound-mob" 
              onClick={toggleSound} 
              className={`h-8 w-8 rounded-full shadow-xs border flex items-center justify-center transition-all hover:scale-105 active:scale-95 group focus:outline-none shrink-0 ${
                soundEnabled 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-600'
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
              className="h-8 w-8 rounded-full bg-red-50 border border-red-200 text-red-700 flex items-center justify-center hover:bg-red-100 transition-all shadow-xs active:scale-95"
              title="Sair / Trocar Conta"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>

            {/* Notification Activation Button on Mobile if needed */}
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
                className="h-8 px-2.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1 active:scale-95 animate-bounce"
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
                className="h-8 w-8 rounded-full bg-blue-600 shadow-md shadow-blue-500/30 flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 group focus:outline-none shrink-0"
                title={activeTab === 'coletas' ? 'Nova Coleta' : 'Nova Entrega'}
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle Bar Mobile */}
        <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 w-full theme-toggle-container">
          <button 
            onClick={() => handleSwitchBoard('coletas')} 
            id="btn-tab-coleta-mob" 
            className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all relative ${
              activeTab === 'coletas' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Coletas
          </button>
          
          <button 
            onClick={() => handleSwitchBoard('entregas')} 
            id="btn-tab-entrega-mob" 
            className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all relative ${
              activeTab === 'entregas' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Entregas
          </button>

          {(isAdmin || isGestor) && (
            <button 
              onClick={() => handleSwitchBoard('dashboard')} 
              id="btn-tab-relatorio-mob" 
              className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all ${
                activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Relatórios
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => handleSwitchBoard('admin')} 
              className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all ${
                activeTab === 'admin' ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold' : 'text-slate-700 hover:text-slate-900'
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
      <header className="hidden lg:flex bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-2.5 justify-between items-center shadow-xs shrink-0 z-10 gap-3 transition-colors duration-500">
        <div className="flex items-center gap-4">
          {/* Transparent Dynamic Logo without blue background box */}
          <img 
            src={currentLogo} 
            alt="J Patricio Metais" 
            className="h-12 xl:h-14 w-auto object-contain bg-transparent drop-shadow-sm hover:scale-105 transition-transform duration-200"
          />
          
          <div className="flex flex-col justify-center border-l-2 border-slate-200 pl-4 border-dynamic transition-colors duration-500">
            <h1 className="font-cunia text-xl font-bold text-slate-900 dynamic-title transition-colors duration-500 leading-tight">
              Gestão Semanal Logística
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-bold text-slate-600 leading-tight dynamic-subtitle transition-colors duration-500">
                Patricio Metais • Controle Operacional
              </span>
              
              <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 theme-toggle-container">
                <button 
                  onClick={() => handleSwitchBoard('coletas')} 
                  id="btn-tab-coleta-desk" 
                  className={`text-xs font-bold px-3.5 py-1 rounded-lg transition-all relative ${
                    activeTab === 'coletas' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Coletas
                </button>
                
                <button 
                  onClick={() => handleSwitchBoard('entregas')} 
                  id="btn-tab-entrega-desk" 
                  className={`text-xs font-bold px-3.5 py-1 rounded-lg transition-all relative ${
                    activeTab === 'entregas' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Entregas
                </button>

                {(isAdmin || isGestor) && (
                  <button 
                    onClick={() => handleSwitchBoard('dashboard')} 
                    id="btn-tab-relatorio-desk" 
                    className={`text-xs font-bold px-3.5 py-1 rounded-lg transition-all ${
                      activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Relatórios & KPIs
                  </button>
                )}

                {isAdmin && (
                  <button 
                    onClick={() => handleSwitchBoard('admin')} 
                    className={`text-xs font-bold px-3.5 py-1 rounded-lg transition-all ${
                      activeTab === 'admin' ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold' : 'text-slate-700 hover:text-slate-900'
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 font-bold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl" id="week-display">
              📅 {formattedWeekRange}
            </span>

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                <span className="material-symbols-outlined text-lg text-slate-700">account_circle</span>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                    {userDisplayName}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${roleBadgeClass}`}>
                      {userRoleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center gap-1 shadow-xs active:scale-95"
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
              className={`h-9 w-9 rounded-xl shadow-xs border flex items-center justify-center transition-all hover:scale-105 active:scale-95 group focus:outline-none ${
                soundEnabled 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
              title="Ligar/Desligar Som"
            >
              <span className="material-symbols-outlined text-lg">
                {soundEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>

            {/* Add Action Button */}
            {!isMotorista && activeTab !== 'dashboard' && activeTab !== 'admin' && (
              <button 
                id="btn-add-desk" 
                onClick={handleOpenNewModal} 
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
