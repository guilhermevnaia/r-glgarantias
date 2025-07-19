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

    // Read data with header as first row to get exact header names
    const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (allRows.length === 0) {
      throw new Error("Planilha vazia ou sem dados.");
    }

    const headers = allRows[0] as string[];
    const dataRows = allRows.slice(1);

    console.log("Headers from Excel:", headers);

    const processingLog: ProcessingLog = {
      totalRows: dataRows.length,
      processedRows: 0,
      validRows: 0,
      errors: [],
      warnings: []
    };

    const validData: any[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const rowArray = dataRows[i] as any[];
      const rowNumber = i + 2; // +2 because Excel starts at 1 and has header

      // Map row array to an object using headers
      const row: { [key: string]: any } = {};
      headers.forEach((header, index) => {
        row[header.toString().trim()] = rowArray[index];
      });

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
          console.log(`❌ Erro na linha ${rowNumber}:`, validationResult.errors);
        }

        processingLog.processedRows++;

      } catch (error) {
        processingLog.errors.push({
          row: rowNumber,
          data: row,
          errors: [`Processing error: ${(error as Error).message}`]
        });
        console.error(`Fatal error processing row ${rowNumber}:`, error);
      }
    }

    // 3. COMPARAR COM EXPECTATIVA
    console.log("📈 RESULTADO FINAL:");
    console.log(`Total no Excel: ${processingLog.totalRows}`);
    console.log(`Processadas: ${processingLog.processedRows}`);
    console.log(`Válidas: ${processingLog.validRows}`);
    console.log(`Perdidas: ${processingLog.totalRows - processingLog.validRows}`);
    console.log(`Taxa de sucesso: ${((processingLog.validRows / processingLog.totalRows) * 100).toFixed(2)}%`);

    return {
      data: validData,
      log: processingLog,
      analysis: analysis
    };
  }

  private validateRow(row: any, rowNumber: number, dateValidator: DateValidator): RowValidationResult {
    const errors: string[] = [];

    // LOG: Valor original da data (apenas para primeiras 5 linhas e a cada 1000 linhas para acompanhar progresso)
    if (rowNumber <= 7 || rowNumber % 1000 === 0) {
      console.log(`[Linha ${rowNumber}] Valor bruto de Data_OSv:`, row["Data_OSv"], `| Tipo:`, typeof row["Data_OSv"]);
    }

    // VALIDAR CAMPOS OBRIGATÓRIOS
    const requiredFields = ["NOrdem_OSv", "Data_OSv", "Status_OSv"];
    for (const field of requiredFields) {
      if (row[field] === undefined || row[field] === null || row[field].toString().trim() === "") {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Se campos obrigatórios estiverem faltando, não prossiga com outras validações para evitar erros em cascata
    if (errors.length > 0) {
      return {
        isValid: false,
        errors: errors,
        rowNumber: rowNumber,
        originalData: row
      };
    }

    // VALIDAR DATA
    const dateValidation = dateValidator.validateDate(row["Data_OSv"]);
    // LOG: Resultado da validação de data (apenas para primeiras 5 linhas e a cada 1000 linhas)
    if (rowNumber <= 7 || rowNumber % 1000 === 0) {
      console.log(`[Linha ${rowNumber}] Resultado do DateValidator:`, dateValidation);
    }
    if (!dateValidation.isValid) {
      errors.push(`Invalid date: ${dateValidation.error}`);
    } else if (!dateValidator.isDateAfter2019(dateValidation.date!)) {
      errors.push(`Date before 2019: ${dateValidation.date?.toISOString().split("T")[0]}`);
    }

    // VALIDAR STATUS
    const status = row["Status_OSv"]?.toString().trim().toUpperCase();
    if (!["G", "GO", "GU"].includes(status)) {
      errors.push(`Invalid status: ${status}`);
    }

    // Validação de TotalProd_OSv, TotalServ_OSv, Total_OSv
    const rawTotalProd = row["TotalProd_OSv"];
    const rawTotalServ = row["TotalServ_OSv"];
    const rawTotal = row["Total_OSv"];

    const originalPartsValue = parseFloat(rawTotalProd) || 0;
    const partsTotal = originalPartsValue / 2;
    const laborTotal = parseFloat(rawTotalServ) || 0;
    const grandTotal = parseFloat(rawTotal) || 0;

    if (isNaN(originalPartsValue) || isNaN(laborTotal) || isNaN(grandTotal)) {
      errors.push("Invalid numeric value for TotalProd_OSv, TotalServ_OSv, or Total_OSv");
    }

    const calculationVerified = Math.abs((partsTotal + laborTotal) - grandTotal) < 0.01;
    
    // REGRA DE NEGÓCIO: Cálculo incorreto deve ser WARNING, não erro que rejeita linha
    if (!calculationVerified) {
      console.log(`⚠️  WARNING [Linha ${rowNumber}]: Calculation mismatch: (Parts: ${partsTotal} + Labor: ${laborTotal}) != Grand Total: ${grandTotal}`);
      // NÃO adicionar aos errors - apenas registrar warning
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
    const originalPartsValue = parseFloat(row["TotalProd_OSv"]) || 0;
    const partsTotal = originalPartsValue / 2;
    const laborTotal = parseFloat(row["TotalServ_OSv"]) || 0;
    const grandTotal = parseFloat(row["Total_OSv"]) || 0;

    const calculationVerified = Math.abs((partsTotal + laborTotal) - grandTotal) < 0.01;

    return {
      order_number: row["NOrdem_OSv"]?.toString().trim(),
      order_date: validatedDate,
      engine_manufacturer: row["Fabricante_Mot"]?.toString().trim() || null,
      engine_description: row["Descricao_Mot"]?.toString().trim() || null,
      vehicle_model: row["ModeloVei_Osv"]?.toString().trim() || null,
      raw_defect_description: row["ObsCorpo_OSv"]?.toString().trim() || null,
      responsible_mechanic: row["RazaoSocial_Cli"]?.toString().trim() || null,
      parts_total: partsTotal,
      labor_total: laborTotal,
      grand_total: grandTotal,
      order_status: row["Status_OSv"]?.toString().trim().toUpperCase(),
      original_parts_value: originalPartsValue,
      calculation_verified: calculationVerified
    };
  }
}

export { RobustDataProcessor, ProcessingResult };


