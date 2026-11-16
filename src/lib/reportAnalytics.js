import { normalizeDeliveryLocation } from './locationUtils.js';

const MONTH_ABBR_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_FULL_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : new Date(dateStr.getTime());
  }
  const str = String(dateStr).trim();
  if (!str) return null;

  // ISO datetime or YYYY-MM-DD
  if (str.includes('T')) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function parseMonetaryValue(valStr) {
  if (typeof valStr === 'number') return isNaN(valStr) ? 0 : valStr;
  if (!valStr) return 0;
  let str = String(valStr).trim().replace(/^R\$\s*/i, '');
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDateBR(dateStr) {
  const d = parseLocalDate(dateStr);
  if (!d) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function formatMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey, full = false) {
  if (!monthKey || !monthKey.includes('-')) return monthKey || '-';
  const [y, m] = monthKey.split('-');
  const idx = parseInt(m, 10) - 1;
  const names = full ? MONTH_FULL_PT : MONTH_ABBR_PT;
  return `${names[idx] || m}/${y}`;
}

export function formatDurationHours(hours) {
  if (!hours || hours <= 0 || !isFinite(hours)) return '0h 0m';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function formatCurrencyBRL(value) {
  const num = Number(value) || 0;
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function computeDeliveryDurationMs(delivery) {
  if (!delivery || delivery.status !== 'concluido') return null;
  const hasExplicitStart = Boolean(delivery.data_inicio);
  const startField = hasExplicitStart ? delivery.data_inicio : delivery.data_registro;
  const startTimeField = hasExplicitStart ? delivery.hora_inicio : delivery.hora_registro;

  if (!startField || !delivery.data_conclusao) return null;
  if (!hasExplicitStart && (!startTimeField || !delivery.hora_conclusao)) return null;

  const startDt = parseLocalDate(startField);
  const endDt = parseLocalDate(delivery.data_conclusao);
  if (!startDt || !endDt) return null;

  if (startTimeField) {
    const [hS, minS, secS] = String(startTimeField).split(':');
    startDt.setHours(parseInt(hS, 10) || 0, parseInt(minS, 10) || 0, parseInt(secS, 10) || 0, 0);
  }
  if (delivery.hora_conclusao) {
    const [hE, minE, secE] = String(delivery.hora_conclusao).split(':');
    endDt.setHours(parseInt(hE, 10) || 0, parseInt(minE, 10) || 0, parseInt(secE, 10) || 0, 0);
  }

  const diffMs = endDt.getTime() - startDt.getTime();
  return diffMs > 0 ? diffMs : null;
}

export function isDeliveryInFull(delivery) {
  if (!delivery || delivery.status !== 'concluido') return false;
  const text = String(delivery.como_foi_entrega || 'Sem ocorrências').trim();
  if (!text) return true;
  const lower = text.toLowerCase();
  if (lower === 'sem ocorrências' || lower === 'sem ocorrencias' || lower.includes('realizada com sucesso')) {
    return true;
  }
  return false;
}

function createEmptyMonthBucket(monthKey) {
  return {
    monthKey,
    label: formatMonthLabel(monthKey, false),
    fullLabel: formatMonthLabel(monthKey, true),
    entregas: 0,
    concluidas: 0,
    emAndamento: 0,
    pendentes: 0,
    matrizCount: 0,
    filialCount: 0,
    km: 0,
    custo: 0,
    tempoMs: 0,
    completedTimeCount: 0,
    avgTimeH: 0,
    valorCarga: 0,
    frete: 0,
    valorTotal: 0,
    totalInFull: 0,
    inFullCount: 0,
    totalOnTime: 0,
    onTimeCount: 0,
    ocorrenciasCount: 0,
    onTimePct: 0,
    inFullPct: 0,
    otifPct: 0,
  };
}

function finalizeOtifPercentages(bucket) {
  bucket.onTimePct = bucket.totalOnTime > 0 ? (bucket.onTimeCount / bucket.totalOnTime) * 100 : 0;
  bucket.inFullPct = bucket.totalInFull > 0 ? (bucket.inFullCount / bucket.totalInFull) * 100 : 0;
  bucket.otifPct = (bucket.onTimePct / 100) * (bucket.inFullPct / 100) * 100;
  bucket.avgTimeH = bucket.completedTimeCount > 0 ? bucket.tempoMs / bucket.completedTimeCount / (1000 * 60 * 60) : 0;
}

/**
 * Pure analytics engine for both the Reports Dashboard and Executive PDF/Excel Exports.
 */
export function buildReportAnalytics({
  deliveries = [],
  romaneioItemsByEntregaId = new Map(),
  resolvedShortLinks = null,
  dateStart,
  dateEnd,
  selectedPlaca = 'TODAS',
  selectedVendedor = 'TODAS',
  selectedLocalCarregamento = 'TODOS',
  custoKm = 5.24,
} = {}) {
  const safeCostKm = parseFloat(custoKm) > 0 ? parseFloat(custoKm) : 5.24;
  const now = new Date();
  const sF = parseLocalDate(dateStart) || new Date(now.getFullYear(), now.getMonth(), 1);
  sF.setHours(0, 0, 0, 0);

  const eF = parseLocalDate(dateEnd) || new Date(now.getFullYear(), now.getMonth() + 1, 0);
  eF.setHours(23, 59, 59, 999);

  // Ensure valid range even if dates are inverted
  const startBoundary = sF <= eF ? sF : eF;
  const endBoundary = sF <= eF ? eF : sF;

  const diffTime = Math.abs(endBoundary.getTime() - startBoundary.getTime());
  const prevEndFilter = new Date(startBoundary.getTime() - 1);
  prevEndFilter.setHours(23, 59, 59, 999);
  const prevStartFilter = new Date(prevEndFilter.getTime() - diffTime);
  prevStartFilter.setHours(0, 0, 0, 0);

  const currentDeliveries = [];
  const previousDeliveries = [];

  for (const card of Array.isArray(deliveries) ? deliveries : []) {
    if (!card) continue;
    const placaCard = card.placa || '';
    const vendedorCard = card.vendedor || '';
    const unitCard = card.local_carregamento || 'MATRIZ';

    if (selectedPlaca !== 'TODAS' && placaCard !== selectedPlaca) continue;
    if (selectedVendedor !== 'TODAS' && vendedorCard !== selectedVendedor) continue;
    if (selectedLocalCarregamento !== 'TODOS' && unitCard !== selectedLocalCarregamento) continue;

    const cardDate = parseLocalDate(card.data_registro || card.created_at || card.data_inicio);
    if (!cardDate) continue;

    if (cardDate >= startBoundary && cardDate <= endBoundary) {
      currentDeliveries.push({ card, cardDate });
    } else if (cardDate >= prevStartFilter && cardDate <= prevEndFilter) {
      previousDeliveries.push({ card, cardDate });
    }
  }

  // Monthly, Daily, Sellers, Vehicles, Materials, Clients, Locations accumulators
  const monthlyMap = new Map();
  const dailyMap = new Map();
  const occurrencesMap = new Map();
  const ofensoresPlaca = {};
  const sellersMap = new Map();
  const vehiclesMap = new Map();
  const materialsMap = new Map();
  const clientsMap = new Map();
  const locationsMap = new Map();

  const summary = createEmptyMonthBucket('TOTAL');
  let matrizKm = 0;
  let filialKm = 0;
  let matrizValor = 0;
  let filialValor = 0;
  let matrizFrete = 0;
  let filialFrete = 0;

  let prevEntregas = previousDeliveries.length;
  let prevKm = 0;
  let prevTotalValorGeral = 0;
  let prevTotalFrete = 0;
  let prevTempoMs = 0;
  let prevCompletedForTime = 0;

  for (const { card } of previousDeliveries) {
    const km = parseFloat(String(card.km_total || '0').replace(',', '.')) || 0;
    prevKm += km;
    const valCarga = parseMonetaryValue(card.valor_entrega);
    const frete = parseMonetaryValue(card.frete);
    prevTotalValorGeral += valCarga + frete;
    prevTotalFrete += frete;

    const durMs = computeDeliveryDurationMs(card);
    if (durMs !== null) {
      prevTempoMs += durMs;
      prevCompletedForTime++;
    }
  }

  let entregasComRomaneio = 0;
  let legacyCount = 0;
  let liveCount = 0;
  let totalRomaneioItensLinhas = 0;
  let totalRomaneioQtd = 0;
  let totalRomaneioPeso = 0;
  let totalRomaneioValor = 0;

  const mapStats = {
    totalEntregas: currentDeliveries.length,
    explicitCoordsCount: 0,
    presetResolvedCount: 0,
    mappableTextCount: 0,
    shortUrlCount: 0,
    emptyAddressCount: 0,
  };

  for (const { card, cardDate } of currentDeliveries) {
    if (card.isHistorical) legacyCount += 1;
    else liveCount += 1;
    const monthKey = formatMonthKey(cardDate);
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, createEmptyMonthBucket(monthKey));
    }
    const mBucket = monthlyMap.get(monthKey);

    const dayKey = `${cardDate.getFullYear()}-${String(cardDate.getMonth() + 1).padStart(2, '0')}-${String(cardDate.getDate()).padStart(2, '0')}`;
    const dayLabel = `${String(cardDate.getDate()).padStart(2, '0')}/${String(cardDate.getMonth() + 1).padStart(2, '0')}`;
    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, { dayKey, label: dayLabel, entregas: 0, valorTotal: 0, km: 0 });
    }
    const dBucket = dailyMap.get(dayKey);

    const km = parseFloat(String(card.km_total || '0').replace(',', '.')) || 0;
    const valCarga = parseMonetaryValue(card.valor_entrega);
    const frete = parseMonetaryValue(card.frete);
    const valorTotal = valCarga + frete;
    const custo = km * safeCostKm;

    const isConcluida = card.status === 'concluido';
    const isEmAndamento = card.status === 'em_andamento';
    const isMatriz = (card.local_carregamento || 'MATRIZ') === 'MATRIZ';
    const isFilial = card.local_carregamento === 'FILIAL';

    // Summary & Month increments
    for (const target of [summary, mBucket]) {
      target.entregas += 1;
      if (isConcluida) target.concluidas += 1;
      else if (isEmAndamento) target.emAndamento += 1;
      else target.pendentes += 1;

      if (isMatriz) target.matrizCount += 1;
      if (isFilial) target.filialCount += 1;

      target.km += km;
      target.custo += custo;
      target.valorCarga += valCarga;
      target.frete += frete;
      target.valorTotal += valorTotal;
    }

    if (isMatriz) {
      matrizKm += km;
      matrizValor += valorTotal;
      matrizFrete += frete;
    } else if (isFilial) {
      filialKm += km;
      filialValor += valorTotal;
      filialFrete += frete;
    }

    dBucket.entregas += 1;
    dBucket.valorTotal += valorTotal;
    dBucket.km += km;

    // Duration & OTIF
    const durMs = computeDeliveryDurationMs(card);
    if (durMs !== null) {
      summary.tempoMs += durMs;
      summary.completedTimeCount += 1;
      summary.totalOnTime += 1;
      mBucket.tempoMs += durMs;
      mBucket.completedTimeCount += 1;
      mBucket.totalOnTime += 1;

      if (durMs <= 24 * 60 * 60 * 1000) {
        summary.onTimeCount += 1;
        mBucket.onTimeCount += 1;
      }
    }

    const placaRaw = String(card.placa || 'Sem Placa').trim() || 'Sem Placa';
    let inFullOk = false;
    if (isConcluida) {
      summary.totalInFull += 1;
      mBucket.totalInFull += 1;
      const motivo = String(card.como_foi_entrega || 'Sem ocorrências').trim() || 'Sem ocorrências';
      occurrencesMap.set(motivo, (occurrencesMap.get(motivo) || 0) + 1);

      if (isDeliveryInFull(card)) {
        inFullOk = true;
        summary.inFullCount += 1;
        mBucket.inFullCount += 1;
      } else {
        summary.ocorrenciasCount += 1;
        mBucket.ocorrenciasCount += 1;
        ofensoresPlaca[placaRaw] = (ofensoresPlaca[placaRaw] || 0) + 1;
      }
    }

    // Sellers aggregation (Total + Monthly)
    const vendRaw = String(card.vendedor || 'Não Informado').trim() || 'Não Informado';
    if (!sellersMap.has(vendRaw)) {
      sellersMap.set(vendRaw, {
        name: vendRaw,
        displayName: vendRaw.replace(/\s*\((Matriz|Filial)\)/gi, '').trim(),
        unidade: vendRaw.toLowerCase().includes('filial') ? 'FILIAL' : card.local_carregamento || 'MATRIZ',
        entregas: 0,
        concluidas: 0,
        valorCarga: 0,
        frete: 0,
        valorTotal: 0,
        km: 0,
        inFullOk: 0,
        inFullTotal: 0,
        byMonth: {},
      });
    }
    const vendObj = sellersMap.get(vendRaw);
    vendObj.entregas += 1;
    if (isConcluida) {
      vendObj.concluidas += 1;
      vendObj.inFullTotal += 1;
      if (inFullOk) vendObj.inFullOk += 1;
    }
    vendObj.valorCarga += valCarga;
    vendObj.frete += frete;
    vendObj.valorTotal += valorTotal;
    vendObj.km += km;

    if (!vendObj.byMonth[monthKey]) {
      vendObj.byMonth[monthKey] = { entregas: 0, concluidas: 0, valorCarga: 0, frete: 0, valorTotal: 0, ticketMedio: 0 };
    }
    const vendM = vendObj.byMonth[monthKey];
    vendM.entregas += 1;
    if (isConcluida) vendM.concluidas += 1;
    vendM.valorCarga += valCarga;
    vendM.frete += frete;
    vendM.valorTotal += valorTotal;
    vendM.ticketMedio = vendM.entregas > 0 ? vendM.valorTotal / vendM.entregas : 0;

    // Vehicles aggregation (Total + Monthly)
    if (!vehiclesMap.has(placaRaw)) {
      const parenMatch = placaRaw.match(/\(([^)]+)\)/);
      vehiclesMap.set(placaRaw, {
        placa: placaRaw,
        placaCurta: placaRaw.split('(')[0].trim(),
        motorista: card.motorista?.nome || (parenMatch ? parenMatch[1] : 'Rotativo'),
        modelo: card.veiculo?.modelo || '-',
        entregas: 0,
        concluidas: 0,
        km: 0,
        custo: 0,
        valorTotal: 0,
        tempoMs: 0,
        completedTimeCount: 0,
        inFullOk: 0,
        inFullTotal: 0,
        ocorrencias: 0,
        byMonth: {},
      });
    }
    const vehObj = vehiclesMap.get(placaRaw);
    vehObj.entregas += 1;
    if (isConcluida) {
      vehObj.concluidas += 1;
      vehObj.inFullTotal += 1;
      if (inFullOk) vehObj.inFullOk += 1;
      else vehObj.ocorrencias += 1;
    }
    vehObj.km += km;
    vehObj.custo += custo;
    vehObj.valorTotal += valorTotal;
    if (durMs !== null) {
      vehObj.tempoMs += durMs;
      vehObj.completedTimeCount += 1;
    }

    if (!vehObj.byMonth[monthKey]) {
      vehObj.byMonth[monthKey] = { entregas: 0, concluidas: 0, km: 0, custo: 0, tempoMs: 0, completedTimeCount: 0, avgTimeH: 0, valorTotal: 0 };
    }
    const vehM = vehObj.byMonth[monthKey];
    vehM.entregas += 1;
    if (isConcluida) vehM.concluidas += 1;
    vehM.km += km;
    vehM.custo += custo;
    vehM.valorTotal += valorTotal;
    if (durMs !== null) {
      vehM.tempoMs += durMs;
      vehM.completedTimeCount += 1;
      vehM.avgTimeH = vehM.tempoMs / vehM.completedTimeCount / (1000 * 60 * 60);
    }

    // Clients aggregation (Total + Monthly)
    const clientName = String(card.cliente || 'Cliente não informado').trim() || 'Cliente não informado';
    const clientKey = clientName.toUpperCase();
    if (!clientsMap.has(clientKey)) {
      clientsMap.set(clientKey, {
        cliente: clientName,
        entregas: 0,
        concluidas: 0,
        km: 0,
        valorCarga: 0,
        frete: 0,
        valorTotal: 0,
        lastDate: card.data_registro || '',
        byMonth: {},
      });
    }
    const cliObj = clientsMap.get(clientKey);
    cliObj.entregas += 1;
    if (isConcluida) cliObj.concluidas += 1;
    cliObj.km += km;
    cliObj.valorCarga += valCarga;
    cliObj.frete += frete;
    cliObj.valorTotal += valorTotal;
    if (card.data_registro && (!cliObj.lastDate || card.data_registro > cliObj.lastDate)) {
      cliObj.lastDate = card.data_registro;
    }

    if (!cliObj.byMonth[monthKey]) {
      cliObj.byMonth[monthKey] = { entregas: 0, concluidas: 0, valorTotal: 0, km: 0 };
    }
    cliObj.byMonth[monthKey].entregas += 1;
    if (isConcluida) cliObj.byMonth[monthKey].concluidas += 1;
    cliObj.byMonth[monthKey].valorTotal += valorTotal;
    cliObj.byMonth[monthKey].km += km;

    // Locations aggregation (Total + Monthly)
    const locInfo = normalizeDeliveryLocation(card, resolvedShortLinks);
    if (locInfo.isEmpty) mapStats.emptyAddressCount += 1;
    else if (locInfo.isShortUrl) mapStats.shortUrlCount += 1;
    else if (locInfo.explicitCoords) mapStats.explicitCoordsCount += 1;
    else if (locInfo.presetCoords) mapStats.presetResolvedCount += 1;
    else if (locInfo.geocodeQuery) mapStats.mappableTextCount += 1;

    if (!locationsMap.has(locInfo.key)) {
      locationsMap.set(locInfo.key, {
        key: locInfo.key,
        label: locInfo.label,
        category: locInfo.category,
        entregas: 0,
        concluidas: 0,
        valorTotal: 0,
        km: 0,
        sampleAddress: locInfo.rawAddress,
        isShortUrl: locInfo.isShortUrl,
        isEmpty: locInfo.isEmpty,
        explicitCoords: locInfo.explicitCoords,
        presetCoords: locInfo.presetCoords,
        geocodeQuery: locInfo.geocodeQuery,
        rawSamples: new Set(),
        byMonth: {},
      });
    }
    const locObj = locationsMap.get(locInfo.key);
    locObj.entregas += 1;
    if (isConcluida) locObj.concluidas += 1;
    locObj.valorTotal += valorTotal;
    locObj.km += km;
    if (locInfo.rawAddress) locObj.rawSamples.add(locInfo.rawAddress);
    if (!locObj.explicitCoords && locInfo.explicitCoords) locObj.explicitCoords = locInfo.explicitCoords;
    if (!locObj.presetCoords && locInfo.presetCoords) locObj.presetCoords = locInfo.presetCoords;
    if (!locObj.geocodeQuery && locInfo.geocodeQuery) locObj.geocodeQuery = locInfo.geocodeQuery;

    if (!locObj.byMonth[monthKey]) {
      locObj.byMonth[monthKey] = { entregas: 0, valorTotal: 0, km: 0 };
    }
    locObj.byMonth[monthKey].entregas += 1;
    locObj.byMonth[monthKey].valorTotal += valorTotal;
    locObj.byMonth[monthKey].km += km;

    // Romaneio items aggregation (Materials sold)
    const romEntry = romaneioItemsByEntregaId instanceof Map
      ? romaneioItemsByEntregaId.get(String(card.id))
      : romaneioItemsByEntregaId?.[String(card.id)];
    const items = romEntry?.itens || card.romaneio?.itens || [];

    if (items.length > 0) {
      entregasComRomaneio += 1;
      const seenMaterialsInDelivery = new Set();

      for (const item of items) {
        const codigo = String(item.codigo_material || '').trim();
        const nome = String(item.nome_material || 'Material sem descrição').trim();
        const unidade = String(item.unidade || 'UN').trim().toUpperCase();
        const matKey = codigo ? `${codigo}::${nome.toUpperCase()}` : nome.toUpperCase();

        const qtd = parseFloat(item.quantidade) || 0;
        const pesoKg = parseFloat(item.peso_total_kg) || (qtd * (parseFloat(item.peso_unitario_kg) || 0)) || 0;
        const valTot = parseFloat(item.valor_total) || (qtd * (parseFloat(item.valor_unitario) || 0)) || 0;

        totalRomaneioItensLinhas += 1;
        totalRomaneioQtd += qtd;
        totalRomaneioPeso += pesoKg;
        totalRomaneioValor += valTot;

        if (!materialsMap.has(matKey)) {
          materialsMap.set(matKey, {
            key: matKey,
            codigo: codigo || '-',
            nome,
            unidade,
            ocorrenciasRomaneio: 0,
            entregasDistintas: 0,
            quantidadeTotal: 0,
            pesoTotalKg: 0,
            valorTotal: 0,
            byMonth: {},
          });
        }

        const matObj = materialsMap.get(matKey);
        matObj.ocorrenciasRomaneio += 1;
        matObj.quantidadeTotal += qtd;
        matObj.pesoTotalKg += pesoKg;
        matObj.valorTotal += valTot;
        if (!seenMaterialsInDelivery.has(matKey)) {
          matObj.entregasDistintas += 1;
          seenMaterialsInDelivery.add(matKey);
        }

        if (!matObj.byMonth[monthKey]) {
          matObj.byMonth[monthKey] = { ocorrencias: 0, quantidade: 0, pesoKg: 0, valorTotal: 0 };
        }
        matObj.byMonth[monthKey].ocorrencias += 1;
        matObj.byMonth[monthKey].quantidade += qtd;
        matObj.byMonth[monthKey].pesoKg += pesoKg;
        matObj.byMonth[monthKey].valorTotal += valTot;
      }
    }
  }

  // Finalize OTIF and averages
  finalizeOtifPercentages(summary);
  const monthlySeries = Array.from(monthlyMap.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  monthlySeries.forEach(finalizeOtifPercentages);

  const dailySeriesArr = Array.from(dailyMap.values())
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  const prevAvgTimeH = prevCompletedForTime > 0 ? prevTempoMs / prevCompletedForTime / (1000 * 60 * 60) : 0;
  const prevCost = prevKm * safeCostKm;

  // Ofensor principal
  let maxErros = 0;
  let ofensorName = 'Nenhum Registro';
  for (const [placa, count] of Object.entries(ofensoresPlaca)) {
    if (count > maxErros) {
      maxErros = count;
      ofensorName = placa;
    }
  }

  const occurrencesBreakdown = Array.from(occurrencesMap.entries())
    .map(([motivo, count]) => ({
      motivo,
      count,
      pct: summary.concluidas > 0 ? (count / summary.concluidas) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const sellersRanking = Array.from(sellersMap.values())
    .map((s) => ({
      ...s,
      ticketMedio: s.entregas > 0 ? s.valorTotal / s.entregas : 0,
      otifPct: s.inFullTotal > 0 ? (s.inFullOk / s.inFullTotal) * 100 : 100,
      sharePct: summary.valorTotal > 0 ? (s.valorTotal / summary.valorTotal) * 100 : 0,
    }))
    .sort((a, b) => (b.valorTotal !== a.valorTotal ? b.valorTotal - a.valorTotal : b.entregas - a.entregas));

  const vehiclesRanking = Array.from(vehiclesMap.values())
    .map((v) => ({
      ...v,
      avgTimeH: v.completedTimeCount > 0 ? v.tempoMs / v.completedTimeCount / (1000 * 60 * 60) : 0,
      otifPct: v.inFullTotal > 0 ? (v.inFullOk / v.inFullTotal) * 100 : 100,
      sharePct: summary.entregas > 0 ? (v.entregas / summary.entregas) * 100 : 0,
    }))
    .sort((a, b) => (b.entregas !== a.entregas ? b.entregas - a.entregas : b.km - a.km));

  const materialsRanking = Array.from(materialsMap.values())
    .map((m) => ({
      ...m,
      shareValorPct: totalRomaneioValor > 0 ? (m.valorTotal / totalRomaneioValor) * 100 : 0,
    }))
    .sort((a, b) =>
      b.entregasDistintas !== a.entregasDistintas
        ? b.entregasDistintas - a.entregasDistintas
        : b.valorTotal - a.valorTotal
    );

  const clientsRanking = Array.from(clientsMap.values())
    .map((c) => ({
      ...c,
      ticketMedio: c.entregas > 0 ? c.valorTotal / c.entregas : 0,
      sharePct: summary.entregas > 0 ? (c.entregas / summary.entregas) * 100 : 0,
    }))
    .sort((a, b) => (b.entregas !== a.entregas ? b.entregas - a.entregas : b.valorTotal - a.valorTotal));

  const locationsRanking = Array.from(locationsMap.values())
    .map((l) => ({
      ...l,
      rawAddressesCount: l.rawSamples.size,
      rawSamples: Array.from(l.rawSamples),
      sharePct: summary.entregas > 0 ? (l.entregas / summary.entregas) * 100 : 0,
    }))
    .sort((a, b) => (b.entregas !== a.entregas ? b.entregas - a.entregas : b.valorTotal - a.valorTotal));

  return {
    meta: {
      dateStart: `${startBoundary.getFullYear()}-${String(startBoundary.getMonth() + 1).padStart(2, '0')}-${String(startBoundary.getDate()).padStart(2, '0')}`,
      dateEnd: `${endBoundary.getFullYear()}-${String(endBoundary.getMonth() + 1).padStart(2, '0')}-${String(endBoundary.getDate()).padStart(2, '0')}`,
      formattedPeriod: `${formatDateBR(startBoundary)} até ${formatDateBR(endBoundary)}`,
      selectedPlaca,
      selectedVendedor,
      selectedLocalCarregamento,
      custoKm: safeCostKm,
      generatedAt: now.toISOString(),
      totalRegistrosFiltrados: currentDeliveries.length,
    },
    summary: {
      totalEntregas: summary.entregas,
      legacyCount,
      liveCount,
      prevEntregas,
      concluidas: summary.concluidas,
      emAndamento: summary.emAndamento,
      pendentes: summary.pendentes,
      matrizCount: summary.matrizCount,
      filialCount: summary.filialCount,
      totalKm: summary.km,
      prevKm,
      avgKmPerDelivery: summary.entregas > 0 ? summary.km / summary.entregas : 0,
      matrizKm,
      filialKm,
      totalCost: summary.custo,
      prevCost,
      matrizCost: matrizKm * safeCostKm,
      filialCost: filialKm * safeCostKm,
      avgCostPerDelivery: summary.entregas > 0 ? summary.custo / summary.entregas : 0,
      avgTimeH: summary.avgTimeH,
      prevAvgTimeH,
      completedCountForTime: summary.completedTimeCount,
      totalValorCarga: summary.valorCarga,
      totalFrete: summary.frete,
      totalValorGeral: summary.valorTotal,
      prevTotalValorGeral,
      prevTotalFrete,
      matrizValor,
      filialValor,
      matrizFrete,
      filialFrete,
      ticketMedio: summary.entregas > 0 ? summary.valorTotal / summary.entregas : 0,
      otif: {
        otifPct: summary.otifPct,
        onTimePct: summary.onTimePct,
        inFullPct: summary.inFullPct,
        totalOnTime: summary.totalOnTime,
        onTimeCount: summary.onTimeCount,
        totalInFull: summary.totalInFull,
        inFullCount: summary.inFullCount,
        ocorrenciasCount: summary.ocorrenciasCount,
        ofensorName,
        maxErros,
        occurrencesBreakdown,
      },
    },
    months: monthlySeries.map((m) => ({ monthKey: m.monthKey, label: m.label, fullLabel: m.fullLabel })),
    monthlySeries,
    dailySeries: {
      labels: dailySeriesArr.map((d) => d.label),
      counts: dailySeriesArr.map((d) => d.entregas),
      values: dailySeriesArr.map((d) => d.valorTotal),
      kms: dailySeriesArr.map((d) => d.km),
    },
    sellers: {
      ranking: sellersRanking,
    },
    vehicles: {
      ranking: vehiclesRanking,
    },
    materials: {
      ranking: materialsRanking,
      totals: {
        itensDistintos: materialsRanking.length,
        linhasRomaneio: totalRomaneioItensLinhas,
        entregasComRomaneio,
        quantidadeTotal: totalRomaneioQtd,
        pesoTotalKg: totalRomaneioPeso,
        valorTotalRomaneios: totalRomaneioValor,
      },
    },
    clients: {
      ranking: clientsRanking,
    },
    locations: {
      ranking: locationsRanking,
      mapStats,
    },
  };
}
