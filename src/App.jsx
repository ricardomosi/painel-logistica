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

// Icons
import { UserCheck, Truck, Layers, ShieldCheck } from 'lucide-react';

export default function App() {
  const { activeTab, confirmDialog, closeConfirm, alertDialog, closeAlert } = useLogistics();
  const { user, loading: authLoading, isAdmin, isGestor } = useAuth();
  const weekNav = useWeekNavigation();
  const [adminActiveSubTab, setAdminActiveSubTab] = useState('drivers'); // 'drivers' | 'vehicles' | 'materials' | 'users'

  // Dynamic Theme Class attached to body
  useEffect(() => {
    document.body.classList.remove('theme-coleta', 'theme-entrega', 'theme-relatorio');
    if (activeTab === 'coletas') {
      document.body.classList.add('theme-coleta');
    } else if (activeTab === 'dashboard') {
      document.body.classList.add('theme-relatorio');
    } else {
      document.body.classList.add('theme-entrega');
    }
  }, [activeTab]);

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
        
        {/* 1. COLETAS BOARD */}
        {activeTab === 'coletas' && (
          <KanbanBoard weekNav={weekNav} type="coleta" />
        )}

        {/* 2. ENTREGAS BOARD */}
        {activeTab === 'entregas' && (
          <KanbanBoard weekNav={weekNav} type="entrega" />
        )}

        {/* 3. RELATÓRIOS & ANALYTICS DASHBOARD */}
        {activeTab === 'dashboard' && (isAdmin || isGestor) && (
          <DashboardView />
        )}

        {/* 4. ADMIN MANAGEMENT PANEL */}
        {activeTab === 'admin' && (
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6 animate-in fade-in duration-300 pb-28">
              
              {/* Admin Subtabs */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-panel border border-white/40">
                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('drivers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminActiveSubTab === 'drivers'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Motoristas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('vehicles')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminActiveSubTab === 'vehicles'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Veículos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('materials')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminActiveSubTab === 'materials'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Catálogo de Materiais</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('sellers')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminActiveSubTab === 'sellers'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-orange-500" />
                  <span>Equipe Comercial (Vendedores)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('users')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminActiveSubTab === 'users'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acessos & Usuários (RBAC)</span>
                </button>
              </div>

              {/* Subtab Contents */}
              {adminActiveSubTab === 'drivers' && <DriversManagement />}
              {adminActiveSubTab === 'vehicles' && <VehiclesManagement />}
              {adminActiveSubTab === 'materials' && <MaterialsManagement />}
              {adminActiveSubTab === 'sellers' && <SellersManagement />}
              {adminActiveSubTab === 'users' && <UsersManagement />}

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

    </div>
  );
}
