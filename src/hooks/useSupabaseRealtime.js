import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

let globalBroadcastChannel = null;

export const broadcastLogisticsEvent = async (event, payload) => {
  try {
    if (!globalBroadcastChannel) {
      globalBroadcastChannel = supabase.channel('logistics-live-channel');
      await globalBroadcastChannel.subscribe();
    }
    await globalBroadcastChannel.send({
      type: 'broadcast',
      event: 'logistics_broadcast',
      payload: {
        event,
        data: payload,
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    console.debug('Broadcast sync error (harmless fallback to postgres changes):', err);
  }
};

export function useSupabaseRealtime({ 
  onDeliveriesChange, 
  onCollectionsChange, 
  onGeneralChange,
  onBroadcastEvent 
}) {
  const lastProcessedEventRef = useRef(new Map());

  useEffect(() => {
    // Channel for Postgres Database Changes
    const dbChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entregas' },
        (payload) => {
          if (onDeliveriesChange) onDeliveriesChange(payload);
          if (onGeneralChange) onGeneralChange('entregas', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coletas' },
        (payload) => {
          if (onCollectionsChange) onCollectionsChange(payload);
          if (onGeneralChange) onGeneralChange('coletas', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'romaneios' },
        (payload) => {
          if (onGeneralChange) onGeneralChange('romaneios', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'romaneio_itens' },
        (payload) => {
          if (onGeneralChange) onGeneralChange('romaneios', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'motoristas' },
        (payload) => {
          if (onGeneralChange) onGeneralChange('motoristas', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'veiculos' },
        (payload) => {
          if (onGeneralChange) onGeneralChange('veiculos', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'materiais' },
        (payload) => {
          if (onGeneralChange) onGeneralChange('materiais', payload);
        }
      );

    // Channel for Instant Realtime Broadcasts across users/tabs
    const broadcastChannel = supabase
      .channel('logistics-live-channel')
      .on(
        'broadcast',
        { event: 'logistics_broadcast' },
        (payload) => {
          if (payload?.payload) {
            const { event, data, timestamp } = payload.payload;
            
            // Deduplication helper (ignore if same event within 500ms)
            const eventKey = `${event}-${data?.id || ''}`;
            const lastTime = lastProcessedEventRef.current.get(eventKey) || 0;
            if (Date.now() - lastTime < 500) return;
            lastProcessedEventRef.current.set(eventKey, Date.now());

            if (onBroadcastEvent) onBroadcastEvent(event, data);
            
            if (event.startsWith('delivery_') && onDeliveriesChange) {
              onDeliveriesChange({ eventType: event.replace('delivery_', '').toUpperCase(), new: data, isBroadcast: true });
            } else if (event.startsWith('collection_') && onCollectionsChange) {
              onCollectionsChange({ eventType: event.replace('collection_', '').toUpperCase(), new: data, isBroadcast: true });
            }
          }
        }
      );

    globalBroadcastChannel = broadcastChannel;

    dbChannel.subscribe();
    broadcastChannel.subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [onDeliveriesChange, onCollectionsChange, onGeneralChange, onBroadcastEvent]);
}

export default useSupabaseRealtime;
