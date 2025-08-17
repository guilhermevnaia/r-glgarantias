import * as XLSX from 'xlsx';
import { utils, writeFile, WorkBook, WorkSheet } from 'xlsx';

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

interface ExportOptions {
  includeCharts?: boolean;
  includeAnalytics?: boolean;
  includeSummary?: boolean;
  customColumns?: string[];
}

export class ProfessionalExcelExport {
  private workbook: WorkBook;
  private data: FilterData;
  private filters: FilterState;
  private options: ExportOptions;

  constructor(data: FilterData, filters: FilterState, options: ExportOptions = {}) {
    this.workbook = utils.book_new();
    this.data = data;
    this.filters = filters;
    this.options = {
      includeCharts: true,
      includeAnalytics: true,
      includeSummary: true,
      ...options
    };
  }

  private createHeaderStyle(): any {
    return {
      font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
      fill: { fgColor: { rgb: "2563EB" } }, // Blue-600
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  private createDataStyle(isAlternate: boolean = false): any {
    return {
      font: { size: 11 },
      fill: { fgColor: { rgb: isAlternate ? "F8FAFC" : "FFFFFF" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E2E8F0" } },
        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      }
    };
  }

  private createSummarySheet(): void {
    if (!this.options.includeSummary) return;

    const summaryData = [];
    
    // Header
    summaryData.push(['RELATÓRIO EXECUTIVO DE GARANTIAS GLÚ']);
    summaryData.push([]);
    summaryData.push(['Gerado em:', new Date().toLocaleString('pt-BR')]);
    summaryData.push([]);
    
    // Filtros aplicados
    summaryData.push(['FILTROS APLICADOS']);
    if (this.filters.dateRange.preset !== 'all') {
      let periodText = '';
      switch (this.filters.dateRange.preset) {
        case 'thisMonth': periodText = 'Este Mês'; break;
        case 'lastMonth': periodText = 'Mês Anterior'; break;
        case 'thisQuarter': periodText = 'Este Trimestre'; break;
        case 'thisYear': periodText = 'Este Ano'; break;
        case 'lastYear': periodText = 'Ano Anterior'; break;
        case 'custom': 
          periodText = `${new Date(this.filters.dateRange.startDate).toLocaleDateString('pt-BR')} - ${new Date(this.filters.dateRange.endDate).toLocaleDateString('pt-BR')}`;
          break;
      }
      summaryData.push(['Período:', periodText]);
    }
    if (this.filters.status.length > 0) {
      summaryData.push(['Status:', this.filters.status.join(', ')]);
    }
    if (this.filters.manufacturers.length > 0) {
      summaryData.push(['Fabricantes:', this.filters.manufacturers.join(', ')]);
    }
    if (this.filters.mechanics.length > 0) {
      summaryData.push(['Mecânicos:', this.filters.mechanics.join(', ')]);
    }
    summaryData.push([]);

    // Métricas principais
    summaryData.push(['MÉTRICAS PRINCIPAIS']);
    summaryData.push(['Total de Ordens de Serviço:', this.data.totalOrders.toLocaleString('pt-BR')]);
    summaryData.push(['Valor Total:', `R$ ${this.data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);
    summaryData.push(['Valor Médio por OS:', `R$ ${this.data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);
    summaryData.push([]);

    // Distribuição por status
    summaryData.push(['DISTRIBUIÇÃO POR STATUS']);
    Object.entries(this.data.statusDistribution).forEach(([status, count]) => {
      const percentage = (count / this.data.totalOrders * 100).toFixed(1);
      const statusLabel = status === 'G' ? 'Garantia' : status === 'GO' ? 'Garantia c/ Observação' : 'Garantia Usuário';
      summaryData.push([`${status} - ${statusLabel}:`, `${count} (${percentage}%)`]);
    });
    summaryData.push([]);

    // Top fabricantes
    summaryData.push(['TOP 5 FABRICANTES']);
    const topManufacturers = Object.entries(this.data.manufacturerDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    topManufacturers.forEach(([manufacturer, count], index) => {
      const percentage = (count / this.data.totalOrders * 100).toFixed(1);
      summaryData.push([`${index + 1}. ${manufacturer}:`, `${count} (${percentage}%)`]);
    });

    const ws = utils.aoa_to_sheet(summaryData);
    
    // Configurar larguras das colunas
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 }
    ];

    // Adicionar estilos (simulado com formatação básica)
    const range = utils.decode_range(ws['!ref'] || '');
    
    // Título principal
    ws['A1'] = { ...ws['A1'], s: { 
      font: { bold: true, size: 16 }, 
      alignment: { horizontal: "center" },
      fill: { fgColor: { rgb: "2563EB" } }
    }};
    
    utils.book_append_sheet(this.workbook, ws, 'Resumo Executivo');
  }

  private createAnalyticsSheet(): void {
    if (!this.options.includeAnalytics) return;

    const analyticsData = [];
    
    // Header
    analyticsData.push(['ANÁLISE DETALHADA DE GARANTIAS']);
    analyticsData.push([]);
    
    // Análise temporal
    analyticsData.push(['ANÁLISE TEMPORAL']);
    analyticsData.push(['Período analisado:', this.getPeriodDescription()]);
    analyticsData.push(['Volume médio mensal:', Math.round(this.data.totalOrders / 12) + ' OS']);
    analyticsData.push(['Receita média mensal:', `R$ ${(this.data.totalValue / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);
    analyticsData.push([]);

    // Análise financeira por status
    analyticsData.push(['ANÁLISE FINANCEIRA POR STATUS']);
    analyticsData.push(['Status', 'Quantidade', 'Valor Total', 'Valor Médio', 'Participação']);
    
    Object.entries(this.data.statusDistribution).forEach(([status, count]) => {
      const statusOrders = this.data.orders.filter(o => o.order_status === status);
      const statusValue = statusOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total || '0') || 0), 0);
      const avgValue = count > 0 ? statusValue / count : 0;
      const participation = (count / this.data.totalOrders * 100).toFixed(1);
      
      const statusLabel = status === 'G' ? 'Garantia' : status === 'GO' ? 'Garantia c/ Obs.' : 'Garantia Usuário';
      
      analyticsData.push([
        `${status} - ${statusLabel}`,
        count,
        `R$ ${statusValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `${participation}%`
      ]);
    });
    analyticsData.push([]);

    // Análise de fabricantes
    analyticsData.push(['ANÁLISE POR FABRICANTE']);
    analyticsData.push(['Fabricante', 'Quantidade', 'Participação', 'Valor Total']);
    
    Object.entries(this.data.manufacturerDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([manufacturer, count]) => {
        const manufacturerOrders = this.data.orders.filter(o => o.engine_manufacturer === manufacturer);
        const manufacturerValue = manufacturerOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total || '0') || 0), 0);
        const participation = (count / this.data.totalOrders * 100).toFixed(1);
        
        analyticsData.push([
          manufacturer,
          count,
          `${participation}%`,
          `R$ ${manufacturerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);
      });

    const ws = utils.aoa_to_sheet(analyticsData);
    
    // Configurar larguras das colunas
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 }
    ];

    utils.book_append_sheet(this.workbook, ws, 'Análise Detalhada');
  }

  private createDataSheet(): void {
    const headers = [
      'Número OS',
      'Data',
      'Status',
      'Fabricante Motor',
      'Descrição Motor',
      'Modelo Veículo',
      'Descrição Defeito',
      'Mecânico Responsável',
      'Valor Peças',
      'Valor Mão de Obra',
      'Valor Total'
    ];

    const formattedData = this.data.orders.map(order => [
      order.order_number,
      new Date(order.order_date).toLocaleDateString('pt-BR'),
      order.order_status,
      order.engine_manufacturer || '',
      order.engine_description || '',
      order.vehicle_model || '',
      order.raw_defect_description || '',
      order.responsible_mechanic || '',
      parseFloat(order.parts_total || '0') || '',
      parseFloat(order.labor_total || '0') || '',
      parseFloat(order.grand_total || '0') || ''
    ]);

    // Adicionar header
    const sheetData = [headers, ...formattedData];
    const ws = utils.aoa_to_sheet(sheetData);

    // Configurar larguras das colunas
    ws['!cols'] = [
      { wch: 12 }, // OS
      { wch: 12 }, // Data
      { wch: 8 },  // Status
      { wch: 20 }, // Fabricante
      { wch: 25 }, // Descrição Motor
      { wch: 20 }, // Modelo
      { wch: 40 }, // Defeito
      { wch: 20 }, // Mecânico
      { wch: 15 }, // Valor Peças
      { wch: 15 }, // Valor MO
      { wch: 15 }  // Total
    ];

    // Aplicar filtros automáticos
    if (ws['!ref']) {
      const range = utils.decode_range(ws['!ref']);
      ws['!autofilter'] = { ref: `A1:${utils.encode_col(range.e.c)}1` };
    }

    // Formatação de valores monetários nas colunas I, J, K
    const range = utils.decode_range(ws['!ref'] || '');
    for (let R = 1; R <= range.e.r; ++R) {
      for (let C = 8; C <= 10; ++C) { // Colunas I, J, K (8, 9, 10)
        const cellAddress = utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
          ws[cellAddress].z = '#,##0.00';
        }
      }
    }

    utils.book_append_sheet(this.workbook, ws, 'Dados Completos');
  }

  private createPivotSummarySheet(): void {
    // Dados para análise pivot
    const pivotData = [];
    
    // Header para análise pivot
    pivotData.push(['STATUS SUMMARY']);
    pivotData.push(['Status', 'Quantidade', 'Valor Total', 'Percentual']);
    
    Object.entries(this.data.statusDistribution).forEach(([status, count]) => {
      const statusOrders = this.data.orders.filter(o => o.order_status === status);
      const statusValue = statusOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total || '0') || 0), 0);
      const percentage = (count / this.data.totalOrders * 100);
      
      pivotData.push([status, count, statusValue, percentage / 100]);
    });
    
    pivotData.push([]);
    pivotData.push(['MANUFACTURER SUMMARY']);
    pivotData.push(['Fabricante', 'Quantidade', 'Percentual']);
    
    Object.entries(this.data.manufacturerDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([manufacturer, count]) => {
        const percentage = (count / this.data.totalOrders * 100);
        pivotData.push([manufacturer, count, percentage / 100]);
      });

    const ws = utils.aoa_to_sheet(pivotData);
    
    // Configurar formatação de percentuais
    const range = utils.decode_range(ws['!ref'] || '');
    for (let R = 0; R <= range.e.r; ++R) {
      const percentCell = utils.encode_cell({ r: R, c: 3 });
      if (ws[percentCell] && typeof ws[percentCell].v === 'number') {
        ws[percentCell].z = '0.00%';
      }
    }

    ws['!cols'] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 }
    ];

    utils.book_append_sheet(this.workbook, ws, 'Análise Pivot');
  }

  private getPeriodDescription(): string {
    switch (this.filters.dateRange.preset) {
      case 'thisMonth': return 'Este Mês';
      case 'lastMonth': return 'Mês Anterior';
      case 'thisQuarter': return 'Este Trimestre';
      case 'thisYear': return 'Este Ano';
      case 'lastYear': return 'Ano Anterior';
      case 'custom': 
        return `${new Date(this.filters.dateRange.startDate).toLocaleDateString('pt-BR')} - ${new Date(this.filters.dateRange.endDate).toLocaleDateString('pt-BR')}`;
      default: return 'Todos os Períodos';
    }
  }

  public generate(): WorkBook {
    // Criar todas as abas
    this.createSummarySheet();
    this.createAnalyticsSheet();
    this.createDataSheet();
    this.createPivotSummarySheet();

    return this.workbook;
  }

  public save(filename: string): void {
    const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    writeFile(this.workbook, finalFilename);
  }

  public getBlob(): Blob {
    const buffer = XLSX.write(this.workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

// Função utilitária para exportação rápida
export const exportToProfessionalExcel = async (
  data: FilterData,
  filters: FilterState,
  options: ExportOptions = {}
): Promise<void> => {
  try {
    const exporter = new ProfessionalExcelExport(data, filters, options);
    exporter.generate();
    
    const filename = `relatorio-garantias-profissional-${new Date().toISOString().split('T')[0]}`;
    exporter.save(filename);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Erro ao gerar Excel profissional:', error);
    throw error;
  }
};

// Função para exportação simples (compatibilidade)
export const exportToExcel = exportToProfessionalExcel;