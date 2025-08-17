import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { mapToHierarchy } from './hierarchyMapper';

// Registrar todos os componentes necessários do Chart.js
Chart.register(...registerables);

// --- INTERFACES ---
interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string | null;
  engine_description: string | null;
  vehicle_model: string | null;
  raw_defect_description: string | null;
  original_defect_description?: string | null;
  responsible_mechanic: string | null;
  parts_total: string | null;
  labor_total: string | null;
  grand_total: string | null;
  order_status: string;
  defect_classifications?: Array<{
    id: number;
    category_id: number;
    ai_confidence: number;
    ai_reasoning?: string;
    original_defect_description?: string;
    defect_categories: {
      category_name: string;
      color_hex: string;
    };
  }>;
}

interface FilterData {
  orders: ServiceOrder[];
  totalOrders: number;
  totalValue: number;
  avgValue: number;
  statusDistribution: Record<string, number>;
  manufacturerDistribution: Record<string, number>;
  defectGroupDistribution: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    value: number;
  }>;
  topMechanics: Array<{
    name: string;
    count: number;
    value: number;
  }>;
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

interface PDFConfig {
  title: string;
  subtitle?: string;
  includeCharts: boolean;
  includeDetailedTables: boolean;
  includeHierarchicalAnalysis: boolean;
  pageFormat: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
}

// --- CONSTANTES DE DESIGN ---
const COLORS = {
  primary: '#1a365d',
  secondary: '#2d3748',
  accent: '#3182ce',
  success: '#38a169',
  warning: '#d69e2e',
  danger: '#e53e3e',
  light: '#f7fafc',
  medium: '#e2e8f0',
  dark: '#2d3748',
  white: '#ffffff'
};

const FONTS = {
  title: { size: 20, weight: 'bold' },
  subtitle: { size: 16, weight: 'bold' },
  heading: { size: 14, weight: 'bold' },
  body: { size: 10, weight: 'normal' },
  caption: { size: 8, weight: 'normal' }
};

