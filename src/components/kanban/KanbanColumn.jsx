import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { useAuth } from '../../contexts/AuthContext';

const COLUMN_THEMES = {
  atualizacoes: {
    columnBg: 'lg:bg-surface-container/50 lg:border lg:border-grid-line',
    headerBg: 'bg-surface-container-high/80 border-b border-grid-line',
    titleColor: 'text-on-surface font-semibold',
    badgeBg: 'bg-surface-container-highest text-on-surface border border-grid-line',
    title: '📋 Atualizações',
  },
  segunda: {
    columnBg: 'lg:bg-surface-container/50 lg:border lg:border-grid-line',
    headerBg: 'bg-surface-container-high/80 border-b border-grid-line',
    titleColor: 'text-on-surface font-semibold',
    subColor: 'text-on-surface-variant',
    badgeBg: 'bg-surface-container-highest text-on-surface border border-grid-line',
    title: 'Segunda',
  },
  terca: {
    columnBg: 'lg:bg-surface-container/50 lg:border lg:border-grid-line',
    headerBg: 'bg-surface-container-high/80 border-b border-grid-line',
    titleColor: 'text-on-surface font-semibold',
    subColor: 'text-on-surface-variant',
    badgeBg: 'bg-surface-container-highest text-on-surface border border-grid-line',
    title: 'Terça',
  },
  quarta: {
    columnBg: 'lg:bg-surface-container/50 lg:border lg:border-grid-line',
    headerBg: 'bg-surface-container-high/80 border-b border-grid-line',
    titleColor: 'text-on-surface font-semibold',
    subColor: 'text-on-surface-variant',
    badgeBg: 'bg-surface-container-highest text-on-surface border border-grid-line',
    title: 'Quarta',
  },
  quinta: {
    columnBg: 'lg:bg-surface-container/50 lg:border lg:border-grid-line',
    headerBg: 'bg-surface-container-high/80 border-b border-grid-line',
    titleColor: 'text-on-surface font-semibold',
    subColor: 'text-on-surface-variant',
    badgeBg: 'bg-surface-container-highest text-on-surface border border-grid-line',
    title: 'Quinta',
  },
  sexta: {
    columnBg: 'lg:bg-surface-container/50 lg:border lg:border-grid-line',
    headerBg: 'bg-surface-container-high/80 border-b border-grid-line',
    titleColor: 'text-on-surface font-semibold',
    subColor: 'text-on-surface-variant',
    badgeBg: 'bg-surface-container-highest text-on-surface border border-grid-line',
    title: 'Sexta',
  },
  sabado: {
    columnBg: 'lg:bg-surface-container/50 lg:border lg:border-grid-line',
    headerBg: 'bg-surface-container-high/80 border-b border-grid-line',
    titleColor: 'text-on-surface font-semibold',
    subColor: 'text-on-surface-variant',
    badgeBg: 'bg-surface-container-highest text-on-surface border border-grid-line',
    title: 'Sábado',
  },
};

export default function KanbanColumn({ 
  column, 
  items = [], 
  type = 'entrega',
  onDropItem 
}) {
  const { isMotorista } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);

  const theme = COLUMN_THEMES[column.key] || COLUMN_THEMES.atualizacoes;

  const handleDragOver = (e) => {
    if (isMotorista) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (isMotorista) return;
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && onDropItem) {
      onDropItem(itemId, column.key);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`kanban-column flex flex-col flex-1 min-w-0 lg:rounded-lg max-h-full lg:overflow-hidden transition-colors ${theme.columnBg} ${
        isDragOver ? 'drag-over' : ''
      }`}
    >
      {/* Desktop Column Header */}
      <div className={`hidden lg:flex p-2.5 border-b rounded-t-lg justify-between items-center shrink-0 ${theme.headerBg}`}>
        {column.isStatic ? (
          <h2 className={`text-xs xl:text-[13px] truncate ${theme.titleColor}`}>
            {theme.title}
          </h2>
        ) : (
          <div className="flex flex-col leading-tight">
            <h2 className={`text-xs xl:text-[13px] ${theme.titleColor}`}>
              {theme.title}
            </h2>
            <span className={`text-[9px] date-label ${theme.subColor || 'text-on-surface-variant'}`}>
              {column.formattedDate || '--/--'}
            </span>
          </div>
        )}

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded count-badge ${theme.badgeBg}`}>
          {items.length}
        </span>
      </div>

      {/* Cards Scroll Container */}
      <div className="px-0 lg:px-2 pt-1 pb-28 lg:pb-2 flex-1 overflow-visible lg:overflow-y-auto space-y-3 lg:space-y-1.5 kanban-cards font-inter">
        {items.map((item) => (
          <KanbanCard
            key={item.id}
            item={item}
            type={type}
            onDragStart={(e, id) => {
              e.dataTransfer.setData('text/plain', id.toString());
            }}
          />
        ))}
      </div>
    </div>
  );
}
