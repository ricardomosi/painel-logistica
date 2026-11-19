import { startOfWeek, addDays } from 'date-fns';

export const WEEK_COLUMN_KEYS = [
  'atualizacoes',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
];

export const DAY_OFFSETS = {
  segunda: 0,
  terca: 1,
  quarta: 2,
  quinta: 3,
  sexta: 4,
  sabado: 5,
};

export function formatIsoBoardDate(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseBoardDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : new Date(val.getFullYear(), val.getMonth(), val.getDate(), 12, 0, 0);
  }
  const str = String(val).trim();
  if (!str) return null;
  const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 12, 0, 0);
    }
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function getColumnKeyFromDate(dateOrStr) {
  const d = parseBoardDate(dateOrStr);
  if (!d) return 'atualizacoes';
  const dow = d.getDay();
  switch (dow) {
    case 1: return 'segunda';
    case 2: return 'terca';
    case 3: return 'quarta';
    case 4: return 'quinta';
    case 5: return 'sexta';
    case 6: return 'sabado';
    default: return 'atualizacoes';
  }
}

export function getWeekDayDateStr(colKey, referenceWeekStart = null) {
  if (!colKey || DAY_OFFSETS[colKey] === undefined) return null;
  let monday;
  if (referenceWeekStart) {
    const parsed = parseBoardDate(referenceWeekStart);
    monday = parsed ? startOfWeek(parsed, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });
  } else {
    monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  }
  const target = addDays(monday, DAY_OFFSETS[colKey]);
  return formatIsoBoardDate(target);
}

export function buildScheduledColumnValue(colKey, scheduledDateStr) {
  const cleanCol = String(colKey || 'atualizacoes').split('|')[0] || 'atualizacoes';
  const cleanDate = scheduledDateStr ? String(scheduledDateStr).trim().slice(0, 10) : '';
  if (!cleanDate) return cleanCol;
  return `${cleanCol}|${cleanDate}`;
}

export function extractScheduledDateFromItem(item, type = 'entrega') {
  const rawCol = (type === 'entrega' ? item?.coluna : item?.coluna_kanban) || '';
  if (typeof rawCol === 'string' && rawCol.includes('|')) {
    const embedded = rawCol.split('|')[1]?.trim();
    if (embedded && /^\d{4}-\d{2}-\d{2}/.test(embedded)) {
      return embedded.slice(0, 10);
    }
  }
  return null;
}

/**
 * Extracts immutable visual creation date ("DD/MM") and time ("HH:mm") for a Kanban card,
 * prioritizing `created_at` so moving a card across weekday columns never alters its creation badge.
 */
export function extractCardCreatedDisplay(item) {
  if (!item) return { dateLabel: '', timeLabel: '' };

  const rawCreated = item.created_at ? String(item.created_at).trim() : '';
  if (rawCreated && (rawCreated.includes('T') || /\d{2}:\d{2}/.test(rawCreated))) {
    const normalized = rawCreated.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
    const dt = new Date(normalized);
    if (!isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const hh = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');
      return {
        dateLabel: `${dd}/${mm}`,
        timeLabel: `${hh}:${min}`,
      };
    }
  }

  let dateLabel = '';
  const fallbackDate = parseBoardDate(item.data_registro || item.created_at);
  if (fallbackDate) {
    dateLabel = `${String(fallbackDate.getDate()).padStart(2, '0')}/${String(fallbackDate.getMonth() + 1).padStart(2, '0')}`;
  }

  let timeLabel = '';
  if (item.hora_registro) {
    const hParts = String(item.hora_registro).trim().split(':');
    if (hParts.length >= 2) {
      timeLabel = `${hParts[0].padStart(2, '0')}:${hParts[1].padStart(2, '0')}`;
    }
  }

  return { dateLabel, timeLabel };
}

