import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogistics } from '../../contexts/LogisticsContext';
import { useSound } from '../../contexts/SoundContext';

const LOGO_URL = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1772193840/Gemini_Generated_Image_b4mrdzb4mrdzb4mr_1_dacrgw.png';

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
    setRomaneioModalOpen,
    setSelectedRomaneioDelivery,
    deliveries,
    drivers,
    showAlert
  } = useLogistics();

  const { formattedWeekRange } = weekNav;

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

  const handleOpenQuickRomaneio = () => {
    // Pick the first available delivery or open new delivery modal with romaneio
    const firstDel = deliveries && deliveries.length > 0 ? deliveries[0] : null;
    setSelectedDelivery(firstDel);
    setDeliveryModalOpen(true);
  };

  const userDisplayName = profile?.nome || (user?.email ? user.email.split('@')[0].toUpperCase() : 'USUÁRIO');
  const userRoleLabel = isAdmin ? 'Admin' : isGestor ? 'Gestor' : 'Motorista';
  const roleBadgeClass = isAdmin 
    ? 'bg-amber-500/20 text-amber-800 border-amber-400' 
    : isGestor 
    ? 'bg-blue-500/20 text-blue-800 border-blue-400' 
    : 'bg-emerald-500/20 text-emerald-800 border-emerald-400';

  return (
    <>
      {/* ============================================== */}
      {/* CABEÇALHO MOBILE                               */}
      {/* ============================================== */}
      <header className="flex lg:hidden flex-col px-4 pt-3 pb-2 shrink-0 z-20 transition-colors duration-500 gap-2.5 bg-white/40 backdrop-blur-md border-b border-white/40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <img 
              src={LOGO_URL} 
              alt="Logo Empresa" 
              className="h-8 sm:h-9 w-auto object-contain drop-shadow-md"
            />
            <div className="flex flex-col leading-none">
              <h1 className="font-cunia text-sm sm:text-base font-bold tracking-tight text-blue-600 dynamic-title">
                Gestão Logística
              </h1>
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                {userDisplayName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Romaneio Button */}
            {!isMotorista && (
              <button
                onClick={handleOpenQuickRomaneio}
                className="h-8 px-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                title="Gerenciar Romaneio"
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                <span className="hidden sm:inline">Romaneio</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button 
              id="btn-sound-mob" 
              onClick={toggleSound} 
              className={`h-8 w-8 rounded-full backdrop-blur-md shadow-sm border flex items-center justify-center transition-all hover:scale-105 active:scale-95 group focus:outline-none shrink-0 ${
                soundEnabled 
                  ? 'bg-blue-50 border-blue-300 text-blue-600' 
                  : 'bg-white/80 border-slate-200 text-slate-600'
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
              className="h-8 w-8 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all shadow-sm active:scale-95"
              title="Sair / Trocar Conta"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>

            {/* Add Button */}
            {!isMotorista && activeTab !== 'dashboard' && activeTab !== 'admin' && (
              <button 
                id="btn-add-mob" 
                onClick={handleOpenNewModal} 
                className="h-8 w-8 rounded-full bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 group focus:outline-none shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle Bar Mobile */}
        <div className="flex bg-slate-200/80 backdrop-blur-md rounded-lg p-1 border border-white/50 w-full theme-toggle-container">
          <button 
            onClick={() => handleSwitchBoard('coletas')} 
            id="btn-tab-coleta-mob" 
            className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-all relative ${
              activeTab === 'coletas' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Coletas
          </button>
          
          <button 
            onClick={() => handleSwitchBoard('entregas')} 
            id="btn-tab-entrega-mob" 
            className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-all relative ${
              activeTab === 'entregas' ? 'bg-[#00D4FF] text-[#020024] shadow-sm' : 'text-slate-500'
            }`}
          >
            Entregas
          </button>

          {(isAdmin || isGestor) && (
            <button 
              onClick={() => handleSwitchBoard('dashboard')} 
              id="btn-tab-relatorio-mob" 
              className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-all ${
                activeTab === 'dashboard' ? 'bg-[#00D4FF] text-[#020024] shadow-sm' : 'text-slate-500'
              }`}
            >
              Relatórios
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => handleSwitchBoard('admin')} 
              className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-md transition-all ${
                activeTab === 'admin' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-500'
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
      <header className="hidden lg:flex bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-2.5 justify-between items-center shadow-sm shrink-0 z-10 gap-3 transition-colors duration-500">
        <div className="flex items-center gap-4">
          <img 
            src={LOGO_URL} 
            alt="Logo Empresa" 
            className="h-12 xl:h-14 w-auto max-w-[180px] object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
          />
          
          <div className="flex flex-col justify-center border-l-2 border-slate-300 pl-4 border-dynamic transition-colors duration-500">
            <h1 className="font-cunia text-2xl font-bold text-blue-600 dynamic-title transition-colors duration-500 leading-tight">
              Gestão Semanal
            </h1>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="text-sm font-semibold text-slate-700 leading-tight dynamic-subtitle transition-colors duration-500">
                Logística e Fornecedores
              </span>
              
              <div className="flex bg-slate-200/80 backdrop-blur-md rounded-lg p-1 border border-white/50 theme-toggle-container">
                <button 
                  onClick={() => handleSwitchBoard('coletas')} 
                  id="btn-tab-coleta-desk" 
                  className={`text-xs font-bold px-4 py-1 rounded-md transition-all relative ${
                    activeTab === 'coletas' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Coletas
                </button>
                
                <button 
                  onClick={() => handleSwitchBoard('entregas')} 
                  id="btn-tab-entrega-desk" 
                  className={`text-xs font-bold px-4 py-1 rounded-md transition-all relative ${
                    activeTab === 'entregas' ? 'bg-[#00D4FF] text-[#020024] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Entregas
                </button>

                {(isAdmin || isGestor) && (
                  <button 
                    onClick={() => handleSwitchBoard('dashboard')} 
                    id="btn-tab-relatorio-desk" 
                    className={`text-xs font-bold px-4 py-1 rounded-md transition-all ${
                      activeTab === 'dashboard' ? 'bg-[#00D4FF] text-[#020024] shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Relatórios
                  </button>
                )}

                {isAdmin && (
                  <button 
                    onClick={() => handleSwitchBoard('admin')} 
                    className={`text-xs font-bold px-4 py-1 rounded-md transition-all ${
                      activeTab === 'admin' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-500'
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
            <span className="text-xs text-slate-500 font-medium" id="week-display">
              {formattedWeekRange}
            </span>

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-base text-slate-600">account_circle</span>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]" title={userDisplayName}>
                    {userDisplayName}
                  </span>
                  <span className={`text-[9px] font-semibold uppercase px-1 py-0.2 rounded mt-0.5 border ${roleBadgeClass}`}>
                    {userRoleLabel}
                  </span>
                </div>
              </div>

              {/* Sair / Trocar Conta */}
              <button
                onClick={signOut}
                className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
                title="Desconectar do sistema e voltar para tela de login"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Sair</span>
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end items-center">
            {/* Quick Romaneio Button */}
            {!isMotorista && (
              <button
                onClick={handleOpenQuickRomaneio}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Visualizar e Emitir Romaneios de Carga em PDF"
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                <span>Romaneios</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button 
              id="btn-sound-desk" 
              onClick={toggleSound} 
              className={`px-3 py-2 text-sm font-medium border rounded-lg transition-all shadow-sm focus:outline-none shrink-0 flex items-center justify-center ${
                soundEnabled 
                  ? 'bg-blue-50 border-blue-300 text-blue-600' 
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              title="Ligar/Desligar Som de Notificação"
            >
              <span className="material-symbols-outlined text-lg">
                {soundEnabled ? 'notifications_active' : 'notifications_off'}
              </span>
            </button>

            {/* Actions for Kanban Views */}
            {activeTab !== 'dashboard' && activeTab !== 'admin' && (
              <div id="desktop-actions" className="flex gap-2 transition-opacity duration-300">
                <button 
                  onClick={clearBoard} 
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus:outline-none shrink-0"
                >
                  Limpar Semana
                </button>
                
                {!isMotorista && (
                  <button 
                    onClick={handleOpenNewModal} 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 focus:outline-none shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>{activeTab === 'coletas' ? 'Nova Atualização' : 'Nova Entrega'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default KanbanHeader;
