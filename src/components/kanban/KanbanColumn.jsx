import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { useAuth } from '../../contexts/AuthContext';

const COLUMN_THEMES = {
  atualizacoes: {
    columnBg: 'lg:bg-slate-200/80 lg:border-2 lg:border-slate-300',
    headerBg: 'bg-slate-700 border-slate-400',
    titleColor: 'text-white',
    badgeBg: 'bg-slate-500 text-white',
    title: '📋 Atualizações',
  },
  segunda: {
    columnBg: 'lg:bg-blue-50/50 lg:border lg:border-blue-100',
    headerBg: 'bg-blue-50/80 border-blue-100',
    titleColor: 'text-blue-900',
    subColor: 'text-blue-600',
    badgeBg: 'bg-blue-200 text-blue-800',
    title: 'Segunda',
  },
  terca: {
    columnBg: 'lg:bg-indigo-50/50 lg:border lg:border-indigo-100',
    headerBg: 'bg-indigo-50/80 border-indigo-100',
    titleColor: 'text-indigo-900',
    subColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-200 text-indigo-800',
    title: 'Terça',
  },
  quarta: {
    columnBg: 'lg:bg-cyan-50/50 lg:border lg:border-cyan-100',
    headerBg: 'bg-cyan-50/80 border-cyan-100',
    titleColor: 'text-cyan-900',
    subColor: 'text-cyan-600',
    badgeBg: 'bg-cyan-200 text-cyan-800',
    title: 'Quarta',
  },
  quinta: {
    columnBg: 'lg:bg-teal-50/50 lg:border lg:border-teal-100',
    headerBg: 'bg-teal-50/80 border-teal-100',
    titleColor: 'text-teal-900',
    subColor: 'text-teal-600',
    badgeBg: 'bg-teal-200 text-teal-800',
    title: 'Quinta',
  },
  sexta: {
    columnBg: 'lg:bg-amber-50/50 lg:border lg:border-amber-100',
    headerBg: 'bg-amber-50/80 border-amber-100',
    titleColor: 'text-amber-900',
    subColor: 'text-amber-600',
    badgeBg: 'bg-amber-200 text-amber-800',
    title: 'Sexta',
  },
  sabado: {
    columnBg: 'lg:bg-orange-50/50 lg:border lg:border-orange-100',
    headerBg: 'bg-orange-50/80 border-orange-100',
    titleColor: 'text-orange-900',
    subColor: 'text-orange-600',
    badgeBg: 'bg-orange-200 text-orange-800',
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
      className={`kanban-column flex flex-col flex-1 min-w-0 lg:rounded-xl max-h-full lg:overflow-hidden lg:shadow-sm transition-colors duration-500 ${theme.columnBg} ${
        isDragOver ? 'drag-over' : ''
      }`}
    >
      {/* Desktop Column Header */}
      <div className={`hidden lg:flex p-2.5 border-b rounded-t-xl justify-between items-center shrink-0 transition-colors duration-500 ${theme.headerBg}`}>
        {column.isStatic ? (
          <h2 className={`font-semibold text-xs xl:text-[13px] truncate ${theme.titleColor}`}>
            {theme.title}
          </h2>
        ) : (
          <div className="flex flex-col leading-tight">
            <h2 className={`font-semibold text-xs xl:text-[13px] ${theme.titleColor}`}>
              {theme.title}
            </h2>
            <span className={`text-[9px] date-label transition-colors ${theme.subColor || 'text-slate-400'}`}>
              {column.formattedDate || '--/--'}
            </span>
          </div>
        )}

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full count-badge transition-colors ${theme.badgeBg}`}>
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
