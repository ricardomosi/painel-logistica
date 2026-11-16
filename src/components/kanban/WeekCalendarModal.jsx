import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function WeekCalendarModal({
  isOpen,
  onClose,
  selectedWeekStart,
  onSelectDate,
  onGoCurrentWeek,
}) {
  const [viewMonthDate, setViewMonthDate] = useState(
    () => selectedWeekStart || new Date()
  );

  useEffect(() => {
    if (isOpen && selectedWeekStart) {
      setViewMonthDate(new Date(selectedWeekStart));
    }
  }, [isOpen, selectedWeekStart]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonthDate);
    const monthEnd = endOfMonth(viewMonthDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const weeks = [];
    let cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const days = [];
      for (let i = 0; i < 7; i += 1) {
        days.push(new Date(cursor));
        cursor = addDays(cursor, 1);
      }
      const mon = days[0];
      const sat = days[5];
      weeks.push({
        weekKey: format(mon, 'yyyy-MM-dd'),
        mon,
        sat,
        rangeLabel: `${format(mon, 'dd/MM')} – ${format(sat, 'dd/MM')}`,
        days,
      });
    }
    return weeks;
  }, [viewMonthDate]);

  if (!isOpen || typeof document === 'undefined') return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const viewMonthIdx = viewMonthDate.getMonth();
  const viewYear = viewMonthDate.getFullYear();

  const pickDateAndClose = (dateObj) => {
    onSelectDate?.(dateObj);
    onClose?.();
  };

  return createPortal(
    <div
      id="week-calendar-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Selecionar Semana no Calendário"
      onClick={() => onClose?.()}
      className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-hanken"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] bg-[#031428] border border-[#0081A7]/60 rounded-[6px] shadow-2xl text-[#d3e3ff] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#020D1A] border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-[4px] bg-[#0081A7]/25 border border-[#0081A7]/50 flex items-center justify-center shrink-0">
              <Calendar size={15} className="text-[#00D4FF]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white truncate">
                Escolher Semana no Calendário
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                Clique em qualquer semana para abrir entregas e coletas do período
              </p>
            </div>
          </div>

          <button
            id="btn-close-week-calendar"
            type="button"
            onClick={() => onClose?.()}
            className="h-7 w-7 rounded-[4px] bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer shrink-0"
            aria-label="Fechar calendário"
          >
            <X size={14} />
          </button>
        </div>

        {/* Month & Year Controls */}
        <div className="px-3.5 py-2.5 bg-[#07182c] border-b border-white/10 flex items-center justify-between gap-2">
          <button
            id="btn-cal-prev-month"
            type="button"
            onClick={() => setViewMonthDate((d) => subMonths(d, 1))}
            className="h-8 w-8 rounded-[4px] bg-[#020D1A] hover:bg-[#0081A7]/40 border border-white/15 flex items-center justify-center text-white cursor-pointer shrink-0"
            title="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <select
              id="select-cal-month"
              value={viewMonthIdx}
              onChange={(e) => {
                const nextM = Number(e.target.value);
                setViewMonthDate(new Date(viewYear, nextM, 1));
              }}
              className="bg-[#020D1A] border border-white/15 rounded-[4px] px-2 py-1 text-xs font-bold text-white outline-none focus:border-[#00D4FF] cursor-pointer"
            >
              {MONTHS_PT.map((label, idx) => (
                <option key={label} value={idx}>
                  {label}
                </option>
              ))}
            </select>

            <select
              id="select-cal-year"
              value={viewYear}
              onChange={(e) => {
                const nextY = Number(e.target.value);
                setViewMonthDate(new Date(nextY, viewMonthIdx, 1));
              }}
              className="bg-[#020D1A] border border-white/15 rounded-[4px] px-2 py-1 text-xs font-data-mono font-bold text-[#00D4FF] outline-none focus:border-[#00D4FF] cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-cal-next-month"
            type="button"
            onClick={() => setViewMonthDate((d) => addMonths(d, 1))}
            className="h-8 w-8 rounded-[4px] bg-[#020D1A] hover:bg-[#0081A7]/40 border border-white/15 flex items-center justify-center text-white cursor-pointer shrink-0"
            title="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Matrix Grouped by Interactive Weeks */}
        <div className="p-3 space-y-1.5">
          <div className="grid grid-cols-7 gap-1 px-1 pb-1 border-b border-white/10 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {WEEKDAY_HEADERS.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          <div className="space-y-1">
            {calendarWeeks.map((week) => {
              const isSelectedWeek = selectedWeekStart
                ? isSameWeek(week.mon, selectedWeekStart, { weekStartsOn: 1 })
                : false;
              const isThisRealWeek = isSameWeek(week.mon, today, { weekStartsOn: 1 });

              return (
                <button
                  key={week.weekKey}
                  type="button"
                  data-week-key={week.weekKey}
                  onClick={() => pickDateAndClose(week.mon)}
                  title={`Selecionar semana ${week.rangeLabel}`}
                  className={`w-full rounded-[4px] p-1 border transition-all cursor-pointer block ${
                    isSelectedWeek
                      ? 'bg-[#0081A7]/35 border-[#00D4FF] shadow-sm'
                      : isThisRealWeek
                        ? 'bg-[#F07127]/15 border-[#F07127]/50 hover:bg-[#0081A7]/25 hover:border-[#00D4FF]/60'
                        : 'bg-[#020D1A]/60 border-white/5 hover:bg-[#0081A7]/25 hover:border-[#00D4FF]/50'
                  }`}
                >
                  <div className="grid grid-cols-7 gap-1 items-center">
                    {week.days.map((day, idx) => {
                      const inCurrentViewMonth = isSameMonth(day, viewMonthDate);
                      const isToday = isSameDay(day, today);
                      const isSunday = idx === 6;

                      return (
                        <div
                          key={day.toISOString()}
                          className={`h-8 rounded-[3px] flex flex-col items-center justify-center font-data-mono text-xs tabular-nums transition-colors ${
                            isToday
                              ? 'bg-[#F07127] text-white font-extrabold ring-1 ring-white/60'
                              : isSelectedWeek && !isSunday
                                ? 'text-white font-bold'
                                : inCurrentViewMonth
                                  ? isSunday
                                    ? 'text-slate-500'
                                    : 'text-slate-200 font-semibold'
                                  : 'text-slate-600'
                          }`}
                        >
                          <span>{format(day, 'd')}</span>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Preset Jumps */}
        <div className="px-3.5 py-2.5 bg-[#020D1A] border-t border-white/10 flex flex-wrap items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => pickDateAndClose(subWeeks(today, 1))}
            className="px-2.5 py-1 rounded-[4px] bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer"
          >
            Semana Passada
          </button>

          <button
            id="btn-cal-today-week"
            type="button"
            onClick={() => {
              onGoCurrentWeek?.();
              onClose?.();
            }}
            className="px-2.5 py-1 rounded-[4px] bg-[#0081A7] hover:bg-[#0099c4] text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Semana Atual</span>
          </button>

          <button
            type="button"
            onClick={() => pickDateAndClose(addWeeks(today, 1))}
            className="px-2.5 py-1 rounded-[4px] bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer"
          >
            Próx. Semana
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

