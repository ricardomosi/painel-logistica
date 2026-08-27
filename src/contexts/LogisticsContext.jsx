import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

  // Normalization helper (lowercase alphanumeric only)
  const norm = (str) => (str ? String(str).toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  const profPlaca = norm(profile.placa);
  const itemPlaca = norm(item.placa);
  const profEmailPrefix = norm(profile.email ? profile.email.split('@')[0] : '');
  const profName = norm(profile.nome ? profile.nome.replace(/\(.*?\)/g, '') : '');
  const profMotoristaId = profile.motorista_id ? String(profile.motorista_id) : '';
  const profUserId = profile.id ? String(profile.id) : '';

  // 1. Direct motorista_id match if both are present
  if (item.motorista_id && profMotoristaId && String(item.motorista_id) === profMotoristaId) {
    return true;
  }

  // 2. Direct user_id match
  if (item.user_id && profUserId && String(item.user_id) === profUserId) {
    return true;
  }

  // 3. Match by vehicle plate in either direction (e.g. 'RGF9F21' in 'RGF9F21 (Jefferson)')
  if (profPlaca && itemPlaca && (itemPlaca.includes(profPlaca) || profPlaca.includes(itemPlaca))) {
    return true;
  }

  // 4. Match by driver name in item plate/motorista fields/responsavel
  if (profName && profName.length >= 3) {
    if (itemPlaca && itemPlaca.includes(profName)) return true;
    if (item.motorista?.nome && norm(item.motorista.nome).includes(profName)) return true;
    if (item.responsavel && norm(item.responsavel).includes(profName)) return true;
  }

  // 5. Match by email prefix
  if (profEmailPrefix && profEmailPrefix.length >= 3) {
    if (itemPlaca && itemPlaca.includes(profEmailPrefix)) return true;
    if (item.motorista?.nome && norm(item.motorista.nome).includes(profEmailPrefix)) return true;
    if (item.responsavel && norm(item.responsavel).includes(profEmailPrefix)) return true;
  }

  // 6. Token matching: check individual words in profile name (e.g., "Jefferson" in "Jefferson (Motorista)")
  if (profile.nome) {
    const tokens = profile.nome.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length >= 3 && t !== 'motorista');
    for (const token of tokens) {
      if (itemPlaca && itemPlaca.includes(token)) return true;
      if (item.motorista?.nome && norm(item.motorista.nome).includes(token)) return true;
    }
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

  // Refs for Tracking Previous Data & Realtime Sync State
  const previousDeliveriesMapRef = useRef(new Map());
  const previousCollectionsMapRef = useRef(new Map());
  const isInitialLoadDoneRef = useRef(false);

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

  // Real-time Delta Synchronizer (Compares new vs old to trigger notifications)
  const performRealtimeSync = useCallback(async () => {
    try {
      const [freshDeliveries, freshCollections] = await Promise.all([
        deliveriesService.getAll().catch(() => []),
        collectionsService.getAll().catch(() => []),
      ]);

      if (Array.isArray(freshDeliveries)) {
        if (isInitialLoadDoneRef.current) {
          const prevMap = previousDeliveriesMapRef.current;
          
          for (const item of freshDeliveries) {
            if (!prevMap.has(item.id)) {
              // Brand new delivery created!
              const isForCurrentDriver = isMotorista && isItemForMotorista(item, profile);

              if (isForCurrentDriver) {
                if (playDriverAlert) playDriverAlert();
                addToast(`🚨 NOVA ENTREGA ATRIBUÍDA: ${item.cliente || 'Cliente'}!`, 'success', 10000);
                
                notificationService.triggerNotification({
                  title: '🚚 Nova Entrega Atribuída a Você!',
                  body: `Destino: ${item.cliente}\nEndereço: ${item.endereco || 'A definir'}`,
                  tag: 'del-' + item.id,
                  data: item,
                });

                setPushNotification({
                  title: item.cliente || 'Nova Entrega',
                  message: item.endereco ? `Endereço: ${item.endereco}` : 'Toque para abrir a entrega.',
                  type: 'delivery',
                  item: item,
                  isForMe: true,
                });
              } else if (!isMotorista) {
                if (playAlert) playAlert();
                addToast(`📦 Nova entrega: ${item.cliente || ''}`);
                
                setPushNotification({
                  title: `Nova entrega: ${item.cliente || 'Sem cliente'}`,
                  message: item.endereco || 'Adicionada ao painel',
                  type: 'delivery',
                  item: item,
                  isForMe: false,
                });
              }
            } else {
              // Existing item check: was it concluded?
              const oldItem = prevMap.get(item.id);
              if (item.status === 'concluido' && oldItem?.status !== 'concluido') {
                if (playSuccess) playSuccess();
                addToast(`✅ Entrega de ${item.cliente || ''} concluída!`, 'info');

                if (!isMotorista) {
                  notificationService.triggerNotification({
                    title: '✅ Entrega Finalizada!',
                    body: `O motorista concluiu a entrega de ${item.cliente || ''}`,
                    tag: 'del-concl-' + item.id,
                  });

                  setPushNotification({
                    title: `Entrega Concluída: ${item.cliente || ''}`,
                    message: `KM Total: ${item.km_total || 0} km | ${item.como_foi_entrega || 'Concluída com sucesso'}`,
                    type: 'concluded',
                    item: item,
                    isForMe: false,
                  });
                }
              }
            }
          }
        }

        const newMap = new Map();
        freshDeliveries.forEach(d => newMap.set(d.id, d));
        previousDeliveriesMapRef.current = newMap;
        setDeliveries(freshDeliveries);
      }

      if (Array.isArray(freshCollections)) {
        if (isInitialLoadDoneRef.current) {
          const prevColMap = previousCollectionsMapRef.current;
          
          for (const item of freshCollections) {
            if (!prevColMap.has(item.id)) {
              const isForCurrentDriver = isMotorista && isItemForMotorista(item, profile);

              if (isForCurrentDriver) {
                if (playDriverAlert) playDriverAlert();
                addToast(`🚨 NOVA COLETA ATRIBUÍDA: ${item.fornecedor || 'Fornecedor'}!`, 'success', 10000);
                
                notificationService.triggerNotification({
                  title: '📦 Nova Coleta Atribuída a Você!',
                  body: `Fornecedor: ${item.fornecedor}\nEndereço: ${item.endereco || 'A definir'}`,
                  tag: 'col-' + item.id,
                  data: item,
                });

                setPushNotification({
                  title: item.fornecedor || 'Nova Coleta',
                  message: item.endereco ? `Endereço: ${item.endereco}` : 'Toque para abrir a coleta.',
                  type: 'collection',
                  item: item,
                  isForMe: true,
                });
              } else if (!isMotorista) {
                if (playAlert) playAlert();
                addToast(`📥 Nova coleta: ${item.fornecedor || ''}`);

                setPushNotification({
                  title: `Nova coleta: ${item.fornecedor || ''}`,
                  message: item.endereco || 'Adicionada ao painel',
                  type: 'collection',
                  item: item,
                  isForMe: false,
                });
              }
            } else {
              const oldItem = prevColMap.get(item.id);
              if (item.status === 'concluido' && oldItem?.status !== 'concluido') {
                if (playSuccess) playSuccess();
                addToast(`✅ Coleta de ${item.fornecedor || ''} concluída!`, 'info');
              }
            }
          }
        }

        const newColMap = new Map();
        freshCollections.forEach(c => newColMap.set(c.id, c));
        previousCollectionsMapRef.current = newColMap;
        setCollections(freshCollections);
      }

      isInitialLoadDoneRef.current = true;
    } catch (err) {
      console.debug('Realtime delta sync notice:', err);
    }
  }, [isMotorista, profile, playDriverAlert, playAlert, playSuccess, addToast]);

  // Initial Full Load Data
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

      const delMap = new Map();
      dels.forEach(d => delMap.set(d.id, d));
      previousDeliveriesMapRef.current = delMap;

      const colMap = new Map();
      cols.forEach(c => colMap.set(c.id, c));
      previousCollectionsMapRef.current = colMap;

      isInitialLoadDoneRef.current = true;

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

  // Real-time Background Polling (Every 3.5 seconds) + Focus/Visibility Handler
  useEffect(() => {
    const pollInterval = setInterval(() => {
      performRealtimeSync();
    }, 3500);

    const handleFocusSync = () => {
      performRealtimeSync();
    };

    window.addEventListener('focus', handleFocusSync);
    window.addEventListener('online', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocusSync);
      window.removeEventListener('online', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, [performRealtimeSync]);

  // Hook for Supabase WebSocket & Instant Broadcast Channels
  useSupabaseRealtime({
    onDeliveriesChange: () => performRealtimeSync(),
    onCollectionsChange: () => performRealtimeSync(),
    onGeneralChange: async (table) => {
      if (table === 'motoristas') {
        const d = await adminService.getDrivers().catch(() => []);
        setDrivers(d);
      } else if (table === 'veiculos') {
        const v = await adminService.getVehicles().catch(() => []);
        setVehicles(v);
      } else if (table === 'materiais') {
        const m = await adminService.getMaterials().catch(() => []);
        setMaterials(m);
      } else {
        performRealtimeSync();
      }
    },
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
