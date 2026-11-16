import { useState, useMemo } from 'react';
import { startOfWeek, addWeeks, subWeeks, addDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseBoardDate, getColumnKeyFromDate as getColFromDate } from '../lib/kanbanWeekUtils';

export const COLUMN_KEYS = {
  ATUALIZACOES: 'atualizacoes',
  SEGUNDA: 'segunda',
  TERCA: 'terca',
  QUARTA: 'quarta',
  QUINTA: 'quinta',
  SEXTA: 'sexta',
  SABADO: 'sabado',
};

export const COLUMNS_CONFIG = [
  { key: 'atualizacoes', label: 'Atualizações', dayOffset: null, isStatic: true, color: 'from-slate-600 to-slate-800' },
  { key: 'segunda', label: 'Segunda-feira', dayOffset: 0, isStatic: false, color: 'from-blue-600 to-indigo-800' },
  { key: 'terca', label: 'Terça-feira', dayOffset: 1, isStatic: false, color: 'from-blue-600 to-indigo-800' },
  { key: 'quarta', label: 'Quarta-feira', dayOffset: 2, isStatic: false, color: 'from-blue-600 to-indigo-800' },
  { key: 'quinta', label: 'Quinta-feira', dayOffset: 3, isStatic: false, color: 'from-blue-600 to-indigo-800' },
  { key: 'sexta', label: 'Sexta-feira', dayOffset: 4, isStatic: false, color: 'from-blue-600 to-indigo-800' },
  { key: 'sabado', label: 'Sábado', dayOffset: 5, isStatic: false, color: 'from-cyan-600 to-blue-800' },
];

export function useWeekNavigation() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Week start: Monday (weekStartsOn: 1)
  const weekStart = useMemo(() => {
    return startOfWeek(currentDate, { weekStartsOn: 1 });
  }, [currentDate]);

  const weekEnd = useMemo(() => {
    // Saturday is day + 5 from Monday
    return addDays(weekStart, 5);
  }, [weekStart]);

  // Recompute real current week whenever currentDate/weekStart updates (prevents stale week across midnight)
  const currentRealWeekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [weekStart]
  );

  const isCurrentWeek = useMemo(
    () => isSameDay(weekStart, currentRealWeekStart),
    [weekStart, currentRealWeekStart]
  );

  const weekRelation = useMemo(() => {
    if (isCurrentWeek) return 'current';
    return weekStart.getTime() < currentRealWeekStart.getTime() ? 'past' : 'future';
  }, [isCurrentWeek, weekStart, currentRealWeekStart]);

  const goToNextWeek = () => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  const goToPrevWeek = () => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  const goToDate = (dateOrStr) => {
    const parsed = parseBoardDate(dateOrStr);
    if (parsed) {
      setCurrentDate(parsed);
    }
  };

  // Build column metadata with concrete dates for the active week
  const columns = useMemo(() => {
    const today = new Date();
    return COLUMNS_CONFIG.map((col) => {
      if (col.dayOffset === null) {
        return {
          ...col,
          date: null,
          formattedDate: 'Geral',
          isToday: false,
        };
      }
      const colDate = addDays(weekStart, col.dayOffset);
      return {
        ...col,
        date: colDate,
        formattedDate: format(colDate, 'dd/MM', { locale: ptBR }),
        fullDateStr: format(colDate, 'yyyy-MM-dd'),
        isToday: isSameDay(colDate, today),
      };
    });
  }, [weekStart]);

  const formattedWeekRange = useMemo(() => {
    const startStr = format(weekStart, "dd 'de' MMM", { locale: ptBR });
    const endStr = format(weekEnd, "dd 'de' MMM, yyyy", { locale: ptBR });
    return `${startStr} - ${endStr}`;
  }, [weekStart, weekEnd]);

  const shortWeekRange = useMemo(() => {
    return `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM', { locale: ptBR })}`;
  }, [weekStart, weekEnd]);

  const getColumnKeyFromDate = (date) => getColFromDate(date);

  return {
    currentDate,
    setCurrentDate,
    weekStart,
    weekEnd,
    isCurrentWeek,
    weekRelation,
    columns,
    formattedWeekRange,
    shortWeekRange,
    goToNextWeek,
    goToPrevWeek,
    goToCurrentWeek,
    goToDate,
    getColumnKeyFromDate,
  };
}

export default useWeekNavigation;
