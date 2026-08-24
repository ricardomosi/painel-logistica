import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSupabaseRealtime({ onDeliveriesChange, onCollectionsChange, onGeneralChange }) {
  useEffect(() => {
    const channel = supabase
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onDeliveriesChange, onCollectionsChange, onGeneralChange]);
}

export default useSupabaseRealtime;
