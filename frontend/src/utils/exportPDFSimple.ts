import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string | null;
  engine_description: string | null;
  vehicle_model: string | null;
  raw_defect_description: string | null;
  original_defect_description?: string | null; // ✅ DEFEITO ORIGINAL COMO CHEGA DO EXCEL
  responsible_mechanic: string | null;
  parts_total: string | null;
  labor_total: string | null;
  grand_total: string | null;
  order_status: string;
}

interface FilterData {
  orders: ServiceOrder[];
  totalOrders: number;
  totalValue: number;
  avgValue: number;
  statusDistribution: Record<string, number>;
  manufacturerDistribution: Record<string, number>;
}

interface FilterState {
  dateRange: {
    startDate: string;
    endDate: string;
    preset: string;
  };
  status: string[];
  manufacturers: string[];
  mechanics: string[];
}

export const exportToPDF = async (
  data: FilterData,
  filters: FilterState,
  reportType: 'summary' | 'detailed' | 'analytical' = 'summary'
): Promise<void> => {
  try {
    const doc = new jsPDF();
    let currentY = 20;

    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Garantias GLú', 20, 25);
    
    currentY = 50;

    // Informações do período
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let periodText = '';
    switch (filters.dateRange.preset) {
      case 'thisMonth': periodText = 'Este Mês'; break;
      case 'lastMonth': periodText = 'Mês Anterior'; break;
      case 'thisQuarter': periodText = 'Este Trimestre'; break;
      case 'thisYear': periodText = 'Este Ano'; break;
      case 'lastYear': periodText = 'Ano Anterior'; break;
      case 'custom': 
        periodText = `${new Date(filters.dateRange.startDate).toLocaleDateString('pt-BR')} - ${new Date(filters.dateRange.endDate).toLocaleDateString('pt-BR')}`;
        break;
      default: periodText = 'Todos os Períodos';
    }
    
    doc.text(`Período: ${periodText}`, 20, currentY);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, currentY + 10);
    
    currentY += 30;

    // Métricas principais
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', 20, currentY);
    currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Ordens de Serviço: ${data.totalOrders.toLocaleString('pt-BR')}`, 20, currentY);
    doc.text(`Valor Total: R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, currentY + 10);
    doc.text(`Valor Médio: R$ ${data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, currentY + 20);
    
    currentY += 40;

    // Distribuição por status
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUIÇÃO POR STATUS', 20, currentY);
    currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    Object.entries(data.statusDistribution).forEach(([status, count]) => {
      const percentage = (count / data.totalOrders * 100).toFixed(1);
      const statusLabel = status === 'G' ? 'Garantia' : status === 'GO' ? 'Garantia c/ Observação' : 'Garantia Usuário';
      doc.text(`${status} - ${statusLabel}: ${count} (${percentage}%)`, 20, currentY);
      currentY += 10;
    });

    currentY += 20;

    // Top fabricantes
    const topManufacturers = Object.entries(data.manufacturerDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (topManufacturers.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP 5 FABRICANTES', 20, currentY);
      currentY += 15;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      topManufacturers.forEach(([manufacturer, count], index) => {
        const percentage = (count / data.totalOrders * 100).toFixed(1);
        doc.text(`${index + 1}. ${manufacturer}: ${count} (${percentage}%)`, 20, currentY);
        currentY += 10;
      });
    }

    // Se é relatório detalhado, adicionar tabela
    if (reportType === 'detailed' && data.orders.length > 0) {
      // Nova página para tabela
      doc.addPage();
      currentY = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DAS ORDENS DE SERVIÇO', 20, currentY);
      currentY += 20;

      // Preparar dados para tabela
      const tableData = data.orders.slice(0, 50).map(order => [
        order.order_number,
        new Date(order.order_date).toLocaleDateString('pt-BR'),
        order.order_status,
        order.engine_manufacturer || 'N/A',
        order.responsible_mechanic || 'N/A',
        `R$ ${parseFloat(order.grand_total || '0').toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['OS', 'Data', 'Status', 'Fabricante', 'Mecânico', 'Valor']],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
          5: { cellWidth: 30, halign: 'right' }
        }
      });

      if (data.orders.length > 50) {
        const finalY = (doc as any).lastAutoTable.finalY || currentY + 100;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Mostrando os primeiros 50 de ${data.orders.length} registros. Para ver todos, use a exportação Excel.`,
          20,
          finalY + 10
        );
      }
    }

    // Rodapé
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Sistema de Garantias GLú`, 20, pageHeight - 20);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 50, pageHeight - 20);
    }

    // Salvar
    const filename = `relatorio-garantias-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};