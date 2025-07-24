// Tipos TypeScript para integração com backend

export interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  order_status: 'G' | 'GO' | 'GU';
  engine_manufacturer?: string;
  engine_description?: string;
  vehicle_model?: string;
  raw_defect_description?: string;
  responsible_mechanic?: string;
  parts_total?: number;
  labor_total?: number;
  grand_total?: number;
  original_parts_value?: number;
  calculation_verified?: boolean;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UploadResult {
  success: boolean;
  uploadId: string;
  processingTime: number;
  summary: {
    fileName: string;
    totalRowsInExcel: number;
    rowsProcessed: number;
    rowsValid: number;
    rowsInserted: number;
    rowsUpdated: number;
    rowsRejected: number;
  };
  details: {
    statusDistribution?: Record<string, number>;
    yearDistribution?: Record<string, number>;
    removedByStatus?: number;
    removedByDate?: number;
    dateValidationIssues: any[];
    statusValidationIssues: any[];
    calculationIssues: any[];
    missingDataIssues: any[];
    otherErrors: any[];
  };
}

export interface UploadLog {
  id: number;
  uploadId: string;
  filename: string;
  status: string;
  processingTime: number;
  summary: any;
  details: any;
  createdAt: string;
}

export interface Stats {
  totalOrders: number;
  statusDistribution: Record<string, number>;
  yearDistribution: Record<string, number>;
  topManufacturers: Array<{ name: string; count: number }>;
  recentUploads: number;
} 