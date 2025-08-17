import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Registrar todos os componentes necessários do Chart.js
Chart.register(...registerables);

// --- INTERFACES DE DADOS ---

interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string | null;
  engine_description: string | null;
  vehicle_model: string | null;
  raw_defect_description: string | null;
  responsible_mechanic: string | null;
  parts_total: string | null;
  labor_total: string | null;
  grand_total: string | null;
  order_status: string;
  defect_group?: string | null;
  defect_subgroup_1?: string | null;
  defect_subgroup_2?: string | null;
}

interface FilterData {
  orders: ServiceOrder[];
  totalOrders: number;
  totalValue: number;
  avgValue: number;
  statusDistribution: Record<string, number>;
  manufacturerDistribution: Record<string, number>;
  defectGroupDistribution: Record<string, number>;
}

interface FilterState {
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

// --- CLASSE PRINCIPAL DO RELATÓRIO ---

export class ProfessionalPDFReport {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private headerHeight: number;
  private footerHeight: number;
  private logoBase64: string;
  private primaryColor = '#2563EB'; // Blue-600
  private textColor = '#1F2937'; // Gray-800
  private mutedColor = '#6B7280'; // Gray-500

  constructor() {
    this.doc = new jsPDF('p', 'pt', 'a4'); // Usar pontos para melhor controle
    const pageSize = this.doc.internal.pageSize;
    this.pageWidth = pageSize.getWidth();
    this.pageHeight = pageSize.getHeight();
    this.margin = 40;
    this.headerHeight = 80;
    this.footerHeight = 50;
    this.currentY = this.margin;

    // Logo da empresa em base64
    this.logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAIeF9DAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpypmY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjUtMDEtMjBUMTQ6NDc6NDctMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDEtMjBUMTQ6NDc6NDctMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI1LTAxLTIwVDE0OjQ3OjQ3LTAzOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNiMzM3NzM0YyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjIyYzFkOTZiLTM5ZTAtYzQ0Ny1iMzE1LTJmOWNiMzM3NzM0YyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNiMzM3NzM0YyIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNiMzM3NzM0YyIgc3RFdnQ6d2hlbj0iMjAyNS0wMS0yMFQxNDo0Nzo0Ny0wMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI4LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';
  }

  // --- MÉTODOS DE ESTRUTURA ---

