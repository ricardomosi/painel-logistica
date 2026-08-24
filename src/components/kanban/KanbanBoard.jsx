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

  const { columns } = weekNav;
  const [mobileActiveColumnKey, setMobileActiveColumnKey] = useState('atualizacoes');

  const items = type === 'entrega' ? filteredDeliveries : filteredCollections;

  // Compute items per column and counts
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

    items.forEach(item => {
      let colVal = (type === 'entrega' ? item.coluna : item.coluna_kanban) || 'atualizacoes';
      if (colVal.includes('|')) {
        colVal = colVal.split('|')[0];
      }

      if (map[colVal]) {
        map[colVal].push(item);
      } else {
        map.atualizacoes.push(item);
      }
    });

    return map;
  }, [items, type]);

  const itemCounts = useMemo(() => {
    const counts = {};
    Object.keys(itemsByColumn).forEach(k => {
      counts[k] = itemsByColumn[k].length;
    });
    return counts;
  }, [itemsByColumn]);

  const handleDropItem = (itemId, targetColumnKey) => {
    const id = Number(itemId);
    if (type === 'entrega') {
      moveDeliveryColumn(id, targetColumnKey);
    } else {
      moveCollectionColumn(id, targetColumnKey);
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
      <div className="lg:hidden flex-1 overflow-y-auto px-4 pb-20 no-scrollbar">
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
