import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SimpleFilterData {
  orders: any[];
  totalOrders: number;
  totalValue: number;
  avgValue: number;
  statusDistribution: Record<string, number>;
  manufacturerDistribution: Record<string, number>;
  defectGroupDistribution: Record<string, number>;
}

export interface SimpleFilterState {
  dateRange: {
    startDate: string | null;
    endDate: string | null;
    preset: string;
  };
  status: string[];
  manufacturers: string[];
  mechanics: string[];
  groups: string[];
}

export async function exportToSimplePDF(
  data: SimpleFilterData,
  filters: SimpleFilterState
): Promise<void> {
  try {
    
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let currentY = 20;

    // TÍTULO
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE ORDENS DE SERVIÇO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // SUBTÍTULO
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Análise Completa dos Dados', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // DATA DE GERAÇÃO
    doc.setFontSize(10);
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    doc.text('Gerado em: ' + dateStr, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    // LINHA SEPARADORA
    doc.setDrawColor(0, 0, 0);
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 15;

    // RESUMO EXECUTIVO
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', 20, currentY);
    currentY += 15;

    // MÉTRICAS PRINCIPAIS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const metrics = [
      ['Total de Ordens de Serviço:', data.totalOrders.toLocaleString('pt-BR')],
      ['Valor Total:', 'R$ ' + data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Valor Médio por Ordem:', 'R$ ' + data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Fabricantes Únicos:', Object.keys(data.manufacturerDistribution).length.toString()],
      ['Grupos de Defeitos:', Object.keys(data.defectGroupDistribution).length.toString()]
    ];

    metrics.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 120, currentY);
      currentY += 8;
    });

    currentY += 10;

    // FILTROS APLICADOS
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FILTROS APLICADOS', 20, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let filtersText = '';
    if (filters.dateRange.preset !== 'all') {
      filtersText += 'Período: ' + filters.dateRange.preset + '\n';
    } else {
      filtersText += 'Período: Todos\n';
    }
    
    if (filters.status.length > 0 && !filters.status.includes('Todas as Garantias')) {
      filtersText += 'Status: ' + filters.status.join(', ') + '\n';
    }
    
    if (filters.manufacturers.length > 0 && !filters.manufacturers.includes('Todos os Fabricantes')) {
      filtersText += 'Fabricantes: ' + filters.manufacturers.slice(0, 3).join(', ');
      if (filters.manufacturers.length > 3) {
        filtersText += ' (e mais ' + (filters.manufacturers.length - 3) + ')';
      }
      filtersText += '\n';
    }

    const filterLines = filtersText.split('\n').filter(line => line.trim());
    filterLines.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 6;
    });

    currentY += 15;

    // DISTRIBUIÇÃO POR STATUS
    if (Object.keys(data.statusDistribution).length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DISTRIBUIÇÃO POR STATUS', 20, currentY);
      currentY += 10;

      const statusData = Object.entries(data.statusDistribution).map(([status, count]) => [
        getStatusName(status),
        count.toString(),
        ((count / data.totalOrders) * 100).toFixed(1) + '%'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Status', 'Quantidade', 'Percentual']],
        body: statusData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // TOP 10 FABRICANTES
    if (Object.keys(data.manufacturerDistribution).length > 0) {
      // Verificar se precisa de nova página
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP 10 FABRICANTES', 20, currentY);
      currentY += 10;

      const manufacturerData = Object.entries(data.manufacturerDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([manufacturer, count]) => [
          manufacturer || 'Não Informado',
          count.toString(),
          ((count / data.totalOrders) * 100).toFixed(1) + '%'
        ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Fabricante', 'Quantidade', 'Percentual']],
        body: manufacturerData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // AMOSTRA DE DADOS (Primeiras 20 ordens)
    if (data.orders.length > 0) {
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AMOSTRA DE DADOS DETALHADOS', 20, currentY);
      currentY += 10;

      const sampleData = data.orders.slice(0, 20).map(order => [
        order.order_number || 'N/A',
        order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : 'N/A',
        getStatusName(order.order_status) || 'N/A',
        order.engine_manufacturer || 'N/A',
        'R$ ' + (parseFloat(order.grand_total || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Nº Ordem', 'Data', 'Status', 'Fabricante', 'Valor']],
        body: sampleData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 40 },
          4: { halign: 'right', cellWidth: 30 }
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      if (data.orders.length > 20) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Exibindo 20 de ' + data.orders.length + ' registros.', 20, currentY);
      }
    }

    // RODAPÉ EM TODAS AS PÁGINAS
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        'GL Garantias - Relatório Confidencial',
        20,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        'Página ' + i + ' de ' + totalPages,
        pageWidth - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }

    // SALVAR O PDF
    const filename = 'relatorio-garantias-' + new Date().toISOString().split('T')[0] + '.pdf';
    doc.save(filename);

    

  } catch (error) {
    console.error('❌ Erro ao gerar PDF simples:', error);
    throw error;
  }
}

function getStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    'G': 'Garantia',
    'GO': 'Garantia de Oficina', 
    'GU': 'Garantia de Usinagem'
  };
  return statusMap[status] || status;
}