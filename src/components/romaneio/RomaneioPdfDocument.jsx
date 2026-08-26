import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateRomaneioPdf({ delivery, romaneio, items = [] }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isMatriz = (delivery?.local_carregamento || 'MATRIZ') === 'MATRIZ';
  const cnpj = isMatriz ? '09.528.239/0001-08 (Matriz)' : '09.528.239/0002-80 (Filial)';
  const romaneioNum = romaneio?.numero_romaneio || String(delivery?.id || '0001').padStart(4, '0');
  const issueDate = new Date().toLocaleDateString('pt-BR');
  const issueTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // 1. BRAND HEADER BLOCK
  doc.setFillColor(2, 0, 36); // #020024
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line
  doc.setFillColor(0, 212, 255); // #00D4FF
  doc.rect(0, 32, 210, 2, 'F');

  // Company Name & CNPJ
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('J PATRICIO METAIS COMERCIO LTDA', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 230);
  doc.text(`CNPJ: ${cnpj}`, 14, 19);
  doc.text('Logística Integrada e Transporte de Materiais Metálicos', 14, 25);

  // ROMANEIO BADGE
  doc.setFillColor(9, 9, 121);
  doc.roundedRect(145, 7, 52, 20, 3, 3, 'F');
  doc.setTextColor(0, 212, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ROMANEIO DE CARGA', 148, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`Nº ${String(romaneioNum).padStart(6, '0')}`, 148, 22);

  // 2. METADATA SECTION
  let y = 42;
  doc.setDrawColor(200, 210, 225);
  doc.setFillColor(245, 248, 252);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

  doc.setTextColor(2, 0, 36);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA ENTREGA / DESTINATÁRIO', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 60, 75);

  // Col 1
  doc.text(`Cliente: ${delivery?.cliente || 'Não informado'}`, 18, y + 13);
  doc.text(`Endereço: ${delivery?.endereco || 'Não informado'}`, 18, y + 19);
  doc.text(`Telefone / Contato: ${delivery?.telefone || 'N/A'}`, 18, y + 25);
  doc.text(`Vendedor: ${delivery?.vendedor || 'N/A'}`, 18, y + 31);

  // Col 2
  const col2X = 125;
  doc.text(`Emissão: ${issueDate} às ${issueTime}`, col2X, y + 13);
  doc.text(`Local Saída: ${delivery?.local_carregamento || 'MATRIZ'}`, col2X, y + 19);
  doc.text(`Placa Veículo: ${delivery?.placa || 'N/A'}`, col2X, y + 25);
  doc.text(`Motorista: ${delivery?.motorista?.nome || 'N/A'}`, col2X, y + 31);

  // 3. ITEMS TABLE
  const tableData = items.map((item, idx) => {
    const qtd = Number(item.quantidade) || 0;
    const pesoUnit = Number(item.peso_unitario_kg) || 0;
    const pesoTotal = Number(item.peso_total_kg) || qtd * pesoUnit;
    const valorUnit = Number(item.valor_unitario) || 0;
    const valorTotal = Number(item.valor_total) || qtd * valorUnit;

    return [
      idx + 1,
      item.codigo_material || '-',
      item.nome_material || 'Material diverso',
      qtd.toLocaleString('pt-BR'),
      item.unidade || 'UN',
      pesoUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      `${pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`,
      `R$ ${valorUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ];
  });

  // Calculate Grand Totals
  const totalQtd = items.reduce((sum, it) => sum + (Number(it.quantidade) || 0), 0);
  const totalPeso = items.reduce((sum, it) => sum + (Number(it.peso_total_kg) || (Number(it.quantidade) * Number(it.peso_unitario_kg)) || 0), 0);
  const totalValor = items.reduce((sum, it) => sum + (Number(it.valor_total) || (Number(it.quantidade) * Number(it.valor_unitario)) || 0), 0);

  autoTable(doc, {
    startY: y + 43,
    head: [['#', 'Cód.', 'Descrição do Material', 'Qtd', 'Unid', 'Peso Unit', 'Peso Total', 'Vlr Unit', 'Vlr Total']],
    body: tableData.length > 0 ? tableData : [['-', '-', 'Nenhum item adicionado ao romaneio', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [9, 9, 121],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 50 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 40, 55],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 253],
    },
  });

  // 4. TOTALS SUMMARY BOX
  const finalY = doc.lastAutoTable.finalY + 4;
  doc.setFillColor(235, 243, 255);
  doc.setDrawColor(180, 210, 245);
  doc.roundedRect(14, finalY, 182, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 0, 36);

  doc.text(`QUANTIDADE TOTAL: ${totalQtd.toLocaleString('pt-BR')} itens`, 20, finalY + 7);
  doc.text(`PESO BRUTO TOTAL: ${totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, 20, finalY + 13);

  doc.setFontSize(10);
  doc.setTextColor(0, 100, 180);
  doc.text(`VALOR TOTAL: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 120, finalY + 10);

  // Observations block if present
  let obsY = finalY + 22;
  if (romaneio?.observacoes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 90, 105);
    doc.text(`Observações: ${romaneio.observacoes}`, 14, obsY);
    obsY += 6;
  }

  // 5. SIGNATURE FOOTER BOXES
  const signY = Math.max(obsY + 8, 240);

  // Expeditor Signature
  doc.setDrawColor(150, 160, 175);
  doc.line(20, signY + 12, 90, signY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(2, 0, 36);
  doc.text('EXPEDIDO POR', 40, signY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 110, 125);
  doc.text('J Patricio Metais Comércio Ltda', 32, signY + 20);

  // Receiver Signature
  doc.line(120, signY + 12, 190, signY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(2, 0, 36);
  doc.text('RECEBIDO POR (CLIENTE)', 133, signY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 110, 125);
  doc.text('Assinatura / Carimbo / Data', 137, signY + 20);

  // Document Footer
  doc.setFontSize(7);
  doc.setTextColor(160, 170, 185);
  doc.text('J PATRICIO METAIS • Romaneio de Carga gerado eletronicamente via Enterprise Logistics Suite', 105, 290, { align: 'center' });

  return doc;
}

export function downloadRomaneioPdf(params) {
  const doc = generateRomaneioPdf(params);
  const romaneioNum = params.romaneio?.numero_romaneio || params.delivery?.id || '001';
  doc.save(`Romaneio_${String(romaneioNum).padStart(6, '0')}_JPatricio.pdf`);
}

export function printRomaneioPdf(params) {
  const doc = generateRomaneioPdf(params);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

export default {
  generateRomaneioPdf,
  downloadRomaneioPdf,
  printRomaneioPdf,
};