export function groupItemsByWeekColumns({
  items = [],
  type = 'entrega',
  weekStart,
  weekEnd,
  referenceToday = new Date(),
}) {
  const map = {
    atualizacoes: [],
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: [],
  };

  if (!weekStart || !weekEnd) return map;

  const startActive = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 0, 0, 0, 0);
  const endActive = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999);

  const curWeekStart = startOfWeek(referenceToday, { weekStartsOn: 1 });
  const curWeekEnd = addDays(curWeekStart, 5);
  curWeekEnd.setHours(23, 59, 59, 999);

  const isViewingPastWeek = endActive.getTime() < curWeekStart.getTime();
  const isViewingFutureWeek = startActive.getTime() > curWeekEnd.getTime();

  for (const item of Array.isArray(items) ? items : []) {
    if (!item) continue;

    const isConcluido = item.status === 'concluido';
    const rawCol = (type === 'entrega' ? item.coluna : item.coluna_kanban) || 'atualizacoes';
    let colVal = rawCol;
    let colEmbeddedDate = null;

    if (typeof rawCol === 'string' && rawCol.includes('|')) {
      const parts = rawCol.split('|');
      colVal = parts[0] || 'atualizacoes';
      colEmbeddedDate = parts[1] || null;
    }

    const itemDate = isConcluido
      ? parseBoardDate(item.data_conclusao) ||
        parseBoardDate(colEmbeddedDate) ||
        parseBoardDate(item.data_registro) ||
        parseBoardDate(item.created_at)
      : parseBoardDate(colEmbeddedDate) ||
        parseBoardDate(item.data_registro) ||
        parseBoardDate(item.created_at);

    const isFromPastWeek = Boolean(itemDate && itemDate.getTime() < startActive.getTime());
    const isFromFutureWeek = Boolean(itemDate && itemDate.getTime() > endActive.getTime());

    if (isViewingPastWeek) {
      // Past-week inspection shows deliveries/collections that belonged specifically to that historical week
      if (!itemDate || isFromPastWeek || isFromFutureWeek) continue;
      if (map[colVal]) {
        map[colVal].push(item);
      } else {
        const mappedCol = getColumnKeyFromDate(itemDate);
        map[mappedCol]?.push(item);
      }
      continue;
    }

    if (isViewingFutureWeek) {
      // Future-week planning shows only items scheduled specifically inside that future week
      if (!itemDate || isFromPastWeek || isFromFutureWeek) continue;
      const targetCol = DAY_OFFSETS[colVal] !== undefined ? colVal : getColumnKeyFromDate(itemDate);
      map[targetCol].push(item);
      continue;
    }

    // Current active week
    if (isConcluido && (isFromPastWeek || isFromFutureWeek)) {
      continue;
    }
    if (!isConcluido && isFromFutureWeek) {
      // Scheduled for a future week: keep hidden until its scheduled week arrives
      continue;
    }
    if (!isConcluido && isFromPastWeek) {
      // Unfinished from earlier weeks rolls into Atualizações
      map.atualizacoes.push(item);
      continue;
    }

    if (map[colVal]) {
      map[colVal].push(item);
    } else {
      map.atualizacoes.push(item);
    }
  }

  Object.keys(map).forEach((col) => {
    map[col].sort((a, b) => {
      if (!a || !b) return 0;
      const aUrg = a.urgente ? 1 : 0;
      const bUrg = b.urgente ? 1 : 0;
      if (aUrg !== bUrg) return bUrg - aUrg;

      const aConcluido = a.status === 'concluido' ? 1 : 0;
      const bConcluido = b.status === 'concluido' ? 1 : 0;
      if (aConcluido !== bConcluido) return aConcluido - bConcluido;

      const timeA = new Date(a.created_at || a.data_registro || 0).getTime() || 0;
      const timeB = new Date(b.created_at || b.data_registro || 0).getTime() || 0;
      if (timeB !== timeA) return timeB - timeA;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  });

  return map;
}