// --- CLASSE PRINCIPAL ---
export class ProfessionalPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margins = { top: 20, right: 20, bottom: 20, left: 20 };
  private currentY: number = 0;
  private pageNumber: number = 1;
  
  constructor(config: PDFConfig) {
    this.doc = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.pageFormat
    });
    
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.currentY = this.margins.top;
  }

  // --- MÉTODO PRINCIPAL DE EXPORTAÇÃO ---
  async generateProfessionalReport(
    data: FilterData,
    filters: FilterState,
    config: PDFConfig
  ): Promise<void> {
    try {
      
      
      // 1. PÁGINA DE CAPA
      await this.createCoverPage(config, filters, data);
      
      // 2. SUMÁRIO EXECUTIVO
      this.addNewPage();
      await this.createExecutiveSummary(data, filters);
      
      // 3. ANÁLISE ESTATÍSTICA
      this.addNewPage();
      await this.createStatisticalAnalysis(data);
      
      // 4. GRÁFICOS E VISUALIZAÇÕES
      if (config.includeCharts) {
        this.addNewPage();
        await this.createChartsSection(data);
      }
      
      // 5. ANÁLISE HIERÁRQUICA DE DEFEITOS
      if (config.includeHierarchicalAnalysis) {
        this.addNewPage();
        await this.createHierarchicalAnalysis(data);
      }
      
      // 6. TABELAS DETALHADAS
      if (config.includeDetailedTables) {
        this.addNewPage();
        await this.createDetailedTables(data);
      }
      
      // 7. ANEXOS
      this.addNewPage();
      await this.createAppendices(data, filters);
      
      // 8. APLICAR CABEÇALHO E RODAPÉ EM TODAS AS PÁGINAS
      this.applyHeaderFooterToAllPages(config);
      
      
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório PDF:', error);
      throw error;
    }
  }

  // --- PÁGINA DE CAPA ---
  private async createCoverPage(config: PDFConfig, filters: FilterState, data: FilterData): Promise<void> {
    const centerX = this.pageWidth / 2;
    
    // Logo placeholder (você pode adicionar uma logo real aqui)
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(centerX - 30, 30, 60, 20, 'F');
    this.doc.setTextColor(COLORS.white);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.text('GL GARANTIAS', centerX, 42, { align: 'center' });
    
    // Título principal
    this.currentY = 80;
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.text(config.title, centerX, this.currentY, { align: 'center' });
    
    // Subtítulo
    if (config.subtitle) {
      this.currentY += 15;
      this.doc.setFontSize(16);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(config.subtitle, centerX, this.currentY, { align: 'center' });
    }
    
    // Informações do período
    this.currentY += 30;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.dark);
    
    const periodText = this.getPeriodText(filters.dateRange);
    this.doc.text(`Período: ${periodText}`, centerX, this.currentY, { align: 'center' });
    
    // Estatísticas resumo
    this.currentY += 20;
    const summaryData = [
      [`Total de Ordens de Serviço`, data.totalOrders.toLocaleString('pt-BR')],
      [`Valor Total`, `R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      [`Valor Médio por Ordem`, `R$ ${data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      [`Data de Geração`, format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })]
    ];
    
    this.createStyledTable(summaryData, {
      startY: this.currentY,
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: COLORS.light },
        1: { halign: 'right' }
      },
      margin: { left: 50, right: 50 }
    });
    
    // Aviso legal
    this.currentY = this.pageHeight - 50;
    this.doc.setFontSize(8);
    this.doc.setTextColor(COLORS.medium);
    this.doc.text(
      'Este relatório é confidencial e destina-se exclusivamente ao uso interno da empresa.',
      centerX,
      this.currentY,
      { align: 'center', maxWidth: this.pageWidth - 40 }
    );
  }

  // --- SUMÁRIO EXECUTIVO ---
  private async createExecutiveSummary(data: FilterData, filters: FilterState): Promise<void> {
    this.addSectionTitle('SUMÁRIO EXECUTIVO');
    
    // Visão geral
    this.addSectionSubtitle('Visão Geral');
    this.currentY += 5;
    
    const summaryText = `
Este relatório apresenta uma análise completa das ${data.totalOrders} ordens de serviço processadas no período selecionado, 
representando um valor total de R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.

A análise abrange distribuição por status de garantia, fabricantes, defeitos categorizados hierarquicamente, 
tendências temporais e performance dos mecânicos responsáveis pelos atendimentos.
    `.trim();
    
    this.addParagraph(summaryText);
    
    // Principais indicadores
    this.currentY += 10;
    this.addSectionSubtitle('Principais Indicadores');
    
    const indicators = [
      ['Total de Ordens de Serviço', data.totalOrders.toLocaleString('pt-BR'), '📊'],
      ['Valor Total dos Serviços', `R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '💰'],
      ['Valor Médio por Ordem', `R$ ${data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '📈'],
      ['Fabricantes Únicos', Object.keys(data.manufacturerDistribution).length.toString(), '🏭'],
      ['Tipos de Defeitos', Object.keys(data.defectGroupDistribution).length.toString(), '🔧'],
      ['Mecânicos Atuantes', data.topMechanics?.length || 0, '👨‍🔧']
    ];
    
    this.createIndicatorsGrid(indicators);
  }

  // --- ANÁLISE ESTATÍSTICA ---
  private async createStatisticalAnalysis(data: FilterData): Promise<void> {
    this.addSectionTitle('ANÁLISE ESTATÍSTICA');
    
    // Distribuição por Status
    this.addSectionSubtitle('Distribuição por Status de Garantia');
    
    const statusData = Object.entries(data.statusDistribution).map(([status, count]) => [
      this.getStatusName(status),
      count.toLocaleString('pt-BR'),
      `${((count / data.totalOrders) * 100).toFixed(1)}%`
    ]);
    
    this.createStyledTable(statusData, {
      head: [['Status', 'Quantidade', 'Percentual']],
      startY: this.currentY + 5,
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    this.currentY += (statusData.length + 2) * 7 + 20;
    
    // Distribuição por Fabricantes (Top 10)
    this.addSectionSubtitle('Top 10 Fabricantes');
    
    const manufacturerData = Object.entries(data.manufacturerDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([manufacturer, count]) => [
        manufacturer || 'Não Informado',
        count.toLocaleString('pt-BR'),
        `${((count / data.totalOrders) * 100).toFixed(1)}%`
      ]);
    
    this.createStyledTable(manufacturerData, {
      head: [['Fabricante', 'Quantidade', 'Percentual']],
      startY: this.currentY + 5,
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // --- GRÁFICOS E VISUALIZAÇÕES ---
  private async createChartsSection(data: FilterData): Promise<void> {
    this.addSectionTitle('VISUALIZAÇÕES E GRÁFICOS');
    
    try {
      // Gráfico de Status
      this.addSectionSubtitle('Distribuição por Status');
      const statusChart = await this.generatePieChart(data.statusDistribution, {
        title: 'Distribuição por Status de Garantia',
        colors: ['#38a169', '#d69e2e', '#e53e3e']
      });
      
      if (statusChart) {
        this.doc.addImage(statusChart, 'PNG', this.margins.left, this.currentY + 5, 80, 60);
      }
      
      // Gráfico de Fabricantes (Top 5)
      const topManufacturers = Object.entries(data.manufacturerDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
      
      const manufacturerChart = await this.generatePieChart(topManufacturers, {
        title: 'Top 5 Fabricantes',
        colors: ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5']
      });
      
      if (manufacturerChart) {
        this.doc.addImage(manufacturerChart, 'PNG', this.pageWidth/2 + 10, this.currentY + 5, 80, 60);
      }
      
      this.currentY += 70;
      
      // Gráfico de tendência mensal (se disponível)
      if (data.monthlyTrend && data.monthlyTrend.length > 1) {
        this.currentY += 20;
        this.addSectionSubtitle('Tendência Mensal');
        
        const trendChart = await this.generateLineChart(data.monthlyTrend);
        if (trendChart) {
          this.doc.addImage(trendChart, 'PNG', this.margins.left, this.currentY + 5, 170, 80);
          this.currentY += 90;
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar gráficos:', error);
      this.addParagraph('Erro ao gerar visualizações. Os dados estatísticos estão disponíveis nas tabelas.');
    }
  }

  // --- ANÁLISE HIERÁRQUICA ---
  private async createHierarchicalAnalysis(data: FilterData): Promise<void> {
    this.addSectionTitle('ANÁLISE HIERÁRQUICA DE DEFEITOS');
    
    // Processar defeitos hierarquicamente
    const hierarchicalData = this.processHierarchicalDefects(data.orders);
    
    this.addSectionSubtitle('Distribuição por Grupos Principais');
    
    const groupData = Object.entries(hierarchicalData.groups)
      .sort(([,a], [,b]) => b - a)
      .map(([group, count]) => [
        group,
        count.toLocaleString('pt-BR'),
        `${((count / data.totalOrders) * 100).toFixed(1)}%`
      ]);
    
    this.createStyledTable(groupData, {
      head: [['Grupo de Defeito', 'Quantidade', 'Percentual']],
      startY: this.currentY + 5,
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    this.currentY += (groupData.length + 2) * 7 + 20;
    
    // Análise detalhada por subgrupos
    this.addSectionSubtitle('Detalhamento por Subgrupos (Top 15)');
    
    const subgroupData = Object.entries(hierarchicalData.subgroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([subgroup, count]) => [
        subgroup,
        count.toLocaleString('pt-BR'),
        `${((count / data.totalOrders) * 100).toFixed(1)}%`
      ]);
    
    this.createStyledTable(subgroupData, {
      head: [['Subgrupo de Defeito', 'Quantidade', 'Percentual']],
      startY: this.currentY + 5,
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // --- TABELAS DETALHADAS ---
  private async createDetailedTables(data: FilterData): Promise<void> {
    this.addSectionTitle('TABELAS DETALHADAS');
    
    // Top Mecânicos
    if (data.topMechanics && data.topMechanics.length > 0) {
      this.addSectionSubtitle('Performance dos Mecânicos');
      
      const mechanicData = data.topMechanics.slice(0, 10).map(mechanic => [
        mechanic.name || 'Não Informado',
        mechanic.count.toLocaleString('pt-BR'),
        `R$ ${mechanic.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(mechanic.value / mechanic.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
      
      this.createStyledTable(mechanicData, {
        head: [['Mecânico', 'Qtd. Ordens', 'Valor Total', 'Valor Médio']],
        startY: this.currentY + 5,
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      this.currentY += (mechanicData.length + 2) * 7 + 20;
    }
    
    // Amostra de dados detalhados (primeiras 20 ordens)
    this.addSectionSubtitle('Amostra de Dados Detalhados');
    
    const sampleData = data.orders.slice(0, 20).map(order => [
      order.order_number,
      format(parseISO(order.order_date), 'dd/MM/yyyy', { locale: ptBR }),
      order.engine_manufacturer || 'N/I',
      order.responsible_mechanic || 'N/I',
      this.getStatusName(order.order_status),
      `R$ ${parseFloat(order.grand_total || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);
    
    this.createStyledTable(sampleData, {
      head: [['Nº Ordem', 'Data', 'Fabricante', 'Mecânico', 'Status', 'Valor']],
      startY: this.currentY + 5,
      columnStyles: {
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { halign: 'right' }
      },
      margin: { left: 10, right: 10 }
    });
  }

  // --- ANEXOS ---
  private async createAppendices(data: FilterData, filters: FilterState): Promise<void> {
    this.addSectionTitle('ANEXOS');
    
    // Metodologia
    this.addSectionSubtitle('Metodologia');
    const methodology = `
Este relatório foi gerado automaticamente pelo sistema GL Garantias, utilizando dados extraídos 
diretamente do banco de dados de ordens de serviço. A classificação hierárquica de defeitos 
é realizada através de inteligência artificial, garantindo precisão e consistência na categorização.

Os filtros aplicados neste relatório:
• Período: ${this.getPeriodText(filters.dateRange)}
• Status: ${filters.status.join(', ')}
• Fabricantes: ${filters.manufacturers.length > 3 ? `${filters.manufacturers.slice(0, 3).join(', ')} e mais ${filters.manufacturers.length - 3}` : filters.manufacturers.join(', ')}
• Mecânicos: ${filters.mechanics.length > 3 ? `${filters.mechanics.slice(0, 3).join(', ')} e mais ${filters.mechanics.length - 3}` : filters.mechanics.join(', ')}

Todos os valores monetários estão em Reais (BRL) e foram calculados com base nos valores 
de peças e mão de obra registrados em cada ordem de serviço.
    `.trim();
    
    this.addParagraph(methodology);
    
    // Glossário
    this.currentY += 10;
    this.addSectionSubtitle('Glossário de Termos');
    
    const glossary = [
      ['G', 'Garantia simples - Defeito coberto pela garantia padrão'],
      ['GO', 'Garantia com observação - Garantia com ressalvas ou condições especiais'],
      ['GU', 'Garantia urgente - Atendimento prioritário com garantia'],
      ['Valor Total', 'Soma de peças e mão de obra para cada ordem de serviço'],
      ['Hierarquia de Defeitos', 'Sistema de classificação em 3 níveis: Grupo > Subgrupo > Subsubgrupo'],
      ['IA', 'Inteligência Artificial utilizada para classificação automática de defeitos']
    ];
    
    this.createStyledTable(glossary, {
      startY: this.currentY + 5,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30, fillColor: COLORS.light },
        1: { cellWidth: 'auto' }
      }
    });
  }

  // --- MÉTODOS AUXILIARES ---
  
  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = this.margins.top + 15; // Espaço para cabeçalho
    this.pageNumber++;
  }

  private addSectionTitle(title: string): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(FONTS.title.size);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margins.left, this.currentY);
    
    // Linha decorativa
    this.currentY += 5;
    this.doc.setDrawColor(COLORS.primary);
    this.doc.setLineWidth(1);
    this.doc.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
    this.currentY += 10;
  }

  private addSectionSubtitle(subtitle: string): void {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(FONTS.subtitle.size);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text(subtitle, this.margins.left, this.currentY);
    this.currentY += 8;
  }

  private addParagraph(text: string): void {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(FONTS.body.size);
    this.doc.setTextColor(COLORS.dark);
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margins.left - this.margins.right);
    this.doc.text(lines, this.margins.left, this.currentY);
    this.currentY += lines.length * 4 + 5;
  }

  private createStyledTable(data: any[], options: any = {}): void {
    const defaultOptions = {
      startY: this.currentY,
      margin: { left: this.margins.left, right: this.margins.right },
      styles: {
        fontSize: FONTS.body.size,
        cellPadding: 3,
        overflow: 'linebreak' as const,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: FONTS.body.size,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      columnStyles: {},
      ...options
    };

    autoTable(this.doc, {
      body: data,
      ...defaultOptions
    });

    const finalY = (this.doc as any).lastAutoTable?.finalY || this.currentY;
    this.currentY = finalY + 5;
  }

  private createIndicatorsGrid(indicators: string[][]): void {
    const cols = 2;
    const cardWidth = (this.pageWidth - this.margins.left - this.margins.right - 10) / cols;
    const cardHeight = 25;
    
    indicators.forEach((indicator, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = this.margins.left + (col * (cardWidth + 10));
      const y = this.currentY + (row * (cardHeight + 5));
      
      // Background
      this.doc.setFillColor(COLORS.light);
      this.doc.rect(x, y, cardWidth, cardHeight, 'F');
      
      // Border
      this.doc.setDrawColor(COLORS.medium);
      this.doc.rect(x, y, cardWidth, cardHeight, 'S');
      
      // Icon (emoji como texto)
      this.doc.setFontSize(16);
      this.doc.text(indicator[2], x + 5, y + 12);
      
      // Label
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(indicator[0], x + 20, y + 8, { maxWidth: cardWidth - 25 });
      
      // Value
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.setTextColor(COLORS.primary);
      this.doc.text(indicator[1], x + 20, y + 18);
    });
    
    const rows = Math.ceil(indicators.length / cols);
    this.currentY += rows * (cardHeight + 5) + 10;
  }

  private async generatePieChart(data: Record<string, number>, options: { title: string, colors: string[] }): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const chartData = {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: options.colors,
          borderWidth: 2,
          borderColor: COLORS.white
        }]
      };
      
      const config: ChartConfiguration = {
        type: 'pie',
        data: chartData,
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: options.title,
              font: { size: 14, weight: 'bold' }
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      };
      
      const chart = new Chart(ctx, config);
      
      // Esperar o chart renderizar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      
      return imageData;
    } catch (error) {
      console.error('Erro ao gerar gráfico de pizza:', error);
      return null;
    }
  }

  private async generateLineChart(monthlyData: Array<{ month: string, count: number, value: number }>): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 300;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const config: ChartConfiguration = {
        type: 'line',
        data: {
          labels: monthlyData.map(d => d.month),
          datasets: [{
            label: 'Quantidade de Ordens',
            data: monthlyData.map(d => d.count),
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primary + '20',
            tension: 0.4
          }]
        },
        options: {
          responsive: false,
          plugins: {
            title: {
              display: true,
              text: 'Tendência Mensal de Ordens de Serviço',
              font: { size: 14, weight: 'bold' }
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };
      
      const chart = new Chart(ctx, config);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      
      return imageData;
    } catch (error) {
      console.error('Erro ao gerar gráfico de linha:', error);
      return null;
    }
  }

  private processHierarchicalDefects(orders: ServiceOrder[]) {
    const groups: Record<string, number> = {};
    const subgroups: Record<string, number> = {};
    const subsubgroups: Record<string, number> = {};
    
    orders.forEach(order => {
      let hierarchy = null;
      
      // Tentar usar classificação IA primeiro
      if (order.defect_classifications && order.defect_classifications.length > 0) {
        const classification = order.defect_classifications[0];
        hierarchy = mapToHierarchy(
          classification.defect_categories.category_name,
          classification.original_defect_description || order.raw_defect_description || order.original_defect_description
        );
      } else {
        // Fallback para descrição direta
        hierarchy = mapToHierarchy(
          'Operacional',
          order.raw_defect_description || order.original_defect_description
        );
      }
      
      if (hierarchy) {
        groups[hierarchy.group] = (groups[hierarchy.group] || 0) + 1;
        
        const subgroupKey = `${hierarchy.group} > ${hierarchy.subgroup}`;
        subgroups[subgroupKey] = (subgroups[subgroupKey] || 0) + 1;
        
        const subsubgroupKey = `${hierarchy.group} > ${hierarchy.subgroup} > ${hierarchy.subsubgroup}`;
        subsubgroups[subsubgroupKey] = (subsubgroups[subsubgroupKey] || 0) + 1;
      }
    });
    
    return { groups, subgroups, subsubgroups };
  }

  private applyHeaderFooterToAllPages(config: PDFConfig): void {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Cabeçalho (pular página 1 - capa)
      if (i > 1) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);
        this.doc.setTextColor(COLORS.medium);
        
        // Linha do cabeçalho
        this.doc.setDrawColor(COLORS.medium);
        this.doc.line(this.margins.left, 15, this.pageWidth - this.margins.right, 15);
        
        // Título no cabeçalho
        this.doc.text(config.title, this.margins.left, 12);
        
        // Data no cabeçalho
        const dateStr = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
        this.doc.text(dateStr, this.pageWidth - this.margins.right, 12, { align: 'right' });
      }
      
      // Rodapé
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(COLORS.medium);
      
      // Linha do rodapé
      const footerY = this.pageHeight - 15;
      this.doc.setDrawColor(COLORS.medium);
      this.doc.line(this.margins.left, footerY, this.pageWidth - this.margins.right, footerY);
      
      // Número da página
      this.doc.text(`Página ${i} de ${totalPages}`, this.pageWidth - this.margins.right, footerY + 8, { align: 'right' });
      
      // Informação da empresa
      this.doc.text('GL Garantias - Relatório Confidencial', this.margins.left, footerY + 8);
    }
  }

  private getPeriodText(dateRange: any): string {
    if (dateRange.preset === 'all') return 'Todos os Períodos';
    if (dateRange.preset === 'thisMonth') return 'Mês Atual';
    if (dateRange.preset === 'lastMonth') return 'Mês Anterior';
    if (dateRange.preset === 'thisYear') return 'Ano Atual';
    if (dateRange.preset === 'lastYear') return 'Ano Anterior';
    
    if (dateRange.startDate && dateRange.endDate) {
      const start = format(parseISO(dateRange.startDate), 'dd/MM/yyyy', { locale: ptBR });
      const end = format(parseISO(dateRange.endDate), 'dd/MM/yyyy', { locale: ptBR });
      return `${start} à ${end}`;
    }
    
    return 'Período Personalizado';
  }

  private getStatusName(status: string): string {
    const statusMap: Record<string, string> = {
      'G': 'Garantia Simples',
      'GO': 'Garantia com Observação',
      'GU': 'Garantia Urgente'
    };
    return statusMap[status] || status;
  }

  public save(filename: string): void {
    this.doc.save(filename);
  }
}

// --- FUNÇÃO PRINCIPAL DE EXPORTAÇÃO ---
export async function exportToProfessionalPDF(
  data: FilterData,
  filters: FilterState,
  config: Partial<PDFConfig> = {}
): Promise<void> {
  const fullConfig: PDFConfig = {
    title: 'RELATÓRIO DE ORDENS DE SERVIÇO',
    subtitle: 'Análise Completa e Detalhada',
    includeCharts: true,
    includeDetailedTables: true,
    includeHierarchicalAnalysis: true,
    pageFormat: 'a4',
    orientation: 'portrait',
    ...config
  };

  const generator = new ProfessionalPDFGenerator(fullConfig);
  await generator.generateProfessionalReport(data, filters, fullConfig);
  
  const filename = `relatorio-garantias-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  generator.save(filename);
}