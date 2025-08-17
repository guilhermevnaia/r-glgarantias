export interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string | null;
  engine_description: string | null;
  engine_model: string | null;
  engine_type: string | null;
  vehicle_model: string | null;
  raw_defect_description: string | null;
  original_defect_description?: string | null;
  responsible_mechanic: string | null;
  parts_total: string | null;
  labor_total: string | null;
  grand_total: string | null;
  order_status: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
}

export interface FilterData {
  orders: ServiceOrder[];
  totalOrders: number;
  totalValue: number;
  avgValue: number;
  statusDistribution: Record<string, number>;
  manufacturerDistribution: Record<string, number>;
}

export interface FilterState {
  dateRange: {
    startDate: string;
    endDate: string;
    preset: 'custom' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'lastYear' | 'all';
  };
  status: string[];
  manufacturers: string[];
  mechanics: string[];
  models: string[];
  types: string[];
  osRange: {
    from: string;
    to: string;
  };
  defectKeywords: string[];
  valueRange: {
    min: number;
    max: number;
  };
}

export interface ExportOptions {
  includeCharts?: boolean;
  includeAnalytics?: boolean;
  includeSummary?: boolean;
  customColumns?: string[];
}

export interface FilterOptions {
  manufacturers: string[];
  mechanics: string[];
  models: string[];
  types: string[];
}

export type ReportType = 'summary' | 'detailed' | 'analytical';