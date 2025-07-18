interface DateValidationResult {
  isValid: boolean;
  date: Date | null;
  originalValue: any;
  detectedFormat?: string;
  error?: string;
}

interface ParseResult {
  isValid: boolean;
  date?: Date;
  error?: string;
}

class DateValidator {
  private debugCount = 0;
  
  validateDate(rawDate: any): DateValidationResult {
    // Logs apenas para debug das primeiras validações
    if (this.debugCount < 5) {
      console.log(`🔍 Validating date: ${rawDate} (type: ${typeof rawDate})`);
      this.debugCount++;
    }
    
    // TESTAR FORMATO EXCEL PRIMEIRO se for número
    if (typeof rawDate === 'number') {
      const formats = ['excel-serial'];
      for (const format of formats) {
        const parsed = this.tryParseDate(rawDate, format);
        if (parsed.isValid && parsed.date) {
          if (this.debugCount <= 5) {
            console.log(`✅ Parsed as ${format}: ${parsed.date.toISOString().split('T')[0]}`);
          }
          return {
            isValid: true,
            date: parsed.date,
            originalValue: rawDate,
            detectedFormat: format
          };
        }
      }
    }

    // TESTAR FORMATOS STRING se for string
    if (typeof rawDate === 'string') {
      const formats = [
        'DD/MM/YYYY',
        'DD-MM-YYYY',
        'YYYY-MM-DD',
        'MM/DD/YYYY'
      ];
      
      for (const format of formats) {
        const parsed = this.tryParseDate(rawDate, format);
        if (parsed.isValid && parsed.date) {
          if (this.debugCount <= 5) {
            console.log(`✅ Parsed as ${format}: ${parsed.date.toISOString().split('T')[0]}`);
          }
          return {
            isValid: true,
            date: parsed.date,
            originalValue: rawDate,
            detectedFormat: format
          };
        }
      }
    }

    if (this.debugCount <= 5) {
      console.log(`❌ Failed to parse date: ${rawDate}`);
    }
    return {
      isValid: false,
      date: null,
      originalValue: rawDate,
      error: `Cannot parse date: ${rawDate}`
    };
  }

  private tryParseDate(value: any, format: string): ParseResult {
    try {
      if (format === 'excel-serial' && typeof value === 'number') {
        // CONVERSÃO UNIVERSAL DE DATAS EXCEL
        // Usar a fórmula padrão: Unix epoch + diferença entre 1900-01-01 e 1970-01-01
        // Excel: 1 = 1900-01-01, mas tem bug do ano bissexto 1900
        // Fórmula correta: (excel_value - 25569) * 86400 * 1000
        
        if (value < 1) {
          return { isValid: false, error: `Invalid Excel serial date: ${value} (must be >= 1)` };
        }
        
        // Diferença entre 1900-01-01 e 1970-01-01 Unix epoch
        // Fórmula universal para qualquer data Excel: (valor - 25568) * 86400 * 1000
        // Esta fórmula funciona para qualquer ano: 1900, 2000, 2010, 2020, 2025, 2030, etc
        const date = new Date((value - 25568) * 86400 * 1000);
        
        // Verificar se a data é válida
        if (!isNaN(date.getTime()) && date.getFullYear() >= 1900) {
          if (this.debugCount <= 5) {
            console.log(`📅 Excel serial ${value} -> ${date.toISOString().split('T')[0]}`);
          }
          return { isValid: true, date };
        }
        
        return { isValid: false, error: `Invalid Excel serial date: ${value}` };
      }

      if (typeof value === 'string') {
        // Tentar diferentes formatos de string
        let date: Date | null = null;

        switch (format) {
          case 'DD/MM/YYYY':
            // Aceita também datas com hora: 'DD/MM/YYYY HH:mm:ss' (um ou mais espaços)
            const ddmmyyyy = value.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s{1,}\d{2}:\d{2}:\d{2})?/);
            if (ddmmyyyy) {
              date = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
            }
            break;
          case 'DD-MM-YYYY':
            // Aceita também datas com hora: 'DD-MM-YYYY HH:mm:ss'
            const ddmmyyyy2 = value.match(/^\s*(\d{1,2})-(\d{1,2})-(\d{4})(?:\s{1,}\d{2}:\d{2}:\d{2})?/);
            if (ddmmyyyy2) {
              date = new Date(parseInt(ddmmyyyy2[3]), parseInt(ddmmyyyy2[2]) - 1, parseInt(ddmmyyyy2[1]));
            }
            break;
          case 'YYYY-MM-DD':
            // Aceita também datas com hora: 'YYYY-MM-DD HH:mm:ss'
            const yyyymmdd = value.match(/^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:\s{1,}\d{2}:\d{2}:\d{2})?/);
            if (yyyymmdd) {
              date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
            }
            break;
          case 'MM/DD/YYYY':
            // Aceita também datas com hora: 'MM/DD/YYYY HH:mm:ss'
            const mmddyyyy = value.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s{1,}\d{2}:\d{2}:\d{2})?/);
            if (mmddyyyy) {
              date = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
            }
            break;
        }

        if (date && !isNaN(date.getTime())) {
          return { isValid: true, date };
        }
      }

      // Tentar usar o construtor Date padrão apenas se for Date object
      if (value instanceof Date) {
        return { isValid: true, date: value };
      }

      return { isValid: false, error: `Unable to parse format ${format}` };

    } catch (error) {
      return { isValid: false, error: (error as Error).message };
    }
  }

  isDateAfter2019(date: Date): boolean {
    return date.getFullYear() >= 2019;
  }
}

export { DateValidator, DateValidationResult };

