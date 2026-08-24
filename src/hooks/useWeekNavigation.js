import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const goToNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const goToPrevWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Build column metadata with concrete dates for the active week
  const columns = useMemo(() => {
    const today = new Date();
    return COLUMNS_CONFIG.map(col => {
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

  /**
   * Translates day of week from a date into column key
   */
  const getColumnKeyFromDate = (date) => {
    if (!date) return COLUMN_KEYS.ATUALIZACOES;
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Mon, ..., 6 = Sat
    switch (dayOfWeek) {
      case 1: return COLUMN_KEYS.SEGUNDA;
      case 2: return COLUMN_KEYS.TERCA;
      case 3: return COLUMN_KEYS.QUARTA;
      case 4: return COLUMN_KEYS.QUINTA;
      case 5: return COLUMN_KEYS.SEXTA;
      case 6: return COLUMN_KEYS.SABADO;
      default: return COLUMN_KEYS.ATUALIZACOES;
    }
  };

  return {
    currentDate,
    setCurrentDate,
    weekStart,
    weekEnd,
    columns,
    formattedWeekRange,
    goToNextWeek,
    goToPrevWeek,
    goToCurrentWeek,
    getColumnKeyFromDate,
  };
}

export default useWeekNavigation;
