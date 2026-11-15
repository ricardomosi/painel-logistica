import * as XLSXNamespace from 'xlsx';
import { formatDurationHours } from './reportAnalytics.js';

function getXlsx() {
  return XLSXNamespace;
}

function autoFitColumns(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const colWidths = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    row.forEach((cell, idx) => {
      const len = cell === null || cell === undefined ? 0 : String(cell).length;
      colWidths[idx] = Math.min(Math.max(colWidths[idx] || 10, len + 3), 48);
    });
  }
  return colWidths.map((wch) => ({ wch }));
}

function appendSheet(wb, XLSX, name, rows) {
  const safeName = String(name).slice(0, 31);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = autoFitColumns(rows);
  XLSX.utils.book_append_sheet(wb, ws, safeName);
}

function round2(n) {
  return Number((Number(n) || 0).toFixed(2));
}

function round1(n) {
  return Number((Number(n) || 0).toFixed(1));
}

export function buildReportWorkbook(analytics) {
  const XLSX = getXlsx();
  const wb = XLSX.utils.book_new();
  const { meta, summary, months, monthlySeries, sellers, vehicles, materials, clients, locations } = analytics;

  // 1. Resumo Executivo
  const resumoRows = [
    ['J PATRÍCIO METAIS — RELATÓRIO EXECUTIVO DE LOGÍSTICA'],
    ['Período do Relatório', meta.formattedPeriod],
    ['Data Início', meta.dateStart],
    ['Data Fim', meta.dateEnd],
    ['Veículo / Placa Filtrada', meta.selectedPlaca],
    ['Vendedor Filtrado', meta.selectedVendedor],
    ['Unidade Filtrada', meta.selectedLocalCarregamento || 'TODOS'],
    ['Custo por KM Configurado (R$)', round2(meta.custoKm)],
    ['Gerado em', new Date(meta.generatedAt).toLocaleString('pt-BR')],
    [],
    ['INDICADOR CONSOLIDADO', 'VALOR', 'DETALHAMENTO'],
    ['Total de Entregas', summary.totalEntregas, `Matriz: ${summary.matrizCount} | Filial: ${summary.filialCount} | Concluídas: ${summary.concluidas}`],
    ['KM Percorrido Total', round1(summary.totalKm), `Média por entrega: ${round1(summary.avgKmPerDelivery)} km`],
    ['Custo Estimado das Entregas (R$)', round2(summary.totalCost), `Matriz: R$ ${round2(summary.matrizCost)} | Filial: R$ ${round2(summary.filialCost)}`],
    ['Média de Tempo por Entrega', formatDurationHours(summary.avgTimeH), `${summary.completedCountForTime} entregas com início e conclusão cronometrados`],
    ['Valor dos Materiais / Carga (R$)', round2(summary.totalValorCarga), 'Soma de valor_entrega no período'],
    ['Total de Fretes (R$)', round2(summary.totalFrete), `Matriz: R$ ${round2(summary.matrizFrete)} | Filial: R$ ${round2(summary.filialFrete)}`],
    ['Valor Total das Entregas (Carga + Frete) (R$)', round2(summary.totalValorGeral), `Ticket médio: R$ ${round2(summary.ticketMedio)}`],
    ['OTIF Geral (%)', round1(summary.otif.otifPct), `On-Time: ${round1(summary.otif.onTimePct)}% | In-Full: ${round1(summary.otif.inFullPct)}%`],
    ['On-Time (Até 24h) (%)', round1(summary.otif.onTimePct), `${summary.otif.onTimeCount} de ${summary.otif.totalOnTime} entregas cronometradas`],
    ['In-Full (Sem Ocorrências) (%)', round1(summary.otif.inFullPct), `${summary.otif.inFullCount} de ${summary.otif.totalInFull} entregas concluídas`],
    ['Maior Ofensor de Ocorrências', summary.otif.maxErros > 0 ? `${summary.otif.ofensorName} (${summary.otif.maxErros})` : 'Zero ocorrências registradas', ''],
    ['Itens de Romaneio Vendidos', materials.totals.linhasRomaneio, `${materials.totals.itensDistintos} materiais distintos em ${materials.totals.entregasComRomaneio} entregas`],
    ['Clientes Atendidos (Distintos)', clients.ranking.length, 'Clientes com entregas no período'],
    ['Locais / Regiões Mapeadas', locations.ranking.length, `${locations.mapStats.shortUrlCount} entregas com link curto maps.app.goo.gl`],
  ];
  appendSheet(wb, XLSX, 'Resumo Executivo', resumoRows);

  // 2. Indicadores por Mes
  const mensalRows = [
    [
      'Mês',
      'Entregas',
      'Concluídas',
      'Matriz',
      'Filial',
      'KM Percorrido',
      'Custo Entregas (R$)',
      'Tempo Médio',
      'Valor Carga (R$)',
      'Frete (R$)',
      'Valor Total (R$)',
      'On-Time (%)',
      'In-Full (%)',
      'OTIF (%)',
      'Ocorrências',
    ],
    ...monthlySeries.map((m) => [
      m.fullLabel,
      m.entregas,
      m.concluidas,
      m.matrizCount,
      m.filialCount,
      round1(m.km),
      round2(m.custo),
      formatDurationHours(m.avgTimeH),
      round2(m.valorCarga),
      round2(m.frete),
      round2(m.valorTotal),
      round1(m.onTimePct),
      round1(m.inFullPct),
      round1(m.otifPct),
      m.ocorrenciasCount,
    ]),
    [
      'TOTAL PERÍODO',
      summary.totalEntregas,
      summary.concluidas,
      summary.matrizCount,
      summary.filialCount,
      round1(summary.totalKm),
      round2(summary.totalCost),
      formatDurationHours(summary.avgTimeH),
      round2(summary.totalValorCarga),
      round2(summary.totalFrete),
      round2(summary.totalValorGeral),
      round1(summary.otif.onTimePct),
      round1(summary.otif.inFullPct),
      round1(summary.otif.otifPct),
      summary.otif.ocorrenciasCount,
    ],
  ];
  appendSheet(wb, XLSX, 'Indicadores por Mes', mensalRows);

  // 3. OTIF e Ocorrencias
  const otifRows = [
    ['OTIF POR MÊS'],
    ['Mês', 'Entregas Concluídas', 'Com Horário (On-Time Base)', 'No Prazo <=24h', 'On-Time (%)', 'Sem Ocorrências', 'Com Ocorrências', 'In-Full (%)', 'OTIF (%)'],
    ...monthlySeries.map((m) => [
      m.fullLabel,
      m.totalInFull,
      m.totalOnTime,
      m.onTimeCount,
      round1(m.onTimePct),
      m.inFullCount,
      m.ocorrenciasCount,
      round1(m.inFullPct),
      round1(m.otifPct),
    ]),
    [
      'TOTAL',
      summary.otif.totalInFull,
      summary.otif.totalOnTime,
      summary.otif.onTimeCount,
      round1(summary.otif.onTimePct),
      summary.otif.inFullCount,
      summary.otif.ocorrenciasCount,
      round1(summary.otif.inFullPct),
      round1(summary.otif.otifPct),
    ],
    [],
    ['DISTRIBUIÇÃO DE OCORRÊNCIAS (ENTREGAS CONCLUÍDAS)'],
    ['Status / Ocorrência', 'Quantidade', 'Participação (%)'],
    ...summary.otif.occurrencesBreakdown.map((o) => [o.motivo, o.count, round1(o.pct)]),
  ];
  appendSheet(wb, XLSX, 'OTIF e Ocorrencias', otifRows);

  // 4. Vendedores (Total e Mes)
  const sellerRows = [
    ['PERFORMANCE CONSOLIDADA POR VENDEDOR (TOTAL DO PERÍODO)'],
    ['Rank', 'Vendedor', 'Unidade', 'Entregas', 'Concluídas', 'Valor Carga (R$)', 'Frete (R$)', 'Valor Total (R$)', 'Ticket Médio (R$)', 'Participação (%)', 'In-Full (%)'],
    ...sellers.ranking.map((s, idx) => [
      idx + 1,
      s.displayName,
      s.unidade,
      s.entregas,
      s.concluidas,
      round2(s.valorCarga),
      round2(s.frete),
      round2(s.valorTotal),
      round2(s.ticketMedio),
      round1(s.sharePct),
      round1(s.otifPct),
    ]),
    [],
    ['DETALHAMENTO MENSAL POR VENDEDOR (POR MÊS)'],
    ['Vendedor', 'Unidade', 'Mês', 'Entregas', 'Concluídas', 'Valor Carga (R$)', 'Frete (R$)', 'Valor Total (R$)', 'Ticket Médio (R$)'],
  ];
  sellers.ranking.forEach((s) => {
    months.forEach((m) => {
      const mb = s.byMonth[m.monthKey];
      if (mb) {
        sellerRows.push([
          s.displayName,
          s.unidade,
          m.fullLabel,
          mb.entregas,
          mb.concluidas,
          round2(mb.valorCarga),
          round2(mb.frete),
          round2(mb.valorTotal),
          round2(mb.ticketMedio),
        ]);
      }
    });
  });
  appendSheet(wb, XLSX, 'Vendedores', sellerRows);

  // 5. Veiculos (Total e Mes)
  const vehicleRows = [
    ['PERFORMANCE CONSOLIDADA POR VEÍCULO (TOTAL DO PERÍODO)'],
    ['Rank', 'Placa', 'Motorista', 'Entregas', 'Concluídas', 'Tempo Médio', 'KM Total', 'Custo Total (R$)', 'Valor Transportado (R$)', 'In-Full (%)', 'Ocorrências'],
    ...vehicles.ranking.map((v, idx) => [
      idx + 1,
      v.placaCurta,
      v.motorista,
      v.entregas,
      v.concluidas,
      formatDurationHours(v.avgTimeH),
      round1(v.km),
      round2(v.custo),
      round2(v.valorTotal),
      round1(v.otifPct),
      v.ocorrencias,
    ]),
    [],
    ['DETALHAMENTO MENSAL POR VEÍCULO (POR MÊS)'],
    ['Placa', 'Motorista', 'Mês', 'Entregas', 'Concluídas', 'Tempo Médio', 'KM Total', 'Custo Total (R$)', 'Valor Transportado (R$)'],
  ];
  vehicles.ranking.forEach((v) => {
    months.forEach((m) => {
      const mb = v.byMonth[m.monthKey];
      if (mb) {
        vehicleRows.push([
          v.placaCurta,
          v.motorista,
          m.fullLabel,
          mb.entregas,
          mb.concluidas,
          formatDurationHours(mb.avgTimeH),
          round1(mb.km),
          round2(mb.custo),
          round2(mb.valorTotal),
        ]);
      }
    });
  });
  appendSheet(wb, XLSX, 'Veiculos', vehicleRows);

  // 6. Materiais Romaneio
  const matRows = [
    ['MATERIAIS MAIS VENDIDOS NO ROMANEIO (TOTAL DO PERÍODO)'],
    ['Rank', 'Código', 'Material', 'Unidade', 'Entregas com Item', 'Lançamentos', 'Quantidade Total', 'Peso Total (kg)', 'Valor Total (R$)', 'Participação Valor (%)'],
    ...materials.ranking.map((mat, idx) => [
      idx + 1,
      mat.codigo,
      mat.nome,
      mat.unidade,
      mat.entregasDistintas,
      mat.ocorrenciasRomaneio,
      round2(mat.quantidadeTotal),
      round2(mat.pesoTotalKg),
      round2(mat.valorTotal),
      round1(mat.shareValorPct),
    ]),
    [],
    ['DETALHAMENTO MENSAL DOS MATERIAIS MAIS VENDIDOS'],
    ['Código', 'Material', 'Mês', 'Lançamentos', 'Quantidade', 'Peso (kg)', 'Valor Total (R$)'],
  ];
  materials.ranking.slice(0, 60).forEach((mat) => {
    months.forEach((m) => {
      const mb = mat.byMonth[m.monthKey];
      if (mb) {
        matRows.push([
          mat.codigo,
          mat.nome,
          m.fullLabel,
          mb.ocorrencias,
          round2(mb.quantidade),
          round2(mb.pesoKg),
          round2(mb.valorTotal),
        ]);
      }
    });
  });
  appendSheet(wb, XLSX, 'Materiais Romaneio', matRows);

  // 7. Clientes
  const clientRows = [
    ['CLIENTES QUE MAIS RECEBERAM ENTREGAS (TOTAL DO PERÍODO)'],
    ['Rank', 'Cliente', 'Entregas', 'Concluídas', 'KM Total', 'Valor Total (R$)', 'Ticket Médio (R$)', 'Participação (%)', 'Última Entrega'],
    ...clients.ranking.map((c, idx) => [
      idx + 1,
      c.cliente,
      c.entregas,
      c.concluidas,
      round1(c.km),
      round2(c.valorTotal),
      round2(c.ticketMedio),
      round1(c.sharePct),
      c.lastDate || '-',
    ]),
    [],
    ['DETALHAMENTO MENSAL DOS PRINCIPAIS CLIENTES'],
    ['Cliente', 'Mês', 'Entregas', 'Concluídas', 'KM Total', 'Valor Total (R$)'],
  ];
  clients.ranking.slice(0, 60).forEach((c) => {
    months.forEach((m) => {
      const mb = c.byMonth[m.monthKey];
      if (mb) {
        clientRows.push([
          c.cliente,
          m.fullLabel,
          mb.entregas,
          mb.concluidas,
          round1(mb.km),
          round2(mb.valorTotal),
        ]);
      }
    });
  });
  appendSheet(wb, XLSX, 'Clientes', clientRows);

  // 8. Locais e Mapa
  const locRows = [
    ['LOCAIS COM MAIS ENTREGAS (TOTAL DO PERÍODO)'],
    ['Rank', 'Local / Região Normalizada', 'Categoria', 'Entregas', 'Concluídas', 'Participação (%)', 'KM Total', 'Valor Total (R$)', 'Amostra de Endereço', 'Status Geo'],
    ...locations.ranking.map((l, idx) => [
      idx + 1,
      l.label,
      l.category,
      l.entregas,
      l.concluidas,
      round1(l.sharePct),
      round1(l.km),
      round2(l.valorTotal),
      l.sampleAddress || '-',
      l.isShortUrl ? 'Link curto maps.app.goo.gl' : (l.explicitCoords || l.presetCoords ? 'Mapeado' : (l.geocodeQuery ? 'Geocodificação Texto' : 'Sem coordenadas')),
    ]),
    [],
    ['DETALHAMENTO MENSAL POR LOCAL'],
    ['Local / Região', 'Mês', 'Entregas', 'KM Total', 'Valor Total (R$)'],
  ];
  locations.ranking.slice(0, 60).forEach((l) => {
    months.forEach((m) => {
      const mb = l.byMonth[m.monthKey];
      if (mb) {
        locRows.push([
          l.label,
          m.fullLabel,
          mb.entregas,
          round1(mb.km),
          round2(mb.valorTotal),
        ]);
      }
    });
  });
  appendSheet(wb, XLSX, 'Locais e Mapa', locRows);

  return wb;
}

export function downloadReportExcel(analytics) {
  const XLSX = getXlsx();
  const wb = buildReportWorkbook(analytics);
  const fileName = `Relatorio_Logistica_JPatricio_${analytics.meta.dateStart}_a_${analytics.meta.dateEnd}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}
