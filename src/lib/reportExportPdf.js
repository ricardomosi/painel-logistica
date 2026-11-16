import * as jsPDFModule from 'jspdf';
import * as autoTableModule from 'jspdf-autotable';
import { formatCurrencyBRL, formatDurationHours } from './reportAnalytics.js';

const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default || jsPDFModule;
const rawAutoTable =
  (typeof autoTableModule.default === 'function' && autoTableModule.default) ||
  (typeof autoTableModule.default?.default === 'function' && autoTableModule.default.default) ||
  (typeof autoTableModule.autoTable === 'function' && autoTableModule.autoTable) ||
  null;

function autoTable(doc, options) {
  if (typeof doc.autoTable === 'function') {
    return doc.autoTable(options);
  }
  if (typeof rawAutoTable === 'function') {
    return rawAutoTable(doc, options);
  }
  const apply = autoTableModule.applyPlugin || autoTableModule.default?.applyPlugin;
  if (typeof apply === 'function' && jsPDF) {
    apply(jsPDF);
    if (typeof doc.autoTable === 'function') {
      return doc.autoTable(options);
    }
  }
  throw new Error('jspdf-autotable não disponível no ambiente');
}

const COMPANY_LOGO_URL =
  'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1766755027/Gemini_Generated_Image_b4mrdzb4mrdzb4mr_b5qgcn.png';

const PAGE_BOTTOM_SAFE_Y = 276;
const TOP_MARGIN_Y = 14;

let cachedLogoData = null;

async function loadLogoSafe() {
  if (typeof Image === 'undefined') return null;
  if (cachedLogoData) return cachedLogoData;

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 1800);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      clearTimeout(timer);
      cachedLogoData = img;
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = COMPANY_LOGO_URL;
  });
}

function ensureSpace(doc, y, neededHeight, topY = TOP_MARGIN_Y) {
  if (y + neededHeight > PAGE_BOTTOM_SAFE_Y) {
    doc.addPage();
    return topY;
  }
  return y;
}

function formatCompactNumber(val) {
  const num = Number(val) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(Math.round(num));
}

function truncateTextToFit(doc, text, maxWidthMm) {
  const str = String(text ?? '').trim();
  if (!str) return '-';
  if (doc.getTextWidth(str) <= maxWidthMm) return str;
  const ellipsis = '...';
  let trimmed = str;
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}${ellipsis}`) > maxWidthMm) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}${ellipsis}`;
}

function drawSectionHeader(doc, title, subtitle, y, minTrailingHeight = 28, startX = 12, contentWidth = 186) {
  const headerH = subtitle ? 12 : 8.5;
  y = ensureSpace(doc, y, headerH + minTrailingHeight);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(startX, y, contentWidth, headerH, 1.5, 1.5, 'F');
  doc.setFillColor(0, 129, 167);
  doc.rect(startX, y, 1.6, headerH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.setTextColor(15, 23, 42);
  doc.text(title, startX + 4, y + 5.2);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.1);
    doc.setTextColor(71, 85, 105);
    doc.text(truncateTextToFit(doc, subtitle, contentWidth - 8), startX + 4, y + 9.8);
  }

  return y + headerH + 3;
}

/**
 * Pure vector full-width monthly grouped column chart (Entregas + KM Percorrido)
 * Avoids canvas-to-PDF aspect stretching and keeps fonts razor-sharp on A4 print/zoom.
 */
