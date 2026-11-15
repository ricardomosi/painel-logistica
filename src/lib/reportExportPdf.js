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

const COMPANY_LOGO_URL = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1766755027/Gemini_Generated_Image_b4mrdzb4mrdzb4mr_b5qgcn.png';

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

function drawSectionHeader(doc, title, subtitle, y, startX = 12, contentWidth = 186) {
  if (y > 255) {
    doc.addPage();
    y = 14;
  }
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(startX, y, contentWidth, subtitle ? 11 : 8, 1.5, 1.5, 'F');
  doc.setDrawColor(0, 129, 167);
  doc.setLineWidth(0.8);
  doc.line(startX, y, startX, y + (subtitle ? 11 : 8));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, startX + 3.5, y + 5);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, startX + 3.5, y + 9.2);
  }

  return y + (subtitle ? 14 : 11);
}

function drawVectorMiniBars(doc, title, items, x, y, width, height, colorRgb = [0, 129, 167]) {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x + 3, y + 5);

  const safeItems = (items || []).slice(0, 5);
  if (safeItems.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Sem dados no período selecionado.', x + 3, y + 14);
    return;
  }

  const maxVal = Math.max(...safeItems.map((i) => Number(i.value) || 0), 1);
  const startBarY = y + 9.5;
  const rowStep = (height - 12) / Math.max(safeItems.length, 1);

  safeItems.forEach((item, idx) => {
    const rowY = startBarY + idx * rowStep;
    const label = String(item.label || '').slice(0, 22);
    const val = Number(item.value) || 0;
    const barMaxW = width - 48;
    const barW = Math.max((val / maxVal) * barMaxW, 1.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(51, 65, 85);
    doc.text(label, x + 3, rowY + 3);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x + 36, rowY + 0.5, barMaxW, 3.2, 0.8, 0.8, 'F');
    doc.setFillColor(colorRgb[0], colorRgb[1], colorRgb[2]);
    doc.roundedRect(x + 36, rowY + 0.5, barW, 3.2, 0.8, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.displayValue ?? val), x + width - 3, rowY + 3, { align: 'right' });
  });
}

