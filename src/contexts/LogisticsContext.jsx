import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { deliveriesService } from '../services/deliveriesService';
import { collectionsService } from '../services/collectionsService';
import { adminService } from '../services/adminService';
import { useAuth } from './AuthContext';
import { useSound } from './SoundContext';
import { useSupabaseRealtime, broadcastLogisticsEvent } from '../hooks/useSupabaseRealtime';
import { notificationService } from '../lib/notificationService';

const LogisticsContext = createContext(null);

export const isItemForMotorista = (item, profile) => {
  if (!item || !profile) return false;

  // 1. Direct motorista_id match if both are present
  if (item.motorista_id && profile.motorista_id && String(item.motorista_id) === String(profile.motorista_id)) {
    return true;
  }

  // Normalization helper (lowercase alphanumeric only)
  const norm = (str) => (str ? String(str).toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  const profPlaca = norm(profile.placa);
  const itemPlaca = norm(item.placa);
  const profEmailPrefix = norm(profile.email ? profile.email.split('@')[0] : '');
  const profName = norm(profile.nome ? profile.nome.replace(/\(.*?\)/g, '') : '');

  // 2. Match by vehicle plate (e.g. 'RGF9F21' inside 'RGF9F21 (Jefferson)')
  if (profPlaca && itemPlaca && (itemPlaca.includes(profPlaca) || profPlaca.includes(itemPlaca))) {
    return true;
  }

  // 3. Match by driver name in item plate/motorista fields (e.g. 'jefferson' inside 'RGF9F21 (Jefferson)')
  if (profName && profName.length >= 3) {
    if (itemPlaca && itemPlaca.includes(profName)) return true;
    if (item.motorista?.nome && norm(item.motorista.nome).includes(profName)) return true;
  }

  // 4. Match by email prefix
  if (profEmailPrefix && profEmailPrefix.length >= 3) {
    if (itemPlaca && itemPlaca.includes(profEmailPrefix)) return true;
    if (item.motorista?.nome && norm(item.motorista.nome).includes(profEmailPrefix)) return true;
  }

  return false;
};

export function LogisticsProvider({ children }) {
  const { profile, isMotorista } = useAuth();
  const { playSuccess, playAlert, playDriverAlert, playWarning, playClick } = useSound();

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
  
  // In-App Push Banner & Toasts
  const [pushNotification, setPushNotification] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const clearPushNotification = useCallback(() => {
    setPushNotification(null);
  }, []);

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

  const saveAddressToHistory = useCallback((address) => {
    if (!address || address.trim().length < 3) return;
    const cleanAddr = address.trim();
    setAddressHistory(prev => {
      const filtered = prev.filter(a => a.toLowerCase() !== cleanAddr.toLowerCase());
      const updated = [cleanAddr, ...filtered].slice(0, 20);
      localStorage.setItem('logisticsAddressHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback(({ title, message, confirmText, cancelText, onConfirm, isDestructive = false }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: confirmText || 'Confirmar',
      cancelText: cancelText || 'Cancelar',
      onConfirm,
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

  // Request browser notification permission automatically
  useEffect(() => {
    if (notificationService.isSupported() && notificationService.getPermission() === 'default') {
      notificationService.requestPermission().catch(() => {});
    }
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

  // Realtime handlers with dedicated notifications for drivers & managers
  const handleDeliveriesChange = useCallback(async (payload) => {
    const fresh = await deliveriesService.getAll().catch(() => []);
    setDeliveries(fresh);

    if ((payload?.eventType === 'INSERT' || payload?.eventType === 'CREATED') && payload.new) {
      const isForCurrentDriver = isMotorista && isItemForMotorista(payload.new, profile);

      if (isForCurrentDriver) {
        if (playDriverAlert) playDriverAlert();
        addToast(`🚨 NOVA ENTREGA ATRIBUÍDA: ${payload.new.cliente || 'Cliente'}!`, 'success', 10000);
        
        // Native mobile notification + in-app push banner
        notificationService.triggerNotification({
          title: '🚚 Nova Entrega Atribuída a Você!',
          body: `Destino: ${payload.new.cliente}\nEndereço: ${payload.new.endereco || 'A definir'}`,
          tag: 'del-' + payload.new.id,
          data: payload.new,
        });

        setPushNotification({
          title: payload.new.cliente || 'Nova Entrega',
          message: payload.new.endereco ? `Endereço: ${payload.new.endereco}` : 'Toque para abrir a entrega.',
          type: 'delivery',
          item: payload.new,
          isForMe: true,
        });

      } else if (!isMotorista) {
        if (playAlert) playAlert();
        addToast(`📦 Nova entrega registrada: ${payload.new.cliente || ''}`);
        
        setPushNotification({
          title: `Nova entrega: ${payload.new.cliente || 'Sem cliente'}`,
          message: payload.new.endereco || 'Adicionada ao painel de entregas',
          type: 'delivery',
          item: payload.new,
          isForMe: false,
        });
      }
    } else if ((payload?.eventType === 'UPDATE' || payload?.eventType === 'CONCLUDED' || payload?.eventType === 'UPDATED') && payload.new) {
      if (payload.new.status === 'concluido' && payload.old?.status !== 'concluido') {
        if (playSuccess) playSuccess();
        addToast(`✅ Entrega de ${payload.new.cliente || ''} concluída!`, 'info');

        if (!isMotorista) {
          notificationService.triggerNotification({
            title: '✅ Entrega Finalizada!',
            body: `O motorista concluiu a entrega de ${payload.new.cliente || ''}`,
            tag: 'del-concl-' + payload.new.id,
          });

          setPushNotification({
            title: `Entrega Concluída: ${payload.new.cliente || ''}`,
            message: `KM Total: ${payload.new.km_total || 0} km | ${payload.new.como_foi_entrega || 'Concluída com sucesso'}`,
            type: 'concluded',
            item: payload.new,
            isForMe: false,
          });
        }
      }
    }
  }, [isMotorista, profile, playDriverAlert, playAlert, playSuccess, addToast]);

  const handleCollectionsChange = useCallback(async (payload) => {
    const fresh = await collectionsService.getAll().catch(() => []);
    setCollections(fresh);

    if ((payload?.eventType === 'INSERT' || payload?.eventType === 'CREATED') && payload.new) {
      const isForCurrentDriver = isMotorista && isItemForMotorista(payload.new, profile);

      if (isForCurrentDriver) {
        if (playDriverAlert) playDriverAlert();
        addToast(`🚨 NOVA COLETA ATRIBUÍDA: ${payload.new.fornecedor || 'Fornecedor'}!`, 'success', 10000);
        
        notificationService.triggerNotification({
          title: '📦 Nova Coleta Atribuída a Você!',
          body: `Fornecedor: ${payload.new.fornecedor}\nEndereço: ${payload.new.endereco || 'A definir'}`,
          tag: 'col-' + payload.new.id,
          data: payload.new,
        });

        setPushNotification({
          title: payload.new.fornecedor || 'Nova Coleta',
          message: payload.new.endereco ? `Endereço: ${payload.new.endereco}` : 'Toque para abrir a coleta.',
          type: 'collection',
          item: payload.new,
          isForMe: true,
        });

      } else if (!isMotorista) {
        if (playAlert) playAlert();
        addToast(`📥 Nova coleta registrada: ${payload.new.fornecedor || ''}`);

        setPushNotification({
          title: `Nova coleta: ${payload.new.fornecedor || ''}`,
          message: payload.new.endereco || 'Adicionada ao painel de coletas',
          type: 'collection',
          item: payload.new,
          isForMe: false,
        });
      }
    } else if ((payload?.eventType === 'UPDATE' || payload?.eventType === 'CONCLUDED' || payload?.eventType === 'UPDATED') && payload.new) {
      if (payload.new.status === 'concluido' && payload.old?.status !== 'concluido') {
        if (playSuccess) playSuccess();
        addToast(`✅ Coleta de ${payload.new.fornecedor || ''} concluída!`, 'info');

        if (!isMotorista) {
          notificationService.triggerNotification({
            title: '✅ Coleta Concluída!',
            body: `Coleta de ${payload.new.fornecedor || ''} finalizada com sucesso`,
            tag: 'col-concl-' + payload.new.id,
          });

          setPushNotification({
            title: `Coleta Concluída: ${payload.new.fornecedor || ''}`,
            message: 'Finalizada com sucesso pelo motorista.',
            type: 'concluded',
            item: payload.new,
            isForMe: false,
          });
        }
      }
    }
  }, [isMotorista, profile, playDriverAlert, playAlert, playSuccess, addToast]);

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
    } else if (table === 'romaneios') {
      const freshDels = await deliveriesService.getAll().catch(() => []);
      setDeliveries(freshDels);
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
      broadcastLogisticsEvent('delivery_created', created);
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
      broadcastLogisticsEvent(updates.status === 'concluido' ? 'delivery_concluded' : 'delivery_updated', updated);
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
      broadcastLogisticsEvent('delivery_deleted', { id });
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
      const updated = await deliveriesService.updateColumn(id, newColumn);
      broadcastLogisticsEvent('delivery_updated', updated);
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
      broadcastLogisticsEvent('delivery_updated', updated);
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
      broadcastLogisticsEvent('delivery_concluded', updated);
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
      broadcastLogisticsEvent('collection_created', created);
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
      broadcastLogisticsEvent(updates.status === 'concluido' ? 'collection_concluded' : 'collection_updated', updated);
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
      broadcastLogisticsEvent('collection_deleted', { id });
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
      const updated = await collectionsService.updateColumn(id, newColumn);
      broadcastLogisticsEvent('collection_updated', updated);
    } catch (err) {
      console.error('Error moving collection column:', err);
      loadData();
      addToast('Erro ao mover cartão de coleta.', 'error');
    }
  };

  const toggleDeliveryUrgent = async (id, currentVal) => {
    const nextVal = !currentVal;
    setDeliveries(prev => prev.map(d => (d.id === id ? { ...d, urgente: nextVal } : d)));
    try {
      const updated = await deliveriesService.update(id, { urgente: nextVal });
      broadcastLogisticsEvent('delivery_updated', updated);
      if (nextVal) {
        if (playAlert) playAlert();
        addToast('🚨 Entrega marcada como URGENTE! Fixada no topo.', 'warning');
      } else {
        addToast('Urgência da entrega desmarcada.');
      }
    } catch (err) {
      console.error('Error toggling delivery urgency:', err);
      loadData();
      addToast('Erro ao atualizar urgência da entrega.', 'error');
    }
  };

  const toggleCollectionUrgent = async (id, currentVal) => {
    const nextVal = !currentVal;
    setCollections(prev => prev.map(c => (c.id === id ? { ...c, urgente: nextVal } : c)));
    try {
      const updated = await collectionsService.update(id, { urgente: nextVal });
      broadcastLogisticsEvent('collection_updated', updated);
      if (nextVal) {
        if (playAlert) playAlert();
        addToast('🚨 Coleta marcada como URGENTE! Fixada no topo.', 'warning');
      } else {
        addToast('Urgência da coleta desmarcada.');
      }
    } catch (err) {
      console.error('Error toggling collection urgency:', err);
      loadData();
      addToast('Erro ao atualizar urgência da coleta.', 'error');
    }
  };

  const concludeCollectionAction = async (id, data) => {
    try {
      const updated = await collectionsService.update(id, data);
      setCollections(prev => (Array.isArray(prev) ? prev : []).map(c => (c.id === id ? { ...c, ...updated } : c)));
      playSuccess();
      addToast('Coleta finalizada com sucesso!');
      broadcastLogisticsEvent('collection_concluded', updated);
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
          setCollections(prev => (Array.isArray(prev) ? prev : []).filter(c => c.status !== 'concluido'));
        } else {
          setDeliveries(prev => (Array.isArray(prev) ? prev : []).filter(d => d.status !== 'concluido'));
        }
        playSuccess();
        addToast('Quadro limpo com sucesso!', 'success');
      }
    });
  }, [activeTab, showConfirm, playSuccess, addToast]);

  // ---------------- FILTERED DATA WITH RBAC ----------------
  const filteredDeliveries = (Array.isArray(deliveries) ? deliveries : []).filter(item => {
    if (!item) return false;
    
    // Se logado como motorista, exibe somente as entregas atribuídas a ele
    if (isMotorista) {
      if (!isItemForMotorista(item, profile)) {
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

  const filteredCollections = (Array.isArray(collections) ? collections : []).filter(item => {
    if (!item) return false;

    // Se logado como motorista, exibe somente as coletas atribuídas a ele
    if (isMotorista) {
      if (!isItemForMotorista(item, profile)) {
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

        // Push Notifications, Dialogs & Toasts
        pushNotification,
        clearPushNotification,
        notificationService,
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
        toggleDeliveryUrgent,
        toggleCollectionUrgent,
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
