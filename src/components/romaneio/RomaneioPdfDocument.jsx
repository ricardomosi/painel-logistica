import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_LOGO_URL = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1772193535/Gemini_Generated_Image_b4mrdzb4mrdzb4mr_1_izinkt.png';

export function generateRomaneioPdf({ delivery, romaneio, items = [] }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isMatriz = (delivery?.local_carregamento || 'MATRIZ') === 'MATRIZ';
  const cnpj = isMatriz ? '09.528.239/0001-08' : '09.528.239/0002-80';
  const unidadeTexto = isMatriz ? 'Matriz - Mossoró/RN' : 'Filial - Mossoró/RN';
  const romaneioNum = romaneio?.numero_romaneio || delivery?.id || 1;
  const numFormatado = String(romaneioNum).padStart(7, '0');
  
  const now = new Date();
  const issueDate = now.toLocaleDateString('pt-BR');
  const issueTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Margins & Page Width
  const startX = 12;
  const contentWidth = 186; // 210 - 24
  let currentY = 12;

  // ==========================================
  // 1. TOP HEADER (Com Logo da Empresa)
  // ==========================================
  
  // Left: Empresa & Contato
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('J PATRICIO METAIS COMERCIO LTDA', startX, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('logistica@jpatricio.com.br', startX, currentY + 9);
  doc.text(`CNPJ: ${cnpj} (${unidadeTexto})`, startX, currentY + 13);
  doc.text('Mossoró / RN', startX, currentY + 17);
  doc.text('Fone: (84) 3205-0000', startX, currentY + 21);

  // Right: Título, Número e Data de Geração
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 129, 167); // #0081A7
  doc.text('Romaneio de carga', startX + contentWidth, currentY + 5, { align: 'right' });

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(numFormatado, startX + contentWidth, currentY + 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`Data de geração: ${issueDate}`, startX + contentWidth, currentY + 19, { align: 'right' });

  currentY += 26;

  // Linha divisória superior
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(startX, currentY, startX + contentWidth, currentY);

  currentY += 4;

  // ==========================================
  // 2. BLOCO TRANSPORTADORA (Quadro Arredondado)
  // ==========================================
  const transpBoxY = currentY;
  const transpBoxHeight = 24;

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(startX, transpBoxY, contentWidth, transpBoxHeight, 2, 2, 'S');

  // Título da seção
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Transportadora', startX + 4, transpBoxY + 5.5);

  // Linha 1 de dados
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Razão Social:', startX + 4, transpBoxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('J PATRICIO METAIS', startX + 24, transpBoxY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Fantasia:', startX + 68, transpBoxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('J PATRICIO METAIS', startX + 82, transpBoxY + 11.5);

  // Motorista & Placa
  const motNome = delivery?.motorista?.nome || (delivery?.placa && delivery.placa.includes('(') ? delivery.placa.split('(')[1]?.replace(')', '') : 'Frota Própria');
  const placaTexto = delivery?.placa ? delivery.placa.split('(')[0]?.trim() : 'Não informada';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Motorista:', startX + 120, transpBoxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(motNome || 'N/D', startX + 135, transpBoxY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Placa:', startX + 162, transpBoxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(placaTexto || 'N/D', startX + 172, transpBoxY + 11.5);

  // Linha 2 de dados
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CNPJ/CPF:', startX + 4, transpBoxY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(cnpj, startX + 20, transpBoxY + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Fone:', startX + 68, transpBoxY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('(84) 3205-0000', startX + 78, transpBoxY + 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Saída:', startX + 120, transpBoxY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(delivery?.local_carregamento || 'MATRIZ', startX + 130, transpBoxY + 18.5);

  currentY += transpBoxHeight + 4;

  // ==========================================
  // 3. BLOCO DESTINATÁRIO & CARGA
  // ==========================================
  const destBoxY = currentY;
  
  // Cabeçalho da Entrega
  const boletoNf = delivery?.boleto || `ENT-${delivery?.id || '001'}`;
  const clienteNome = delivery?.cliente || 'Não informado';
  const enderecoDest = delivery?.endereco || 'Não informado';

  // Format table data: Coluna 'Quant.'
  const tableData = items.map((item, idx) => {
    const qtd = Number(item.quantidade) || 0;
    const pesoUnit = Number(item.peso_unitario_kg) || 0;
    const pesoTotal = Number(item.peso_total_kg) || (qtd * pesoUnit);
    const valorUnit = Number(item.valor_unitario) || 0;
    const valorTotal = Number(item.valor_total) || (qtd * valorUnit);

    return [
      item.codigo_material || String(idx + 1).padStart(2, '0'),
      item.nome_material || 'Material Diverso',
      item.unidade || 'UN',
      pesoUnit > 0 ? `${pesoUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : '-',
      qtd.toLocaleString('pt-BR'),
      valorUnit > 0 ? `R$ ${valorUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
      valorTotal > 0 ? `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
    ];
  });

  // Calculate Grand Totals
  const totalQtd = items.reduce((sum, it) => sum + (Number(it.quantidade) || 0), 0);
  const totalPeso = items.reduce((sum, it) => sum + (Number(it.peso_total_kg) || ((Number(it.quantidade) || 0) * (Number(it.peso_unitario_kg) || 0)) || 0), 0);
  const totalValor = items.reduce((sum, it) => sum + (Number(it.valor_total) || ((Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0)) || 0), 0);

  // Render Table with autoTable: Altura ajustada para caber Linha 1 e Linha 2 de Destinatário
  autoTable(doc, {
    startY: currentY + 16,
    margin: { left: startX, right: startX },
    head: [['Código', 'Descrição do Material', 'Unid', 'Peso Unit.', 'Quant.', 'Valor Unit. (R$)', 'Valor Total (R$)']],
    body: tableData.length > 0 ? tableData : [['-', 'Nenhum material adicionado', '-', '-', '0', '-', 'R$ 0,00']],
    theme: 'plain',
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: { top: 0.3, bottom: 0.3 },
      lineColor: [180, 180, 180],
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left' },
      1: { cellWidth: 70, halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 21, halign: 'right' },
      6: { cellWidth: 21, halign: 'right' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [225, 225, 225],
      lineWidth: { bottom: 0.1 },
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });

  const tableFinalY = doc.lastAutoTable.finalY || (currentY + 30);

  // Quadro delimitador que envolve o Destinatário e a Tabela
  const boxHeight = (tableFinalY - destBoxY) + 14;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.roundedRect(startX, destBoxY, contentWidth, boxHeight, 2, 2, 'S');

  // Cabeçalho interno do Destinatário (Linha 1: Nota fiscal / Boleto e Destinatário)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Nota fiscal / Boleto:', startX + 4, destBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(boletoNf, startX + 32, destBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Destinatário:', startX + 75, destBoxY + 5.5);
  doc.setFont('helvetica', 'normal');
  const clienteAbrev = clienteNome.length > 45 ? clienteNome.substring(0, 45) + '...' : clienteNome;
  doc.text(clienteAbrev, startX + 94, destBoxY + 5.5);

  // Linha 2 (Abaixo da Nota Fiscal): Endereço Destinatário completo com proteção contra overflow
  doc.setFont('helvetica', 'bold');
  doc.text('Endereço destinatário:', startX + 4, destBoxY + 11.5);
  doc.setFont('helvetica', 'normal');
  const endAbrev = enderecoDest.length > 85 ? enderecoDest.substring(0, 85) + '...' : enderecoDest;
  doc.text(endAbrev, startX + 37, destBoxY + 11.5);

  // Subtotais no rodapé do quadro de carga
  const subtotalY = tableFinalY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Quant. total: ${totalQtd.toLocaleString('pt-BR')}`, startX + contentWidth - 95, subtotalY, { align: 'right' });
  doc.text(`Peso total: ${totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`, startX + contentWidth - 45, subtotalY, { align: 'right' });
  doc.text(`Preço total: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, startX + contentWidth - 4, subtotalY, { align: 'right' });

  currentY = destBoxY + boxHeight + 4;

  // ==========================================
  // 4. OBSERVAÇÕES (se houver)
  // ==========================================
  if (romaneio?.observacoes && romaneio.observacoes.trim()) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.roundedRect(startX, currentY, contentWidth, 12, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Observações:', startX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(romaneio.observacoes.substring(0, 120), startX + 22, currentY + 4.5);

    currentY += 16;
  } else {
    currentY += 4;
  }

  // ==========================================
  // 5. ASSINATURAS & TERMO DE RECEBIMENTO
  // ==========================================
  const signY = Math.max(currentY + 10, 245);

  // Linha Expedidor / Motorista
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(startX + 10, signY + 10, startX + 75, signY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('RESPONSÁVEL PELA EXPEDIÇÃO', startX + 42.5, signY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('J Patricio Metais Comércio Ltda', startX + 42.5, signY + 18, { align: 'center' });

  // Linha Cliente / Recebedor
  doc.line(startX + 110, signY + 10, startX + 175, signY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('RECEBIDO POR (DESTINATÁRIO)', startX + 142.5, signY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Assinatura / Carimbo / Data', startX + 142.5, signY + 18, { align: 'center' });

  // ==========================================
  // 6. RODAPÉ DO ROMANEIO
  // ==========================================
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(startX, 282, startX + contentWidth, 282);

  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`Romaneio gerado ${issueDate} às ${issueTime}`, startX, 287);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('J PATRICIO METAIS', startX + contentWidth, 287, { align: 'right' });

  return doc;
}

export function downloadRomaneioPdf(params) {
  const doc = generateRomaneioPdf(params);
  const romaneioNum = params.romaneio?.numero_romaneio || params.delivery?.id || 1;
  doc.save(`Romaneio_${String(romaneioNum).padStart(7, '0')}_JPatricio.pdf`);
}

export function printRomaneioPdf(params) {
  try {
    const doc = generateRomaneioPdf(params);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // Create a hidden iframe for seamless direct browser printing
    let printIframe = document.getElementById('romaneio-print-iframe');
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'romaneio-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);
    }

    printIframe.src = blobUrl;
    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (e) {
          window.open(blobUrl, '_blank');
        }
      }, 250);
    };
  } catch (err) {
    console.error('Erro ao acionar impressão:', err);
    window.print();
  }
}

export default {
  generateRomaneioPdf,
  downloadRomaneioPdf,
  printRomaneioPdf,
};
