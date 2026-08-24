import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { deliveriesService } from '../services/deliveriesService';
import { collectionsService } from '../services/collectionsService';
import { adminService } from '../services/adminService';
import { useAuth } from './AuthContext';
import { useSound } from './SoundContext';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';

const LogisticsContext = createContext(null);

export function LogisticsProvider({ children }) {
  const { profile, isMotorista } = useAuth();
  const { playSuccess, playAlert, playWarning, playClick } = useSound();

  // Data states
  const [deliveries, setDeliveries] = useState([]);
  const [collections, setCollections] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sellers, setSellers] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('coletas'); // 'coletas' | 'entregas' | 'dashboard' | 'admin'

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('all');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedDockFilter, setSelectedDockFilter] = useState('all');

  // Modals state
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [romaneioModalOpen, setRomaneioModalOpen] = useState(false);
  const [selectedRomaneioDelivery, setSelectedRomaneioDelivery] = useState(null);
  
  // Custom dialogs & Toasts
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Quick helper to open delivery with romaneio
  const openRomaneio = useCallback((delivery) => {
    setSelectedDelivery(delivery);
    setDeliveryModalOpen(true);
  }, []);

  // Address History for Autocomplete
  const [addressHistory, setAddressHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('logisticsAddressHistory') || '[]');
    } catch {
      return [];
    }
  });

  const saveAddressToHistory = useCallback((addressStr) => {
    if (!addressStr || addressStr.includes('http')) return;
    const clean = addressStr.trim();
    if (!clean) return;
    setAddressHistory(prev => {
      const updated = [clean, ...prev.filter(a => a !== clean)].slice(0, 50);
      localStorage.setItem('logisticsAddressHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback(({ title, message, onConfirm, confirmText = 'Confirmar', isDestructive = false }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      isDestructive,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = useCallback(({ title, message, type = 'info' }) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Fetch all core logistics data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dels, cols, drvs, vehs, mats, sels] = await Promise.all([
        deliveriesService.getAll().catch(() => []),
        collectionsService.getAll().catch(() => []),
        adminService.getDrivers().catch(() => []),
        adminService.getVehicles().catch(() => []),
        adminService.getMaterials().catch(() => []),
        adminService.getSellers().catch(() => []),
      ]);

      setDeliveries(dels);
      setCollections(cols);
      setDrivers(drvs);
      setVehicles(vehs);
      setMaterials(mats);
      setSellers(sels);
    } catch (err) {
      console.error('Error loading logistics data:', err);
      addToast('Erro ao carregar dados do servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime handlers
  const handleDeliveriesChange = useCallback(async () => {
    const fresh = await deliveriesService.getAll().catch(() => []);
    setDeliveries(fresh);
  }, []);

  const handleCollectionsChange = useCallback(async () => {
    const fresh = await collectionsService.getAll().catch(() => []);
    setCollections(fresh);
  }, []);

  const handleGeneralChange = useCallback(async (table) => {
    if (table === 'motoristas') {
      const d = await adminService.getDrivers().catch(() => []);
      setDrivers(d);
    } else if (table === 'veiculos') {
      const v = await adminService.getVehicles().catch(() => []);
      setVehicles(v);
    } else if (table === 'materiais') {
      const m = await adminService.getMaterials().catch(() => []);
      setMaterials(m);
    }
  }, []);

  useSupabaseRealtime({
    onDeliveriesChange: handleDeliveriesChange,
    onCollectionsChange: handleCollectionsChange,
    onGeneralChange: handleGeneralChange,
  });

  // ---------------- DELIVERY ACTIONS ----------------
  const createDelivery = async (formData) => {
    try {
      const created = await deliveriesService.create(formData);
      setDeliveries(prev => [created, ...prev]);
      if (formData.endereco) saveAddressToHistory(formData.endereco);
      playAlert();
      addToast('Nova entrega registrada!');
      return created;
    } catch (err) {
      console.error('Error creating delivery:', err);
      playWarning();
      addToast(`Falha ao criar entrega: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  const updateDelivery = async (id, updates) => {
    try {
      const updated = await deliveriesService.update(id, updates);
      setDeliveries(prev => prev.map(d => (d.id === id ? updated : d)));
      if (updates.endereco) saveAddressToHistory(updates.endereco);
      if (updates.status === 'concluido') {
        playSuccess();
      } else {
        playSuccess();
      }
      addToast('Entrega atualizada com sucesso!');
      return updated;
    } catch (err) {
      console.error('Error updating delivery:', err);
      playWarning();
      addToast(`Falha ao atualizar entrega: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  const deleteDelivery = async (id) => {
    try {
      await deliveriesService.delete(id);
      setDeliveries(prev => prev.filter(d => d.id !== id));
      playSuccess();
      addToast('Entrega removida.');
    } catch (err) {
      console.error('Error deleting delivery:', err);
      playWarning();
      addToast(`Falha ao remover entrega: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  const moveDeliveryColumn = async (id, newColumn) => {
    // Optimistic UI update
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, coluna: newColumn } : d));

    try {
      await deliveriesService.updateColumn(id, newColumn);
    } catch (err) {
      console.error('Error moving delivery column:', err);
      loadData();
      addToast('Erro ao mover cartão no quadro.', 'error');
    }
  };

  const startDeliveryAction = async (id, data) => {
    try {
      const updated = await deliveriesService.startDelivery(id, data);
      setDeliveries(prev => prev.map(d => (d.id === id ? { ...d, ...updated } : d)));
      playSuccess();
      addToast('Entrega iniciada! Rota em andamento.');
      return updated;
    } catch (err) {
      console.error('Error starting delivery:', err);
      playWarning();
      addToast(`Erro ao iniciar entrega: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  const concludeDeliveryAction = async (id, data) => {
    try {
      const updated = await deliveriesService.concludeDelivery(id, data);
      setDeliveries(prev => prev.map(d => (d.id === id ? { ...d, ...updated } : d)));
      playSuccess();
      addToast('Entrega finalizada com sucesso!');
      return updated;
    } catch (err) {
      console.error('Error concluding delivery:', err);
      playWarning();
      addToast(`Erro ao concluir entrega: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  // ---------------- COLLECTION ACTIONS ----------------
  const createCollection = async (formData) => {
    try {
      const created = await collectionsService.create(formData);
      setCollections(prev => [created, ...prev]);
      playAlert();
      addToast('Nova coleta registrada!');
      return created;
    } catch (err) {
      console.error('Error creating collection:', err);
      playWarning();
      addToast(`Falha ao cadastrar coleta: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  const updateCollection = async (id, updates) => {
    try {
      const updated = await collectionsService.update(id, updates);
      setCollections(prev => prev.map(c => (c.id === id ? updated : c)));
      playSuccess();
      addToast('Coleta atualizada com sucesso!');
      return updated;
    } catch (err) {
      console.error('Error updating collection:', err);
      playWarning();
      addToast(`Falha ao atualizar coleta: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  const deleteCollection = async (id) => {
    try {
      await collectionsService.delete(id);
      setCollections(prev => prev.filter(c => c.id !== id));
      playSuccess();
      addToast('Coleta removida.');
    } catch (err) {
      console.error('Error deleting collection:', err);
      playWarning();
      addToast(`Falha ao remover coleta: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  const moveCollectionColumn = async (id, newColumn) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, coluna_kanban: newColumn } : c));

    try {
      await collectionsService.updateColumn(id, newColumn);
    } catch (err) {
      console.error('Error moving collection column:', err);
      loadData();
      addToast('Erro ao mover cartão de coleta.', 'error');
    }
  };

  const concludeCollectionAction = async (id, data) => {
    try {
      const updated = await collectionsService.concludeCollection(id, data);
      setCollections(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
      playSuccess();
      addToast('Coleta finalizada com sucesso!');
      return updated;
    } catch (err) {
      console.error('Error concluding collection:', err);
      playWarning();
      addToast(`Erro ao concluir coleta: ${err.message || ''}`, 'error');
      throw err;
    }
  };

  // ---------------- LIMPAR SEMANA (CLEAR COMPLETED FROM VIEW) ----------------
  const clearBoard = useCallback(() => {
    showConfirm({
      title: 'Limpar Semana',
      message: 'Deseja apagar os cards CONCLUÍDOS desta aba? Os cards pendentes serão mantidos e nenhum dado histórico será perdido.',
      confirmText: 'Limpar Agora',
      isDestructive: true,
      onConfirm: () => {
        if (activeTab === 'coletas') {
          setCollections(prev => prev.filter(c => c.status !== 'concluido'));
        } else {
          setDeliveries(prev => prev.filter(d => d.status !== 'concluido'));
        }
        playSuccess();
        addToast('Quadro limpo com sucesso!', 'success');
      }
    });
  }, [activeTab, showConfirm, playSuccess, addToast]);

  // ---------------- FILTERED DATA WITH RBAC ----------------
  const filteredDeliveries = deliveries.filter(item => {
    if (isMotorista && profile?.motorista_id) {
      if (item.motorista_id !== profile.motorista_id) {
        return false;
      }
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchClient = item.cliente?.toLowerCase().includes(q);
      const matchAddress = item.endereco?.toLowerCase().includes(q);
      const matchDriver = item.motorista?.nome?.toLowerCase().includes(q);
      const matchPlate = item.placa?.toLowerCase().includes(q);
      const matchBoleto = item.boleto?.toLowerCase().includes(q);
      const matchSeller = item.vendedor?.toLowerCase().includes(q);
      if (!matchClient && !matchAddress && !matchDriver && !matchPlate && !matchBoleto && !matchSeller) {
        return false;
      }
    }

    if (selectedVehicleFilter !== 'all' && item.placa !== selectedVehicleFilter) return false;
    if (selectedDriverFilter !== 'all' && item.motorista_id !== selectedDriverFilter) return false;
    if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) return false;
    if (selectedDockFilter !== 'all' && item.local_carregamento !== selectedDockFilter) return false;

    return true;
  });

  const filteredCollections = collections.filter(item => {
    if (isMotorista && profile?.motorista_id) {
      if (item.motorista_id !== profile.motorista_id) {
        return false;
      }
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSupplier = item.fornecedor?.toLowerCase().includes(q);
      const matchResp = item.responsavel?.toLowerCase().includes(q);
      const matchDriver = item.motorista?.nome?.toLowerCase().includes(q);
      const matchPlate = item.placa?.toLowerCase().includes(q);
      if (!matchSupplier && !matchResp && !matchDriver && !matchPlate) {
        return false;
      }
    }

    if (selectedVehicleFilter !== 'all' && item.placa !== selectedVehicleFilter) return false;
    if (selectedDriverFilter !== 'all' && item.motorista_id !== selectedDriverFilter) return false;
    if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) return false;

    return true;
  });

  return (
    <LogisticsContext.Provider
      value={{
        deliveries,
        collections,
        filteredDeliveries,
        filteredCollections,
        drivers,
        vehicles,
        materials,
        loading,
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        selectedVehicleFilter,
        setSelectedVehicleFilter,
        selectedDriverFilter,
        setSelectedDriverFilter,
        selectedStatusFilter,
        setSelectedStatusFilter,
        selectedDockFilter,
        setSelectedDockFilter,
        
        // Modal states
        deliveryModalOpen,
        setDeliveryModalOpen,
        selectedDelivery,
        setSelectedDelivery,
        collectionModalOpen,
        setCollectionModalOpen,
        selectedCollection,
        setSelectedCollection,
        romaneioModalOpen,
        setRomaneioModalOpen,
        selectedRomaneioDelivery,
        setSelectedRomaneioDelivery,
        openRomaneio,

        // Dialogs & Toasts & History
        addressHistory,
        saveAddressToHistory,
        toasts,
        addToast,
        removeToast,
        confirmDialog,
        showConfirm,
        closeConfirm,
        alertDialog,
        showAlert,
        closeAlert,

        // Actions
        loadData,
        clearBoard,
        createDelivery,
        updateDelivery,
        deleteDelivery,
        moveDeliveryColumn,
        startDeliveryAction,
        concludeDeliveryAction,
        createCollection,
        updateCollection,
        deleteCollection,
        moveCollectionColumn,
        concludeCollectionAction,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
}

export function useLogistics() {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
}

export default LogisticsContext;
