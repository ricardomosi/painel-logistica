import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useLogistics } from './contexts/LogisticsContext';
import { useWeekNavigation } from './hooks/useWeekNavigation';

// Components
import KanbanHeader from './components/kanban/KanbanHeader';
import KanbanBoard from './components/kanban/KanbanBoard';
import DeliveryModal from './components/forms/DeliveryModal';
import CollectionModal from './components/forms/CollectionModal';
import RomaneioModal from './components/romaneio/RomaneioModal';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard View
import DashboardView from './components/dashboard/DashboardView';

// Admin Components
import DriversManagement from './components/admin/DriversManagement';
import VehiclesManagement from './components/admin/VehiclesManagement';
import MaterialsManagement from './components/admin/MaterialsManagement';
import SellersManagement from './components/admin/SellersManagement';
import UsersManagement from './components/admin/UsersManagement';

// Common Components
import ModalConfirm from './components/common/ModalConfirm';
import ModalAlert from './components/common/ModalAlert';
import ToastContainer from './components/common/ToastContainer';
import PushNotificationBanner from './components/common/PushNotificationBanner';

// Icons
import { UserCheck, Truck, Layers, ShieldCheck } from 'lucide-react';

export default function App() {
  const { activeTab, confirmDialog, closeConfirm, alertDialog, closeAlert } = useLogistics();
  const { user, loading: authLoading, isAdmin, isGestor } = useAuth();
  const weekNav = useWeekNavigation();
  const [adminActiveSubTab, setAdminActiveSubTab] = useState('drivers'); // 'drivers' | 'vehicles' | 'materials' | 'sellers' | 'users'
  const [tabTransitioning, setTabTransitioning] = useState(false);
  const [displayedTab, setDisplayedTab] = useState(activeTab);

  // Dynamic Theme Class attached to body
  useEffect(() => {
    document.body.classList.remove('theme-coleta', 'theme-entrega', 'theme-relatorio');
    if (activeTab === 'coletas') {
      document.body.classList.add('theme-coleta');
    } else if (activeTab === 'dashboard' || activeTab === 'admin') {
      document.body.classList.add('theme-relatorio');
    } else {
      document.body.classList.add('theme-entrega');
    }
  }, [activeTab]);

  // Smooth Tab Transition Effect
  useEffect(() => {
    if (activeTab !== displayedTab) {
      setTabTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
        setTabTransitioning(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [activeTab, displayedTab]);

  // If verifying auth session
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Carregando Sessão...
        </span>
      </div>
    );
  }

  // If user is not logged in, display full LoginPage
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-800">
      
      {/* Universal Header */}
      <KanbanHeader weekNav={weekNav} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden w-full h-full relative z-0 flex flex-col">
        
        {/* Shimmer / Progress indicator during tab change */}
        {tabTransitioning && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0081A7]/30 z-50 overflow-hidden">
            <div className="h-full bg-[#0081A7] animate-pulse w-full" />
          </div>
        )}

        {/* 1. COLETAS BOARD */}
        {displayedTab === 'coletas' && (
          <div className="flex-1 flex flex-col min-h-0 h-full animate-in fade-in duration-200">
            <KanbanBoard weekNav={weekNav} type="coleta" />
          </div>
        )}

        {/* 2. ENTREGAS BOARD */}
        {displayedTab === 'entregas' && (
          <div className="flex-1 flex flex-col min-h-0 h-full animate-in fade-in duration-200">
            <KanbanBoard weekNav={weekNav} type="entrega" />
          </div>
        )}

        {/* 3. RELATÓRIOS & ANALYTICS DASHBOARD */}
        {displayedTab === 'dashboard' && (isAdmin || isGestor) && (
          <div className="flex-1 flex flex-col min-h-0 h-full animate-in fade-in duration-200">
            <DashboardView />
          </div>
        )}

        {/* 4. ADMIN MANAGEMENT PANEL */}
        {displayedTab === 'admin' && (
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6 animate-in fade-in duration-200 pb-20">
              
              {/* Admin Subtabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-surface-container border border-grid-line shrink-0">
                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('drivers')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    adminActiveSubTab === 'drivers'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Motoristas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('vehicles')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    adminActiveSubTab === 'vehicles'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Veículos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('materials')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    adminActiveSubTab === 'materials'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Catálogo de Materiais</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('sellers')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    adminActiveSubTab === 'sellers'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-secondary" />
                  <span>Equipe Comercial (Vendedores)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('users')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    adminActiveSubTab === 'users'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Acessos & Usuários (RBAC)</span>
                </button>
              </div>

              {/* Subtab Contents */}
              <div className="flex-1 flex flex-col min-h-[480px]">
                {adminActiveSubTab === 'drivers' && <DriversManagement />}
                {adminActiveSubTab === 'vehicles' && <VehiclesManagement />}
                {adminActiveSubTab === 'materials' && <MaterialsManagement />}
                {adminActiveSubTab === 'sellers' && <SellersManagement />}
                {adminActiveSubTab === 'users' && <UsersManagement />}
              </div>

            </div>
          </ProtectedRoute>
        )}

      </main>

      {/* Global Modals & Dialogs */}
      <DeliveryModal />
      <CollectionModal />
      <RomaneioModal />

      <ModalConfirm
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      <ModalAlert
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={closeAlert}
      />

      <ToastContainer />
      <PushNotificationBanner />

    </div>
  );
}