  private addHeader(title: string) {
    this.doc.addImage(this.logoBase64, 'PNG', this.margin, 20, 80, 25);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.textColor);
    this.doc.text(title, this.pageWidth - this.margin, 45, { align: 'right' });
    this.doc.setDrawColor(this.primaryColor);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, 70, this.pageWidth - this.margin, 70);
    this.currentY = this.headerHeight;
  }

  private addFooter() {
    const totalPages = (this.doc as any).internal.getNumberOfPages();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.mutedColor);

      this.doc.text(`Relatório de Garantias GL - Gerado em: ${dateStr}`, this.margin, this.pageHeight - 20);
      this.doc.text(`Página ${i} de ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 20, { align: 'right' });
    }
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.footerHeight) {
      this.doc.addPage();
      this.currentY = this.headerHeight;
    }
  }

  private addSectionTitle(title: string) {
    this.checkPageBreak(40);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 25;
  }

  // --- MÉTODOS DE CONTEÚDO ---

  private addFilterSummary(filters: FilterState) {
    this.addSectionTitle('Filtros Aplicados');
    let filterText = '';
    if (filters.dateRange.preset !== 'all' && filters.dateRange.startDate && filters.dateRange.endDate) {
      const start = new Date(filters.dateRange.startDate).toLocaleDateString('pt-BR');
      const end = new Date(filters.dateRange.endDate).toLocaleDateString('pt-BR');
      filterText += `Período: ${start} a ${end}\n`;
    } else {
      filterText += 'Período: Todos\n';
    }
    if (filters.status.length > 0 && !filters.status.includes('Todas as Garantias')) filterText += `Status: ${filters.status.join(', ')}\n`;
    if (filters.manufacturers.length > 0 && !filters.manufacturers.includes('Todos os Fabricantes')) filterText += `Fabricantes: ${filters.manufacturers.join(', ')}\n`;
    if (filters.mechanics.length > 0 && !filters.mechanics.includes('Todos os Mecânicos')) filterText += `Mecânicos: ${filters.mechanics.join(', ')}\n`;
    if (filters.groups.length > 0 && !filters.groups.includes('Todos os Grupos')) filterText += `Grupos: ${filters.groups.join(', ')}\n`;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.textColor);
    this.doc.text(filterText, this.margin, this.currentY);
    this.currentY += (filterText.split('\n').length * 15) + 10;
  }

  private addMetricsCards(data: FilterData) {
    this.addSectionTitle('Métricas Principais');
    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4;
    const metrics = [
      { title: 'Total de OS', value: data.totalOrders.toLocaleString('pt-BR') },
      { title: 'Valor Total', value: `R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
      { title: 'Valor Médio', value: `R$ ${data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
      { title: 'OS em Garantia', value: (data.statusDistribution['G'] || 0).toLocaleString('pt-BR') },
    ];

    metrics.forEach((metric, index) => {
      const x = this.margin + index * (cardWidth + 10);
      this.doc.setFillColor('#F9FAFB'); // Gray-50
      this.doc.roundedRect(x, this.currentY, cardWidth, 50, 5, 5, 'F');
      this.doc.setFontSize(10);
      this.doc.setTextColor(this.mutedColor);
      this.doc.text(metric.title, x + 10, this.currentY + 15);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.primaryColor);
      this.doc.text(metric.value, x + 10, this.currentY + 35);
    });
    this.currentY += 70;
  }

  private async renderChartToImage(chartData: any, width: number, height: number): Promise<string> {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const chart = new Chart(canvas, chartData);
      await new Promise(resolve => setTimeout(resolve, 500));
      const dataUrl = canvas.toDataURL('image/png');
      chart.destroy();
      return dataUrl;
  }

  private async addDistributionCharts(data: FilterData) {
    this.addSectionTitle('Análises Gráficas');
    const chartWidth = (this.pageWidth - 2 * this.margin - 20) / 2;
    const chartHeight = chartWidth * 0.75;

    this.checkPageBreak(chartHeight + 30);
    const initialY = this.currentY;

    // Gráfico 1: Distribuição por Status
    const statusChartData = {
      type: 'doughnut',
      data: {
        labels: Object.keys(data.statusDistribution),
        datasets: [{
          data: Object.values(data.statusDistribution),
          backgroundColor: ['#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6'],
        }],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Distribuição por Status' } }
      }
    };

    // Gráfico 2: Top 5 Fabricantes
    const topManufacturers = Object.entries(data.manufacturerDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const manufacturerChartData = {
      type: 'bar',
      data: {
        labels: topManufacturers.map(item => item[0]),
        datasets: [{
          label: 'Nº de Ordens',
          data: topManufacturers.map(item => item[1]),
          backgroundColor: '#3B82F6',
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: false,
        animation: false,
        plugins: { legend: { display: false }, title: { display: true, text: 'Top 5 Fabricantes' } }
      }
    };
    
    // Renderizar e adicionar os gráficos lado a lado
    const statusChartImage = await this.renderChartToImage(statusChartData, chartWidth, chartHeight);
    this.doc.addImage(statusChartImage, 'PNG', this.margin, initialY, chartWidth, chartHeight);

    const manufacturerChartImage = await this.renderChartToImage(manufacturerChartData, chartWidth, chartHeight);
    this.doc.addImage(manufacturerChartImage, 'PNG', this.margin + chartWidth + 20, initialY, chartWidth, chartHeight);
    
    this.currentY = initialY + chartHeight + 30;
  }

  private addDetailedTable(data: FilterData) {
    this.addSectionTitle('Detalhamento das Ordens de Serviço');
    if (data.orders.length === 0) {
      this.doc.text('Nenhuma ordem de serviço encontrada.', this.margin, this.currentY);
      this.currentY += 20;
      return;
    }

    const tableData = data.orders.slice(0, 200).map(order => [
      order.order_number,
      new Date(order.order_date).toLocaleDateString('pt-BR'),
      order.order_status,
      order.engine_manufacturer || 'N/A',
      order.defect_group || 'N/A',
      `R$ ${parseFloat(order.grand_total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['OS', 'Data', 'Status', 'Fabricante', 'Grupo Defeito', 'Valor Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      columnStyles: {
        5: { halign: 'right' }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (hookData) => {
        // O cabeçalho será adicionado em todas as páginas depois
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
    if (data.orders.length > 200) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(this.mutedColor);
        this.doc.text('Exibindo 200 de ' + data.orders.length + ' registros.', this.margin, this.currentY);
        this.currentY += 20;
    }
  }

  // --- MÉTODO PRINCIPAL DE GERAÇÃO ---

  public async generate(
    data: FilterData,
    filters: FilterState,
    title: string
  ) {
    this.addHeader(title);
    this.addFilterSummary(filters);
    this.addMetricsCards(data);
    await this.addDistributionCharts(data);
    this.addDetailedTable(data);
    this.addFooter();
  }

  public save(filename: string) {
    this.doc.save(filename);
  }
}

// --- FUNÇÃO DE EXPORTAÇÃO ---

export const exportToPDF = async (
  data: FilterData,
  filters: FilterState,
  reportType: 'resumido' | 'detalhado' | 'analitico' = 'detalhado'
): Promise<void> => {
  try {
    const report = new ProfessionalPDFReport();
    const title = `Relatório ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} de Garantias`;
    
    await report.generate(data, filters, title);
    
    const filename = `relatorio-garantias-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
    report.save(filename);
  } catch (error) {
    console.error('Falha ao gerar PDF profissional:', error);
    alert('Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.');
  }
};