import * as XLSX from 'xlsx';
import { ExcelAnalyzer, DetailedAnalysis } from './ExcelAnalyzer';
import { DateValidator, DateValidationResult } from '../validators/DateValidator';

interface ProcessingResult {
  data: any[];
  log: ProcessingLog;
  analysis: DetailedAnalysis;
}

interface ProcessingLog {
  totalRows: number;
  processedRows: number;
  validRows: number;
  errors: ProcessingError[];
  warnings: ProcessingWarning[];
}

interface ProcessingError {
  row: number;
  data: any;
  errors: string[];
}

interface ProcessingWarning {
  row: number;
  data: any;
  warnings: string[];
}

interface RowValidationResult {
  isValid: boolean;
  data?: any;
  errors?: string[];
  rowNumber: number;
  originalData?: any;
}

class RobustDataProcessor {
  async processExcelData(buffer: Buffer): Promise<ProcessingResult> {
    const analyzer = new ExcelAnalyzer();
    const dateValidator = new DateValidator();

    // 1. ANÁLISE INICIAL DETALHADA
    const analysis = analyzer.analyzeFile(buffer);
    console.log('📊 ANÁLISE INICIAL:', analysis);

    // 2. PROCESSAR LINHA POR LINHA
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets['Tabela'];
    
    if (!worksheet) {
      throw new Error('A planilha deve conter uma aba chamada "Tabela"');
    }

    const allRows = XLSX.utils.sheet_to_json(worksheet);

    const processingLog: ProcessingLog = {
      totalRows: allRows.length,
      processedRows: 0,
      validRows: 0,
      errors: [],
      warnings: []
    };

    const validData: any[] = [];

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header

      try {
        // VALIDAR CADA CAMPO INDIVIDUALMENTE
        const validationResult = this.validateRow(row, rowNumber, dateValidator);

        if (validationResult.isValid && validationResult.data) {
          validData.push(validationResult.data);
          processingLog.validRows++;
        } else {
          processingLog.errors.push({
            row: rowNumber,
            data: row,
            errors: validationResult.errors || []
          });
        }

        processingLog.processedRows++;

      } catch (error) {
        processingLog.errors.push({
          row: rowNumber,
          data: row,
          errors: [`Processing error: ${(error as Error).message}`]
        });
      }
    }

    // 3. COMPARAR COM EXPECTATIVA
    console.log('📈 RESULTADO FINAL:');
    console.log(`Total no Excel: ${allRows.length}`);
    console.log(`Processadas: ${processingLog.processedRows}`);
    console.log(`Válidas: ${processingLog.validRows}`);
    console.log(`Perdidas: ${allRows.length - processingLog.validRows}`);

    return {
      data: validData,
      log: processingLog,
      analysis: analysis
    };
  }

  private validateRow(row: any, rowNumber: number, dateValidator: DateValidator): RowValidationResult {
    const errors: string[] = [];

    // VALIDAR DATA
    const dateValidation = dateValidator.validateDate(row['Data_OSv']); // Nome exato da coluna
    if (!dateValidation.isValid) {
      errors.push(`Invalid date: ${dateValidation.error}`);
    }

    // VALIDAR STATUS
    const status = row['Status_OSv']?.toString().trim().toUpperCase();
    if (!['G', 'GO', 'GU'].includes(status)) {
      errors.push(`Invalid status: ${status}`);
    }

    // VALIDAR CAMPOS OBRIGATÓRIOS
    const requiredFields = ['NOrdem_Osv', 'Data_OSv', 'Status_OSv'];
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // VALIDAR FILTRO DE DATA (>= 2019)
    if (dateValidation.isValid && dateValidation.date && !dateValidator.isDateAfter2019(dateValidation.date)) {
      errors.push(`Date before 2019: ${dateValidation.date}`);
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors: errors,
        rowNumber: rowNumber,
        originalData: row
      };
    }

    return {
      isValid: true,
      data: this.transformRow(row, dateValidation.date!),
      rowNumber: rowNumber
    };
  }

  private transformRow(row: any, validatedDate: Date): any {
    // Aplicar regras de negócio
    const originalPartsValue = parseFloat(row['TotalProd_OSv']) || 0;
    const partsTotal = originalPartsValue / 2; // Dividir por 2
    const laborTotal = parseFloat(row['TotalServ_OSv']) || 0;
    const grandTotal = parseFloat(row['Total_OSv']) || 0;

    // Verificar se a soma bate
    const calculationVerified = Math.abs((partsTotal + laborTotal) - grandTotal) < 0.01; // Tolerância de 1 centavo

    return {
      order_number: row['NOrdem_Osv']?.toString().trim(),
      order_date: validatedDate,
      engine_manufacturer: row['Fabricante_Mot']?.toString().trim() || null,
      engine_description: row['Descricao_Mot']?.toString().trim() || null,
      vehicle_model: row['ModeloVei_Osv']?.toString().trim() || null,
      raw_defect_description: row['ObsCorpo_OSv']?.toString().trim() || null,
      responsible_mechanic: row['RazaoSocial_Cli']?.toString().trim() || null,
      parts_total: partsTotal,
      labor_total: laborTotal,
      grand_total: grandTotal,
      order_status: row['Status_OSv']?.toString().trim().toUpperCase(),
      original_parts_value: originalPartsValue,
      calculation_verified: calculationVerified
    };
  }
}

export { RobustDataProcessor, ProcessingResult };

