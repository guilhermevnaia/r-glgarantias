import * as XLSX from 'xlsx';

interface DetailedAnalysis {
  totalRows: number;
  rowsWithData: number;
  rowsAfterDateFilter: number;
  rowsAfterStatusFilter: number;
  finalValidRows: number;
  rowsWithInvalidDates: any[];
  rowsWithInvalidStatus: any[];
  rowsWithMissingData: any[];
}

interface ColumnMapping {
  [key: string]: string;
}

class ExcelAnalyzer {
  analyzeFile(buffer: Buffer): DetailedAnalysis {
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets['Tabela']; // Nome exato da aba

    if (!worksheet) {
      throw new Error('A planilha deve conter uma aba chamada "Tabela"');
    }

    const allData = XLSX.utils.sheet_to_json(worksheet);

    // Implementar lógica para extrair cabeçalhos e mapear colunas se necessário
    // Por enquanto, vamos focar na contagem e filtragem

    const analysis: DetailedAnalysis = {
      totalRows: allData.length,
      rowsWithData: 0,
      rowsAfterDateFilter: 0,
      rowsAfterStatusFilter: 0,
      finalValidRows: 0,
      rowsWithInvalidDates: [],
      rowsWithInvalidStatus: [],
      rowsWithMissingData: [],
    };

    // Placeholder para as funções de validação que serão implementadas em DateValidator e RobustDataProcessor
    // Por enquanto, apenas para simular a contagem
    const isValidDate = (row: any) => {
      // Lógica de validação de data (>= 2019)
      const rawDate = row['Data_OSv'];
      if (!rawDate) return false; // Data ausente
      try {
        const date = new Date(rawDate);
        return date.getFullYear() >= 2019;
      } catch (e) {
        return false;
      }
    };

    const isValidStatus = (row: any) => {
      // Lógica de validação de status (G, GO, GU)
      const status = row['Status_OSv']?.toString().trim().toUpperCase();
      return ['G', 'GO', 'GU'].includes(status);
    };

    const hasRequiredData = (row: any) => {
      // Lógica para verificar se a linha tem dados mínimos
      const requiredFields = ['NOrdem_OSv', 'Data_OSv', 'Status_OSv'];
      return requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field].toString().trim() !== '');
    };

    const passesAllFilters = (row: any) => {
      return hasRequiredData(row) && isValidDate(row) && isValidStatus(row);
    };

    allData.forEach(row => {
      if (hasRequiredData(row)) {
        analysis.rowsWithData++;
      } else {
        analysis.rowsWithMissingData.push(row);
      }

      if (isValidDate(row)) {
        analysis.rowsAfterDateFilter++;
      } else {
        analysis.rowsWithInvalidDates.push(row);
      }

      if (isValidStatus(row)) {
        analysis.rowsAfterStatusFilter++;
      } else {
        analysis.rowsWithInvalidStatus.push(row);
      }

      if (passesAllFilters(row)) {
        analysis.finalValidRows++;
      }
    });

    return analysis;
  }

  private extractHeaders(worksheet: XLSX.WorkSheet): string[] {
    const headers: string[] = [];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ c: C, r: range.s.r })];
      if (cell && cell.v) {
        headers.push(cell.v.toString());
      }
    }
    return headers;
  }

  private mapColumns(headers: string[]): ColumnMapping {
    // Esta lógica será mais robusta quando lermos do system_settings
    const predefinedMapping: { [key: string]: string } = {
      'NOrdem_OSv': 'order_number',
      'Data_OSv': 'order_date',
      'Fabricante_Mot': 'engine_manufacturer',
      'Descricao_Mot': 'engine_description',
      'ModeloVei_Osv': 'vehicle_model',
      'ObsCorpo_OSv': 'raw_defect_description',
      'RazaoSocial_Cli': 'responsible_mechanic',
      'TotalProd_OSv': 'parts_total',
      'TotalServ_OSv': 'labor_total',
      'Total_OSv': 'grand_total',
      'Status_OSv': 'order_status',
    };

    const mapping: ColumnMapping = {};
    headers.forEach(header => {
      if (predefinedMapping[header]) {
        mapping[header] = predefinedMapping[header];
      }
    });
    return mapping;
  }
}

export { ExcelAnalyzer, DetailedAnalysis };