function embedChartOrFallback(doc, chartDataUrl, fallbackConfig, x, y, width, height) {
  if (chartDataUrl && typeof chartDataUrl === 'string' && chartDataUrl.startsWith('data:image/')) {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(10, 22, 40);
    doc.roundedRect(x, y, width, height, 1.8, 1.8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(211, 227, 255);
    doc.text(fallbackConfig.title, x + 3, y + 5);
    try {
      doc.addImage(chartDataUrl, 'PNG', x + 2, y + 6.5, width - 4, height - 8.5, undefined, 'FAST');
      return;
    } catch {
      // Fallback below
    }
  }
  drawVectorMiniBars(doc, fallbackConfig.title, fallbackConfig.items, x, y, width, height, fallbackConfig.colorRgb);
}

const DEFAULT_TABLE_STYLES = {
  theme: 'grid',
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

export async function buildReportPdfDoc(analytics, chartImages = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const startX = 12;
  const contentWidth = 186;
  const { meta, summary, months, monthlySeries, sellers, vehicles, materials, clients, locations } = analytics;

  let y = 11;

  // Header Banner
  doc.setFillColor(2, 13, 26);
  doc.roundedRect(startX, y, contentWidth, 24, 2, 2, 'F');
  doc.setFillColor(0, 129, 167);
  doc.rect(startX, y + 22.5, contentWidth, 1.5, 'F');

  const logo = await loadLogoSafe();
  let textLeft = startX + 5;
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', startX + 4, y + 3, 16, 16);
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
  doc.text(`J PATRÍCIO METAIS • Período: ${meta.formattedPeriod}`, textLeft, y + 13.8);
  doc.setFontSize(7.2);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Placa: ${meta.selectedPlaca} | Vendedor: ${meta.selectedVendedor} | Unidade: ${meta.selectedLocalCarregamento || 'TODOS'} | Custo/KM: ${formatCurrencyBRL(meta.custoKm)}`,
    textLeft,
    y + 18.6
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 212, 255);
  doc.text(`${summary.totalEntregas} ENTREGAS`, startX + contentWidth - 4, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emitido: ${new Date(meta.generatedAt).toLocaleString('pt-BR')}`, startX + contentWidth - 4, y + 14.5, { align: 'right' });

  y += 28;

  // 6 KPI Cards Grid (2 rows x 3 cols)
  const kpiCards = [
    {
      label: 'NÚMERO DE ENTREGAS',
      value: String(summary.totalEntregas),
      sub: `Matriz: ${summary.matrizCount} | Filial: ${summary.filialCount} | Concluídas: ${summary.concluidas}`,
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
    doc.text(k.value, cx + 3.5, cy + 11.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.1);
    doc.setTextColor(100, 116, 139);
    doc.text(k.sub.slice(0, 48), cx + 3.5, cy + 16.3);
  });

  y += cardH * 2 + 8;

  // Embedded Charts Row 1 (Evolução Mensal + OTIF)
  const halfW = (contentWidth - 4) / 2;
  embedChartOrFallback(
    doc,
    chartImages.monthlyVolume,
    {
      title: 'Evolução Mensal: Entregas por Mês',
      colorRgb: [0, 129, 167],
      items: monthlySeries.map((m) => ({ label: m.label, value: m.entregas, displayValue: `${m.entregas} ent.` })),
    },
    startX,
    y,
    halfW,
    46
  );
  embedChartOrFallback(
    doc,
    chartImages.otifMonthly,
    {
      title: 'OTIF Mensal (% Eficiência)',
      colorRgb: [16, 185, 129],
      items: monthlySeries.map((m) => ({ label: m.label, value: m.otifPct, displayValue: `${Math.round(m.otifPct)}%` })),
    },
    startX + halfW + 4,
    y,
    halfW,
    46
  );
  y += 50;

  // Section 1: Indicadores por Mês e Total
  y = drawSectionHeader(doc, '1. INDICADORES CONSOLIDADOS POR MÊS E TOTAL', 'Entregas, KM, Custo, Tempo Médio, Valores (Carga + Frete) e OTIF mês a mês.', y);
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { left: startX, right: startX },
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
    y
  );
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { left: startX, right: startX },
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
  y = drawSectionHeader(doc, '3. PERFORMANCE POR VENDEDORES (TOTAL E POR MÊS)', 'Faturamento, ticket médio e entregas consolidadas e separadas por mês.', y);
  if (y + 44 < 270) {
    embedChartOrFallback(
      doc,
      chartImages.sellers,
      {
        title: 'Ranking Comercial por Faturamento (Top Vendedores)',
        colorRgb: [0, 129, 167],
        items: sellers.ranking.slice(0, 5).map((s) => ({ label: s.displayName, value: s.valorTotal, displayValue: formatCurrencyBRL(s.valorTotal) })),
      },
      startX,
      y,
      contentWidth,
      40
    );
    y += 43;
  }
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { left: startX, right: startX },
    head: [['#', 'Vendedor', 'Unidade', 'Entregas', 'Concluídas', 'Valor Carga', 'Frete', 'Total (R$)', 'Ticket Médio', 'Share']],
    body: sellers.ranking.length > 0
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
      margin: { left: startX, right: startX },
      head: [['Vendedor (Detalhe Mensal)', 'Unid.', 'Mês', 'Entr.', 'Concl.', 'Carga', 'Frete', 'Total (R$)', 'Ticket Médio']],
      body: sellerMonthlyRows,
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  // Section 4: Performance por Veículos (Total + Por Mês)
  y = drawSectionHeader(doc, '4. PERFORMANCE POR VEÍCULOS (TOTAL E POR MÊS)', 'Eficiência de frota, KM percorrido, tempo médio e custo por placa.', y);
  if (y + 44 < 270) {
    embedChartOrFallback(
      doc,
      chartImages.vehicles,
      {
        title: 'Ranking da Frota (Entregas por Veículo)',
        colorRgb: [240, 113, 39],
        items: vehicles.ranking.slice(0, 5).map((v) => ({ label: v.placaCurta, value: v.entregas, displayValue: `${v.entregas} ent. / ${v.km.toFixed(0)} km` })),
      },
      startX,
      y,
      contentWidth,
      40
    );
    y += 43;
  }
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { left: startX, right: startX },
    head: [['#', 'Placa', 'Motorista', 'Entregas', 'Concl.', 'T. Médio', 'KM Total', 'Custo Total', 'Valor Transp.', 'In-Full']],
    body: vehicles.ranking.length > 0
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
      margin: { left: startX, right: startX },
      head: [['Placa (Detalhe Mensal)', 'Motorista', 'Mês', 'Entr.', 'Concl.', 'T. Médio', 'KM', 'Custo Total', 'Valor Transp.']],
      body: vehicleMonthlyRows,
    });
    y = doc.lastAutoTable.finalY + 7;
  }

  // Section 5: Materiais Mais Vendidos no Romaneio
  y = drawSectionHeader(
    doc,
    '5. MATERIAIS MAIS VENDIDOS NO ROMANEIO',
    `${materials.totals.itensDistintos} materiais distintos em ${materials.totals.entregasComRomaneio} romaneios no período.`,
    y
  );
  if (y + 44 < 270) {
    embedChartOrFallback(
      doc,
      chartImages.materials,
      {
        title: 'Materiais com Maior Presença em Romaneios',
        colorRgb: [16, 185, 129],
        items: materials.ranking.slice(0, 5).map((m) => ({ label: m.nome, value: m.entregasDistintas, displayValue: `${m.entregasDistintas} rom.` })),
      },
      startX,
      y,
      contentWidth,
      40
    );
    y += 43;
  }
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { left: startX, right: startX },
    head: [['#', 'Código', 'Material', 'Un.', 'Entregas', 'Qtd Total', 'Peso (kg)', 'Valor Total (R$)']],
    body: materials.ranking.length > 0
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
  y = drawSectionHeader(doc, '6. CLIENTES QUE MAIS RECEBERAM ENTREGAS', `Top clientes entre ${clients.ranking.length} clientes atendidos no período.`, y);
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { left: startX, right: startX },
    head: [['#', 'Cliente', 'Entregas', 'Concluídas', 'KM Total', 'Valor Total (R$)', 'Ticket Médio', 'Share %']],
    body: clients.ranking.length > 0
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
    `Distribuição geográfica normalizada (${locations.mapStats.shortUrlCount} links curtos maps.app.goo.gl sem coordenadas no navegador).`,
    y
  );
  if (y + 44 < 270) {
    embedChartOrFallback(
      doc,
      chartImages.locations,
      {
        title: 'Concentração de Entregas por Região / Local',
        colorRgb: [14, 165, 233],
        items: locations.ranking.slice(0, 5).map((l) => ({ label: l.label, value: l.entregas, displayValue: `${l.entregas} ent.` })),
      },
      startX,
      y,
      contentWidth,
      40
    );
    y += 43;
  }
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    startY: y,
    margin: { left: startX, right: startX },
    head: [['#', 'Local / Região', 'Categoria', 'Entregas', 'Share %', 'KM Total', 'Valor Total (R$)']],
    body: locations.ranking.length > 0
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
