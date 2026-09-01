import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

let activeRealtimeChannel = null;

export const broadcastLogisticsEvent = async (event, payload) => {
  try {
    if (!activeRealtimeChannel) {
      activeRealtimeChannel = supabase.channel('logistics-live-unified-channel');
      await activeRealtimeChannel.subscribe();
    }
    await activeRealtimeChannel.send({
      type: 'broadcast',
      event: 'logistics_broadcast',
      payload: {
        event,
        data: payload,
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    console.debug('Broadcast send notice (fallback active):', err);
  }
};

export function useSupabaseRealtime({ 
  onDeliveriesChange, 
  onCollectionsChange, 
  onGeneralChange,
  onBroadcastEvent 
}) {
  // Store callbacks in refs to avoid channel teardown on parent re-renders
  const deliveriesCbRef = useRef(onDeliveriesChange);
  const collectionsCbRef = useRef(onCollectionsChange);
  const generalCbRef = useRef(onGeneralChange);
  const broadcastCbRef = useRef(onBroadcastEvent);
  const lastProcessedEventRef = useRef(new Map());

  useEffect(() => {
    deliveriesCbRef.current = onDeliveriesChange;
  }, [onDeliveriesChange]);

  useEffect(() => {
    collectionsCbRef.current = onCollectionsChange;
  }, [onCollectionsChange]);

  useEffect(() => {
    generalCbRef.current = onGeneralChange;
  }, [onGeneralChange]);

  useEffect(() => {
    broadcastCbRef.current = onBroadcastEvent;
  }, [onBroadcastEvent]);

  useEffect(() => {
    // Unified Persistent Channel (Postgres CDC + Instant Broadcast)
    const unifiedChannel = supabase
      .channel('logistics-live-unified-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entregas' },
        (payload) => {
          if (deliveriesCbRef.current) deliveriesCbRef.current(payload);
          if (generalCbRef.current) generalCbRef.current('entregas', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coletas' },
        (payload) => {
          if (collectionsCbRef.current) collectionsCbRef.current(payload);
          if (generalCbRef.current) generalCbRef.current('coletas', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'romaneios' },
        (payload) => {
          if (generalCbRef.current) generalCbRef.current('romaneios', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'romaneio_itens' },
        (payload) => {
          if (generalCbRef.current) generalCbRef.current('romaneios', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'motoristas' },
        (payload) => {
          if (generalCbRef.current) generalCbRef.current('motoristas', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'veiculos' },
        (payload) => {
          if (generalCbRef.current) generalCbRef.current('veiculos', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materiais' },
        (payload) => {
          if (generalCbRef.current) generalCbRef.current('materiais', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendedores' },
        (payload) => {
          if (generalCbRef.current) generalCbRef.current('vendedores', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (generalCbRef.current) generalCbRef.current('profiles', payload);
        }
      )
      .on(
        'broadcast',
        { event: 'logistics_broadcast' },
        (payload) => {
          if (payload?.payload) {
            const { event, data } = payload.payload;
            
            // Deduplication (ignore duplicate messages in 400ms)
            const eventKey = `${event}-${data?.id || ''}`;
            const lastTime = lastProcessedEventRef.current.get(eventKey) || 0;
            if (Date.now() - lastTime < 400) return;
            lastProcessedEventRef.current.set(eventKey, Date.now());

            if (broadcastCbRef.current) broadcastCbRef.current(event, data);
            
            if (event.startsWith('delivery_') && deliveriesCbRef.current) {
              deliveriesCbRef.current({ 
                eventType: event.replace('delivery_', '').toUpperCase(), 
                new: data, 
                isBroadcast: true 
              });
            } else if (event.startsWith('collection_') && collectionsCbRef.current) {
              collectionsCbRef.current({ 
                eventType: event.replace('collection_', '').toUpperCase(), 
                new: data, 
                isBroadcast: true 
              });
            }
          }
        }
      );

    activeRealtimeChannel = unifiedChannel;

    unifiedChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Connected successfully
      }
    });

    return () => {
      // Don't kill active channel on fast re-renders
    };
  }, []);
}

export default useSupabaseRealtime;