function drawMonthlyGroupedBarChart(doc, monthlySeries, x, y, width, height) {
  y = ensureSpace(doc, y, height);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  // Card header strip
  doc.setFillColor(248, 250, 252);
  doc.rect(x + 0.3, y + 0.3, width - 0.6, 10.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(x, y + 10.8, x + width, y + 10.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(15, 23, 42);
  doc.text('EVOLUÇÃO MENSAL — ENTREGAS & QUILOMETRAGEM PERCORRIDA', x + 4, y + 6.8);

  // Legend badges on top right
  const legRightX = x + width - 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('KM Percorrido', legRightX, y + 6.6, { align: 'right' });
  const kmTextW = doc.getTextWidth('KM Percorrido');
  doc.setFillColor(240, 113, 39);
  doc.roundedRect(legRightX - kmTextW - 4.5, y + 4.1, 3.2, 3.2, 0.6, 0.6, 'F');

  const entLegX = legRightX - kmTextW - 10;
  doc.text('Entregas', entLegX, y + 6.6, { align: 'right' });
  const entTextW = doc.getTextWidth('Entregas');
  doc.setFillColor(0, 129, 167);
  doc.roundedRect(entLegX - entTextW - 4.5, y + 4.1, 3.2, 3.2, 0.6, 0.6, 'F');

  const series = monthlySeries || [];
  if (series.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Sem movimentação mensal no período selecionado.', x + width / 2, y + height / 2 + 2, { align: 'center' });
    return y + height + 5;
  }

  const plotLeft = x + 15;
  const plotRight = x + width - 16;
  const plotTop = y + 16;
  const plotBottom = y + height - 11;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const rawMaxEnt = Math.max(...series.map((m) => Number(m.entregas) || 0), 1);
  const rawMaxKm = Math.max(...series.map((m) => Number(m.km) || 0), 1);
  const maxEnt = Math.ceil(rawMaxEnt * 1.15);
  const maxKm = Math.ceil(rawMaxKm * 1.15);

  // Horizontal gridlines + Left (Entregas) & Right (KM) axis ticks
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const gy = plotBottom - ratio * plotH;
    doc.setDrawColor(i === 0 ? 148 : 226, i === 0 ? 163 : 232, i === 0 ? 184 : 240);
    doc.setLineWidth(i === 0 ? 0.35 : 0.2);
    doc.line(plotLeft, gy, plotRight, gy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(0, 102, 134);
    doc.text(formatCompactNumber(ratio * maxEnt), plotLeft - 2, gy + 1.1, { align: 'right' });

    doc.setTextColor(194, 82, 22);
    doc.text(formatCompactNumber(ratio * maxKm), plotRight + 2, gy + 1.1, { align: 'left' });
  }

  // Axis unit micro-labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(0, 102, 134);
  doc.text('Entr.', plotLeft - 2, plotTop - 2, { align: 'right' });
  doc.setTextColor(194, 82, 22);
  doc.text('KM', plotRight + 2, plotTop - 2, { align: 'left' });

  const slotW = plotW / series.length;
  const barGroupW = Math.min(slotW * 0.72, 16);
  const singleBarW = Math.max((barGroupW - 1.2) / 2, 1.8);
  const showBarValues = series.length <= 14;
  const valueFontSize = series.length > 9 ? 5.6 : 6.4;

  series.forEach((m, idx) => {
    const centerX = plotLeft + idx * slotW + slotW / 2;
    const entVal = Number(m.entregas) || 0;
    const kmVal = Number(m.km) || 0;

    const entH = Math.max((entVal / maxEnt) * plotH, entVal > 0 ? 1.2 : 0);
    const kmH = Math.max((kmVal / maxKm) * plotH, kmVal > 0 ? 1.2 : 0);

    const entX = centerX - singleBarW - 0.5;
    const kmX = centerX + 0.5;

    if (entH > 0) {
      doc.setFillColor(0, 129, 167);
      doc.roundedRect(entX, plotBottom - entH, singleBarW, entH, 0.5, 0.5, 'F');
    }
    if (kmH > 0) {
      doc.setFillColor(240, 113, 39);
      doc.roundedRect(kmX, plotBottom - kmH, singleBarW, kmH, 0.5, 0.5, 'F');
    }

    if (showBarValues) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(valueFontSize);
      if (entVal > 0) {
        doc.setTextColor(0, 102, 134);
        doc.text(String(entVal), entX + singleBarW / 2, plotBottom - entH - 1.2, { align: 'center' });
      }
      if (kmVal > 0) {
        doc.setTextColor(194, 82, 22);
        doc.text(formatCompactNumber(kmVal), kmX + singleBarW / 2, plotBottom - kmH - 1.2, { align: 'center' });
      }
    }

    // X-axis Month Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(series.length > 10 ? 6.2 : 6.9);
    doc.setTextColor(51, 65, 85);
    doc.text(String(m.label || ''), centerX, plotBottom + 5.2, { align: 'center' });
  });

  return y + height + 5;
}

/**
 * Pure vector full-width monthly multi-line chart for OTIF %, On-Time <=24h %, In-Full %
 */
function drawMonthlyOtifLineChart(doc, monthlySeries, x, y, width, height) {
  y = ensureSpace(doc, y, height);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.rect(x + 0.3, y + 0.3, width - 0.6, 10.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(x, y + 10.8, x + width, y + 10.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(15, 23, 42);
  doc.text('EVOLUÇÃO MENSAL DE QUALIDADE — OTIF, ON-TIME (<=24h) & IN-FULL', x + 4, y + 6.8);

  // Legend top right
  const legendItems = [
    { label: 'In-Full %', color: [240, 113, 39] },
    { label: 'On-Time %', color: [0, 129, 167] },
    { label: 'OTIF %', color: [16, 185, 129] },
  ];
  let cursorX = x + width - 4;
  legendItems.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(item.label, cursorX, y + 6.6, { align: 'right' });
    const w = doc.getTextWidth(item.label);
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.circle(cursorX - w - 2.6, y + 5.7, 1.3, 'F');
    cursorX -= w + 8.5;
  });

  const series = monthlySeries || [];
  if (series.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Sem dados de OTIF no período selecionado.', x + width / 2, y + height / 2 + 2, { align: 'center' });
    return y + height + 5;
  }

  const plotLeft = x + 15;
  const plotRight = x + width - 10;
  const plotTop = y + 16.5;
  const plotBottom = y + height - 10.5;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  for (let pct = 0; pct <= 100; pct += 25) {
    const gy = plotBottom - (pct / 100) * plotH;
    doc.setDrawColor(pct === 0 ? 148 : 226, pct === 0 ? 163 : 232, pct === 0 ? 184 : 240);
    doc.setLineWidth(pct === 0 ? 0.35 : 0.2);
    doc.line(plotLeft, gy, plotRight, gy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${pct}%`, plotLeft - 2.2, gy + 1.1, { align: 'right' });
  }

  const getPointX = (idx) => {
    if (series.length === 1) return plotLeft + plotW / 2;
    const slotW = plotW / series.length;
    return plotLeft + idx * slotW + slotW / 2;
  };
  const getPointY = (pctVal) => {
    const clamped = Math.max(0, Math.min(100, Number(pctVal) || 0));
    return plotBottom - (clamped / 100) * plotH;
  };

  const linesSpec = [
    { key: 'onTimePct', color: [0, 129, 167], width: 0.45, radius: 1.0, showLabel: false },
    { key: 'inFullPct', color: [240, 113, 39], width: 0.45, radius: 1.0, showLabel: false },
    { key: 'otifPct', color: [16, 185, 129], width: 0.75, radius: 1.35, showLabel: true },
  ];

  linesSpec.forEach((spec) => {
    doc.setDrawColor(spec.color[0], spec.color[1], spec.color[2]);
    doc.setLineWidth(spec.width);
    for (let i = 0; i < series.length - 1; i++) {
      const x1 = getPointX(i);
      const y1 = getPointY(series[i][spec.key]);
      const x2 = getPointX(i + 1);
      const y2 = getPointY(series[i + 1][spec.key]);
      doc.line(x1, y1, x2, y2);
    }

    series.forEach((m, idx) => {
      const px = getPointX(idx);
      const val = Number(m[spec.key]) || 0;
      const py = getPointY(val);
      doc.setFillColor(spec.color[0], spec.color[1], spec.color[2]);
      doc.circle(px, py, spec.radius, 'F');

      if (spec.showLabel) {
        const labelOffset = val > 88 ? 4.3 : -2.2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(series.length > 10 ? 6.0 : 6.7);
        doc.setTextColor(6, 95, 70);
        doc.text(`${Math.round(val)}%`, px, py + labelOffset, { align: 'center' });
      }
    });
  });

  series.forEach((m, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(series.length > 10 ? 6.2 : 6.9);
    doc.setTextColor(51, 65, 85);
    doc.text(String(m.label || ''), getPointX(idx), plotBottom + 5.2, { align: 'center' });
  });

  return y + height + 5;
}

/**
 * Pure vector full-width horizontal ranking bar chart (crisp unstretched typography, aligned columns)
 */
function drawVectorRankingBarChart(doc, config, x, y, width) {
  const safeItems = (config.items || []).slice(0, config.maxItems || 8);
  const headerH = 10.5;
  const rowH = 6.4;
  const bottomPad = 6.5;
  const height = safeItems.length > 0 ? headerH + 3.5 + safeItems.length * rowH + bottomPad : 26;

  y = ensureSpace(doc, y, height);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  // Card header
  doc.setFillColor(248, 250, 252);
  doc.rect(x + 0.3, y + 0.3, width - 0.6, headerH, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(x, y + headerH, x + width, y + headerH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(config.title, x + 4, y + 6.6);

  if (config.legendLabel) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(config.legendLabel, x + width - 4, y + 6.5, { align: 'right' });
    const legW = doc.getTextWidth(config.legendLabel);
    doc.setFillColor(config.colorRgb[0], config.colorRgb[1], config.colorRgb[2]);
    doc.roundedRect(x + width - 4 - legW - 4.5, y + 4.1, 3.2, 3.2, 0.6, 0.6, 'F');
  }

  if (safeItems.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(100, 116, 139);
    doc.text(config.emptyMessage || 'Sem registros suficientes no período selecionado.', x + width / 2, y + 19, {
      align: 'center',
    });
    return y + height + 5;
  }

  const labelColW = 54;
  const valueColW = 46;
  const barAreaX = x + 4 + labelColW + 3;
  const barAreaW = width - labelColW - valueColW - 14;
  const maxVal = Math.max(...safeItems.map((i) => Number(i.value) || 0), 1);

  const firstRowY = y + headerH + 3.5;
  const trackTopY = firstRowY;
  const trackBottomY = firstRowY + safeItems.length * rowH - 1.2;

  // Vertical reference ticks behind bars
  for (let g = 0; g <= 4; g++) {
    const gx = barAreaX + (g / 4) * barAreaW;
    doc.setDrawColor(232, 238, 245);
    doc.setLineWidth(0.18);
    doc.line(gx, trackTopY - 0.5, gx, trackBottomY + 0.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.9);
    doc.setTextColor(100, 116, 139);
    const tickLabel = config.formatTick
      ? config.formatTick((g / 4) * maxVal)
      : formatCompactNumber((g / 4) * maxVal);
    doc.text(tickLabel, gx, trackBottomY + 3.8, { align: 'center' });
  }

  safeItems.forEach((item, idx) => {
    const rowY = firstRowY + idx * rowH;
    const val = Number(item.value) || 0;
    const barW = Math.max((val / maxVal) * barAreaW, val > 0 ? 1.8 : 0);

    // Subtle zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(250, 252, 255);
      doc.rect(x + 1, rowY - 0.4, width - 2, rowH - 0.4, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    doc.setTextColor(30, 41, 59);
    doc.text(truncateTextToFit(doc, `${idx + 1}. ${item.label}`, labelColW), x + 4, rowY + 3.8);

    // Track + value bar
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barAreaX, rowY + 0.9, barAreaW, 3.6, 0.8, 0.8, 'F');
    if (barW > 0) {
      doc.setFillColor(config.colorRgb[0], config.colorRgb[1], config.colorRgb[2]);
      doc.roundedRect(barAreaX, rowY + 0.9, barW, 3.6, 0.8, 0.8, 'F');
    }

    // Crisp right-aligned value summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.displayValue ?? val), x + width - 4, rowY + 3.8, { align: 'right' });
  });

  return y + height + 5;
}

const DEFAULT_TABLE_STYLES = {
  theme: 'grid',
  showHead: 'everyPage',
  rowPageBreak: 'avoid',
  margin: { top: TOP_MARGIN_Y, bottom: 18, left: 12, right: 12 },
  styles: {
    fontSize: 7.2,
    cellPadding: 1.8,
    textColor: [30, 41, 59],
    lineColor: [226, 232, 240],
    lineWidth: 0.15,
  },
  headStyles: {
    fillColor: [15, 23, 42],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    fontSize: 7.1,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252],
  },
};

export async function buildReportPdfDoc(analytics, _chartImages = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const startX = 12;
  const contentWidth = 186;
  const { meta, summary, months, monthlySeries, sellers, vehicles, materials, clients, locations } = analytics;

  let y = 11;

  // Executive Header Banner
  doc.setFillColor(2, 13, 26);
  doc.roundedRect(startX, y, contentWidth, 25, 2, 2, 'F');
  doc.setFillColor(0, 129, 167);
  doc.rect(startX, y + 23.5, contentWidth, 1.5, 'F');

  const logo = await loadLogoSafe();
  let textLeft = startX + 5;
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', startX + 4, y + 3.5, 16, 16);
      textLeft = startX + 23;
    } catch {
      // Ignore logo render failure
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO EXECUTIVO DE LOGÍSTICA', textLeft, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(186, 230, 253);
  doc.text(
    `J PATRÍCIO METAIS • Período: ${meta.formattedPeriod} (${months.length} ${months.length === 1 ? 'mês' : 'meses'})`,
    textLeft,
    y + 13.8
  );
  doc.setFontSize(7.1);
  doc.setTextColor(148, 163, 184);
  doc.text(
    truncateTextToFit(
      doc,
      `Placa: ${meta.selectedPlaca} | Vendedor: ${meta.selectedVendedor} | Unidade: ${meta.selectedLocalCarregamento || 'TODOS'} | Custo/KM: ${formatCurrencyBRL(meta.custoKm)}`,
      125
    ),
    textLeft,
    y + 18.8
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(0, 212, 255);
  doc.text(`${summary.totalEntregas} ENTREGAS`, startX + contentWidth - 4, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emitido: ${new Date(meta.generatedAt).toLocaleString('pt-BR')}`, startX + contentWidth - 4, y + 14.3, { align: 'right' });
  if (summary.legacyCount > 0) {
    doc.setTextColor(253, 224, 71);
    doc.text(`${summary.legacyCount} reg. pré-Set/26 inclusos`, startX + contentWidth - 4, y + 19.1, { align: 'right' });
  }

  y += 29;

  // 6 KPI Cards Grid (2 rows x 3 cols)
  const kpiCards = [
    {
      label: 'NÚMERO DE ENTREGAS',
      value: String(summary.totalEntregas),
      sub: `Matriz: ${summary.matrizCount} | Filial: ${summary.filialCount} | Concl.: ${summary.concluidas}`,
      accent: [0, 129, 167],
    },
    {
      label: 'KM PERCORRIDO',
      value: `${summary.totalKm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`,
      sub: `Média: ${summary.avgKmPerDelivery.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km/entrega`,
      accent: [16, 185, 129],
    },
    {
      label: 'CUSTO DE ENTREGAS',
      value: formatCurrencyBRL(summary.totalCost),
      sub: `Matriz: ${formatCurrencyBRL(summary.matrizCost)} | Filial: ${formatCurrencyBRL(summary.filialCost)}`,
      accent: [240, 113, 39],
    },
    {
      label: 'MÉDIA DE TEMPO / ENTREGA',
      value: formatDurationHours(summary.avgTimeH),
      sub: `Base: ${summary.completedCountForTime} entregas cronometradas`,
      accent: [14, 165, 233],
    },
    {
      label: 'VALORES DAS ENTREGAS',
      value: formatCurrencyBRL(summary.totalValorGeral),
      sub: `Carga: ${formatCurrencyBRL(summary.totalValorCarga)} | Fretes: ${formatCurrencyBRL(summary.totalFrete)}`,
      accent: [234, 179, 8],
    },
    {
      label: 'ÍNDICE OTIF (PRAZO & QUALIDADE)',
      value: `${Math.round(summary.otif.otifPct)}%`,
      sub: `On-Time: ${Math.round(summary.otif.onTimePct)}% | In-Full: ${Math.round(summary.otif.inFullPct)}%`,
      accent: summary.otif.otifPct >= 90 ? [16, 185, 129] : summary.otif.otifPct >= 70 ? [245, 158, 11] : [239, 68, 68],
    },
  ];

  const cardW = (contentWidth - 6) / 3;
  const cardH = 19;
  kpiCards.forEach((k, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const cx = startX + col * (cardW + 3);
    const cy = y + row * (cardH + 3);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, cy, cardW, cardH, 1.5, 1.5, 'FD');
    doc.setFillColor(k.accent[0], k.accent[1], k.accent[2]);
    doc.rect(cx, cy, 1.4, cardH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(71, 85, 105);
    doc.text(k.label, cx + 3.5, cy + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(truncateTextToFit(doc, k.value, cardW - 6), cx + 3.5, cy + 11.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.1);
    doc.setTextColor(100, 116, 139);
    doc.text(truncateTextToFit(doc, k.sub, cardW - 6), cx + 3.5, cy + 16.3);
  });

  y += cardH * 2 + 8;

  // Full-width Crisp Vector Charts Row 1 & Row 2
  y = drawMonthlyGroupedBarChart(doc, monthlySeries, startX, y, contentWidth, 64);
  y = drawMonthlyOtifLineChart(doc, monthlySeries, startX, y, contentWidth, 58);

  // Section 1: Indicadores por Mês e Total
  y = drawSectionHeader(
    doc,
    '1. INDICADORES CONSOLIDADOS POR MÊS E TOTAL',
    'Entregas, KM, Custo, Tempo Médio, Valores (Carga + Frete) e OTIF mês a mês.',
    y,
    24
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
    head: [['Mês', 'Entr.', 'Concl.', 'KM', 'Custo (R$)', 'T. Médio', 'Carga (R$)', 'Frete (R$)', 'Total (R$)', 'OTIF']],
    body: [
      ...monthlySeries.map((m) => [
        m.label,
        m.entregas,
        m.concluidas,
        m.km.toFixed(1),
        formatCurrencyBRL(m.custo),
        formatDurationHours(m.avgTimeH),
        formatCurrencyBRL(m.valorCarga),
        formatCurrencyBRL(m.frete),
        formatCurrencyBRL(m.valorTotal),
        `${Math.round(m.otifPct)}%`,
      ]),
      [
        'TOTAL',
        summary.totalEntregas,
        summary.concluidas,
        summary.totalKm.toFixed(1),
        formatCurrencyBRL(summary.totalCost),
        formatDurationHours(summary.avgTimeH),
        formatCurrencyBRL(summary.totalValorCarga),
        formatCurrencyBRL(summary.totalFrete),
        formatCurrencyBRL(summary.totalValorGeral),
        `${Math.round(summary.otif.otifPct)}%`,
      ],
    ],
    didParseCell: (data) => {
      if (data.row.index === monthlySeries.length && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [224, 242, 254];
      }
    },
  });
  y = doc.lastAutoTable.finalY + 7;

  // Section 2: OTIF Detalhado e Ocorrências
  y = drawSectionHeader(
    doc,
    '2. DADOS DE OTIF E OCORRÊNCIAS LOGÍSTICAS',
    `On-Time (<=24h): ${Math.round(summary.otif.onTimePct)}% | In-Full (Sem ocorrências): ${Math.round(summary.otif.inFullPct)}% | Maior Ofensor: ${summary.otif.maxErros > 0 ? `${summary.otif.ofensorName} (${summary.otif.maxErros})` : 'Nenhum'}`,
    y,
    24
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
    head: [['Mês / Período', 'Base Concluídas', 'Base Horário', 'No Prazo <=24h', 'On-Time %', 'Sem Ocorrências', 'Com Ocorrências', 'In-Full %', 'OTIF %']],
    body: [
      ...monthlySeries.map((m) => [
        m.label,
        m.totalInFull,
        m.totalOnTime,
        m.onTimeCount,
        `${Math.round(m.onTimePct)}%`,
        m.inFullCount,
        m.ocorrenciasCount,
        `${Math.round(m.inFullPct)}%`,
        `${Math.round(m.otifPct)}%`,
      ]),
      [
        'TOTAL',
        summary.otif.totalInFull,
        summary.otif.totalOnTime,
        summary.otif.onTimeCount,
        `${Math.round(summary.otif.onTimePct)}%`,
        summary.otif.inFullCount,
        summary.otif.ocorrenciasCount,
        `${Math.round(summary.otif.inFullPct)}%`,
        `${Math.round(summary.otif.otifPct)}%`,
      ],
    ],
  });
  y = doc.lastAutoTable.finalY + 7;

  // Section 3: Performance por Vendedores (Total + Por Mês)
  y = drawSectionHeader(
    doc,
    '3. PERFORMANCE POR VENDEDORES (TOTAL E POR MÊS)',
    'Faturamento, ticket médio e entregas consolidadas e separadas por mês.',
    y,
    56
  );
  y = drawVectorRankingBarChart(
    doc,
    {
      title: 'RANKING COMERCIAL — FATURAMENTO POR VENDEDOR (TOP 8)',
      legendLabel: 'Faturamento Total (R$)',
      colorRgb: [0, 129, 167],
      maxItems: 8,
      formatTick: (val) => `R$ ${formatCompactNumber(val)}`,
      items: sellers.ranking.slice(0, 8).map((s) => ({
        label: `${s.displayName} (${s.unidade})`,
        value: s.valorTotal,
        displayValue: `${formatCurrencyBRL(s.valorTotal)} (${s.entregas} ent.)`,
      })),
    },
    startX,
    y,
    contentWidth
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
    head: [['#', 'Vendedor', 'Unidade', 'Entregas', 'Concluídas', 'Valor Carga', 'Frete', 'Total (R$)', 'Ticket Médio', 'Share']],
    body:
      sellers.ranking.length > 0
        ? sellers.ranking.map((s, idx) => [
            idx + 1,
            s.displayName,
            s.unidade,
            s.entregas,
            s.concluidas,
            formatCurrencyBRL(s.valorCarga),
            formatCurrencyBRL(s.frete),
            formatCurrencyBRL(s.valorTotal),
            formatCurrencyBRL(s.ticketMedio),
            `${s.sharePct.toFixed(1)}%`,
          ])
        : [['-', 'Sem registros no período', '-', 0, 0, '-', '-', '-', '-', '-']],
  });
  y = doc.lastAutoTable.finalY + 4;

  const sellerMonthlyRows = [];
  sellers.ranking.forEach((s) => {
    months.forEach((m) => {
      const mb = s.byMonth[m.monthKey];
      if (mb) {
        sellerMonthlyRows.push([
          s.displayName,
          s.unidade,
          m.label,
          mb.entregas,
          mb.concluidas,
          formatCurrencyBRL(mb.valorCarga),
          formatCurrencyBRL(mb.frete),
          formatCurrencyBRL(mb.valorTotal),
          formatCurrencyBRL(mb.ticketMedio),
        ]);
      }
    });
  });
  if (sellerMonthlyRows.length > 0) {
    autoTable(doc, {
      ...DEFAULT_TABLE_STYLES,
      startY: y,
      margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
      head: [['Vendedor (Detalhe Mensal)', 'Unid.', 'Mês', 'Entr.', 'Concl.', 'Carga', 'Frete', 'Total (R$)', 'Ticket Médio']],
      body: sellerMonthlyRows,
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  // Section 4: Performance por Veículos (Total + Por Mês)
  y = drawSectionHeader(
    doc,
    '4. PERFORMANCE POR VEÍCULOS (TOTAL E POR MÊS)',
    'Eficiência de frota, KM percorrido, tempo médio e custo operacional por placa.',
    y,
    56
  );
  y = drawVectorRankingBarChart(
    doc,
    {
      title: 'RANKING DA FROTA — ENTREGAS & KM POR VEÍCULO (TOP 8)',
      legendLabel: 'Entregas Realizadas',
      colorRgb: [240, 113, 39],
      maxItems: 8,
      items: vehicles.ranking.slice(0, 8).map((v) => ({
        label: `${v.placaCurta}${v.motorista && v.motorista !== '-' ? ` (${v.motorista})` : ''}`,
        value: v.entregas,
        displayValue: `${v.entregas} ent. • ${v.km.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km`,
      })),
    },
    startX,
    y,
    contentWidth
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
    head: [['#', 'Placa', 'Motorista', 'Entregas', 'Concl.', 'T. Médio', 'KM Total', 'Custo Total', 'Valor Transp.', 'In-Full']],
    body:
      vehicles.ranking.length > 0
        ? vehicles.ranking.map((v, idx) => [
            idx + 1,
            v.placaCurta,
            v.motorista,
            v.entregas,
            v.concluidas,
            formatDurationHours(v.avgTimeH),
            `${v.km.toFixed(1)} km`,
            formatCurrencyBRL(v.custo),
            formatCurrencyBRL(v.valorTotal),
            `${Math.round(v.otifPct)}%`,
          ])
        : [['-', 'Sem registros', '-', 0, 0, '-', '-', '-', '-', '-']],
  });
  y = doc.lastAutoTable.finalY + 4;

  const vehicleMonthlyRows = [];
  vehicles.ranking.forEach((v) => {
    months.forEach((m) => {
      const mb = v.byMonth[m.monthKey];
      if (mb) {
        vehicleMonthlyRows.push([
          v.placaCurta,
          v.motorista,
          m.label,
          mb.entregas,
          mb.concluidas,
          formatDurationHours(mb.avgTimeH),
          `${mb.km.toFixed(1)} km`,
          formatCurrencyBRL(mb.custo),
          formatCurrencyBRL(mb.valorTotal),
        ]);
      }
    });
  });
  if (vehicleMonthlyRows.length > 0) {
    autoTable(doc, {
      ...DEFAULT_TABLE_STYLES,
      startY: y,
      margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
      head: [['Placa (Detalhe Mensal)', 'Motorista', 'Mês', 'Entr.', 'Concl.', 'T. Médio', 'KM', 'Custo Total', 'Valor Transp.']],
      body: vehicleMonthlyRows,
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  // Section 5: Materiais Mais Vendidos no Romaneio
  const legacyMaterialNote =
    summary.legacyCount > 0
      ? ` • Obs: ${summary.legacyCount} reg. pré-Set/26 antecedem módulo de romaneio detalhado.`
      : '';
  y = drawSectionHeader(
    doc,
    '5. MATERIAIS MAIS VENDIDOS NO ROMANEIO',
    `${materials.totals.itensDistintos} materiais distintos em ${materials.totals.entregasComRomaneio} romaneios no período${legacyMaterialNote}`,
    y,
    50
  );
  y = drawVectorRankingBarChart(
    doc,
    {
      title: 'MATERIAIS COM MAIOR PRESENÇA EM ROMANEIOS (TOP 8)',
      legendLabel: 'Presença em Romaneios',
      colorRgb: [16, 185, 129],
      maxItems: 8,
      items: materials.ranking.slice(0, 8).map((m) => ({
        label: m.nome,
        value: m.entregasDistintas,
        displayValue: `${m.entregasDistintas} rom. • ${formatCurrencyBRL(m.valorTotal)}`,
      })),
    },
    startX,
    y,
    contentWidth
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
    head: [['#', 'Código', 'Material', 'Un.', 'Entregas', 'Qtd Total', 'Peso (kg)', 'Valor Total (R$)']],
    body:
      materials.ranking.length > 0
        ? materials.ranking.slice(0, 25).map((mat, idx) => [
            idx + 1,
            mat.codigo,
            mat.nome.slice(0, 46),
            mat.unidade,
            mat.entregasDistintas,
            mat.quantidadeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
            mat.pesoTotalKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
            formatCurrencyBRL(mat.valorTotal),
          ])
        : [['-', '-', 'Nenhum item de romaneio encontrado no período', '-', 0, 0, 0, 'R$ 0,00']],
  });
  y = doc.lastAutoTable.finalY + 7;

  // Section 6: Clientes que Mais Receberam Entregas
  y = drawSectionHeader(
    doc,
    '6. CLIENTES QUE MAIS RECEBERAM ENTREGAS',
    `Top clientes entre ${clients.ranking.length} clientes atendidos no período.`,
    y,
    24
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
    head: [['#', 'Cliente', 'Entregas', 'Concluídas', 'KM Total', 'Valor Total (R$)', 'Ticket Médio', 'Share %']],
    body:
      clients.ranking.length > 0
        ? clients.ranking.slice(0, 25).map((c, idx) => [
            idx + 1,
            c.cliente.slice(0, 44),
            c.entregas,
            c.concluidas,
            `${c.km.toFixed(1)} km`,
            formatCurrencyBRL(c.valorTotal),
            formatCurrencyBRL(c.ticketMedio),
            `${c.sharePct.toFixed(1)}%`,
          ])
        : [['-', 'Sem clientes no período', 0, 0, '-', '-', '-', '-']],
  });
  y = doc.lastAutoTable.finalY + 7;

  // Section 7: Lugares que Mais Fizemos Entrega
  y = drawSectionHeader(
    doc,
    '7. LOCAIS QUE MAIS RECEBERAM ENTREGAS',
    `Distribuição geográfica normalizada (${locations.mapStats.mappableCount} pontos geolocalizados | ${locations.mapStats.shortUrlCount} links curtos maps.app.goo.gl).`,
    y,
    50
  );
  y = drawVectorRankingBarChart(
    doc,
    {
      title: 'CONCENTRAÇÃO DE ENTREGAS POR REGIÃO / LOCAL (TOP 8)',
      legendLabel: 'Entregas Realizadas',
      colorRgb: [14, 165, 233],
      maxItems: 8,
      items: locations.ranking.slice(0, 8).map((l) => ({
        label: l.label,
        value: l.entregas,
        displayValue: `${l.entregas} ent. (${l.sharePct.toFixed(1)}%)`,
      })),
    },
    startX,
    y,
    contentWidth
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { top: TOP_MARGIN_Y, bottom: 18, left: startX, right: startX },
    head: [['#', 'Local / Região', 'Categoria', 'Entregas', 'Share %', 'KM Total', 'Valor Total (R$)']],
    body:
      locations.ranking.length > 0
        ? locations.ranking.slice(0, 25).map((l, idx) => [
            idx + 1,
            l.label.slice(0, 42),
            l.category,
            l.entregas,
            `${l.sharePct.toFixed(1)}%`,
            `${l.km.toFixed(1)} km`,
            formatCurrencyBRL(l.valorTotal),
          ])
        : [['-', 'Sem locais no período', '-', 0, '0%', '-', '-']],
  });

  // Pagination footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(startX, 285, startX + contentWidth, 285);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`J Patrício Metais • Relatório Logístico (${meta.formattedPeriod})`, startX, 290);
    doc.text(`Página ${p} de ${totalPages}`, startX + contentWidth, 290, { align: 'right' });
  }

  return doc;
}

export async function downloadReportPdf(analytics, chartImages = {}) {
  const doc = await buildReportPdfDoc(analytics, chartImages);
  const fileName = `Relatorio_Executivo_Logistica_JPatricio_${analytics.meta.dateStart}_a_${analytics.meta.dateEnd}.pdf`;
  doc.save(fileName);
  return fileName;
}
