import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { useAuth } from '../../contexts/AuthContext';

const COLUMN_THEMES = {
  atualizacoes: {
    columnBg: 'lg:bg-[#F0F2F5]/92 lg:border lg:border-slate-300/85 lg:backdrop-blur-xs',
    headerBg: 'bg-[#1E293B] border-b border-[#334155] text-white',
    titleColor: 'text-white font-bold',
    badgeBg: 'bg-[#334155] text-white border border-slate-600',
    title: '📋 Atualizações',
  },
  segunda: {
    columnBg: 'lg:bg-[#F0F2F5]/92 lg:border lg:border-slate-300/85 lg:backdrop-blur-xs',
    headerBg: 'bg-[#0081A7] border-b border-[#006c8c] text-white',
    titleColor: 'text-white font-bold',
    subColor: 'text-cyan-100',
    badgeBg: 'bg-white/25 text-white border border-white/40',
    title: 'Segunda',
  },
  terca: {
    columnBg: 'lg:bg-[#F0F2F5]/92 lg:border lg:border-slate-300/85 lg:backdrop-blur-xs',
    headerBg: 'bg-[#0081A7] border-b border-[#006c8c] text-white',
    titleColor: 'text-white font-bold',
    subColor: 'text-cyan-100',
    badgeBg: 'bg-white/25 text-white border border-white/40',
    title: 'Terça',
  },
  quarta: {
    columnBg: 'lg:bg-[#F0F2F5]/92 lg:border lg:border-slate-300/85 lg:backdrop-blur-xs',
    headerBg: 'bg-[#2E97C2] border-b border-[#2580a5] text-white',
    titleColor: 'text-white font-bold',
    subColor: 'text-cyan-100',
    badgeBg: 'bg-white/25 text-white border border-white/40',
    title: 'Quarta',
  },
  quinta: {
    columnBg: 'lg:bg-[#F0F2F5]/92 lg:border lg:border-slate-300/85 lg:backdrop-blur-xs',
    headerBg: 'bg-[#2E97C2] border-b border-[#2580a5] text-white',
    titleColor: 'text-white font-bold',
    subColor: 'text-cyan-100',
    badgeBg: 'bg-white/25 text-white border border-white/40',
    title: 'Quinta',
  },
  sexta: {
    columnBg: 'lg:bg-[#F0F2F5]/92 lg:border lg:border-slate-300/85 lg:backdrop-blur-xs',
    headerBg: 'bg-[#F07127] border-b border-[#d85e19] text-white',
    titleColor: 'text-white font-bold',
    subColor: 'text-amber-100',
    badgeBg: 'bg-white/25 text-white border border-white/40',
    title: 'Sexta',
  },
  sabado: {
    columnBg: 'lg:bg-[#F0F2F5]/92 lg:border lg:border-slate-300/85 lg:backdrop-blur-xs',
    headerBg: 'bg-[#F07127] border-b border-[#d85e19] text-white',
    titleColor: 'text-white font-bold',
    subColor: 'text-amber-100',
    badgeBg: 'bg-white/25 text-white border border-white/40',
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
      className={`kanban-column flex flex-col flex-1 min-w-0 lg:rounded-[4px] max-h-full lg:overflow-hidden transition-colors ${theme.columnBg} ${
        isDragOver ? 'drag-over' : ''
      }`}
    >
      {/* Desktop Column Header */}
      <div className={`hidden lg:flex p-2.5 border-b rounded-t-[3px] justify-between items-center shrink-0 ${theme.headerBg}`}>
        {column.isStatic ? (
          <h2 className={`text-xs xl:text-[13px] truncate ${theme.titleColor}`}>
            {theme.title}
          </h2>
        ) : (
          <div className="flex flex-col leading-tight">
            <h2 className={`text-xs xl:text-[13px] ${theme.titleColor}`}>
              {theme.title}
            </h2>
            <span className={`text-[9px] date-label ${theme.subColor || 'text-white/80'}`}>
              {column.formattedDate || '--/--'}
            </span>
          </div>
        )}

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[3px] count-badge ${theme.badgeBg}`}>
          {items.length}
        </span>
      </div>

      {/* Cards Scroll Container */}
      <div className="px-0 lg:px-2 pt-1.5 pb-28 lg:pb-2 flex-1 overflow-visible lg:overflow-y-auto space-y-2.5 lg:space-y-1.5 kanban-cards font-inter">
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
