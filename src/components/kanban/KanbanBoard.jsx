import React, { useState, useMemo } from 'react';
import KanbanColumn from './KanbanColumn';
import MobileWeekNav from './MobileWeekNav';
import { useLogistics } from '../../contexts/LogisticsContext';

export default function KanbanBoard({ weekNav, type = 'entrega' }) {
  const { 
    filteredDeliveries, 
    filteredCollections, 
    moveDeliveryColumn, 
    moveCollectionColumn, 
    loading 
  } = useLogistics();

  const { columns, weekStart, weekEnd } = weekNav;
  const [mobileActiveColumnKey, setMobileActiveColumnKey] = useState('atualizacoes');

  const rawItems = type === 'entrega' ? filteredDeliveries : filteredCollections;
  const items = Array.isArray(rawItems) ? rawItems.filter(Boolean) : [];

  // Start & End of active week
  const startOfActiveWeek = useMemo(() => {
    if (!weekStart) return null;
    const d = new Date(weekStart);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekStart]);

  const endOfActiveWeek = useMemo(() => {
    if (!weekEnd) return null;
    const d = new Date(weekEnd);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekEnd]);

  // Compute items per column with rollover logic
  const itemsByColumn = useMemo(() => {
    const map = {
      atualizacoes: [],
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: []
    };

    const parseDateSafe = (val) => {
      if (!val) return null;
      if (val instanceof Date) return val;
      if (typeof val === 'string') {
        const clean = val.includes('T') ? val.split('T')[0] : val.split(' ')[0];
        const parts = clean.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m, d, 12, 0, 0);
          }
        }
        const dObj = new Date(val);
        if (!isNaN(dObj.getTime())) return dObj;
      }
      return null;
    };

    items.forEach(item => {
      if (!item) return;

      const isConcluido = item.status === 'concluido';
      let rawCol = (type === 'entrega' ? item.coluna : item.coluna_kanban) || 'atualizacoes';
      let colVal = rawCol;
      let colEmbeddedDate = null;

      if (typeof rawCol === 'string' && rawCol.includes('|')) {
        const parts = rawCol.split('|');
        colVal = parts[0];
        colEmbeddedDate = parts[1] || null;
      }

      // Determine item reference date
      let itemDate = null;
      if (isConcluido) {
        itemDate = parseDateSafe(item.data_conclusao) || parseDateSafe(item.data_registro) || parseDateSafe(item.created_at);
      } else {
        itemDate = parseDateSafe(colEmbeddedDate) || parseDateSafe(item.data_registro) || parseDateSafe(item.created_at);
      }

      let isFromPastWeek = false;
      let isFromFutureWeek = false;

      if (itemDate && startOfActiveWeek && endOfActiveWeek) {
        if (itemDate.getTime() < startOfActiveWeek.getTime()) {
          isFromPastWeek = true;
        } else if (itemDate.getTime() > endOfActiveWeek.getTime()) {
          isFromFutureWeek = true;
        }
      }

      // 1. Concluídos de semanas anteriores NÃO aparecem na semana atual
      if (isConcluido && (isFromPastWeek || isFromFutureWeek)) {
        return;
      }

      // 2. Não concluídos (pendentes) de semanas anteriores vão automaticamente para "Atualizações"
      if (!isConcluido && isFromPastWeek) {
        map.atualizacoes.push(item);
        return;
      }

      // 3. Itens da semana ativa (ou sem data específica) vão para a coluna correspondente
      if (map[colVal]) {
        map[colVal].push(item);
      } else {
        map.atualizacoes.push(item);
      }
    });

    // Sort items in each column: URGENT first, pending before concluded, newest first
    Object.keys(map).forEach(col => {
      map[col].sort((a, b) => {
        if (!a || !b) return 0;
        // 1. Urgente first
        const aUrg = a.urgente ? 1 : 0;
        const bUrg = b.urgente ? 1 : 0;
        if (aUrg !== bUrg) return bUrg - aUrg;

        // 2. Pendentes antes de concluídos
        const aConcluido = a.status === 'concluido' ? 1 : 0;
        const bConcluido = b.status === 'concluido' ? 1 : 0;
        if (aConcluido !== bConcluido) return aConcluido - bConcluido;

        // 3. Mais recentes primeiro
        const timeA = new Date(a.created_at || a.data_registro || 0).getTime() || 0;
        const timeB = new Date(b.created_at || b.data_registro || 0).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
    });

    return map;
  }, [items, type, startOfActiveWeek, endOfActiveWeek]);

  const itemCounts = useMemo(() => {
    const counts = {};
    Object.keys(itemsByColumn).forEach(k => {
      counts[k] = itemsByColumn[k].length;
    });
    return counts;
  }, [itemsByColumn]);

  const handleDropItem = (itemId, targetColumnKey) => {
    const id = Number(itemId);
    const targetCol = columns.find(c => c.key === targetColumnKey);
    const targetDateStr = targetCol?.fullDateStr || null;

    if (type === 'entrega') {
      moveDeliveryColumn(id, targetColumnKey, targetDateStr);
    } else {
      moveCollectionColumn(id, targetColumnKey, targetDateStr);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <svg className="animate-spin h-12 w-12 text-[#00D4FF] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-white font-semibold tracking-widest text-sm uppercase">Sincronizando Sistema...</span>
        <span className="text-slate-400 text-[10px] mt-2 text-center max-w-xs uppercase">Carregando dados da nuvem</span>
      </div>
    );
  }

  const atualizacoesCol = columns.find(c => c.key === 'atualizacoes') || { key: 'atualizacoes', label: 'Atualizações', isStatic: true };
  const weekDaysCols = columns.filter(c => c.key !== 'atualizacoes');

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative z-0">
      
      {/* Mobile Week Day Tabs */}
      <MobileWeekNav
        columns={columns}
        activeColumnKey={mobileActiveColumnKey}
        onSelectColumn={setMobileActiveColumnKey}
        itemCounts={itemCounts}
      />

      {/* DESKTOP: 7 Columns Horizontal Kanban with divider */}
      <div 
        id="kanban-view" 
        className="h-full hidden lg:flex lg:flex-row lg:gap-2 xl:gap-2 overflow-y-auto lg:overflow-visible no-scrollbar p-3 pb-4 transition-opacity duration-500"
      >
        {/* Inbox / Atualizações Column */}
        <KanbanColumn
          column={atualizacoesCol}
          items={itemsByColumn['atualizacoes'] || []}
          type={type}
          onDropItem={handleDropItem}
        />

        {/* Divider Bar */}
        <div className="w-[3px] bg-white/70 rounded-full my-6 shrink-0 transition-opacity" />

        {/* Seg to Sab Columns */}
        {weekDaysCols.map((column) => (
          <KanbanColumn
            key={column.key}
            column={column}
            items={itemsByColumn[column.key] || []}
            type={type}
            onDropItem={handleDropItem}
          />
        ))}
      </div>

      {/* MOBILE: Single Active Column */}
      <div className="lg:hidden flex-1 flex flex-col min-h-full overflow-y-auto px-3 sm:px-4 pb-24 no-scrollbar">
        {columns
          .filter((col) => col.key === mobileActiveColumnKey)
          .map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              items={itemsByColumn[column.key] || []}
              type={type}
              onDropItem={handleDropItem}
            />
          ))}
      </div>

    </div>
  );
}
